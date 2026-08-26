import type { Metadata } from "next";
import Link from "next/link";
import { CheckCheck } from "lucide-react";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { unpaidOrders } from "@/server/queries/payments";
import { PageHeader } from "@/components/app/page-header";
import {
  PaymentForm,
  type PayingCustomer,
} from "@/components/app/payments/payment-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Record a payment" };

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requirePermission("payment:write");
  const params = await searchParams;

  const orderId = typeof params.order === "string" ? params.order : undefined;
  const customerParam =
    typeof params.customer === "string" ? params.customer : undefined;

  const orders = await unpaidOrders(tenant.businessId, 400);

  // Anyone with a balance, plus whoever the page was opened for, since a
  // customer with nothing outstanding can still hand over money.
  const outstandingByCustomer = new Map<string, number>();
  for (const order of orders) {
    outstandingByCustomer.set(
      order.customer.id,
      (outstandingByCustomer.get(order.customer.id) ?? 0) + order.balanceMinor,
    );
  }

  const extraIds = [
    customerParam,
    orders.find((order) => order.id === orderId)?.customer.id,
  ].filter((value): value is string => !!value);

  const customerRows = await prisma.customer.findMany({
    where: {
      businessId: tenant.businessId,
      OR: [
        { id: { in: [...outstandingByCustomer.keys(), ...extraIds] } },
        ...(outstandingByCustomer.size === 0 ? [{ status: "ACTIVE" }] : []),
      ],
    },
    select: { id: true, fullName: true, code: true },
    orderBy: { fullName: "asc" },
    take: 400,
  });

  const customers: PayingCustomer[] = customerRows
    .map((customer) => ({
      ...customer,
      outstandingMinor: outstandingByCustomer.get(customer.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.outstandingMinor - a.outstandingMinor ||
        a.fullName.localeCompare(b.fullName),
    );

  if (customers.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader
          back={{ href: "/app/payments", label: "Payments" }}
          title="Record a payment"
        />
        <Card>
          <EmptyState
            icon={CheckCheck}
            title="Nothing to record against yet."
            message="Once you have a customer with an outfit, payments can be recorded here and receipts are generated for you."
            action={
              <Button asChild variant="primary">
                <Link href="/app/customers/new">Add a customer</Link>
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={
          orderId
            ? { href: `/app/orders/${orderId}`, label: "Back to the order" }
            : { href: "/app/payments", label: "Payments" }
        }
        title="Record a payment"
        description="The outfit's balance and the customer's total update themselves."
      />

      <PaymentForm
        customers={customers}
        orders={orders.map((order) => ({
          id: order.id,
          code: order.code,
          title: order.title,
          balanceMinor: order.balanceMinor,
          customerId: order.customer.id,
        }))}
        currency={tenant.business.currency}
        defaultOrderId={orderId}
        defaultCustomerId={customerParam}
        cancelHref={orderId ? `/app/orders/${orderId}` : "/app/payments"}
      />
    </div>
  );
}
