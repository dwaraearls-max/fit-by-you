import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { prisma } from "./db";
import { getSession, setActiveBusiness } from "./auth";
import { can, ForbiddenError, type Permission } from "./permissions";
import type { Role } from "./domain";

export type TenantContext = {
  businessId: string;
  business: {
    id: string;
    name: string;
    slug: string;
    type: string;
    currency: string;
    logoKey: string | null;
    onboardedAt: Date | null;
    onboardingStep: number;
  };
  role: Role;
  user: { id: string; name: string; email: string; avatarKey: string | null };
  sessionId: string;
  /** Convenience wrapper so pages read `t.can("order:write")`. */
  can: (permission: Permission) => boolean;
};

/**
 * The single door into tenant data.
 *
 * Every page, Server Action and route handler that touches business data calls
 * this first. It resolves the session cookie to a membership, picks the active
 * business, and hands back the `businessId` that must appear in every query.
 *
 * Wrapped in React's `cache` so a page rendering a dozen server components
 * resolves the session once per request rather than a dozen times.
 */
export const requireTenant = cache(async function requireTenant(): Promise<TenantContext> {
  const session = await getSession();
  if (!session) redirect("/login");

  const memberships = await prisma.membership.findMany({
    where: { userId: session.userId, status: "ACTIVE" },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          currency: true,
          logoKey: true,
          onboardedAt: true,
          onboardingStep: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  if (memberships.length === 0) redirect("/onboarding");

  // Honour the session's active business when it is still valid, otherwise
  // fall back to the first membership and remember that choice.
  const membership =
    memberships.find((entry) => entry.businessId === session.businessId) ??
    memberships[0]!;

  if (session.businessId !== membership.businessId) {
    await setActiveBusiness(session.sessionId, membership.businessId);
  }

  const role = membership.role as Role;

  return {
    businessId: membership.businessId,
    business: membership.business,
    role,
    user: session.user,
    sessionId: session.sessionId,
    can: (permission: Permission) => can(role, permission),
  };
});

/**
 * Same as `requireTenant`, but also asserts a capability. Server Actions should
 * always use this form so authorisation is impossible to forget.
 */
export async function requirePermission(
  permission: Permission,
): Promise<TenantContext> {
  const tenant = await requireTenant();
  if (!can(tenant.role, permission)) throw new ForbiddenError(permission);
  return tenant;
}

/** For pages that must render for signed-out visitors too. */
export const optionalTenant = cache(async function optionalTenant(): Promise<TenantContext | null> {
  const session = await getSession();
  if (!session) return null;

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      status: "ACTIVE",
      ...(session.businessId ? { businessId: session.businessId } : {}),
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          currency: true,
          logoKey: true,
          onboardedAt: true,
          onboardingStep: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  if (!membership) return null;
  const role = membership.role as Role;

  return {
    businessId: membership.businessId,
    business: membership.business,
    role,
    user: session.user,
    sessionId: session.sessionId,
    can: (permission: Permission) => can(role, permission),
  };
});

/** Every business the signed-in user can switch between. */
export async function listMemberships(userId: string) {
  return prisma.membership.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      business: { select: { id: true, name: true, slug: true, logoKey: true } },
    },
    orderBy: { joinedAt: "asc" },
  });
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

/**
 * Records a mutation against the business. Deliberately non-throwing: an audit
 * write must never be the reason a tailor loses the measurement they just took.
 */
export async function audit(
  tenant: Pick<TenantContext, "businessId" | "user">,
  entry: {
    action: string;
    entityType: string;
    entityId?: string | null;
    summary: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        businessId: tenant.businessId,
        actorId: tenant.user.id,
        actorName: tenant.user.name,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        summary: entry.summary,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    });
  } catch (error) {
    console.error("audit write failed", error);
  }
}

/** Raises an in-app notification, respecting the business's preferences. */
export async function notify(
  businessId: string,
  entry: {
    type: string;
    title: string;
    body: string;
    entityType?: string | null;
    entityId?: string | null;
    userId?: string | null;
  },
): Promise<void> {
  try {
    const settings = await prisma.businessSettings.findUnique({
      where: { businessId },
    });

    const enabled: Record<string, boolean | undefined> = {
      NEW_ORDER: settings?.notifyNewOrder,
      PAYMENT_RECEIVED: settings?.notifyPaymentReceived,
      PAYMENT_OVERDUE: settings?.notifyPaymentOverdue,
      FITTING_TOMORROW: settings?.notifyFittingTomorrow,
      DELIVERY_DUE: settings?.notifyDeliveryDue,
      NEW_CUSTOMER: settings?.notifyNewCustomer,
      MEASUREMENT_UPDATED: settings?.notifyMeasurementUpdated,
      SUBSCRIPTION_RENEWAL: settings?.notifySubscription,
    };

    if (enabled[entry.type] === false) return;

    await prisma.notification.create({
      data: {
        businessId,
        userId: entry.userId ?? null,
        type: entry.type,
        title: entry.title,
        body: entry.body,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
      },
    });
  } catch (error) {
    console.error("notification write failed", error);
  }
}
