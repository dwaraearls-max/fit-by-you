import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { updateCustomerAction } from "@/server/customer-actions";
import { PageHeader } from "@/components/app/page-header";
import { CustomerForm } from "@/components/app/customer-form";

export const metadata: Metadata = { title: "Edit customer" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await requirePermission("customer:write");
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, businessId: tenant.businessId },
    include: { tags: { select: { label: true } } },
  });

  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ href: `/app/customers/${customer.id}`, label: customer.fullName }}
        title={`Edit ${customer.fullName}`}
        description="Changing a name updates it everywhere, including on past orders."
      />
      <CustomerForm
        action={updateCustomerAction}
        submitLabel="Save changes"
        cancelHref={`/app/customers/${customer.id}`}
        values={{
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          altPhone: customer.altPhone,
          email: customer.email,
          gender: customer.gender,
          city: customer.city,
          addressLine: customer.addressLine,
          birthday: customer.birthday,
          notes: customer.notes,
          tags: customer.tags.map((tag) => tag.label),
        }}
      />
    </div>
  );
}
