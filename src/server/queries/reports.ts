import "server-only";

import { format, subMonths } from "date-fns";

import { prisma } from "@/lib/db";
import { monthBounds } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { OUTFIT_TYPE_META, labelFor } from "@/lib/domain";
import { percent, pluralise } from "@/lib/utils";

/**
 * Analytics for someone who runs a workshop, not a spreadsheet.
 *
 * Every figure here answers a question a tailor actually asks: am I busier than
 * last month, who is worth looking after, what do I make most of, and am I
 * finishing on time. The insights at the bottom say it in words, because a
 * number without a sentence is just decoration.
 */
export async function businessReport(businessId: string, currency: string) {
  const months = 6;
  const windows = Array.from({ length: months }, (_, index) =>
    monthBounds(-(months - 1 - index)),
  );
  const oldest = windows[0]!.start;

  const [
    revenueRows,
    orderRows,
    customerRows,
    outfitMix,
    topCustomers,
    delivered,
    activeCount,
    newCustomersThisMonth,
    totalCustomers,
    outstanding,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: { businessId, receivedAt: { gte: oldest } },
      select: { amountMinor: true, receivedAt: true },
    }),
    prisma.order.findMany({
      where: { businessId, createdAt: { gte: oldest } },
      select: { createdAt: true, priceMinor: true, status: true },
    }),
    prisma.customer.findMany({
      where: { businessId, createdAt: { gte: oldest } },
      select: { createdAt: true },
    }),
    prisma.order.groupBy({
      by: ["outfitType"],
      where: { businessId, status: { not: "CANCELLED" } },
      _count: { _all: true },
      _sum: { priceMinor: true },
    }),
    prisma.order.groupBy({
      by: ["customerId"],
      where: { businessId, status: { not: "CANCELLED" } },
      _sum: { paidMinor: true },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: {
        businessId,
        status: "DELIVERED",
        deliveredAt: { not: null },
        deliveryDate: { not: null },
      },
      select: { deliveredAt: true, deliveryDate: true },
      take: 500,
      orderBy: { deliveredAt: "desc" },
    }),
    prisma.order.count({
      where: {
        businessId,
        status: { notIn: ["DELIVERED", "CANCELLED"] },
      },
    }),
    prisma.customer.count({
      where: { businessId, createdAt: { gte: monthBounds().start } },
    }),
    prisma.customer.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.order.aggregate({
      where: { businessId, status: { not: "CANCELLED" }, balanceMinor: { gt: 0 } },
      _sum: { balanceMinor: true },
    }),
  ]);

  const series = windows.map((window) => {
    const revenueMinor = revenueRows
      .filter((row) => row.receivedAt >= window.start && row.receivedAt <= window.end)
      .reduce((sum, row) => sum + row.amountMinor, 0);

    const ordersInMonth = orderRows.filter(
      (row) => row.createdAt >= window.start && row.createdAt <= window.end,
    );

    return {
      month: format(window.start, "MMM"),
      label: window.label,
      revenueMinor,
      orders: ordersInMonth.length,
      customers: customerRows.filter(
        (row) => row.createdAt >= window.start && row.createdAt <= window.end,
      ).length,
    };
  });

  const thisMonth = series[series.length - 1]!;
  const lastMonth = series[series.length - 2] ?? null;

  const revenueChange =
    lastMonth && lastMonth.revenueMinor > 0
      ? Math.round(
          ((thisMonth.revenueMinor - lastMonth.revenueMinor) /
            lastMonth.revenueMinor) *
            100,
        )
      : null;

  const completedOrders = orderRows.filter((row) => row.status === "DELIVERED");
  const averageOrderMinor =
    orderRows.length > 0
      ? Math.round(
          orderRows.reduce((sum, row) => sum + row.priceMinor, 0) / orderRows.length,
        )
      : 0;

  const onTime = delivered.filter(
    (order) => order.deliveredAt! <= order.deliveryDate!,
  ).length;
  const onTimePercent =
    delivered.length > 0 ? percent(onTime, delivered.length) : null;

  const mix = outfitMix
    .map((row) => ({
      outfitType: row.outfitType,
      label: labelFor(OUTFIT_TYPE_META, row.outfitType),
      count: row._count._all,
      revenueMinor: row._sum.priceMinor ?? 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const topIds = topCustomers
    .sort((a, b) => (b._sum.paidMinor ?? 0) - (a._sum.paidMinor ?? 0))
    .slice(0, 6);

  const topCustomerRows =
    topIds.length > 0
      ? await prisma.customer.findMany({
          where: { businessId, id: { in: topIds.map((row) => row.customerId) } },
          select: { id: true, fullName: true, customerSince: true },
        })
      : [];

  const byId = new Map(topCustomerRows.map((row) => [row.id, row]));
  const best = topIds
    .map((row) => {
      const customer = byId.get(row.customerId);
      if (!customer) return null;
      return {
        id: customer.id,
        name: customer.fullName,
        since: customer.customerSince,
        spentMinor: row._sum.paidMinor ?? 0,
        orders: row._count._all,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  // --- Insights ------------------------------------------------------------
  const insights: { tone: "positive" | "caution" | "neutral"; text: string }[] = [];

  if (revenueChange !== null && Math.abs(revenueChange) >= 5) {
    insights.push({
      tone: revenueChange > 0 ? "positive" : "caution",
      text:
        revenueChange > 0
          ? `You have collected ${revenueChange}% more this month than last month — ${formatMoney(thisMonth.revenueMinor, currency)} so far.`
          : `You have collected ${Math.abs(revenueChange)}% less this month than last month. ${formatMoney(outstanding._sum.balanceMinor ?? 0, currency)} is still sitting in unpaid outfits.`,
    });
  }

  if (mix[0]) {
    insights.push({
      tone: "neutral",
      text: `${mix[0].label.toLowerCase()} are your bread and butter — ${pluralise(mix[0].count, "order")} of them. It is worth having a few ready-made samples to show.`,
    });
  }

  if (onTimePercent !== null) {
    insights.push({
      tone: onTimePercent >= 85 ? "positive" : "caution",
      text:
        onTimePercent >= 85
          ? `${onTimePercent}% of your outfits went out on or before the promised day. That is what brings people back.`
          : `Only ${onTimePercent}% of outfits went out on time. Promising a few days later than you think would fix most of that.`,
    });
  }

  if (best[0]) {
    insights.push({
      tone: "neutral",
      text: `${best[0].name} has spent ${formatMoney(best[0].spentMinor, currency)} with you across ${pluralise(best[0].orders, "outfit")}. A message when you have new fabric in would not go amiss.`,
    });
  }

  if (activeCount > 0) {
    insights.push({
      tone: activeCount > 12 ? "caution" : "neutral",
      text:
        activeCount > 12
          ? `You have ${activeCount} outfits on the bench. That is a full workshop — be careful what you promise this week.`
          : `${pluralise(activeCount, "outfit")} in progress, which is a comfortable load.`,
    });
  }

  if (newCustomersThisMonth > 0) {
    insights.push({
      tone: "positive",
      text: `${pluralise(newCustomersThisMonth, "new customer")} found you this month.`,
    });
  }

  return {
    series,
    thisMonth,
    revenueChange,
    averageOrderMinor,
    completedCount: completedOrders.length,
    activeCount,
    totalCustomers,
    newCustomersThisMonth,
    onTimePercent,
    deliveredMeasured: delivered.length,
    outstandingMinor: outstanding._sum.balanceMinor ?? 0,
    mix,
    best,
    insights,
    since: subMonths(new Date(), months - 1),
  };
}

export type BusinessReport = Awaited<ReturnType<typeof businessReport>>;
