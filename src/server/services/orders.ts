import "server-only";

import { prisma } from "@/lib/db";
import { nextOrderCode, orderSearchText } from "@/lib/codes";
import { audit, notify, type TenantContext } from "@/lib/tenant";
import { ORDER_STATUS_META, labelFor, type OrderStatus } from "@/lib/domain";

export type OrderInput = {
  customerId: string;
  title: string;
  outfitType: string;
  description?: string | null;
  fabric?: string | null;
  fabricNotes?: string | null;
  measurementSetId?: string | null;
  priceMinor: number;
  depositMinor?: number;
  deliveryDate?: Date | null;
  fittingDate?: Date | null;
  priority?: string;
  notes?: string | null;
};

export async function createOrder(
  tenant: Pick<TenantContext, "businessId" | "business" | "user">,
  input: OrderInput,
) {
  const customer = await prisma.customer.findFirstOrThrow({
    where: { id: input.customerId, businessId: tenant.businessId },
    select: { id: true, fullName: true },
  });

  // Default to the customer's most recent measurements — the overwhelmingly
  // common case, and one less decision at the counter.
  let measurementSetId = input.measurementSetId ?? null;
  if (measurementSetId) {
    const owned = await prisma.measurementSet.findFirst({
      where: {
        id: measurementSetId,
        businessId: tenant.businessId,
        customerId: customer.id,
      },
      select: { id: true },
    });
    measurementSetId = owned?.id ?? null;
  } else {
    const latest = await prisma.measurementSet.findFirst({
      where: { businessId: tenant.businessId, customerId: customer.id },
      orderBy: { measuredAt: "desc" },
      select: { id: true },
    });
    measurementSetId = latest?.id ?? null;
  }

  const code = await nextOrderCode(tenant.businessId);

  const order = await prisma.order.create({
    data: {
      businessId: tenant.businessId,
      code,
      customerId: customer.id,
      title: input.title,
      outfitType: input.outfitType,
      description: input.description ?? null,
      fabric: input.fabric ?? null,
      fabricNotes: input.fabricNotes ?? null,
      measurementSetId,
      priceMinor: input.priceMinor,
      paidMinor: 0,
      balanceMinor: input.priceMinor,
      status: "NEW",
      priority: input.priority ?? "NORMAL",
      deliveryDate: input.deliveryDate ?? null,
      fittingDate: input.fittingDate ?? null,
      notes: input.notes ?? null,
      createdById: tenant.user.id,
      searchText: orderSearchText({
        code,
        title: input.title,
        customerName: customer.fullName,
        fabric: input.fabric,
        description: input.description,
      }),
      timeline: {
        create: {
          businessId: tenant.businessId,
          type: "CREATED",
          title: "Order created",
          description: measurementSetId
            ? "Cut from the customer's most recent measurements."
            : "No measurements attached yet.",
          actorId: tenant.user.id,
          actorName: tenant.user.name,
        },
      },
    },
  });

  await prisma.customer.update({
    where: { id: customer.id, businessId: tenant.businessId },
    data: { lastVisitAt: new Date() },
  });

  await audit(tenant, {
    action: "order.created",
    entityType: "order",
    entityId: order.id,
    summary: `Created order #${code} — ${input.title} for ${customer.fullName}.`,
  });

  await notify(tenant.businessId, {
    type: "NEW_ORDER",
    title: "New order created",
    body: `Order #${code} — ${input.title} for ${customer.fullName}.`,
    entityType: "order",
    entityId: order.id,
  });

  return order;
}

export async function updateOrderStatus(
  tenant: Pick<TenantContext, "businessId" | "user">,
  orderId: string,
  status: OrderStatus,
  note?: string | null,
) {
  const order = await prisma.order.findFirstOrThrow({
    where: { id: orderId, businessId: tenant.businessId },
    select: {
      id: true,
      code: true,
      status: true,
      title: true,
      customer: { select: { fullName: true } },
    },
  });

  if (order.status === status) return order;

  const now = new Date();
  const label = labelFor(ORDER_STATUS_META, status);

  await prisma.order.update({
    where: { id: orderId, businessId: tenant.businessId },
    data: {
      status,
      completedAt:
        status === "READY" || status === "DELIVERED" ? now : null,
      deliveredAt: status === "DELIVERED" ? now : null,
      cancelledAt: status === "CANCELLED" ? now : null,
      timeline: {
        create: {
          businessId: tenant.businessId,
          type:
            status === "DELIVERED"
              ? "DELIVERED"
              : status === "CANCELLED"
                ? "CANCELLED"
                : "STATUS_CHANGED",
          title:
            status === "DELIVERED"
              ? "Delivered to customer"
              : status === "CANCELLED"
                ? "Order cancelled"
                : `Moved to ${label}`,
          description:
            note || (status === "DELIVERED" ? "Another perfect fit completed." : null),
          occurredAt: now,
          actorId: tenant.user.id,
          actorName: tenant.user.name,
        },
      },
    },
  });

  await audit(tenant, {
    action: "order.status_changed",
    entityType: "order",
    entityId: orderId,
    summary: `Order #${order.code} moved to ${label}.`,
    metadata: { from: order.status, to: status },
  });

  return order;
}

/**
 * Recomputes an order's paid and outstanding totals from its payment rows.
 *
 * These two columns are denormalised so the dashboard can sum outstanding
 * balances across hundreds of orders without a correlated subquery. This is the
 * only place allowed to write them, and every payment mutation calls it inside
 * the same transaction.
 */
export async function recalculateOrderTotals(
  businessId: string,
  orderId: string,
): Promise<{ priceMinor: number; paidMinor: number; balanceMinor: number }> {
  const order = await prisma.order.findFirstOrThrow({
    where: { id: orderId, businessId },
    select: { priceMinor: true },
  });

  const paid = await prisma.payment.aggregate({
    where: { businessId, orderId },
    _sum: { amountMinor: true },
  });

  const paidMinor = paid._sum.amountMinor ?? 0;
  const balanceMinor = order.priceMinor - paidMinor;

  await prisma.order.update({
    where: { id: orderId, businessId },
    data: { paidMinor, balanceMinor },
  });

  return { priceMinor: order.priceMinor, paidMinor, balanceMinor };
}

export async function addTimelineEvent(
  tenant: Pick<TenantContext, "businessId" | "user">,
  orderId: string,
  entry: { type: string; title: string; description?: string | null; occurredAt?: Date },
) {
  return prisma.orderTimelineEvent.create({
    data: {
      businessId: tenant.businessId,
      orderId,
      type: entry.type,
      title: entry.title,
      description: entry.description ?? null,
      occurredAt: entry.occurredAt ?? new Date(),
      actorId: tenant.user.id,
      actorName: tenant.user.name,
    },
  });
}
