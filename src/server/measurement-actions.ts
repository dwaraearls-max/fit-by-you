"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requirePermission, audit } from "@/lib/tenant";
import {
  displayToTenths,
  measurementGroupSchema,
  measurementUnitSchema,
} from "@/lib/domain";
import { slugify } from "@/lib/utils";
import {
  getMeasurementFields,
  recordMeasurementSet,
} from "@/server/services/measurements";
import {
  fail,
  getOptionalString,
  getString,
  guarded,
  succeed,
  type FormState,
} from "@/server/form";

/** Inputs are named `m.<fieldKey>` so one pass over the form finds them all. */
const VALUE_PREFIX = "m.";

export async function recordMeasurementsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("measurement:write");

    const customerId = getString(formData, "customerId");
    if (!customerId) return fail("Missing customer.");

    const unitResult = measurementUnitSchema.safeParse(
      getString(formData, "unit") || "in",
    );
    const unit = unitResult.success ? unitResult.data : "in";

    const measuredAtRaw = getOptionalString(formData, "measuredAt");
    const measuredAt = measuredAtRaw ? new Date(measuredAtRaw) : new Date();
    if (Number.isNaN(measuredAt.getTime())) {
      return fail("Enter a valid date.", { measuredAt: "Enter a valid date." });
    }
    if (measuredAt.getTime() > Date.now() + 60_000) {
      return fail("Measurements cannot be dated in the future.", {
        measuredAt: "Pick today or a past date.",
      });
    }

    const values: Record<string, number> = {};
    const fieldErrors: Record<string, string> = {};

    for (const [name, raw] of formData.entries()) {
      if (!name.startsWith(VALUE_PREFIX) || typeof raw !== "string") continue;
      const trimmed = raw.trim();
      if (trimmed === "") continue;

      const key = name.slice(VALUE_PREFIX.length);
      const tenths = displayToTenths(trimmed);

      if (tenths === null || tenths <= 0) {
        fieldErrors[name] = "Enter a number.";
        continue;
      }
      // A 500-inch waist is a typo, not a customer.
      if (tenths > 5000) {
        fieldErrors[name] = "That looks too large.";
        continue;
      }

      values[key] = tenths;
    }

    if (Object.keys(fieldErrors).length > 0) {
      return fail("Please check the highlighted measurements.", fieldErrors);
    }

    if (Object.keys(values).length === 0) {
      return fail("Enter at least one measurement before saving.");
    }

    await recordMeasurementSet(tenant, {
      customerId,
      values,
      unit,
      measuredAt,
      notes: getOptionalString(formData, "notes"),
    });

    revalidatePath(`/app/customers/${customerId}`);
    revalidatePath("/app/measurements");
    revalidatePath("/app");

    redirect(`/app/customers/${customerId}?tab=measurements&saved=1`);
  });
}

const customFieldSchema = z.object({
  label: z
    .string()
    .trim()
    .min(2, "Give the measurement a name.")
    .max(40, "Keep the name short."),
  group: measurementGroupSchema,
});

/**
 * Businesses measure things the catalogue does not cover — a smock yoke, a
 * particular sleeve style. Custom fields join the same catalogue, so they
 * appear in capture, history and comparison without special-casing.
 */
export async function addMeasurementFieldAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("settings:write");

    const parsed = customFieldSchema.safeParse({
      label: getString(formData, "label"),
      group: getString(formData, "group") || "CUSTOM",
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return fail("Please check the field.", {
        [issue?.path.join(".") ?? "label"]: issue?.message ?? "Invalid value.",
      });
    }

    const key = slugify(parsed.data.label).replace(/-/g, "_");
    if (!key) return fail("Give the measurement a name.", { label: "Enter a name." });

    const existing = await prisma.measurementField.findFirst({
      where: { businessId: tenant.businessId, key },
      select: { id: true, isActive: true },
    });

    if (existing) {
      if (existing.isActive) {
        return fail("You already have a measurement with that name.", {
          label: "This measurement already exists.",
        });
      }
      // Retired field coming back: reuse the key so old history still lines up.
      await prisma.measurementField.update({
        where: { id: existing.id, businessId: tenant.businessId },
        data: { isActive: true, label: parsed.data.label, group: parsed.data.group },
      });
    } else {
      const fields = await getMeasurementFields(tenant.businessId);
      await prisma.measurementField.create({
        data: {
          businessId: tenant.businessId,
          key,
          label: parsed.data.label,
          group: parsed.data.group,
          unit: "in",
          sortOrder: fields.length,
          isCustom: true,
        },
      });
    }

    await audit(tenant, {
      action: "measurement_field.created",
      entityType: "measurement_field",
      entityId: key,
      summary: `Added the "${parsed.data.label}" measurement.`,
    });

    revalidatePath("/app/settings");
    revalidatePath("/app/measurements");

    return succeed(`"${parsed.data.label}" is now one of your measurements.`);
  });
}

export async function retireMeasurementFieldAction(
  formData: FormData,
): Promise<void> {
  const tenant = await requirePermission("settings:write");
  const id = getString(formData, "fieldId");
  if (!id) return;

  const field = await prisma.measurementField.findFirst({
    where: { id, businessId: tenant.businessId },
    select: { label: true, isCustom: true },
  });
  if (!field) return;

  // Deactivated, never deleted: historical MeasurementValue rows keep their own
  // copy of the label, and removing the field must not rewrite the past.
  await prisma.measurementField.update({
    where: { id, businessId: tenant.businessId },
    data: { isActive: false },
  });

  await audit(tenant, {
    action: "measurement_field.retired",
    entityType: "measurement_field",
    entityId: id,
    summary: `Stopped using the "${field.label}" measurement.`,
  });

  revalidatePath("/app/settings");
}
