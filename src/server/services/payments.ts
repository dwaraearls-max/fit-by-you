import "server-only";

import { prisma } from "@/lib/db";
import { nextReceiptNumber } from "@/lib/codes";
import { formatMoney } from "@/lib/money";
import { audit, notify, type TenantContext } from "@/lib/tenant";
import { recalculateOrderTotals } from "./orders";

export async function recordPayment(
  tenant: Pick<TenantContext, "businessId" | "business" | "user">,
  input: {
    customerId: string;
    orderId?: string | null;
    amountMinor: number;
    method: string;
    reference?: string | null;
    note?: string | null;
    receivedAt?: Date;
  },
) {
  if (input.amountMinor <= 0) {
    throw new Error("Enter an amount greater than zero.");
  }

  const customer = await prisma.customer.findFirstOrThrow({
    where: { id: input.customerId, businessId: tenant.businessId },
    select: { id: true, fullName: true },
  });

  let orderId: string | null = null;
  if (input.orderId) {
    const order = await prisma.order.findFirst({
      where: {
        id: input.orderId,
        businessId: tenant.businessId,
        customerId: customer.id,
      },
      select: { id: true, balanceMinor: true, title: true },
    });
    if (!order) throw new Error("That order does not belong to this customer.");
    orderId = order.id;
  }

  const receiptNumber = await nextReceiptNumber(
    tenant.businessId,
    tenant.business.name,
  );
  const receivedAt = input.receivedAt ?? new Date();

  const payment = await prisma.payment.create({
    data: {
      businessId: tenant.businessId,
      customerId: customer.id,
      orderId,
      amountMinor: input.amountMinor,
      method: input.method,
      reference: input.reference ?? null,
      note: input.note ?? null,
      receiptNumber,
      receivedAt,
      recordedById: tenant.user.id,
    },
  });

  let totals: { balanceMinor: number } | null = null;

  if (orderId) {
    totals = await recalculateOrderTotals(tenant.businessId, orderId);

    await prisma.orderTimelineEvent.create({
      data: {
        businessId: tenant.businessId,
        orderId,
        type: "PAYMENT_RECORDED",
        title: `Payment recorded — ${formatMoney(input.amountMinor, tenant.business.currency)}`,
        description:
          totals.balanceMinor <= 0
            ? "Balance settled in full."
            : `${formatMoney(totals.balanceMinor, tenant.business.currency)} still outstanding.`,
        occurredAt: receivedAt,
        actorId: tenant.user.id,
        actorName: tenant.user.name,
      },
    });

    // Once the balance is clear there is nothing left to chase.
    if (totals.balanceMinor <= 0) {
      await prisma.paymentReminder.updateMany({
        where: { businessId: tenant.businessId, orderId, status: "PENDING" },
        data: { status: "DISMISSED" },
      });
    }
  }

  await prisma.customer.update({
    where: { id: customer.id, businessId: tenant.businessId },
    data: { lastVisitAt: receivedAt },
  });

  await audit(tenant, {
    action: "payment.recorded",
    entityType: "payment",
    entityId: payment.id,
    summary: `Recorded ${formatMoney(input.amountMinor, tenant.business.currency)} from ${customer.fullName}.`,
    metadata: { receiptNumber, method: input.method, orderId },
  });

  await notify(tenant.businessId, {
    type: "PAYMENT_RECEIVED",
    title: "Payment received",
    body: `${formatMoney(input.amountMinor, tenant.business.currency)} from ${customer.fullName}.`,
    entityType: "payment",
    entityId: payment.id,
  });

  return { payment, balanceMinor: totals?.balanceMinor ?? null };
}

export async function deletePayment(
  tenant: Pick<TenantContext, "businessId" | "business" | "user">,
  paymentId: string,
) {
  const payment = await prisma.payment.findFirstOrThrow({
    where: { id: paymentId, businessId: tenant.businessId },
    select: {
      id: true,
      orderId: true,
      amountMinor: true,
      receiptNumber: true,
      customer: { select: { fullName: true } },
    },
  });

  await prisma.payment.delete({
    where: { id: paymentId, businessId: tenant.businessId },
  });

  if (payment.orderId) {
    await recalculateOrderTotals(tenant.businessId, payment.orderId);
  }

  await audit(tenant, {
    action: "payment.deleted",
    entityType: "payment",
    entityId: paymentId,
    summary: `Removed receipt ${payment.receiptNumber} (${formatMoney(payment.amountMinor, tenant.business.currency)}) for ${payment.customer.fullName}.`,
  });
}

/**
 * Customers who owe money, worst first. Powers the dashboard alert and the
 * payments screen.
 */
export async function getOutstandingCustomers(businessId: string, take = 50) {
  const rows = await prisma.order.groupBy({
    by: ["customerId"],
    where: {
      businessId,
      status: { not: "CANCELLED" },
      balanceMinor: { gt: 0 },
    },
    _sum: { balanceMinor: true },
    _count: { _all: true },
  });

  const sorted = rows
    .sort((a, b) => (b._sum.balanceMinor ?? 0) - (a._sum.balanceMinor ?? 0))
    .slice(0, take);

  if (sorted.length === 0) return [];

  const customers = await prisma.customer.findMany({
    where: {
      businessId,
      id: { in: sorted.map((row) => row.customerId) },
    },
    select: {
      id: true,
      code: true,
      fullName: true,
      phone: true,
      photoKey: true,
    },
  });

  const byId = new Map(customers.map((customer) => [customer.id, customer]));

  return sorted
    .map((row) => {
      const customer = byId.get(row.customerId);
      if (!customer) return null;
      return {
        customer,
        outstandingMinor: row._sum.balanceMinor ?? 0,
        orderCount: row._count._all,
      };
    })
    .filter(
      (
        entry,
      ): entry is {
        customer: (typeof customers)[number];
        outstandingMinor: number;
        orderCount: number;
      } => entry !== null,
    );
}
