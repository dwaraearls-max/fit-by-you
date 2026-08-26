"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { audit } from "@/lib/tenant";
import {
  customerTagSchema,
  genderSchema,
  preferenceKindSchema,
  preferredFitSchema,
} from "@/lib/domain";
import {
  createCustomer,
  setCustomerTags,
  setStylePreferences,
  updateCustomer,
} from "@/server/services/customers";
import {
  fail,
  getAll,
  getString,
  guarded,
  nameSchema,
  optionalDateSchema,
  parseForm,
  phoneSchema,
  succeed,
  type FormState,
} from "@/server/form";

const customerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  altPhone: z.string().trim().max(24).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(254)
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value),
      "Enter a valid email address.",
    ),
  gender: genderSchema.optional(),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  addressLine: z.string().trim().max(200).optional().or(z.literal("")),
  birthday: optionalDateSchema,
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
});

function toInput(data: z.infer<typeof customerSchema>, tags: string[]) {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    altPhone: data.altPhone || null,
    email: data.email || null,
    gender: data.gender ?? "UNSPECIFIED",
    city: data.city || null,
    addressLine: data.addressLine || null,
    birthday: data.birthday,
    notes: data.notes || null,
    tags,
  };
}

export async function createCustomerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("customer:write");
    const parsed = parseForm(customerSchema, formData);
    if (!parsed.ok) return parsed.state;

    const tags = getAll(formData, "tags").filter(
      (label) => customerTagSchema.safeParse(label).success,
    );

    const customer = await createCustomer(tenant, toInput(parsed.data, tags));

    revalidatePath("/app/customers");
    revalidatePath("/app");

    // Straight to the profile: the next thing a tailor does is measure.
    redirect(`/app/customers/${customer.id}?welcome=1`);
  });
}

export async function updateCustomerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("customer:write");
    const customerId = getString(formData, "customerId");
    if (!customerId) return fail("Missing customer.");

    const parsed = parseForm(customerSchema, formData);
    if (!parsed.ok) return parsed.state;

    const tags = getAll(formData, "tags").filter(
      (label) => customerTagSchema.safeParse(label).success,
    );

    await updateCustomer(tenant, customerId, toInput(parsed.data, tags));
    await setCustomerTags(tenant, customerId, tags);

    revalidatePath(`/app/customers/${customerId}`);
    revalidatePath("/app/customers");

    return succeed("Details saved.");
  });
}

/** The Notes tab saves on its own so a long note is never lost to validation. */
export async function saveCustomerNotesAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("customer:write");
    const customerId = getString(formData, "customerId");
    if (!customerId) return fail("Missing customer.");

    const notes = getString(formData, "notes").slice(0, 8000);

    await prisma.customer.update({
      where: { id: customerId, businessId: tenant.businessId },
      data: { notes: notes || null },
    });

    await audit(tenant, {
      action: "customer.notes_updated",
      entityType: "customer",
      entityId: customerId,
      summary: "Updated customer notes.",
    });

    revalidatePath(`/app/customers/${customerId}`);
    return succeed("Notes saved.");
  });
}

export async function setCustomerTagsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("customer:write");
    const customerId = getString(formData, "customerId");
    if (!customerId) return fail("Missing customer.");

    const tags = getAll(formData, "tags").filter(
      (label) => customerTagSchema.safeParse(label).success,
    );

    await setCustomerTags(tenant, customerId, tags);
    revalidatePath(`/app/customers/${customerId}`);
    revalidatePath("/app/customers");

    return succeed("Tags updated.");
  });
}

const styleProfileSchema = z.object({
  preferredFit: preferredFitSchema.optional().or(z.literal("")),
  styleNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  avoidNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  occasionNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function saveStyleProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("style:write");
    const customerId = getString(formData, "customerId");
    if (!customerId) return fail("Missing customer.");

    const parsed = parseForm(styleProfileSchema, formData);
    if (!parsed.ok) return parsed.state;

    const fields = {
      preferredFit: parsed.data.preferredFit || null,
      styleNotes: parsed.data.styleNotes || null,
      avoidNotes: parsed.data.avoidNotes || null,
      occasionNotes: parsed.data.occasionNotes || null,
    };

    // `customerId` is unique on StyleProfile, but an upsert keyed on it alone
    // would not prove the row belongs to this business. Resolving inside the
    // tenant first keeps the guarantee.
    const existing = await prisma.styleProfile.findFirst({
      where: { customerId, businessId: tenant.businessId },
      select: { id: true },
    });

    if (existing) {
      await prisma.styleProfile.update({
        where: { id: existing.id, businessId: tenant.businessId },
        data: fields,
      });
    } else {
      await prisma.styleProfile.create({
        data: { businessId: tenant.businessId, customerId, ...fields },
      });
    }

    for (const kind of ["STYLE", "COLOR", "FABRIC"] as const) {
      if (!preferenceKindSchema.safeParse(kind).success) continue;
      const values = getAll(formData, kind.toLowerCase());
      await setStylePreferences(tenant, customerId, kind, values);
    }

    revalidatePath(`/app/customers/${customerId}`);
    return succeed("Style profile saved.");
  });
}

/**
 * Archive and visit take plain `FormData` rather than a form state, because
 * they are fired from menu items and buttons that have no fields to invalidate.
 */
export async function archiveCustomerAction(formData: FormData): Promise<void> {
  const tenant = await requirePermission("customer:delete");
  const customerId = getString(formData, "customerId");
  if (!customerId) return;

  const customer = await prisma.customer.findFirstOrThrow({
    where: { id: customerId, businessId: tenant.businessId },
    select: { fullName: true, status: true },
  });

  const archiving = customer.status === "ACTIVE";

  await prisma.customer.update({
    where: { id: customerId, businessId: tenant.businessId },
    data: { status: archiving ? "ARCHIVED" : "ACTIVE" },
  });

  await audit(tenant, {
    action: archiving ? "customer.archived" : "customer.restored",
    entityType: "customer",
    entityId: customerId,
    summary: `${archiving ? "Archived" : "Restored"} ${customer.fullName}.`,
  });

  revalidatePath("/app/customers");
  revalidatePath(`/app/customers/${customerId}`);
}

/** Records that the customer walked in today, which drives "Welcome back". */
export async function markVisitAction(formData: FormData): Promise<void> {
  const tenant = await requirePermission("customer:write");
  const customerId = getString(formData, "customerId");
  if (!customerId) return;

  await prisma.customer.update({
    where: { id: customerId, businessId: tenant.businessId },
    data: { lastVisitAt: new Date() },
  });

  revalidatePath(`/app/customers/${customerId}`);
}
