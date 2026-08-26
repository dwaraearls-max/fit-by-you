"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { audit, requirePermission, requireTenant } from "@/lib/tenant";
import {
  destroyAllSessions,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { canManageRole } from "@/lib/permissions";
import {
  businessTypeSchema,
  measurementGroupSchema,
  measurementUnitSchema,
  roleSchema,
} from "@/lib/domain";
import {
  emailSchema,
  fail,
  getString,
  guarded,
  nameSchema,
  parseForm,
  passwordSchema,
  succeed,
  type FormState,
} from "@/server/form";

const SETTINGS_PATH = "/app/settings";

// ---------------------------------------------------------------------------
// Business profile
// ---------------------------------------------------------------------------

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const businessSchema = z.object({
  name: nameSchema,
  type: businessTypeSchema,
  tagline: optionalText(160),
  phone: optionalText(24),
  email: optionalText(254),
  whatsapp: optionalText(24),
  addressLine: optionalText(200),
  city: optionalText(80),
  country: z.string().trim().min(2).max(2),
  currency: z.string().trim().min(3).max(3),
});

export async function updateBusinessAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("settings:write");
    const parsed = parseForm(businessSchema, formData);
    if (!parsed.ok) return parsed.state;

    const data = parsed.data;

    await prisma.business.update({
      where: { id: tenant.businessId },
      data: {
        name: data.name,
        type: data.type,
        tagline: data.tagline || null,
        phone: data.phone || null,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
        addressLine: data.addressLine || null,
        city: data.city || null,
        country: data.country.toUpperCase(),
        currency: data.currency.toUpperCase(),
      },
    });

    await audit(tenant, {
      action: "business.updated",
      entityType: "Business",
      entityId: tenant.businessId,
      summary: `Updated the business profile for ${data.name}`,
    });

    revalidatePath("/app", "layout");
    return succeed("Saved.");
  });
}

// ---------------------------------------------------------------------------
// Preferences, templates and notifications
// ---------------------------------------------------------------------------

const NOTIFICATION_KEYS = [
  "notifyNewOrder",
  "notifyPaymentReceived",
  "notifyPaymentOverdue",
  "notifyFittingTomorrow",
  "notifyDeliveryDue",
  "notifyNewCustomer",
  "notifyMeasurementUpdated",
  "notifySubscription",
] as const;

export type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

const preferencesSchema = z.object({
  defaultUnit: measurementUnitSchema,
  timezone: z.string().trim().min(1).max(64),
  weekStartsOn: z.coerce.number().int().min(0).max(1),
  receiptFooter: optionalText(240),
  whatsappOrderTemplate: z.string().trim().min(10).max(600),
  whatsappPaymentTemplate: z.string().trim().min(10).max(600),
  whatsappFittingTemplate: z.string().trim().min(10).max(600),
});

export async function updatePreferencesAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("settings:write");
    const parsed = parseForm(preferencesSchema, formData);
    if (!parsed.ok) return parsed.state;

    const data = parsed.data;
    // Unchecked switches are absent from FormData, so absence means off.
    const toggles = Object.fromEntries(
      NOTIFICATION_KEYS.map((key) => [key, formData.get(key) !== null]),
    ) as Record<NotificationKey, boolean>;

    const values = {
      defaultUnit: data.defaultUnit,
      timezone: data.timezone,
      weekStartsOn: data.weekStartsOn,
      receiptFooter: data.receiptFooter || null,
      whatsappOrderTemplate: data.whatsappOrderTemplate,
      whatsappPaymentTemplate: data.whatsappPaymentTemplate,
      whatsappFittingTemplate: data.whatsappFittingTemplate,
      ...toggles,
    };

    await prisma.businessSettings.upsert({
      where: { businessId: tenant.businessId },
      create: { businessId: tenant.businessId, ...values },
      update: values,
    });

    await audit(tenant, {
      action: "settings.updated",
      entityType: "BusinessSettings",
      entityId: tenant.businessId,
      summary: "Updated preferences, message templates and notifications",
    });

    revalidatePath(SETTINGS_PATH);
    return succeed("Saved.");
  });
}

// ---------------------------------------------------------------------------
// Custom measurement fields
// ---------------------------------------------------------------------------

const fieldSchema = z.object({
  label: z.string().trim().min(2, "Give the measurement a name.").max(60),
  group: measurementGroupSchema,
  unit: measurementUnitSchema,
});

