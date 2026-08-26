"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getSession, setActiveBusiness } from "@/lib/auth";
import { audit, requireTenant } from "@/lib/tenant";
import { uniqueBusinessSlug } from "@/lib/codes";
import { slugify } from "@/lib/utils";
import {
  BUSINESS_TYPES,
  DEFAULT_MEASUREMENT_FIELDS,
  GENDERS,
  OUTFIT_TYPES,
  displayToTenths,
} from "@/lib/domain";
import { createCustomer } from "./services/customers";
import { recordMeasurementSet } from "./services/measurements";
import { createOrder } from "./services/orders";
import {
  fail,
  type FormState,
  guarded,
  moneySchema,
  nameSchema,
  optionalDateSchema,
  parseForm,
  phoneSchema,
} from "./form";

// ---------------------------------------------------------------------------
// Step 1 — tell us about your business
// ---------------------------------------------------------------------------

const businessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "What is your business called?")
    .max(120, "That name is too long."),
  type: z.enum(BUSINESS_TYPES),
  city: z.string().trim().min(2, "Which town or city?").max(80),
  phone: phoneSchema.optional().or(z.literal("")),
});

export async function createBusinessAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const session = await getSession();
    if (!session) redirect("/login");

    const parsed = parseForm(businessSchema, formData);
    if (!parsed.ok) return parsed.state;

    const existing = await prisma.membership.findFirst({
      where: { userId: session.userId, status: "ACTIVE" },
    });
    if (existing) redirect("/app");

    const { name, type, city, phone } = parsed.data;
    const slug = await uniqueBusinessSlug(slugify(name));

    const starter = await prisma.plan.findUnique({ where: { code: "STARTER" } });
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const business = await prisma.business.create({
      data: {
        name,
        slug,
        type,
        city,
        country: "GH",
        currency: "GHS",
        phone: phone || null,
        whatsapp: phone || null,
        onboardingStep: 1,
        settings: { create: {} },
        measurementFields: {
          create: DEFAULT_MEASUREMENT_FIELDS.map((field, index) => ({
            key: field.key,
            label: field.label,
            group: field.group,
            unit: "in",
            sortOrder: index,
          })),
        },
        memberships: {
          create: {
            userId: session.userId,
            role: "OWNER",
            status: "ACTIVE",
          },
        },
        // A trial rather than a paywall: no card is asked for anywhere in this
        // flow, per the brief's "frictionless onboarding".
        ...(starter
          ? {
              subscription: {
                create: {
                  planId: starter.id,
                  status: "ACTIVE",
                  interval: "MONTHLY",
                  currentPeriodEnd: periodEnd,
                },
              },
            }
          : {}),
      },
    });

    await setActiveBusiness(session.sessionId, business.id);

    await prisma.auditLog.create({
      data: {
        businessId: business.id,
        actorId: session.userId,
        actorName: session.user.name,
        action: "business.created",
        entityType: "business",
        entityId: business.id,
        summary: `${name} created on FIT BY YOU.`,
      },
    });

    revalidatePath("/onboarding");
    redirect("/onboarding?step=2");
  });
}

// ---------------------------------------------------------------------------
// Step 2 — add your first customer
// ---------------------------------------------------------------------------

const firstCustomerSchema = z.object({
  firstName: nameSchema,
  lastName: z.string().trim().max(120).default(""),
  phone: phoneSchema,
  gender: z.enum(GENDERS).default("UNSPECIFIED"),
  bust: z.string().trim().default(""),
  waist: z.string().trim().default(""),
  hip: z.string().trim().default(""),
});

export async function addFirstCustomerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requireTenant();

    const parsed = parseForm(firstCustomerSchema, formData);
    if (!parsed.ok) return parsed.state;

    const { firstName, lastName, phone, gender, bust, waist, hip } = parsed.data;

    const customer = await createCustomer(tenant, {
      firstName,
      lastName,
      phone,
      gender,
      tags: ["NEW"],
    });

    // Only record a measurement session if something was actually measured —
    // an empty set would be a lie in the history.
    const values: Record<string, number> = {};
    for (const [key, raw] of [
      ["bust", bust],
      ["waist", waist],
      ["hip", hip],
    ] as const) {
      if (raw === "") continue;
      const tenths = displayToTenths(raw);
      if (tenths && tenths > 0) values[key] = tenths;
    }

    if (Object.keys(values).length > 0) {
      await recordMeasurementSet(tenant, { customerId: customer.id, values });
    }

    await prisma.business.update({
      where: { id: tenant.businessId },
      data: { onboardingStep: 2 },
    });

    revalidatePath("/onboarding");
    redirect("/onboarding?step=3");
  });
}

// ---------------------------------------------------------------------------
// Step 3 — create your first order
// ---------------------------------------------------------------------------

const firstOrderSchema = z.object({
  customerId: z.string().min(1, "Pick a customer."),
  title: z.string().trim().min(2, "What are you making?").max(160),
  outfitType: z.enum(OUTFIT_TYPES).default("OTHER"),
  price: moneySchema,
  deliveryDate: optionalDateSchema,
});

export async function createFirstOrderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requireTenant();

    const parsed = parseForm(firstOrderSchema, formData);
    if (!parsed.ok) return parsed.state;

    const { customerId, title, outfitType, price, deliveryDate } = parsed.data;

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId: tenant.businessId },
      select: { id: true },
    });
    if (!customer) return fail("That customer could not be found.");

    await createOrder(tenant, {
      customerId: customer.id,
      title,
      outfitType,
      priceMinor: price,
      deliveryDate,
    });

    await prisma.business.update({
      where: { id: tenant.businessId },
      data: { onboardingStep: 3 },
    });

    revalidatePath("/onboarding");
    redirect("/onboarding?step=4");
  });
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export async function skipOnboardingStepAction(formData: FormData): Promise<void> {
  const tenant = await requireTenant();
  const target = Number.parseInt(String(formData.get("step") ?? "0"), 10);
  const step = Number.isFinite(target) ? Math.min(Math.max(target, 1), 3) : 1;

  await prisma.business.update({
    where: { id: tenant.businessId },
    data: { onboardingStep: step },
  });

  revalidatePath("/onboarding");
  redirect(`/onboarding?step=${step + 1}`);
}

export async function finishOnboardingAction(): Promise<void> {
  const tenant = await requireTenant();

  await prisma.business.update({
    where: { id: tenant.businessId },
    data: { onboardingStep: 4, onboardedAt: new Date() },
  });

  await audit(tenant, {
    action: "business.onboarded",
    entityType: "business",
    entityId: tenant.businessId,
    summary: "Onboarding completed.",
  });

  revalidatePath("/app", "layout");
  redirect("/app");
}
