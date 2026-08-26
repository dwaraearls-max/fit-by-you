import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus, Users } from "lucide-react";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { getMeasurementHistory } from "@/server/services/measurements";
import { createOrderAction } from "@/server/order-actions";
import { HEADLINE_MEASUREMENT_KEYS, tenthsToDisplay } from "@/lib/domain";
import { formatLongDate } from "@/lib/dates";
import { PageHeader } from "@/components/app/page-header";
import {
  OrderForm,
  type MeasurementSetOption,
} from "@/components/app/orders/order-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "New order" };

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requirePermission("order:write");
  const params = await searchParams;
  const customerId = typeof params.customer === "string" ? params.customer : null;

  const customers = await prisma.customer.findMany({
    where: { businessId: tenant.businessId, status: "ACTIVE" },
    select: { id: true, fullName: true, code: true },
    orderBy: { fullName: "asc" },
    take: 500,
  });

  if (customers.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader
          back={{ href: "/app/orders", label: "Orders" }}
          title="New order"
        />
        <Card>
          <EmptyState
            icon={Users}
            title="You need a customer first."
            message="An order belongs to somebody. Add the customer, then come back and take the order — it takes about twenty seconds."
            action={
              <Button asChild variant="primary">
                <Link href="/app/customers/new">
                  <UserPlus />
                  Add a customer
                </Link>
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const locked = customerId
    ? (customers.find((customer) => customer.id === customerId) ?? null)
    : null;

  let measurementSets: MeasurementSetOption[] = [];

  if (locked) {
    const history = await getMeasurementHistory(tenant.businessId, locked.id, 8);
    measurementSets = history.map((set, index) => {
      const headline = HEADLINE_MEASUREMENT_KEYS.map((key) =>
        set.values.find((value) => value.fieldKey === key),
      )
        .filter(Boolean)
        .map(
          (value) =>
            `${value!.fieldLabel} ${tenthsToDisplay(value!.valueTenths)}${value!.unit}`,
        );

      return {
        id: set.id,
        label: formatLongDate(set.measuredAt),
        summary:
          headline.length > 0
            ? headline.join(" · ")
            : `${set.values.length} measurements by ${set.measuredByName}`,
        isLatest: index === 0,
      };
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={
          locked
            ? { href: `/app/customers/${locked.id}`, label: locked.fullName }
            : { href: "/app/orders", label: "Orders" }
        }
        title="Take an order"
        description="What you are making, what it costs, and when it is due."
      />

      <OrderForm
        action={createOrderAction}
        customers={customers}
        measurementSets={measurementSets}
        currency={tenant.business.currency}
        lockedCustomer={locked}
        showDeposit
        submitLabel="Create order"
        cancelHref={locked ? `/app/customers/${locked.id}` : "/app/orders"}
      />
    </div>
  );
}
