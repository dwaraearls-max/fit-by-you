import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ACTIVE_ORDER_STATUSES, type CustomerFilter } from "@/lib/domain";
import { buildFitMemory, type FitMemory } from "@/lib/fit-memory";

export const CUSTOMERS_PER_PAGE = 12;

export type CustomerSort = "recent" | "name" | "orders" | "outstanding" | "visit";

/**
 * The customer database read.
 *
 * Filters are expressed as `where` clauses rather than post-filtering in
 * JavaScript, because "VIP" on a book of 4,000 customers has to stay a single
 * indexed query.
 */
export async function listCustomers(
  businessId: string,
  options: {
    query?: string;
    filter?: CustomerFilter;
    tag?: string;
    sort?: CustomerSort;
    page?: number;
  } = {},
) {
  const page = Math.max(1, options.page ?? 1);
  const term = options.query?.trim().toLowerCase();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const filters: Prisma.CustomerWhereInput[] = [];

  switch (options.filter) {
    case "NEW":
      filters.push({ createdAt: { gte: thirtyDaysAgo } });
      break;
    case "ACTIVE":
      // Somebody you are currently sewing for.
      filters.push({
        orders: { some: { status: { in: [...ACTIVE_ORDER_STATUSES] } } },
      });
      break;
    case "RETURNING":
      // More than one order, but nothing on the bench right now.
      filters.push({
        orders: { some: { status: "DELIVERED" } },
        AND: [{ orders: { none: { status: { in: [...ACTIVE_ORDER_STATUSES] } } } }],
      });
      break;
    case "VIP":
      filters.push({ tags: { some: { label: "VIP" } } });
      break;
    case "OUTSTANDING":
      filters.push({
        orders: { some: { balanceMinor: { gt: 0 }, status: { not: "CANCELLED" } } },
      });
      break;
    default:
      break;
  }

  if (options.tag) filters.push({ tags: { some: { label: options.tag } } });
  if (term) filters.push({ searchText: { contains: term } });

  const where: Prisma.CustomerWhereInput = {
    businessId,
    status: options.filter === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
    ...(filters.length > 0 ? { AND: filters } : {}),
  };

  const orderBy: Prisma.CustomerOrderByWithRelationInput[] =
    options.sort === "name"
      ? [{ fullName: "asc" }]
      : options.sort === "orders"
        ? [{ orders: { _count: "desc" } }, { fullName: "asc" }]
        : options.sort === "visit"
          ? [{ lastVisitAt: "desc" }, { createdAt: "desc" }]
          : [{ createdAt: "desc" }];

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      select: {
        id: true,
        code: true,
        fullName: true,
        phone: true,
        city: true,
        photoKey: true,
        createdAt: true,
        lastVisitAt: true,
        tags: { select: { label: true } },
        _count: { select: { orders: true, measurementSets: true } },
        orders: {
          where: { status: { not: "CANCELLED" } },
          select: { balanceMinor: true, status: true, deliveryDate: true },
        },
      },
      orderBy,
      skip: (page - 1) * CUSTOMERS_PER_PAGE,
      take: CUSTOMERS_PER_PAGE,
    }),
    prisma.customer.count({ where }),
  ]);

  const rows = customers.map((customer) => {
    const outstandingMinor = customer.orders.reduce(
      (total, order) => total + Math.max(0, order.balanceMinor),
      0,
    );
    const activeOrders = customer.orders.filter((order) =>
      (ACTIVE_ORDER_STATUSES as readonly string[]).includes(order.status),
    );

    return {
      id: customer.id,
      code: customer.code,
      fullName: customer.fullName,
      phone: customer.phone,
      city: customer.city,
      photoKey: customer.photoKey,
      createdAt: customer.createdAt,
      lastVisitAt: customer.lastVisitAt,
      tags: customer.tags.map((tag) => tag.label),
      orderCount: customer._count.orders,
      measurementCount: customer._count.measurementSets,
      activeOrderCount: activeOrders.length,
      outstandingMinor,
      nextDeliveryDate: activeOrders
        .map((order) => order.deliveryDate)
        .filter((date): date is Date => !!date)
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null,
    };
  });

  // Outstanding is a derived sum, so it is the one sort the database cannot do
  // for us. Sorting the page is honest about that rather than pretending.
  if (options.sort === "outstanding") {
    rows.sort((a, b) => b.outstandingMinor - a.outstandingMinor);
  }

  return {
    rows,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / CUSTOMERS_PER_PAGE)),
  };
}

