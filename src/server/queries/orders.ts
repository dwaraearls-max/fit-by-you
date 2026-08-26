import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ACTIVE_ORDER_STATUSES } from "@/lib/domain";
import { dayBounds } from "@/lib/dates";

export const ORDERS_PER_PAGE = 15;

export const ORDER_FILTERS = [
  "ACTIVE",
  "OVERDUE",
  "DUE_SOON",
  "READY",
  "UNPAID",
  "DELIVERED",
  "CANCELLED",
  "ALL",
] as const;

export type OrderFilter = (typeof ORDER_FILTERS)[number];

export const ORDER_FILTER_LABELS: Record<OrderFilter, string> = {
  ACTIVE: "In progress",
  OVERDUE: "Overdue",
  DUE_SOON: "Due this week",
  READY: "Ready",
  UNPAID: "Unpaid",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  ALL: "All orders",
};

function whereFor(businessId: string, filter: OrderFilter): Prisma.OrderWhereInput {
  const { start: todayStart, end: todayEnd } = dayBounds();
  const weekAhead = new Date(todayEnd);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const active = { status: { in: [...ACTIVE_ORDER_STATUSES] } };

  switch (filter) {
    case "ACTIVE":
      return { businessId, ...active };
    case "OVERDUE":
      return { businessId, ...active, deliveryDate: { lt: todayStart } };
    case "DUE_SOON":
      return {
        businessId,
        ...active,
        deliveryDate: { gte: todayStart, lte: weekAhead },
      };
    case "READY":
      return { businessId, status: "READY" };
    case "UNPAID":
      return {
        businessId,
        status: { not: "CANCELLED" },
        balanceMinor: { gt: 0 },
      };
    case "DELIVERED":
      return { businessId, status: "DELIVERED" };
    case "CANCELLED":
      return { businessId, status: "CANCELLED" };
    default:
      return { businessId };
  }
}

export async function listOrders(
  businessId: string,
  options: {
    query?: string;
    filter?: OrderFilter;
    page?: number;
  } = {},
) {
  const page = Math.max(1, options.page ?? 1);
  const filter = options.filter ?? "ACTIVE";
  const term = options.query?.trim().toLowerCase();

  const where: Prisma.OrderWhereInput = {
    ...whereFor(businessId, filter),
    ...(term ? { searchText: { contains: term } } : {}),
  };

  // Live work sorts by how soon it is due, with undated orders last. Finished
  // work sorts by when it was finished, newest first.
  const orderBy: Prisma.OrderOrderByWithRelationInput[] =
    filter === "DELIVERED" || filter === "CANCELLED"
      ? [{ updatedAt: "desc" }]
      : [{ deliveryDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }];

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        code: true,
        title: true,
        outfitType: true,
        fabric: true,
        status: true,
        priority: true,
        priceMinor: true,
        paidMinor: true,
        balanceMinor: true,
        deliveryDate: true,
        fittingDate: true,
        createdAt: true,
        customer: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy,
      skip: (page - 1) * ORDERS_PER_PAGE,
      take: ORDERS_PER_PAGE,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ORDERS_PER_PAGE)),
  };
}

export type OrderListRow = Awaited<ReturnType<typeof listOrders>>["orders"][number];

export async function orderFilterCounts(businessId: string) {
  const entries = await Promise.all(
    ORDER_FILTERS.map(async (filter) => {
      const count = await prisma.order.count({
        where: whereFor(businessId, filter),
      });
      return [filter, count] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<OrderFilter, number>;
}

/** Everything the order detail screen needs, in one read. */
export async function getOrder(businessId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, businessId },
    include: {
      customer: {
        select: {
          id: true,
          code: true,
          fullName: true,
          firstName: true,
          phone: true,
          photoKey: true,
        },
      },
      createdBy: { select: { name: true } },
      measurementSet: {
        select: {
          id: true,
          measuredAt: true,
          measuredByName: true,
          unit: true,
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
      },
      timeline: { orderBy: { occurredAt: "desc" } },
      fittings: { orderBy: { scheduledFor: "asc" } },
      payments: {
        orderBy: { receivedAt: "desc" },
        select: {
          id: true,
          amountMinor: true,
          method: true,
          reference: true,
          receiptNumber: true,
          receivedAt: true,
        },
      },
      photos: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          category: true,
          caption: true,
          storageKey: true,
          createdAt: true,
        },
      },
      items: { orderBy: { name: "asc" } },
    },
  });

  return order;
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrder>>>;
