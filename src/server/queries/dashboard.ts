import "server-only";

import { prisma } from "@/lib/db";
import { ACTIVE_ORDER_STATUSES } from "@/lib/domain";
import { dayBounds } from "@/lib/dates";
import { percent } from "@/lib/utils";
import type { RevenuePoint } from "@/lib/dashboard-types";

export type { RevenuePoint } from "@/lib/dashboard-types";

export type TodayItem = {
  id: string;
  kind: "fitting" | "measurement" | "delivery" | "reminder" | "appointment";
  time: string | null;
  at: Date;
  title: string;
  detail: string;
  href: string;
};

/**
 * Every number on the dashboard, resolved in one pass.
 *
 * The queries are deliberately aggregate-first: a tailor with 4,000 orders
 * should not be paying to hydrate them so the page can count them in JavaScript.
 * The two places rows are actually fetched — recent customers and upcoming
 * orders — are both hard-limited.
 */
export async function getDashboard(businessId: string, currency: string) {
  const now = new Date();
  const { start: todayStart, end: todayEnd } = dayBounds(now);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const weekAhead = new Date(todayEnd);
  weekAhead.setDate(weekAhead.getDate() + 7);

  // Twelve full months back, inclusive of the current one.
  const chartStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    activeOrders,
    lastMonthActiveOrders,
    customerCount,
    newCustomersThisMonth,
    newCustomersLastMonth,
    revenueThisMonth,
    revenueLastMonth,
    outstanding,
    outstandingOrderCount,
    completedThisMonth,
    completedLastMonth,
    overdueOrders,
    chartPayments,
    chartOrders,
    todaysFittings,
    todaysAppointments,
    dueOrders,
    pendingReminders,
    recentCustomers,
    upcomingOrders,
    topOutstanding,
  ] = await Promise.all([
    prisma.order.count({
      where: { businessId, status: { in: [...ACTIVE_ORDER_STATUSES] } },
    }),
    prisma.order.count({
      where: {
        businessId,
        status: { in: [...ACTIVE_ORDER_STATUSES] },
        createdAt: { lt: monthStart },
      },
    }),
    prisma.customer.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.customer.count({
      where: { businessId, status: "ACTIVE", createdAt: { gte: monthStart } },
    }),
    prisma.customer.count({
      where: {
        businessId,
        status: "ACTIVE",
        createdAt: { gte: lastMonthStart, lt: monthStart },
      },
    }),
    prisma.payment.aggregate({
      where: { businessId, receivedAt: { gte: monthStart } },
      _sum: { amountMinor: true },
    }),
    prisma.payment.aggregate({
      where: { businessId, receivedAt: { gte: lastMonthStart, lt: monthStart } },
      _sum: { amountMinor: true },
    }),
    prisma.order.aggregate({
      where: {
        businessId,
        status: { not: "CANCELLED" },
        balanceMinor: { gt: 0 },
      },
      _sum: { balanceMinor: true },
    }),
    prisma.order.count({
      where: {
        businessId,
        status: { not: "CANCELLED" },
        balanceMinor: { gt: 0 },
      },
    }),
    prisma.order.count({
      where: { businessId, status: "DELIVERED", deliveredAt: { gte: monthStart } },
    }),
    prisma.order.count({
      where: {
        businessId,
        status: "DELIVERED",
        deliveredAt: { gte: lastMonthStart, lt: monthStart },
      },
    }),
    prisma.order.count({
      where: {
        businessId,
        status: { in: [...ACTIVE_ORDER_STATUSES] },
        deliveryDate: { lt: todayStart },
      },
    }),

    // The chart reads from payments (money actually received) rather than order
    // prices, so it reflects cash in hand — which is what the number a tailor
    // trusts looks like.
    prisma.payment.findMany({
      where: { businessId, receivedAt: { gte: chartStart } },
      select: { amountMinor: true, receivedAt: true },
    }),
    prisma.order.findMany({
      where: { businessId, createdAt: { gte: chartStart } },
      select: { createdAt: true },
    }),

    prisma.fitting.findMany({
      where: {
        businessId,
        status: "SCHEDULED",
        scheduledFor: { gte: todayStart, lte: todayEnd },
      },
      select: {
        id: true,
        scheduledFor: true,
        orderId: true,
        customer: { select: { fullName: true } },
        order: { select: { title: true, code: true } },
      },
      orderBy: { scheduledFor: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        businessId,
        status: "SCHEDULED",
        scheduledFor: { gte: todayStart, lte: todayEnd },
      },
      select: {
        id: true,
        type: true,
        title: true,
        scheduledFor: true,
        customerId: true,
        customer: { select: { fullName: true } },
      },
      orderBy: { scheduledFor: "asc" },
    }),
    prisma.order.findMany({
      where: {
        businessId,
        status: { in: [...ACTIVE_ORDER_STATUSES] },
        deliveryDate: { gte: todayStart, lte: todayEnd },
      },
      select: {
        id: true,
        code: true,
        title: true,
        deliveryDate: true,
        customer: { select: { fullName: true } },
      },
      orderBy: { deliveryDate: "asc" },
    }),
    prisma.paymentReminder.findMany({
      where: { businessId, status: "PENDING" },
      select: {
        id: true,
        createdAt: true,
        customerId: true,
        order: { select: { balanceMinor: true, title: true } },
        customer: { select: { fullName: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),

    prisma.customer.findMany({
      where: { businessId, status: "ACTIVE" },
      select: {
        id: true,
        fullName: true,
        phone: true,
        photoKey: true,
        createdAt: true,
        lastVisitAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.order.findMany({
      where: {
        businessId,
        status: { in: [...ACTIVE_ORDER_STATUSES] },
        deliveryDate: { not: null },
      },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        priority: true,
        deliveryDate: true,
        priceMinor: true,
        balanceMinor: true,
        customer: { select: { id: true, fullName: true } },
      },
      orderBy: { deliveryDate: "asc" },
      take: 6,
    }),
    prisma.order.findMany({
      where: {
        businessId,
        status: { not: "CANCELLED" },
        balanceMinor: { gt: 0 },
      },
      select: {
        id: true,
        balanceMinor: true,
        customer: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: { balanceMinor: "desc" },
      take: 3,
    }),
  ]);

  // --- Revenue series -------------------------------------------------------
  const buckets = new Map<string, RevenuePoint>();
  for (let index = 0; index < 12; index += 1) {
    const date = new Date(chartStart.getFullYear(), chartStart.getMonth() + index, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    buckets.set(key, {
      label: date.toLocaleDateString("en-GB", { month: "short" }),
      month: date.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      revenueMinor: 0,
      orders: 0,
    });
  }

  for (const payment of chartPayments) {
    const key = `${payment.receivedAt.getFullYear()}-${payment.receivedAt.getMonth()}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.revenueMinor += payment.amountMinor;
  }

  for (const order of chartOrders) {
    const key = `${order.createdAt.getFullYear()}-${order.createdAt.getMonth()}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.orders += 1;
  }

  const revenueSeries = [...buckets.values()];

  // --- Today ----------------------------------------------------------------
  const today: TodayItem[] = [
    ...todaysFittings.map((fitting) => ({
      id: `fitting-${fitting.id}`,
      kind: "fitting" as const,
      at: fitting.scheduledFor,
      time: fitting.scheduledFor.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      title: `Fitting — ${fitting.customer.fullName}`,
      detail: fitting.order.title,
      href: `/app/orders/${fitting.orderId}`,
    })),
    ...todaysAppointments.map((appointment) => ({
      id: `appointment-${appointment.id}`,
      kind:
        appointment.type === "MEASUREMENT"
          ? ("measurement" as const)
          : ("appointment" as const),
      at: appointment.scheduledFor,
      time: appointment.scheduledFor.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      title: appointment.title,
      detail: appointment.customer?.fullName ?? "No customer attached",
      href: appointment.customerId
        ? `/app/customers/${appointment.customerId}`
        : "/app/calendar",
    })),
    ...dueOrders.map((order) => ({
      id: `delivery-${order.id}`,
      kind: "delivery" as const,
      at: order.deliveryDate!,
      time: null,
      title: `Due today — ${order.title}`,
      detail: order.customer.fullName,
      href: `/app/orders/${order.id}`,
    })),
    ...pendingReminders.map((reminder) => ({
      id: `reminder-${reminder.id}`,
      kind: "reminder" as const,
      at: reminder.createdAt,
      time: null,
      title: `Payment reminder — ${reminder.customer.fullName}`,
      detail: reminder.order?.title
        ? `${reminder.order.title} — balance outstanding`
        : "Outstanding balance to follow up",
      href: `/app/customers/${reminder.customerId}?tab=payments`,
    })),
  ].sort((a, b) => {
    // Timed items lead the day in order; untimed work sits after them.
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return a.at.getTime() - b.at.getTime();
  });

  const revenueThisMonthMinor = revenueThisMonth._sum.amountMinor ?? 0;
  const revenueLastMonthMinor = revenueLastMonth._sum.amountMinor ?? 0;

  return {
    currency,
    stats: {
      activeOrders,
      activeOrdersDelta: activeOrders - lastMonthActiveOrders,
      customerCount,
      newCustomersThisMonth,
      newCustomersDelta: newCustomersThisMonth - newCustomersLastMonth,
      revenueThisMonthMinor,
      revenueDeltaPercent:
        revenueLastMonthMinor > 0
          ? percent(revenueThisMonthMinor - revenueLastMonthMinor, revenueLastMonthMinor)
          : null,
      outstandingMinor: outstanding._sum.balanceMinor ?? 0,
      outstandingOrderCount,
      completedThisMonth,
      completedDelta: completedThisMonth - completedLastMonth,
      overdueOrders,
    },
    revenueSeries,
    today,
    recentCustomers,
    upcomingOrders,
    topOutstanding,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
