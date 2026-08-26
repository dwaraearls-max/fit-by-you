import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { monthBounds } from "@/lib/dates";

export const PAYMENTS_PER_PAGE = 20;

export async function listPayments(
  businessId: string,
  options: { query?: string; method?: string; page?: number } = {},
) {
  const page = Math.max(1, options.page ?? 1);
  const term = options.query?.trim().toLowerCase();

  const where: Prisma.PaymentWhereInput = {
    businessId,
    ...(options.method ? { method: options.method } : {}),
    ...(term
      ? {
          OR: [
            { customer: { searchText: { contains: term } } },
            { receiptNumber: { contains: term.toUpperCase() } },
            { reference: { contains: term } },
          ],
        }
      : {}),
  };

  const [payments, total, sum] = await Promise.all([
    prisma.payment.findMany({
      where,
      select: {
        id: true,
        amountMinor: true,
        method: true,
        reference: true,
        receiptNumber: true,
        receivedAt: true,
        customer: { select: { id: true, fullName: true } },
        order: { select: { id: true, title: true, code: true } },
        recordedBy: { select: { name: true } },
      },
      orderBy: { receivedAt: "desc" },
      skip: (page - 1) * PAYMENTS_PER_PAGE,
      take: PAYMENTS_PER_PAGE,
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ where, _sum: { amountMinor: true } }),
  ]);

  return {
    payments,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAYMENTS_PER_PAGE)),
    totalMinor: sum._sum.amountMinor ?? 0,
  };
}

export type PaymentRow = Awaited<ReturnType<typeof listPayments>>["payments"][number];

/** The headline numbers above the payments screen. */
export async function paymentSummary(businessId: string) {
  const { start, end } = monthBounds();
  const previous = monthBounds(-1);

  const [thisMonth, lastMonth, outstanding, orderCount, pendingReminders] =
    await Promise.all([
      prisma.payment.aggregate({
        where: { businessId, receivedAt: { gte: start, lte: end } },
        _sum: { amountMinor: true },
        _count: { _all: true },
      }),
      prisma.payment.aggregate({
        where: {
          businessId,
          receivedAt: { gte: previous.start, lte: previous.end },
        },
        _sum: { amountMinor: true },
      }),
      prisma.order.aggregate({
        where: { businessId, status: { not: "CANCELLED" }, balanceMinor: { gt: 0 } },
        _sum: { balanceMinor: true },
      }),
      prisma.order.count({
        where: { businessId, status: { not: "CANCELLED" }, balanceMinor: { gt: 0 } },
      }),
      prisma.paymentReminder.count({ where: { businessId, status: "PENDING" } }),
    ]);

  const collected = thisMonth._sum.amountMinor ?? 0;
  const before = lastMonth._sum.amountMinor ?? 0;

  return {
    collectedMinor: collected,
    paymentCount: thisMonth._count._all,
    changePercent:
      before > 0 ? Math.round(((collected - before) / before) * 100) : null,
    outstandingMinor: outstanding._sum.balanceMinor ?? 0,
    outstandingOrders: orderCount,
    pendingReminders,
  };
}

export async function pendingReminders(businessId: string) {
  return prisma.paymentReminder.findMany({
    where: { businessId, status: "PENDING" },
    select: {
      id: true,
      message: true,
      createdAt: true,
      customer: { select: { id: true, fullName: true, phone: true } },
      order: { select: { id: true, title: true, balanceMinor: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 25,
  });
}

/** Orders carrying a balance, worst first, for the chase list. */
export async function unpaidOrders(businessId: string, take = 25) {
  return prisma.order.findMany({
    where: { businessId, status: { not: "CANCELLED" }, balanceMinor: { gt: 0 } },
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      priceMinor: true,
      paidMinor: true,
      balanceMinor: true,
      deliveryDate: true,
      customer: { select: { id: true, fullName: true, phone: true } },
    },
    orderBy: [{ balanceMinor: "desc" }],
    take,
  });
}

export async function getPaymentReceipt(businessId: string, paymentId: string) {
  return prisma.payment.findFirst({
    where: { id: paymentId, businessId },
    select: {
      id: true,
      amountMinor: true,
      method: true,
      reference: true,
      note: true,
      receiptNumber: true,
      receivedAt: true,
      customer: {
        select: { id: true, code: true, fullName: true, phone: true },
      },
      order: {
        select: {
          id: true,
          code: true,
          title: true,
          priceMinor: true,
          paidMinor: true,
          balanceMinor: true,
        },
      },
      recordedBy: { select: { name: true } },
    },
  });
}