export type CustomerRow = Awaited<ReturnType<typeof listCustomers>>["rows"][number];

/** Counts for the filter chips, so each one can show what it will find. */
export async function customerFilterCounts(businessId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const base = { businessId, status: "ACTIVE" } as const;

  const [all, isNew, active, returning, vip, outstanding, archived] =
    await Promise.all([
      prisma.customer.count({ where: base }),
      prisma.customer.count({
        where: { ...base, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.customer.count({
        where: {
          ...base,
          orders: { some: { status: { in: [...ACTIVE_ORDER_STATUSES] } } },
        },
      }),
      prisma.customer.count({
        where: {
          ...base,
          orders: { some: { status: "DELIVERED" } },
          AND: [
            { orders: { none: { status: { in: [...ACTIVE_ORDER_STATUSES] } } } },
          ],
        },
      }),
      prisma.customer.count({
        where: { ...base, tags: { some: { label: "VIP" } } },
      }),
      prisma.customer.count({
        where: {
          ...base,
          orders: { some: { balanceMinor: { gt: 0 }, status: { not: "CANCELLED" } } },
        },
      }),
      prisma.customer.count({ where: { businessId, status: "ARCHIVED" } }),
    ]);

  return {
    ALL: all,
    NEW: isNew,
    ACTIVE: active,
    RETURNING: returning,
    VIP: vip,
    OUTSTANDING: outstanding,
    ARCHIVED: archived,
  } satisfies Record<CustomerFilter, number>;
}

/**
 * The whole customer profile in one read, plus the FIT MEMORY aggregate that
 * the Overview tab and the "welcome back" moment both depend on.
 */
export async function getCustomerProfile(
  businessId: string,
  customerId: string,
  currency: string,
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
    include: {
      tags: { select: { id: true, label: true } },
      styleProfile: true,
      stylePreferences: { select: { id: true, kind: true, value: true } },
      createdBy: { select: { name: true } },
      _count: {
        select: {
          orders: true,
          measurementSets: true,
          photos: true,
          payments: true,
        },
      },
    },
  });

  if (!customer) return null;

  const [orders, lastMeasurement, paidAggregate] = await Promise.all([
    prisma.order.findMany({
      where: { businessId, customerId },
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
        deliveredAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.measurementSet.findFirst({
      where: { businessId, customerId },
      orderBy: { measuredAt: "desc" },
      select: { id: true, measuredAt: true, unit: true, measuredByName: true },
    }),
    prisma.payment.aggregate({
      where: { businessId, customerId },
      _sum: { amountMinor: true },
    }),
  ]);

  const outstandingMinor = orders
    .filter((order) => order.status !== "CANCELLED")
    .reduce((total, order) => total + Math.max(0, order.balanceMinor), 0);

  const fitMemory: FitMemory = buildFitMemory({
    customer: {
      firstName: customer.firstName,
      fullName: customer.fullName,
      customerSince: customer.customerSince,
      lastVisitAt: customer.lastVisitAt,
      notes: customer.notes,
    },
    orders: orders.map((order) => ({
      title: order.title,
      outfitType: order.outfitType,
      fabric: order.fabric,
      status: order.status,
      priceMinor: order.priceMinor,
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
    })),
    lastMeasuredAt: lastMeasurement?.measuredAt ?? null,
    measurementCount: customer._count.measurementSets,
    preferredFit: customer.styleProfile?.preferredFit ?? null,
    preferences: customer.stylePreferences,
    outstandingMinor,
    totalPaidMinor: paidAggregate._sum.amountMinor ?? 0,
    currency,
  });

  return {
    customer,
    orders,
    lastMeasurement,
    outstandingMinor,
    totalPaidMinor: paidAggregate._sum.amountMinor ?? 0,
    fitMemory,
  };
}

export type CustomerProfile = NonNullable<
  Awaited<ReturnType<typeof getCustomerProfile>>
>;
