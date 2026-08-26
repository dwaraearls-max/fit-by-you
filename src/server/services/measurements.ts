import "server-only";

import { prisma } from "@/lib/db";
import { audit, notify, type TenantContext } from "@/lib/tenant";
import {
  DEFAULT_MEASUREMENT_FIELDS,
  type MeasurementGroup,
  MEASUREMENT_GROUPS,
} from "@/lib/domain";
import type { MeasurementFieldRow } from "@/lib/measurement-fields";

export type { MeasurementFieldRow } from "@/lib/measurement-fields";

/**
 * The catalogue for a business, seeding the defaults on first use so an
 * account created before a field was added still gets it.
 */
export async function getMeasurementFields(
  businessId: string,
): Promise<MeasurementFieldRow[]> {
  const existing = await prisma.measurementField.findMany({
    where: { businessId, isActive: true },
    orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      key: true,
      label: true,
      group: true,
      unit: true,
      sortOrder: true,
      isCustom: true,
    },
  });

  if (existing.length > 0) return sortFields(existing);

  await prisma.measurementField.createMany({
    data: DEFAULT_MEASUREMENT_FIELDS.map((field, index) => ({
      businessId,
      key: field.key,
      label: field.label,
      group: field.group,
      unit: "in",
      sortOrder: index,
    })),
  });

  const seeded = await prisma.measurementField.findMany({
    where: { businessId, isActive: true },
    select: {
      id: true,
      key: true,
      label: true,
      group: true,
      unit: true,
      sortOrder: true,
      isCustom: true,
    },
  });

  return sortFields(seeded);
}

/** Groups are ordered as the brief lists them, not alphabetically. */
function sortFields(fields: MeasurementFieldRow[]): MeasurementFieldRow[] {
  const groupRank = new Map<string, number>(
    MEASUREMENT_GROUPS.map((group, index) => [group, index]),
  );

  return [...fields].sort((a, b) => {
    const rank =
      (groupRank.get(a.group) ?? 99) - (groupRank.get(b.group) ?? 99);
    if (rank !== 0) return rank;
    return a.sortOrder - b.sortOrder;
  });
}

/**
 * Writes a new measurement session.
 *
 * Always an insert. Measurements are never updated in place, because the whole
 * point of the product is being able to answer "what was her waist last
 * September?" six months later.
 */
export async function recordMeasurementSet(
  tenant: Pick<TenantContext, "businessId" | "user">,
  input: {
    customerId: string;
    /** fieldKey -> value in tenths of a unit. Zero and blank are skipped. */
    values: Record<string, number>;
    unit?: string;
    measuredAt?: Date;
    notes?: string | null;
  },
) {
  const fields = await getMeasurementFields(tenant.businessId);
  const byKey = new Map(fields.map((field) => [field.key, field]));

  const entries = Object.entries(input.values).filter(
    ([key, value]) => byKey.has(key) && Number.isFinite(value) && value > 0,
  );

  if (entries.length === 0) {
    throw new Error("Enter at least one measurement.");
  }

  const customer = await prisma.customer.findFirstOrThrow({
    where: { id: input.customerId, businessId: tenant.businessId },
    select: { id: true, fullName: true },
  });

  const unit = input.unit ?? "in";
  const measuredAt = input.measuredAt ?? new Date();

  const set = await prisma.measurementSet.create({
    data: {
      businessId: tenant.businessId,
      customerId: customer.id,
      measuredAt,
      measuredById: tenant.user.id,
      measuredByName: tenant.user.name,
      unit,
      notes: input.notes ?? null,
      values: {
        create: entries.map(([key, valueTenths]) => {
          const field = byKey.get(key)!;
          return {
            businessId: tenant.businessId,
            fieldKey: key,
            // Label and group are denormalised so renaming or retiring a field
            // later cannot corrupt a historical record.
            fieldLabel: field.label,
            group: field.group,
            valueTenths,
            unit,
          };
        }),
      },
    },
  });

  await prisma.customer.update({
    where: { id: customer.id, businessId: tenant.businessId },
    data: { lastVisitAt: measuredAt },
  });

  await audit(tenant, {
    action: "measurement.recorded",
    entityType: "customer",
    entityId: customer.id,
    summary: `Recorded ${entries.length} measurements for ${customer.fullName}.`,
    metadata: { setId: set.id, fields: entries.map(([key]) => key) },
  });

  await notify(tenant.businessId, {
    type: "MEASUREMENT_UPDATED",
    title: "Measurements updated",
    body: `${customer.fullName}'s measurements were updated.`,
    entityType: "customer",
    entityId: customer.id,
  });

  return set;
}

