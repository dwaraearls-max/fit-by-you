import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { getMeasurementHistory } from "@/server/services/measurements";
import { updateOrderAction } from "@/server/order-actions";
import { HEADLINE_MEASUREMENT_KEYS, tenthsToDisplay } from "@/lib/domain";
import { formatLongDate } from "@/lib/dates";
import { PageHeader } from "@/components/app/page-header";
import { OrderForm } from "@/components/app/orders/order-form";

export const metadata: Metadata = { title: "Edit order" };

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await requirePermission("order:write");
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, businessId: tenant.businessId },
    select: {
      id: true,
      code: true,
      title: true,
      outfitType: true,
      description: true,
      fabric: true,
      fabricNotes: true,
      measurementSetId: true,
      priceMinor: true,
      deliveryDate: true,
      fittingDate: true,
      priority: true,
      notes: true,
      customer: { select: { id: true, fullName: true, code: true } },
    },
  });

  if (!order) notFound();

  const history = await getMeasurementHistory(
    tenant.businessId,
    order.customer.id,
    8,
  );

  const measurementSets = history.map((set, index) => {
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

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ href: `/app/orders/${order.id}`, label: `#${order.code}` }}
        title="Edit order"
        description="Changing the price recalculates the balance and notes it on the timeline."
      />

      <OrderForm
        action={updateOrderAction}
        customers={[order.customer]}
        measurementSets={measurementSets}
        currency={tenant.business.currency}
        lockedCustomer={order.customer}
        values={order}
        submitLabel="Save changes"
        cancelHref={`/app/orders/${order.id}`}
      />
    </div>
  );
}