/** `Sleeve at elbow` becomes `sleeve_at_elbow`, which is what the values store. */
function toKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export async function addMeasurementFieldAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("settings:write");
    const parsed = parseForm(fieldSchema, formData);
    if (!parsed.ok) return parsed.state;

    const { label, group, unit } = parsed.data;
    const key = toKey(label);
    if (!key) {
      return fail("Please check the highlighted fields.", {
        label: "Use at least a couple of letters or numbers.",
      });
    }

    const clash = await prisma.measurementField.findFirst({
      where: { businessId: tenant.businessId, key },
      select: { id: true, label: true, isActive: true },
    });

    if (clash) {
      // Re-adding something previously hidden should bring it back rather than
      // refuse, otherwise the name is permanently unusable.
      if (!clash.isActive) {
        await prisma.measurementField.update({
          where: { id: clash.id },
          data: { isActive: true, label, group, unit },
        });
        revalidatePath(SETTINGS_PATH);
        return succeed(`${label} is back in your measurement form.`);
      }

      return fail("Please check the highlighted fields.", {
        label: `You already measure "${clash.label}".`,
      });
    }

    const last = await prisma.measurementField.findFirst({
      where: { businessId: tenant.businessId, group },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    await prisma.measurementField.create({
      data: {
        businessId: tenant.businessId,
        key,
        label,
        group,
        unit,
        isCustom: true,
        sortOrder: (last?.sortOrder ?? 0) + 10,
      },
    });

    await audit(tenant, {
      action: "measurementField.created",
      entityType: "MeasurementField",
      summary: `Added the custom measurement "${label}"`,
    });

    revalidatePath(SETTINGS_PATH);
    revalidatePath("/app/customers", "layout");
    return succeed(`${label} will now appear on every measurement form.`);
  });
}

/**
 * Fields are hidden, never deleted. Values already recorded against a field
 * must keep their label, so an old measurement set still reads correctly.
 */
export async function toggleMeasurementFieldAction(formData: FormData): Promise<void> {
  const tenant = await requirePermission("settings:write");
  const id = getString(formData, "id");
  if (!id) return;

  const field = await prisma.measurementField.findFirst({
    where: { id, businessId: tenant.businessId },
    select: { id: true, label: true, isActive: true },
  });
  if (!field) return;

  await prisma.measurementField.update({
    where: { id: field.id },
    data: { isActive: !field.isActive },
  });

  await audit(tenant, {
    action: field.isActive
      ? "measurementField.hidden"
      : "measurementField.shown",
    entityType: "MeasurementField",
    entityId: field.id,
    summary: `${field.isActive ? "Hid" : "Restored"} the measurement "${field.label}"`,
  });

  revalidatePath(SETTINGS_PATH);
  revalidatePath("/app/customers", "layout");
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

const inviteSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: roleSchema,
  password: passwordSchema,
});

/**
 * Invitations are modelled as a real membership with a starting password,
 * because email delivery is deliberately deferred. The owner shares the
 * password once and the new member changes it — which is how a five-person
 * workshop actually onboards someone.
 */
export async function inviteMemberAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("team:write");
    const parsed = parseForm(inviteSchema, formData);
    if (!parsed.ok) return parsed.state;

    const { name, email, role, password } = parsed.data;

    if (!canManageRole(tenant.role, role)) {
      return fail(`You cannot add someone as ${role.toLowerCase()}.`);
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    const userId =
      existing?.id ??
      (
        await prisma.user.create({
          data: { email, name, passwordHash: await hashPassword(password) },
          select: { id: true },
        })
      ).id;

    const alreadyHere = await prisma.membership.findFirst({
      where: { userId, businessId: tenant.businessId },
      select: { id: true, status: true },
    });

    if (alreadyHere) {
      if (alreadyHere.status === "ACTIVE") {
        return fail(`${name} is already on your team.`, {
          email: "This person already has access.",
        });
      }

      await prisma.membership.update({
        where: { id: alreadyHere.id },
        data: { status: "ACTIVE", role },
      });
    } else {
      await prisma.membership.create({
        data: {
          userId,
          businessId: tenant.businessId,
          role,
          status: "ACTIVE",
          invitedEmail: email,
          invitedAt: new Date(),
        },
      });
    }

    await audit(tenant, {
      action: "team.invited",
      entityType: "Membership",
      summary: `Added ${name} as ${role.toLowerCase()}`,
      metadata: { email, role },
    });

    revalidatePath(SETTINGS_PATH);
    return succeed(
      existing
        ? `${name} already had an account, so they can sign in with their own password.`
        : `${name} can sign in with ${email} and the password you just set.`,
    );
  });
}

const roleChangeSchema = z.object({
  membershipId: z.string().min(1),
  role: roleSchema,
});

export async function changeMemberRoleAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("team:write");
    const parsed = parseForm(roleChangeSchema, formData);
    if (!parsed.ok) return parsed.state;

    const { membershipId, role } = parsed.data;

    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, businessId: tenant.businessId },
      include: { user: { select: { name: true } } },
    });
    if (!membership) return fail("That team member is no longer here.");

    if (!canManageRole(tenant.role, membership.role as never)) {
      return fail("You cannot change that person's role.");
    }

    if (membership.role === "OWNER" && role !== "OWNER") {
      const owners = await prisma.membership.count({
        where: {
          businessId: tenant.businessId,
          role: "OWNER",
          status: "ACTIVE",
        },
      });
      if (owners <= 1) {
        return fail(
          "Every business needs one owner. Make someone else an owner first.",
        );
      }
    }

    await prisma.membership.update({
      where: { id: membership.id },
      data: { role },
    });

    await audit(tenant, {
      action: "team.roleChanged",
      entityType: "Membership",
      entityId: membership.id,
      summary: `Changed ${membership.user.name} to ${role.toLowerCase()}`,
    });

    revalidatePath(SETTINGS_PATH);
    return succeed(`${membership.user.name} is now ${role.toLowerCase()}.`);
  });
}

