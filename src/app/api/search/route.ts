import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { formatMoney } from "@/lib/money";
import { formatShortDate } from "@/lib/dates";
import { ORDER_STATUS_META, labelFor, tenthsToDisplay } from "@/lib/domain";

export type SearchResult = {
  id: string;
  kind: "customer" | "order" | "measurement" | "balance";
  title: string;
  subtitle: string;
  meta?: string;
  href: string;
};

/**
 * Global search. Queries the denormalised lowercase `searchText` columns with
 * `contains`, which keeps it case-insensitive on SQLite (where Prisma's
 * `mode: "insensitive"` is unsupported) and fast without a full-text index.
 */
export async function GET(request: Request) {
  const tenant = await requireTenant();
  const raw = new URL(request.url).searchParams.get("q") ?? "";
  const query = raw.trim().toLowerCase();

  if (query.length < 2) {
    return NextResponse.json({ results: [] satisfies SearchResult[] });
  }

  const { businessId, business } = tenant;
  const results: SearchResult[] = [];

  // -- Customers ------------------------------------------------------------
  const customers = await prisma.customer.findMany({
    where: { businessId, searchText: { contains: query } },
    orderBy: [{ lastVisitAt: "desc" }, { fullName: "asc" }],
    take: 6,
    select: {
      id: true,
      code: true,
      fullName: true,
      phone: true,
      photoKey: true,
      _count: { select: { orders: true } },
    },
  });

  for (const customer of customers) {
    results.push({
      id: customer.id,
      kind: "customer",
      title: customer.fullName,
      subtitle: `${customer.code} · ${customer.phone}`,
      meta:
        customer._count.orders === 1
          ? "1 order"
          : `${customer._count.orders} orders`,
      href: `/app/customers/${customer.id}`,
    });
  }

  // -- Orders ---------------------------------------------------------------
  const orders = await prisma.order.findMany({
    where: { businessId, searchText: { contains: query } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      balanceMinor: true,
      deliveryDate: true,
      customer: { select: { fullName: true } },
    },
  });

  for (const order of orders) {
    results.push({
      id: order.id,
      kind: "order",
      title: `#${order.code} — ${order.title}`,
      subtitle: `${order.customer.fullName} · ${labelFor(ORDER_STATUS_META, order.status)}`,
      meta: order.deliveryDate ? formatShortDate(order.deliveryDate) : undefined,
      href: `/app/orders/${order.id}`,
    });
  }

  // -- Measurements ---------------------------------------------------------
  // Two shapes of query are useful here: a body part ("waist") and a value
  // ("32"). Both resolve to the customers whose latest session matches.
  const numeric = Number.parseFloat(query);
  const valueTenths = Number.isFinite(numeric) ? Math.round(numeric * 10) : null;

  const measurementValues = await prisma.measurementValue.findMany({
    where: {
      businessId,
      ...(valueTenths !== null
        ? { valueTenths: { gte: valueTenths - 2, lte: valueTenths + 2 } }
        : { fieldKey: { contains: query.replace(/\s+/g, "_") } }),
    },
    take: 30,
    orderBy: { set: { measuredAt: "desc" } },
    select: {
      id: true,
      fieldLabel: true,
      valueTenths: true,
      unit: true,
      set: {
        select: {
          measuredAt: true,
          customer: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  const seenCustomers = new Set<string>();
  for (const value of measurementValues) {
    if (seenCustomers.has(value.set.customer.id)) continue;
    seenCustomers.add(value.set.customer.id);
    results.push({
      id: value.id,
      kind: "measurement",
      title: `${value.fieldLabel} ${tenthsToDisplay(value.valueTenths)}${value.unit}`,
      subtitle: value.set.customer.fullName,
      meta: formatShortDate(value.set.measuredAt),
      href: `/app/customers/${value.set.customer.id}?tab=measurements`,
    });
    if (seenCustomers.size >= 4) break;
  }

  // -- Outstanding balances -------------------------------------------------
  if (
    "balance".includes(query) ||
    "outstanding".includes(query) ||
    "owing".includes(query) ||
    "debt".includes(query)
  ) {
    const owing = await prisma.order.findMany({
      where: { businessId, balanceMinor: { gt: 0 }, status: { not: "CANCELLED" } },
      orderBy: { balanceMinor: "desc" },
      take: 5,
      select: {
        id: true,
        code: true,
        balanceMinor: true,
        customer: { select: { fullName: true } },
      },
    });

    for (const order of owing) {
      results.push({
        id: `balance-${order.id}`,
        kind: "balance",
        title: `${formatMoney(order.balanceMinor, business.currency)} outstanding`,
        subtitle: `${order.customer.fullName} · order #${order.code}`,
        href: `/app/orders/${order.id}`,
      });
    }
  }

  return NextResponse.json({ results });
}
