import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import {
  getLatestMeasurementSet,
  getMeasurementFields,
} from "@/server/services/measurements";
import { PageHeader } from "@/components/app/page-header";
import {
  MeasurementCaptureForm,
  type PreviousValue,
} from "@/components/app/measurements/capture-form";

export const metadata: Metadata = { title: "Take measurements" };

export default async function MeasurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await requirePermission("measurement:write");
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, businessId: tenant.businessId },
    select: { id: true, firstName: true, fullName: true },
  });
  if (!customer) notFound();

  const [fields, latest, settings] = await Promise.all([
    getMeasurementFields(tenant.businessId),
    getLatestMeasurementSet(tenant.businessId, customer.id),
    prisma.businessSettings.findUnique({
      where: { businessId: tenant.businessId },
      select: { defaultUnit: true },
    }),
  ]);

  const previous: Record<string, PreviousValue> = {};
  for (const value of latest?.values ?? []) {
    previous[value.fieldKey] = {
      valueTenths: value.valueTenths,
      unit: value.unit,
    };
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        back={{
          href: `/app/customers/${customer.id}?tab=measurements`,
          label: customer.fullName,
        }}
        eyebrow={latest ? "New session" : "First session"}
        title={`Measure ${customer.firstName}`}
        description={
          latest
            ? "This is saved as a new record. Nothing you measured before is replaced."
            : "Every measurement you take from now on builds on this first one."
        }
      />

      <MeasurementCaptureForm
        customerId={customer.id}
        customerName={customer.firstName}
        fields={fields}
        previous={previous}
        previousDate={latest?.measuredAt ?? null}
        defaultUnit={latest?.unit ?? settings?.defaultUnit ?? "in"}
      />
    </div>
  );
}
