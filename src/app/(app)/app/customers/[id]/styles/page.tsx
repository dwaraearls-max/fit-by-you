import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { PageHeader } from "@/components/app/page-header";
import { StyleProfileForm } from "@/components/app/customer/style-profile-form";

export const metadata: Metadata = { title: "Style profile" };

export default async function StyleProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await requirePermission("style:write");
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, businessId: tenant.businessId },
    select: {
      id: true,
      firstName: true,
      fullName: true,
      styleProfile: {
        select: {
          preferredFit: true,
          styleNotes: true,
          avoidNotes: true,
          occasionNotes: true,
        },
      },
      stylePreferences: { select: { kind: true, value: true } },
    },
  });

  if (!customer) notFound();

  const selected = (kind: string) =>
    customer.stylePreferences
      .filter((entry) => entry.kind === kind)
      .map((entry) => entry.value);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{
          href: `/app/customers/${customer.id}?tab=styles`,
          label: customer.fullName,
        }}
        title={`${customer.firstName}'s style profile`}
        description="What they like, what they avoid, and what they usually dress for. This is what stops you asking the same questions every visit."
      />

      <StyleProfileForm
        customerId={customer.id}
        values={{
          preferredFit: customer.styleProfile?.preferredFit ?? "",
          styleNotes: customer.styleProfile?.styleNotes ?? "",
          avoidNotes: customer.styleProfile?.avoidNotes ?? "",
          occasionNotes: customer.styleProfile?.occasionNotes ?? "",
          styles: selected("STYLE"),
          colors: selected("COLOR"),
          fabrics: selected("FABRIC"),
        }}
      />
    </div>
  );
}
