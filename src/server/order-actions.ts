"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { audit, notify, requirePermission } from "@/lib/tenant";
import {
  orderPrioritySchema,
  orderStatusSchema,
  outfitTypeSchema,
  fittingStatusSchema,
} from "@/lib/domain";
import { formatMoney } from "@/lib/money";
import { formatFriendlyDateTime } from "@/lib/dates";
import { orderSearchText } from "@/lib/codes";
import {
  addTimelineEvent,
  createOrder,
  recalculateOrderTotals,
  updateOrderStatus,
} from "@/server/services/orders";
import { recordPayment } from "@/server/services/payments";
import {
  fail,
  getOptionalString,
  getString,
  guarded,
  moneySchema,
  optionalDateSchema,
  parseForm,
  succeed,
  type FormState,
} from "@/server/form";

const orderSchema = z.object({
  customerId: z.string().trim().min(1, "Choose a customer."),
  title: z
    .string()
    .trim()
    .min(2, "Give the outfit a name.")
    .max(120, "Keep the name shorter."),
  outfitType: outfitTypeSchema,
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  fabric: z.string().trim().max(120).optional().or(z.literal("")),
  fabricNotes: z.string().trim().max(1000).optional().or(z.literal("")),
  measurementSetId: z.string().trim().optional().or(z.literal("")),
  priceMinor: moneySchema,
  depositMinor: moneySchema.optional(),
  depositMethod: z.string().trim().optional().or(z.literal("")),
  deliveryDate: optionalDateSchema,
  fittingDate: optionalDateSchema,
  priority: orderPrioritySchema.optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function createOrderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("order:write");
    const parsed = parseForm(orderSchema, formData);
    if (!parsed.ok) return parsed.state;

    const data = parsed.data;

    if (data.priceMinor <= 0) {
      return fail("Enter what the outfit costs.", {
        priceMinor: "Enter an amount.",
      });
    }

    const deposit = data.depositMinor ?? 0;
    if (deposit > data.priceMinor) {
      return fail("The deposit cannot be more than the price.", {
        depositMinor: "That is more than the total price.",
      });
    }

    if (data.deliveryDate && data.fittingDate && data.fittingDate > data.deliveryDate) {
      return fail("The fitting has to happen before delivery.", {
        fittingDate: "Pick a date before the delivery date.",
      });
    }

    const order = await createOrder(tenant, {
      customerId: data.customerId,
      title: data.title,
      outfitType: data.outfitType,
      description: data.description || null,
      fabric: data.fabric || null,
      fabricNotes: data.fabricNotes || null,
      measurementSetId: data.measurementSetId || null,
      priceMinor: data.priceMinor,
      deliveryDate: data.deliveryDate,
      fittingDate: data.fittingDate,
      priority: data.priority ?? "NORMAL",
      notes: data.notes || null,
    });

    // A deposit taken at the counter is a real payment, so it gets a real
    // receipt rather than being stashed on the order row.
    if (deposit > 0) {
      await recordPayment(tenant, {
        customerId: data.customerId,
        orderId: order.id,
        amountMinor: deposit,
        method: data.depositMethod || "CASH",
        note: "Deposit taken when the order was placed.",
      });
    }

    // A fitting date on the order is also a scheduled fitting, so it shows up
    // on the calendar and in Today without being entered twice.
    if (data.fittingDate) {
      await prisma.fitting.create({
        data: {
          businessId: tenant.businessId,
          orderId: order.id,
          customerId: data.customerId,
          scheduledFor: data.fittingDate,
          status: "SCHEDULED",
        },
      });
    }

    revalidatePath("/app/orders");
    revalidatePath("/app/calendar");
    revalidatePath(`/app/customers/${data.customerId}`);
    revalidatePath("/app");

    redirect(`/app/orders/${order.id}?created=1`);
  });
}

