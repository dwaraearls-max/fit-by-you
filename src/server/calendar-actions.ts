"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { audit, requirePermission } from "@/lib/tenant";
import { appointmentTypeSchema } from "@/lib/domain";
import { formatFriendlyDateTime } from "@/lib/dates";
import {
  fail,
  getString,
  guarded,
  parseForm,
  succeed,
  type FormState,
} from "@/server/form";

const appointmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Give the appointment a name.")
    .max(120, "Keep the name shorter."),
  type: appointmentTypeSchema,
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
      return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 600) : 30;
    }),
  customerId: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function createAppointmentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("calendar:write");
    const parsed = parseForm(appointmentSchema, formData);
    if (!parsed.ok) return parsed.state;

    const data = parsed.data;

    if (data.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: data.customerId, businessId: tenant.businessId },
        select: { id: true },
      });
      if (!customer) {
        return fail("That customer is not in your records.", {
          customerId: "Pick a customer from your list.",
        });
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        businessId: tenant.businessId,
        customerId: data.customerId || null,
        type: data.type,
        title: data.title,
        scheduledFor: data.scheduledFor,
        durationMinutes: data.durationMinutes,
        notes: data.notes || null,
        status: "SCHEDULED",
        createdById: tenant.user.id,
      },
      select: { id: true },
    });

    await audit(tenant, {
      action: "appointment.created",
      entityType: "appointment",
      entityId: appointment.id,
      summary: `Scheduled "${data.title}" for ${formatFriendlyDateTime(data.scheduledFor)}.`,
    });

    revalidatePath("/app/calendar");
    revalidatePath("/app");

    return succeed(`Added for ${formatFriendlyDateTime(data.scheduledFor)}.`);
  });
}

export async function updateAppointmentStatusAction(
  formData: FormData,
): Promise<void> {
  const tenant = await requirePermission("calendar:write");
  const id = getString(formData, "appointmentId");
  const status = getString(formData, "status");

  if (!id || !["SCHEDULED", "COMPLETED", "MISSED", "CANCELLED"].includes(status)) {
    return;
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id, businessId: tenant.businessId },
    select: { id: true },
  });
  if (!appointment) return;

  await prisma.appointment.update({
    where: { id, businessId: tenant.businessId },
    data: { status },
  });

  revalidatePath("/app/calendar");
  revalidatePath("/app");
}
