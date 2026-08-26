import type { Metadata } from "next";
import Link from "next/link";
import { Package, Plus, SearchX, Zap } from "lucide-react";

import { requireTenant } from "@/lib/tenant";
import {
  ORDERS_PER_PAGE,
  ORDER_FILTERS,
  ORDER_FILTER_LABELS,
  listOrders,
  orderFilterCounts,
  type OrderFilter,
  type OrderListRow,
} from "@/server/queries/orders";
import {
  ORDER_STATUS_META,
  OUTFIT_TYPE_META,
  labelFor,
  orderProgress,
  toneFor,
} from "@/lib/domain";
import { formatMoney } from "@/lib/money";
import { describeDeadline, formatShortDate } from "@/lib/dates";
import { pluralise } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { FilterChips, SearchField } from "@/components/app/list-controls";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Table, TBody, TD, TH, THead, TR, TableShell } from "@/components/ui/table";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requireTenant();
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q : "";
  const filterParam = typeof params.filter === "string" ? params.filter : "ACTIVE";
  const filter = (ORDER_FILTERS as readonly string[]).includes(filterParam)
    ? (filterParam as OrderFilter)
    : "ACTIVE";
  const page = Number.parseInt(
    typeof params.page === "string" ? params.page : "1",
    10,
  );

  const [{ orders, total, pageCount }, counts] = await Promise.all([
    listOrders(tenant.businessId, {
      query,
      filter,
      page: Number.isFinite(page) ? page : 1,
    }),
    orderFilterCounts(tenant.businessId),
  ]);

  const buildHref = (nextPage: number) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (filter !== "ACTIVE") search.set("filter", filter);
    if (nextPage > 1) search.set("page", String(nextPage));
    const suffix = search.toString();
    return suffix ? `/app/orders?${suffix}` : "/app/orders";
  };

  const currency = tenant.business.currency;

  if (counts.ALL === 0) {
    return (
      <div className="mx-auto max-w-[84rem]">
        <PageHeader
          title="Orders"
          description="Every outfit you are making, from measuring to delivery."
        />
        <div className="rounded-xl border border-border bg-surface shadow-xs">
          <EmptyState
            icon={Package}
            title="No orders yet."
            message="Take your first order and you will be able to see, at a glance, what is cut, what is sewing, what is due on Friday and who still owes you money."
            action={
              tenant.can("order:write") ? (
                <Button asChild variant="primary">
                  <Link href="/app/orders/new">
                    <Plus />
                    Take an order
                  </Link>
                </Button>
              ) : null
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[84rem]">
      <PageHeader
        title="Orders"
        description={
          counts.OVERDUE > 0
            ? `${pluralise(counts.OVERDUE, "order")} past its delivery date.`
            : "Everything you are making, sorted by how soon it is due."
        }
        actions={
          tenant.can("order:write") ? (
            <Button asChild variant="primary" size="sm">
              <Link href="/app/orders/new">
                <Plus />
                New order
              </Link>
            </Button>
          ) : null
        }
      />

      <SearchField
        placeholder="Search by outfit, customer or order number…"
        className="sm:max-w-md"
      />

      <FilterChips
        className="mt-4"
        options={ORDER_FILTERS.map((value) => ({
          value,
          label: ORDER_FILTER_LABELS[value],
          count: counts[value],
        }))}
      />

      {orders.length === 0 ? (
        <div className="mt-5 rounded-xl border border-border bg-surface shadow-xs">
          <EmptyState
            icon={SearchX}
            title={query ? `Nothing matches “${query}”.` : "Nothing here."}
            message={
              query
                ? "Try an outfit name, a customer, or the order number."
                : `No orders are ${ORDER_FILTER_LABELS[filter].toLowerCase()} right now — which is usually good news.`
            }
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/app/orders">See orders in progress</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <ul className="mt-5 space-y-2.5 lg:hidden">
            {orders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} currency={currency} />
              </li>
            ))}
          </ul>

          <TableShell className="mt-5 hidden lg:block">
            <Table>
              <THead>
                <tr>
                  <TH>Outfit</TH>
                  <TH>Customer</TH>
                  <TH>Stage</TH>
                  <TH>Due</TH>
                  <TH align="right">Price</TH>
                  <TH align="right">Balance</TH>
                </tr>
              </THead>
              <TBody>
                {orders.map((order) => {
                  const deadline = describeDeadline(order.deliveryDate);
                  return (
                    <TR key={order.id} className="group">
                      <TD>
                        <Link href={`/app/orders/${order.id}`} className="block min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-medium group-hover:underline group-hover:decoration-border-strong group-hover:underline-offset-2">
                              {order.title}
                            </span>
                            {order.priority === "RUSH" ? (
                              <Badge size="sm" tone="critical">
                                <Zap className="size-2.5" aria-hidden />
                                Rush
                              </Badge>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            #{order.code} ·{" "}
                            {labelFor(OUTFIT_TYPE_META, order.outfitType)}
                            {order.fabric ? ` · ${order.fabric}` : ""}
                          </span>
                        </Link>
                      </TD>
                      <TD>
                        <Link
                          href={`/app/customers/${order.customer.id}`}
                          className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground"
                        >
                          <Avatar name={order.customer.fullName} size="xs" />
                          <span className="truncate">{order.customer.fullName}</span>
                        </Link>
                      </TD>
                      <TD>
                        <Badge size="sm" tone={toneFor(ORDER_STATUS_META, order.status)}>
                          {labelFor(ORDER_STATUS_META, order.status)}
                        </Badge>
                        <div className="mt-2 h-1 w-24 overflow-hidden rounded-full bg-surface-muted">
                          <div
                            className="h-full rounded-full bg-ink-900 dark:bg-accent"
                            style={{ width: `${orderProgress(order.status)}%` }}
                          />
                        </div>
                      </TD>
                      <TD>
                        {order.deliveryDate ? (
                          <>
                            <span className="block text-muted-foreground">
                              {formatShortDate(order.deliveryDate)}
                            </span>
                            <span
                              className={`text-[0.6875rem] font-medium ${
                                deadline.tone === "critical"
                                  ? "text-critical"
                                  : deadline.tone === "caution"
                                    ? "text-caution"
                                    : "text-subtle-foreground"
                              }`}
                            >
                              {deadline.text}
                            </span>
                          </>
                        ) : (
                          <span className="text-subtle-foreground">No date</span>
                        )}
                      </TD>
                      <TD align="right">{formatMoney(order.priceMinor, currency)}</TD>
                      <TD align="right">
                        {order.balanceMinor > 0 ? (
                          <span className="font-medium text-caution">
                            {formatMoney(order.balanceMinor, currency)}
                          </span>
                        ) : (
                          <span className="text-positive">Paid</span>
                        )}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </TableShell>

          <Pagination
            page={page > 0 ? page : 1}
            pageCount={pageCount}
            total={total}
            pageSize={ORDERS_PER_PAGE}
            buildHref={buildHref}
            label="orders"
          />
        </>
      )}
    </div>
  );
}

function OrderCard({
  order,
  currency,
}: {
  order: OrderListRow;
  currency: string;
}) {
  const deadline = describeDeadline(order.deliveryDate);

  return (
    <Link
      href={`/app/orders/${order.id}`}
      className="block rounded-xl border border-border bg-surface p-4 shadow-xs transition-colors active:bg-surface-muted/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-foreground">{order.title}</p>
            {order.priority === "RUSH" ? (
              <Badge size="sm" tone="critical">
                Rush
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {order.customer.fullName} · #{order.code}
          </p>
        </div>
        <Badge size="sm" tone={toneFor(ORDER_STATUS_META, order.status)}>
          {labelFor(ORDER_STATUS_META, order.status)}
        </Badge>
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-ink-900 dark:bg-accent"
          style={{ width: `${orderProgress(order.status)}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span
          className={`font-medium ${
            deadline.tone === "critical"
              ? "text-critical"
              : deadline.tone === "caution"
                ? "text-caution"
                : "text-muted-foreground"
          }`}
        >
          {order.deliveryDate ? deadline.text : "No delivery date"}
        </span>
        <span className="tabular text-muted-foreground">
          {order.balanceMinor > 0 ? (
            <span className="text-caution">
              {formatMoney(order.balanceMinor, currency)} owed
            </span>
          ) : (
            <span className="text-positive">Paid in full</span>
          )}
        </span>
      </div>
    </Link>
  );
}