export async function setMemberStatusAction(formData: FormData): Promise<void> {
  const tenant = await requirePermission("team:write");
  const membershipId = getString(formData, "membershipId");
  const status = getString(formData, "status");
  if (!membershipId || (status !== "ACTIVE" && status !== "SUSPENDED")) return;

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, businessId: tenant.businessId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!membership) return;

  // Suspending yourself would lock you out of the settings page you are on.
  if (membership.user.id === tenant.user.id) return;

  if (status === "SUSPENDED" && membership.role === "OWNER") {
    const owners = await prisma.membership.count({
      where: { businessId: tenant.businessId, role: "OWNER", status: "ACTIVE" },
    });
    if (owners <= 1) return;
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { status },
  });

  await audit(tenant, {
    action: status === "ACTIVE" ? "team.restored" : "team.suspended",
    entityType: "Membership",
    entityId: membership.id,
    summary: `${status === "ACTIVE" ? "Restored" : "Suspended"} ${membership.user.name}`,
  });

  revalidatePath(SETTINGS_PATH);
}

// ---------------------------------------------------------------------------
// Your own account
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  name: nameSchema,
  phone: optionalText(24),
});

export async function updateProfileAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requireTenant();
    const parsed = parseForm(profileSchema, formData);
    if (!parsed.ok) return parsed.state;

    await prisma.user.update({
      where: { id: tenant.user.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
      },
    });

    revalidatePath("/app", "layout");
    return succeed("Saved.");
  });
}

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Type the new password again."),
    signOutEverywhere: z.string().optional(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Those two passwords do not match.",
  });

export async function changePasswordAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requireTenant();
    const parsed = parseForm(passwordChangeSchema, formData);
    if (!parsed.ok) return parsed.state;

    const user = await prisma.user.findUnique({
      where: { id: tenant.user.id },
      select: { passwordHash: true },
    });
    if (!user) return fail("Please sign in again.");

    const correct = await verifyPassword(
      parsed.data.currentPassword,
      user.passwordHash,
    );
    if (!correct) {
      return fail("Please check the highlighted fields.", {
        currentPassword: "That is not your current password.",
      });
    }

    await prisma.user.update({
      where: { id: tenant.user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });

    await audit(tenant, {
      action: "user.passwordChanged",
      entityType: "User",
      entityId: tenant.user.id,
      summary: "Changed their password",
    });

    if (parsed.data.signOutEverywhere) {
      await destroyAllSessions(tenant.user.id);
      redirect("/login?reason=password-changed");
    }

    return succeed("Password changed.");
  });
}

export async function signOutEverywhereAction(): Promise<void> {
  const tenant = await requireTenant();
  await audit(tenant, {
    action: "user.sessionsRevoked",
    entityType: "User",
    entityId: tenant.user.id,
    summary: "Signed out of every device",
  });
  await destroyAllSessions(tenant.user.id);
  redirect("/login?reason=signed-out-everywhere");
}

export async function revokeSessionAction(formData: FormData): Promise<void> {
  const tenant = await requireTenant();
  const id = getString(formData, "id");
  if (!id || id === tenant.sessionId) return;

  await prisma.session.deleteMany({ where: { id, userId: tenant.user.id } });
  revalidatePath(SETTINGS_PATH);
}

// ---------------------------------------------------------------------------
// Deleting the business
// ---------------------------------------------------------------------------

/**
 * Deletion is real, immediate and cascading, which is why it demands the
 * business name typed out and the account password. Everything the business
 * owns goes with it; nothing is kept "just in case".
 */
export async function deleteBusinessAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("business:delete");

    const typed = getString(formData, "confirmName");
    const password = getString(formData, "password");

    if (typed !== tenant.business.name) {
      return fail("Please check the highlighted fields.", {
        confirmName: `Type "${tenant.business.name}" exactly to confirm.`,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: tenant.user.id },
      select: { passwordHash: true },
    });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return fail("Please check the highlighted fields.", {
        password: "That is not your password.",
      });
    }

    await prisma.business.delete({ where: { id: tenant.businessId } });

    const remaining = await prisma.membership.count({
      where: { userId: tenant.user.id, status: "ACTIVE" },
    });

    if (remaining === 0) {
      await destroySession();
      redirect("/?deleted=1");
    }

    redirect("/app");
  });
}