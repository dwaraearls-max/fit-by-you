"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { audit, requirePermission } from "@/lib/tenant";
import { paymentMethodSchema } from "@/lib/domain";
import { formatMoney } from "@/lib/money";
import { buildMessage } from "@/lib/whatsapp";
import { deletePayment, recordPayment } from "@/server/services/payments";
import {
  fail,
  getOptionalString,
  getString,
  guarded,
  moneySchema,
  parseForm,
  type FormState,
} from "@/server/form";

const paymentSchema = z.object({
  customerId: z.string().trim().min(1, "Choose a customer."),
  orderId: z.string().trim().optional().or(z.literal("")),
  amountMinor: moneySchema,
  method: paymentMethodSchema,
  reference: z.string().trim().max(80).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  receivedAt: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? new Date(value) : new Date())),
});

export async function recordPaymentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("payment:write");
    const parsed = parseForm(paymentSchema, formData);
    if (!parsed.ok) return parsed.state;

    const data = parsed.data;

    if (data.amountMinor <= 0) {
      return fail("Enter how much was paid.", { amountMinor: "Enter an amount." });
    }
    if (Number.isNaN(data.receivedAt.getTime())) {
      return fail("Enter a valid date.", { receivedAt: "Enter a valid date." });
    }
    if (data.receivedAt.getTime() > Date.now() + 60_000) {
      return fail("A payment cannot be dated in the future.", {
        receivedAt: "Pick today or a past date.",
      });
    }

    // Mobile money and transfers have a reference the tailor can check against
    // their phone, so it is worth insisting on it.
    if (
      (data.method === "MOBILE_MONEY" || data.method === "BANK_TRANSFER") &&
      !data.reference
    ) {
      return fail("Add the transaction reference so this can be traced later.", {
        reference: "Enter the reference.",
      });
    }

    if (data.orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: data.orderId,
          businessId: tenant.businessId,
          customerId: data.customerId,
        },
        select: { balanceMinor: true, title: true },
      });

      if (!order) {
        return fail("That order does not belong to this customer.", {
          orderId: "Pick one of this customer's orders.",
        });
      }

      // Overpaying is nearly always a typo, and a negative balance would spread
      // confusion through every total on the dashboard.
      if (data.amountMinor > order.balanceMinor) {
        return fail(
          `That is more than the ${formatMoney(
            order.balanceMinor,
            tenant.business.currency,
          )} outstanding on ${order.title}.`,
          { amountMinor: "More than the outstanding balance." },
        );
      }
    }

    const { payment } = await recordPayment(tenant, {
      customerId: data.customerId,
      orderId: data.orderId || null,
      amountMinor: data.amountMinor,
      method: data.method,
      reference: data.reference || null,
      note: data.note || null,
      receivedAt: data.receivedAt,
    });

    revalidatePath("/app/payments");
    revalidatePath("/app");
    revalidatePath(`/app/customers/${data.customerId}`);
    if (data.orderId) revalidatePath(`/app/orders/${data.orderId}`);

    redirect(`/app/payments/${payment.id}?recorded=1`);
  });
}

export async function deletePaymentAction(formData: FormData): Promise<void> {
  const tenant = await requirePermission("payment:delete");
  const paymentId = getString(formData, "paymentId");
  if (!paymentId) return;

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, businessId: tenant.businessId },
    select: { customerId: true, orderId: true },
  });
  if (!payment) return;

  await deletePayment(tenant, paymentId);

  revalidatePath("/app/payments");
  revalidatePath("/app");
  revalidatePath(`/app/customers/${payment.customerId}`);
  if (payment.orderId) revalidatePath(`/app/orders/${payment.orderId}`);

  redirect("/app/payments?removed=1");
}

/**
 * Reminders are a queue, not a sender. FIT BY YOU never messages a customer
 * behind the tailor's back: it writes the message, the tailor taps it open in
 * WhatsApp, and marking it sent is what closes the loop.
 */
export async function queueReminderAction(formData: FormData): Promise<void> {
  const tenant = await requirePermission("payment:write");

  const customerId = getString(formData, "customerId");
  const orderId = getOptionalString(formData, "orderId");
  if (!customerId) return;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId: tenant.businessId },
    select: { id: true, fullName: true },
  });
  if (!customer) return;

  const order = orderId
    ? await prisma.order.findFirst({
        where: { id: orderId, businessId: tenant.businessId, customerId },
        select: { id: true, title: true, balanceMinor: true },
      })
    : null;

  const settings = await prisma.businessSettings.findUnique({
    where: { businessId: tenant.businessId },
    select: { whatsappPaymentTemplate: true },
  });

  const message =
    getOptionalString(formData, "message") ??
    buildMessage(
      "PAYMENT_REMINDER",
      {
        customer: customer.fullName,
        business: tenant.business.name,
        outfit: order?.title,
        amountMinor: order?.balanceMinor,
        currency: tenant.business.currency,
      },
      settings?.whatsappPaymentTemplate,
    );

  // Queueing the same chase twice would just mean nagging twice.
  const existing = await prisma.paymentReminder.findFirst({
    where: {
      businessId: tenant.businessId,
      customerId,
      orderId: order?.id ?? null,
      status: "PENDING",
    },
    select: { id: true },
  });
  if (existing) return;

  await prisma.paymentReminder.create({
    data: {
      businessId: tenant.businessId,
      customerId,
      orderId: order?.id ?? null,
      channel: "WHATSAPP",
      message,
      status: "PENDING",
      createdById: tenant.user.id,
    },
  });

  revalidatePath("/app/payments");
  revalidatePath("/app");
}

export async function resolveReminderAction(formData: FormData): Promise<void> {
  const tenant = await requirePermission("payment:write");
  const reminderId = getString(formData, "reminderId");
  const status = getString(formData, "status") === "SENT" ? "SENT" : "DISMISSED";
  if (!reminderId) return;

  const reminder = await prisma.paymentReminder.findFirst({
    where: { id: reminderId, businessId: tenant.businessId },
    select: { id: true, customer: { select: { fullName: true } } },
  });
  if (!reminder) return;

  await prisma.paymentReminder.update({
    where: { id: reminderId, businessId: tenant.businessId },
    data: { status, sentAt: status === "SENT" ? new Date() : null },
  });

  await audit(tenant, {
    action: status === "SENT" ? "reminder.sent" : "reminder.dismissed",
    entityType: "payment_reminder",
    entityId: reminderId,
    summary:
      status === "SENT"
        ? `Sent a payment reminder to ${reminder.customer.fullName}.`
        : `Dismissed the reminder for ${reminder.customer.fullName}.`,
  });

  revalidatePath("/app/payments");
  revalidatePath("/app");
}
