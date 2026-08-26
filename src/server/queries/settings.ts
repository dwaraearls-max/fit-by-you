import "server-only";

import { prisma } from "@/lib/db";

export async function businessProfile(businessId: string) {
  return prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    include: { settings: true },
  });
}

export async function teamMembers(businessId: string) {
  return prisma.membership.findMany({
    where: { businessId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarKey: true,
          lastLoginAt: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });
}

export async function measurementFields(businessId: string) {
  return prisma.measurementField.findMany({
    where: { businessId },
    orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
  });
}

/**
 * How many times each field has actually been recorded. Shown beside the field
 * so nobody hides something the whole history depends on without knowing.
 */
export async function measurementFieldUsage(
  businessId: string,
): Promise<Map<string, number>> {
  const rows = await prisma.measurementValue.groupBy({
    by: ["fieldKey"],
    where: { businessId },
    _count: { _all: true },
  });
  return new Map(rows.map((row) => [row.fieldKey, row._count._all]));
}

export async function auditTrail(businessId: string, take = 60) {
  return prisma.auditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      actorName: true,
      action: true,
      entityType: true,
      entityId: true,
      summary: true,
      createdAt: true,
    },
  });
}

export async function activeSessions(userId: string, currentSessionId: string) {
  const sessions = await prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: "desc" },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  return sessions.map((session) => ({
    ...session,
    isCurrent: session.id === currentSessionId,
  }));
}

/** What deleting the business would actually destroy, counted honestly. */
export async function deletionImpact(businessId: string) {
  const [customers, orders, payments, photos, measurementSets] =
    await Promise.all([
      prisma.customer.count({ where: { businessId } }),
      prisma.order.count({ where: { businessId } }),
      prisma.payment.count({ where: { businessId } }),
      prisma.customerPhoto.count({ where: { businessId } }),
      prisma.measurementSet.count({ where: { businessId } }),
    ]);

  return { customers, orders, payments, photos, measurementSets };
}
