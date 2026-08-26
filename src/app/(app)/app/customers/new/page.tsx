import type { Metadata } from "next";

import { requirePermission } from "@/lib/tenant";
import { createCustomerAction } from "@/server/customer-actions";
import { PageHeader } from "@/components/app/page-header";
import { CustomerForm } from "@/components/app/customer-form";

export const metadata: Metadata = { title: "New customer" };

export default async function NewCustomerPage() {
  await requirePermission("customer:write");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ href: "/app/customers", label: "Customers" }}
        title="Add a customer"
        description="Name and phone number are all you need now. Measurements, styles and photos come next."
      />
      <CustomerForm
        action={createCustomerAction}
        submitLabel="Add customer"
        cancelHref="/app/customers"
      />
    </div>
  );
}