export type MeasurementSetWithValues = {
  id: string;
  measuredAt: Date;
  measuredByName: string;
  unit: string;
  notes: string | null;
  values: {
    fieldKey: string;
    fieldLabel: string;
    group: string;
    valueTenths: number;
    unit: string;
  }[];
};

export async function getMeasurementHistory(
  businessId: string,
  customerId: string,
  limit = 50,
): Promise<MeasurementSetWithValues[]> {
  return prisma.measurementSet.findMany({
    where: { businessId, customerId },
    orderBy: { measuredAt: "desc" },
    take: limit,
    select: {
      id: true,
      measuredAt: true,
      measuredByName: true,
      unit: true,
      notes: true,
      values: {
        select: {
          fieldKey: true,
          fieldLabel: true,
          group: true,
          valueTenths: true,
          unit: true,
        },
      },
    },
  });
}

export async function getLatestMeasurementSet(
  businessId: string,
  customerId: string,
): Promise<MeasurementSetWithValues | null> {
  return prisma.measurementSet.findFirst({
    where: { businessId, customerId },
    orderBy: { measuredAt: "desc" },
    select: {
      id: true,
      measuredAt: true,
      measuredByName: true,
      unit: true,
      notes: true,
      values: {
        select: {
          fieldKey: true,
          fieldLabel: true,
          group: true,
          valueTenths: true,
          unit: true,
        },
      },
    },
  });
}

export type MeasurementDiff = {
  fieldKey: string;
  fieldLabel: string;
  group: string;
  from: number | null;
  to: number | null;
  delta: number | null;
};

/**
 * Diffs two sessions. Fields present in only one side are still returned, with
 * a null on the missing side, so nothing silently disappears from the compare
 * view.
 */
export function diffMeasurementSets(
  older: MeasurementSetWithValues,
  newer: MeasurementSetWithValues,
): MeasurementDiff[] {
  const olderByKey = new Map(older.values.map((value) => [value.fieldKey, value]));
  const newerByKey = new Map(newer.values.map((value) => [value.fieldKey, value]));
  const keys = new Set([...olderByKey.keys(), ...newerByKey.keys()]);

  const out: MeasurementDiff[] = [];

  for (const key of keys) {
    const before = olderByKey.get(key);
    const after = newerByKey.get(key);
    const reference = after ?? before;
    if (!reference) continue;

    const from = before?.valueTenths ?? null;
    const to = after?.valueTenths ?? null;

    out.push({
      fieldKey: key,
      fieldLabel: reference.fieldLabel,
      group: reference.group,
      from,
      to,
      delta: from !== null && to !== null ? to - from : null,
    });
  }

  const groupRank = new Map<string, number>(
    MEASUREMENT_GROUPS.map((group, index) => [group, index]),
  );

  return out.sort((a, b) => {
    const rank = (groupRank.get(a.group) ?? 99) - (groupRank.get(b.group) ?? 99);
    if (rank !== 0) return rank;
    return a.fieldLabel.localeCompare(b.fieldLabel);
  });
}

/** History of one field across every session, oldest first, for trend lines. */
export function trendForField(
  history: MeasurementSetWithValues[],
  fieldKey: string,
): { measuredAt: Date; valueTenths: number; unit: string }[] {
  return history
    .map((set) => {
      const match = set.values.find((value) => value.fieldKey === fieldKey);
      return match
        ? { measuredAt: set.measuredAt, valueTenths: match.valueTenths, unit: match.unit }
        : null;
    })
    .filter((entry): entry is { measuredAt: Date; valueTenths: number; unit: string } =>
      entry !== null,
    )
    .reverse();
}

export function groupValues(
  set: MeasurementSetWithValues | null,
): Record<MeasurementGroup, MeasurementSetWithValues["values"]> {
  const out = {
    UPPER_BODY: [],
    LOWER_BODY: [],
    GARMENT: [],
    CUSTOM: [],
  } as Record<MeasurementGroup, MeasurementSetWithValues["values"]>;

  if (!set) return out;

  for (const value of set.values) {
    const group = (value.group as MeasurementGroup) ?? "CUSTOM";
    (out[group] ?? out.CUSTOM).push(value);
  }

  return out;
}
