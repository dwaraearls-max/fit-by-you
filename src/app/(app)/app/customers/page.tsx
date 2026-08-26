import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Plus, SearchX, UserPlus, Users } from "lucide-react";

import { requireTenant } from "@/lib/tenant";
import {
  CUSTOMERS_PER_PAGE,
  customerFilterCounts,
  listCustomers,
  type CustomerRow,
  type CustomerSort,
} from "@/server/queries/customers";
import {
  CUSTOMER_FILTERS,
  CUSTOMER_FILTER_META,
  CUSTOMER_TAG_META,
  labelFor,
  toneFor,
  type CustomerFilter,
} from "@/lib/domain";
import { formatMoney } from "@/lib/money";
import { formatShortDate, timeAgo } from "@/lib/dates";
import { formatPhone, pluralise } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { FilterChips, SearchField, SortSelect } from "@/components/app/list-controls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Table, TBody, TD, TH, THead, TR, TableShell } from "@/components/ui/table";

export const metadata: Metadata = { title: "Customers" };

const SORTS: { value: CustomerSort; label: string }[] = [
  { value: "recent", label: "Newest first" },
  { value: "name", label: "Name A–Z" },
  { value: "orders", label: "Most orders" },
  { value: "outstanding", label: "Owes the most" },
  { value: "visit", label: "Last visit" },
];

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requireTenant();
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q : "";
  const filterParam = typeof params.filter === "string" ? params.filter : "ALL";
  const filter = (CUSTOMER_FILTERS as readonly string[]).includes(filterParam)
    ? (filterParam as CustomerFilter)
    : "ALL";
  const sortParam = typeof params.sort === "string" ? params.sort : "recent";
  const sort = SORTS.some((entry) => entry.value === sortParam)
    ? (sortParam as CustomerSort)
    : "recent";
  const page = Number.parseInt(
    typeof params.page === "string" ? params.page : "1",
    10,
  );

  const [{ rows, total, pageCount }, counts] = await Promise.all([
    listCustomers(tenant.businessId, {
      query,
      filter,
      sort,
      page: Number.isFinite(page) ? page : 1,
    }),
    customerFilterCounts(tenant.businessId),
  ]);

  const buildHref = (nextPage: number) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (filter !== "ALL") search.set("filter", filter);
    if (sort !== "recent") search.set("sort", sort);
    if (nextPage > 1) search.set("page", String(nextPage));
    const suffix = search.toString();
    return suffix ? `/app/customers?${suffix}` : "/app/customers";
  };

  const hasAnyCustomers = counts.ALL > 0 || counts.ARCHIVED > 0;

  return (
    <div className="mx-auto max-w-[84rem]">
      <PageHeader
        title="Customers"
        description={
          hasAnyCustomers
            ? "Everyone you sew for, with their measurements, styles and history attached."
            : "This is your customer book. Nothing gets forgotten once it is in here."
        }
        actions={
          tenant.can("customer:write") ? (
            <Button asChild variant="primary" size="sm">
              <Link href="/app/customers/new">
                <Plus />
                New customer
              </Link>
            </Button>
          ) : null
        }
      />

      {!hasAnyCustomers ? (
        <div className="rounded-xl border border-border bg-surface shadow-xs">
          <EmptyState
            icon={Users}
            title="Your first customer is waiting."
            message="Add the person whose outfit is on your table right now. From then on, every measurement, style, photo and payment stays with their name."
            action={
              tenant.can("customer:write") ? (
                <Button asChild variant="primary">
                  <Link href="/app/customers/new">
                    <UserPlus />
                    Add your first customer
                  </Link>
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchField
              placeholder="Search by name, phone or customer code…"
              className="sm:max-w-md sm:flex-1"
            />
            <SortSelect options={SORTS} className="sm:w-44" />
          </div>

          <FilterChips
            className="mt-4"
            options={CUSTOMER_FILTERS.map((value) => ({
              value,
              label: labelFor(CUSTOMER_FILTER_META, value),
              count: counts[value],
            }))}
          />

          {rows.length === 0 ? (
            <div className="mt-5 rounded-xl border border-border bg-surface shadow-xs">
              <EmptyState
                icon={SearchX}
                title={query ? `Nothing matches “${query}”.` : "No customers here yet."}
                message={
                  query
                    ? "Try part of a name, the last four digits of a phone number, or a customer code."
                    : `No customers fall under ${labelFor(
                        CUSTOMER_FILTER_META,
                        filter,
                      ).toLowerCase()} right now.`
                }
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/app/customers">Clear filters</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* Phones get cards; the table below only exists from lg up. */}
              <ul className="mt-5 space-y-2.5 lg:hidden">
                {rows.map((customer) => (
                  <li key={customer.id}>
                    <CustomerCard
                      customer={customer}
                      currency={tenant.business.currency}
                    />
                  </li>
                ))}
              </ul>

              <TableShell className="mt-5 hidden lg:block">
                <Table>
                  <THead>
                    <tr>
                      <TH>Customer</TH>
                      <TH>Phone</TH>
                      <TH>Tags</TH>
                      <TH align="right">Orders</TH>
                      <TH align="right">Outstanding</TH>
                      <TH align="right">Added</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {rows.map((customer) => (
                      <TR key={customer.id} className="group">
                        <TD>
                          <Link
                            href={`/app/customers/${customer.id}`}
                            className="flex items-center gap-3"
                          >
                            <Avatar name={customer.fullName} size="sm" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-foreground group-hover:underline group-hover:decoration-border-strong group-hover:underline-offset-2">
                                {customer.fullName}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {customer.code}
                                {customer.city ? ` · ${customer.city}` : ""}
                              </span>
                            </span>
                          </Link>
                        </TD>
                        <TD className="tabular text-muted-foreground">
                          {formatPhone(customer.phone)}
                        </TD>
                        <TD>
                          <div className="flex flex-wrap gap-1">
                            {customer.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                size="sm"
                                tone={toneFor(CUSTOMER_TAG_META, tag)}
                              >
                                {labelFor(CUSTOMER_TAG_META, tag)}
                              </Badge>
                            ))}
                            {customer.tags.length > 2 ? (
                              <Badge size="sm">+{customer.tags.length - 2}</Badge>
                            ) : null}
                          </div>
                        </TD>
                        <TD align="right">
                          {customer.orderCount}
                          {customer.activeOrderCount > 0 ? (
                            <span className="ml-1 text-xs text-accent">
                              ({customer.activeOrderCount} live)
                            </span>
                          ) : null}
                        </TD>
                        <TD align="right">
                          {customer.outstandingMinor > 0 ? (
                            <span className="font-medium text-caution">
                              {formatMoney(
                                customer.outstandingMinor,
                                tenant.business.currency,
                              )}
                            </span>
                          ) : (
                            <span className="text-subtle-foreground">—</span>
                          )}
                        </TD>
                        <TD align="right" className="text-muted-foreground">
                          {formatShortDate(customer.createdAt)}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </TableShell>

              <Pagination
                page={page > 0 ? page : 1}
                pageCount={pageCount}
                total={total}
                pageSize={CUSTOMERS_PER_PAGE}
                buildHref={buildHref}
                label="customers"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function CustomerCard({
  customer,
  currency,
}: {
  customer: CustomerRow;
  currency: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex items-start gap-3.5">
        <Link href={`/app/customers/${customer.id}`} className="shrink-0">
          <Avatar name={customer.fullName} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/app/customers/${customer.id}`} className="block">
            <p className="truncate font-medium text-foreground">{customer.fullName}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {customer.code}
              {customer.orderCount > 0
                ? ` · ${pluralise(customer.orderCount, "order")}`
                : " · No orders yet"}
              {customer.lastVisitAt ? ` · seen ${timeAgo(customer.lastVisitAt)}` : ""}
            </p>
          </Link>

          {customer.tags.length > 0 || customer.outstandingMinor > 0 ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {customer.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} size="sm" tone={toneFor(CUSTOMER_TAG_META, tag)}>
                  {labelFor(CUSTOMER_TAG_META, tag)}
                </Badge>
              ))}
              {customer.outstandingMinor > 0 ? (
                <Badge size="sm" tone="caution">
                  {formatMoney(customer.outstandingMinor, currency)} owed
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* One tap to call, because half of this happens over the phone. */}
        <a
          href={`tel:${customer.phone}`}
          aria-label={`Call ${customer.fullName}`}
          className="shrink-0 rounded-lg border border-border p-2.5 text-muted-foreground transition-colors active:bg-surface-muted"
        >
          <Phone className="size-4" aria-hidden />
        </a>
      </div>
    </div>
  );
}
