"use client";

import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ChevronLeft,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Ruler,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { QrCard } from "@/components/app/customer/qr-card";
import { CUSTOMER_TAG_META, labelFor, toneFor } from "@/lib/domain";
import { formatPhone } from "@/lib/utils";
import { formatLongDate } from "@/lib/dates";
import { archiveCustomerAction } from "@/server/customer-actions";

export function ProfileHeader({
  customer,
  businessName,
  whatsappHref,
  permissions,
}: {
  customer: {
    id: string;
    code: string;
    fullName: string;
    phone: string;
    email: string | null;
    city: string | null;
    photoKey: string | null;
    status: string;
    customerSince: Date;
    tags: string[];
  };
  businessName: string;
  whatsappHref: string;
  permissions: { write: boolean; delete: boolean; measure: boolean; order: boolean };
}) {
  return (
    <header className="mb-6">
      <Link
        href="/app/customers"
        className="mb-4 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" aria-hidden />
        Customers
      </Link>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar name={customer.fullName} size="xl" className="hidden sm:inline-flex" />
          <Avatar name={customer.fullName} size="lg" className="sm:hidden" />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-[1.75rem]">
                {customer.fullName}
              </h1>
              {customer.status === "ARCHIVED" ? (
                <Badge tone="neutral">Archived</Badge>
              ) : null}
            </div>

            <p className="tabular mt-1.5 text-sm text-muted-foreground">
              {customer.code} · {formatPhone(customer.phone)}
              {customer.city ? ` · ${customer.city}` : ""}
            </p>
            <p className="mt-1 text-xs text-subtle-foreground">
              Customer since {formatLongDate(customer.customerSince)}
            </p>

            {customer.tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {customer.tags.map((tag) => (
                  <Badge key={tag} size="sm" tone={toneFor(CUSTOMER_TAG_META, tag)}>
                    {labelFor(CUSTOMER_TAG_META, tag)}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <Button asChild variant="outline" size="sm">
            <a href={`tel:${customer.phone}`}>
              <Phone />
              Call
            </a>
          </Button>

          <Button asChild variant="outline" size="sm">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle />
              WhatsApp
            </a>
          </Button>

          {permissions.order ? (
            <Button asChild variant="primary" size="sm">
              <Link href={`/app/orders/new?customer=${customer.id}`}>
                <Plus />
                New order
              </Link>
            </Button>
          ) : null}

          <Menu>
            <MenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="More actions">
                <MoreHorizontal />
              </Button>
            </MenuTrigger>
            <MenuContent>
              {permissions.measure ? (
                <MenuItem asChild>
                  <Link href={`/app/customers/${customer.id}/measure`}>
                    <Ruler />
                    Take measurements
                  </Link>
                </MenuItem>
              ) : null}
              {permissions.write ? (
                <MenuItem asChild>
                  <Link href={`/app/customers/${customer.id}/edit`}>
                    <Pencil />
                    Edit details
                  </Link>
                </MenuItem>
              ) : null}
              {permissions.delete ? (
                <>
                  <MenuSeparator />
                  <form action={archiveCustomerAction}>
                    <input type="hidden" name="customerId" value={customer.id} />
                    <MenuItem asChild tone={customer.status === "ACTIVE" ? "danger" : "default"}>
                      <button type="submit" className="w-full text-left">
                        {customer.status === "ACTIVE" ? (
                          <>
                            <Archive />
                            Archive customer
                          </>
                        ) : (
                          <>
                            <ArchiveRestore />
                            Restore customer
                          </>
                        )}
                      </button>
                    </MenuItem>
                  </form>
                </>
              ) : null}
            </MenuContent>
          </Menu>

          <QrCard
            customerId={customer.id}
            customerName={customer.fullName}
            customerCode={customer.code}
            businessName={businessName}
            phone={formatPhone(customer.phone)}
          />
        </div>
      </div>
    </header>
  );
}