export async function updateOrderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("order:write");
    const orderId = getString(formData, "orderId");
    if (!orderId) return fail("Missing order.");

    const parsed = parseForm(orderSchema.omit({ depositMinor: true, depositMethod: true }), formData);
    if (!parsed.ok) return parsed.state;

    const data = parsed.data;

    const existing = await prisma.order.findFirstOrThrow({
      where: { id: orderId, businessId: tenant.businessId },
      select: {
        code: true,
        priceMinor: true,
        customer: { select: { id: true, fullName: true } },
      },
    });

    await prisma.order.update({
      where: { id: orderId, businessId: tenant.businessId },
      data: {
        title: data.title,
        outfitType: data.outfitType,
        description: data.description || null,
        fabric: data.fabric || null,
        fabricNotes: data.fabricNotes || null,
        measurementSetId: data.measurementSetId || null,
        priceMinor: data.priceMinor,
        deliveryDate: data.deliveryDate,
        fittingDate: data.fittingDate,
        priority: data.priority ?? "NORMAL",
        notes: data.notes || null,
        searchText: orderSearchText({
          code: existing.code,
          title: data.title,
          customerName: existing.customer.fullName,
          fabric: data.fabric,
          description: data.description,
        }),
      },
    });

    // The price drives the balance, so a change has to flow through.
    if (existing.priceMinor !== data.priceMinor) {
      await recalculateOrderTotals(tenant.businessId, orderId);
      await addTimelineEvent(tenant, orderId, {
        type: "NOTE_ADDED",
        title: "Price updated",
        description: `Changed from ${formatMoney(
          existing.priceMinor,
          tenant.business.currency,
        )} to ${formatMoney(data.priceMinor, tenant.business.currency)}.`,
      });
    }

    await audit(tenant, {
      action: "order.updated",
      entityType: "order",
      entityId: orderId,
      summary: `Updated order #${existing.code}.`,
    });

    revalidatePath(`/app/orders/${orderId}`);
    revalidatePath("/app/orders");

    return succeed("Order updated.");
  });
}

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const tenant = await requirePermission("order:write");
  const orderId = getString(formData, "orderId");
  const statusResult = orderStatusSchema.safeParse(getString(formData, "status"));
  if (!orderId || !statusResult.success) return;

  const order = await updateOrderStatus(
    tenant,
    orderId,
    statusResult.data,
    getOptionalString(formData, "note"),
  );

  if (statusResult.data === "READY") {
    await notify(tenant.businessId, {
      type: "DELIVERY_DUE",
      title: "Outfit ready",
      body: `#${order.code} — ${order.title} is ready for ${order.customer.fullName}.`,
      entityType: "order",
      entityId: orderId,
    });
  }

  revalidatePath(`/app/orders/${orderId}`);
  revalidatePath("/app/orders");
  revalidatePath("/app");
}

export async function addOrderNoteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("order:write");
    const orderId = getString(formData, "orderId");
    const note = getString(formData, "note");

    if (!orderId) return fail("Missing order.");
    if (note.length < 2) {
      return fail("Write something first.", { note: "Add a note." });
    }

    await prisma.order.findFirstOrThrow({
      where: { id: orderId, businessId: tenant.businessId },
      select: { id: true },
    });

    await addTimelineEvent(tenant, orderId, {
      type: "NOTE_ADDED",
      title: "Note added",
      description: note.slice(0, 2000),
    });

    revalidatePath(`/app/orders/${orderId}`);
    return succeed("Note added to the timeline.");
  });
}

const fittingSchema = z.object({
  orderId: z.string().trim().min(1),
  scheduledFor: z
    .string()
    .trim()
    .min(1, "Pick a date and time.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date.")
    .transform((value) => new Date(value)),
  durationMinutes: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      const parsed = Number.parseInt(value ?? "", 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
    }),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function scheduleFittingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("calendar:write");
    const parsed = parseForm(fittingSchema, formData);
    if (!parsed.ok) return parsed.state;

    const { orderId, scheduledFor, durationMinutes, notes } = parsed.data;

    const order = await prisma.order.findFirstOrThrow({
      where: { id: orderId, businessId: tenant.businessId },
      select: { id: true, code: true, title: true, customerId: true },
    });

    await prisma.fitting.create({
      data: {
        businessId: tenant.businessId,
        orderId: order.id,
        customerId: order.customerId,
        scheduledFor,
        durationMinutes,
        notes: notes || null,
        status: "SCHEDULED",
      },
    });

    await prisma.order.update({
      where: { id: order.id, businessId: tenant.businessId },
      data: { fittingDate: scheduledFor },
    });

    await addTimelineEvent(tenant, order.id, {
      type: "FITTING_SCHEDULED",
      title: "Fitting scheduled",
      description: formatFriendlyDateTime(scheduledFor),
      occurredAt: new Date(),
    });

    revalidatePath(`/app/orders/${order.id}`);
    revalidatePath("/app/calendar");

    return succeed(`Fitting set for ${formatFriendlyDateTime(scheduledFor)}.`);
  });
}

export async function updateFittingStatusAction(formData: FormData): Promise<void> {
  const tenant = await requirePermission("calendar:write");
  const fittingId = getString(formData, "fittingId");
  const statusResult = fittingStatusSchema.safeParse(getString(formData, "status"));
  if (!fittingId || !statusResult.success) return;

  const fitting = await prisma.fitting.findFirst({
    where: { id: fittingId, businessId: tenant.businessId },
    select: { id: true, orderId: true, scheduledFor: true },
  });
  if (!fitting) return;

  await prisma.fitting.update({
    where: { id: fittingId, businessId: tenant.businessId },
    data: {
      status: statusResult.data,
      outcome: getOptionalString(formData, "outcome"),
    },
  });

  if (statusResult.data === "COMPLETED") {
    await addTimelineEvent(tenant, fitting.orderId, {
      type: "FITTING_COMPLETED",
      title: "Fitting completed",
      description: getOptionalString(formData, "outcome"),
    });
  }

  revalidatePath(`/app/orders/${fitting.orderId}`);
  revalidatePath("/app/calendar");
}
