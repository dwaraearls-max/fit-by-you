import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Package,
  Plus,
  Ruler,
  Scissors,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import { requireTenant } from "@/lib/tenant";
import { getDashboard } from "@/server/queries/dashboard";
import { formatMoney } from "@/lib/money";
import {
  ORDER_STATUS_META,
  labelFor,
  toneFor,
  orderProgress,
} from "@/lib/domain";
import { describeDeadline, formatShortDate, timeAgo } from "@/lib/dates";
import { pluralise } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { RevenueChart } from "@/components/app/revenue-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Dashboard" };

const TODAY_ICON = {
  fitting: Ruler,
  measurement: Ruler,
  delivery: Truck,
  reminder: BellRing,
  appointment: CalendarClock,
} as const;

const TODAY_TONE = {
  fitting: "text-info",
  measurement: "text-accent",
  delivery: "text-positive",
  reminder: "text-critical",
  appointment: "text-muted-foreground",
} as const;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const tenant = await requireTenant();
  const data = await getDashboard(tenant.businessId, tenant.business.currency);
  const { stats, currency } = data;

  const firstName = tenant.user.name.split(" ")[0] ?? tenant.user.name;
  const isEmpty = stats.customerCount === 0;

  return (
    <div className="mx-auto max-w-[84rem]">
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title={`${greeting()}, ${firstName}.`}
        description={
          isEmpty
            ? "This is where your fashion business starts remembering everything."
            : `${tenant.business.name} — everything you need for today, in one place.`
        }
        actions={
          tenant.can("order:write") ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/app/customers/new">
                  <Plus />
                  Customer
                </Link>
              </Button>
              <Button asChild variant="primary" size="sm">
                <Link href="/app/orders/new">
                  <Scissors />
                  New order
                </Link>
              </Button>
            </>
          ) : null
        }
      />

      {isEmpty ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Your first customer is waiting."
            message="Add someone you are sewing for right now. Their measurements, styles, orders and payments will live here from then on — and you will never write them in a notebook again."
            action={
              <Button asChild variant="primary">
                <Link href="/app/customers/new">
                  <Plus />
                  Add your first customer
                </Link>
              </Button>
            }
            secondaryAction={
              <Button asChild variant="ghost">
                <Link href="/how-it-works">See how it works</Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* Outstanding-balance smart alert */}
          {stats.outstandingMinor > 0 ? (
            <Card className="mb-6 border-caution/35 bg-caution-soft/60">
              <CardContent className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-caution/15">
                    <Wallet className="size-[1.125rem] text-caution" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {formatMoney(stats.outstandingMinor, currency)} is still owed
                      to you
                    </p>
                    <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
                      Across {pluralise(stats.outstandingOrderCount, "order")}.{" "}
                      {data.topOutstanding.length > 0 ? (
                        <>
                          The largest is{" "}
                          <Link
                            href={`/app/customers/${data.topOutstanding[0]!.customer.id}?tab=payments`}
                            className="font-medium text-foreground underline decoration-border-strong underline-offset-2 hover:decoration-foreground"
                          >
                            {data.topOutstanding[0]!.customer.fullName}
                          </Link>{" "}
                          at{" "}
                          {formatMoney(
                            data.topOutstanding[0]!.balanceMinor,
                            currency,
                          )}
                          .
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
                <Button asChild variant="primary" size="sm" className="shrink-0">
                  <Link href="/app/payments?filter=outstanding">
                    Collect payments
                    <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/* Five headline numbers */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Active orders"
              value={stats.activeOrders}
              icon={Package}
              tone="accent"
              href="/app/orders"
              hint={
                stats.overdueOrders > 0
                  ? `${stats.overdueOrders} past due`
                  : "All on schedule"
              }
            />
            <StatCard
              label="Customers"
              value={stats.customerCount}
              icon={Users}
              href="/app/customers"
              delta={{
                value: stats.newCustomersDelta,
                label: "vs last month",
                unit: "count",
              }}
            />
            <StatCard
              label="Revenue this month"
              value={formatMoney(stats.revenueThisMonthMinor, currency)}
              icon={CreditCard}
              tone="positive"
              href="/app/reports"
              delta={
                stats.revenueDeltaPercent === null
                  ? null
                  : { value: stats.revenueDeltaPercent, label: "vs last month" }
              }
              hint={stats.revenueDeltaPercent === null ? "First month" : undefined}
            />
            <StatCard
              label="Outstanding"
              value={formatMoney(stats.outstandingMinor, currency)}
              icon={Wallet}
              tone={stats.outstandingMinor > 0 ? "caution" : "neutral"}
              href="/app/payments?filter=outstanding"
              hint={
                stats.outstandingOrderCount > 0
                  ? `${pluralise(stats.outstandingOrderCount, "order")} unpaid`
                  : "Everyone is settled"
              }
            />
            <StatCard
              label="Completed this month"
              value={stats.completedThisMonth}
              icon={CheckCircle2}
              tone="info"
              href="/app/orders?filter=delivered"
              delta={{
                value: stats.completedDelta,
                label: "vs last month",
                unit: "count",
              }}
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            {/* Revenue */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle>Revenue</CardTitle>
                  <CardDescription>
                    Money actually received, month by month.
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="xs">
                  <Link href="/app/reports">
                    Full report
                    <ArrowRight />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pl-1 sm:pl-2">
                <RevenueChart data={data.revenueSeries} currency={currency} />
              </CardContent>
            </Card>

            {/* Today */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Today</CardTitle>
                  <CardDescription>
                    {data.today.length > 0
                      ? pluralise(data.today.length, "thing") + " to handle"
                      : "Nothing scheduled"}
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="xs">
                  <Link href="/app/calendar">Calendar</Link>
                </Button>
              </CardHeader>
              <CardContent className="pb-2">
                {data.today.length === 0 ? (
                  <EmptyState
                    compact
                    icon={CalendarClock}
                    title="A clear day."
                    message="No fittings, deliveries or reminders due. A good day to get ahead on the sewing."
                  />
                ) : (
                  <ul className="-mx-2 divide-y divide-border">
                    {data.today.map((item) => {
                      const Icon = TODAY_ICON[item.kind];
                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            className="flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-surface-muted/60"
                          >
                            <Icon
                              className={`mt-0.5 size-4 shrink-0 ${TODAY_TONE[item.kind]}`}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[0.8125rem] font-medium text-foreground">
                                {item.title}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {item.detail}
                              </span>
                            </span>
                            {item.time ? (
                              <span className="tabular shrink-0 text-xs font-medium text-muted-foreground">
                                {item.time}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            {/* Upcoming orders */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Upcoming deliveries</CardTitle>
                  <CardDescription>Sorted by how soon they are due.</CardDescription>
                </div>
                <Button asChild variant="ghost" size="xs">
                  <Link href="/app/orders">
                    All orders
                    <ArrowRight />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pb-3">
                {data.upcomingOrders.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Package}
                    title="Nothing in the queue."
                    message="When you take an order with a delivery date, it will appear here."
                    action={
                      tenant.can("order:write") ? (
                        <Button asChild variant="outline" size="sm">
                          <Link href="/app/orders/new">
                            <Plus />
                            New order
                          </Link>
                        </Button>
                      ) : null
                    }
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {data.upcomingOrders.map((order) => {
                      const deadline = describeDeadline(order.deliveryDate);
                      return (
                        <li key={order.id}>
                          <Link
                            href={`/app/orders/${order.id}`}
                            className="group -mx-2 flex items-center gap-3.5 rounded-lg px-2 py-3.5 transition-colors hover:bg-surface-muted/60"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-[0.8125rem] font-medium text-foreground">
                                  {order.title}
                                </p>
                                {order.priority === "RUSH" ? (
                                  <Badge tone="critical" size="sm">
                                    Rush
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {order.customer.fullName} · #{order.code}
                              </p>
                              {/* Progress through the nine stages, read at a glance */}
                              <div className="mt-2 h-1 w-full max-w-40 overflow-hidden rounded-full bg-surface-muted">
                                <div
                                  className="h-full rounded-full bg-ink-900 transition-all duration-500 dark:bg-accent"
                                  style={{ width: `${orderProgress(order.status)}%` }}
                                />
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <Badge tone={toneFor(ORDER_STATUS_META, order.status)} size="sm">
                                {labelFor(ORDER_STATUS_META, order.status)}
                              </Badge>
                              <p
                                className={`mt-1.5 text-[0.6875rem] font-medium ${
                                  deadline.tone === "critical"
                                    ? "text-critical"
                                    : deadline.tone === "caution"
                                      ? "text-caution"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {deadline.text}
                              </p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Recent customers */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Recent customers</CardTitle>
                  <CardDescription>The newest names in your book.</CardDescription>
                </div>
                <Button asChild variant="ghost" size="xs">
                  <Link href="/app/customers">
                    All customers
                    <ArrowRight />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pb-3">
                <ul className="divide-y divide-border">
                  {data.recentCustomers.map((customer) => (
                    <li key={customer.id}>
                      <Link
                        href={`/app/customers/${customer.id}`}
                        className="-mx-2 flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-surface-muted/60"
                      >
                        <Avatar name={customer.fullName} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.8125rem] font-medium text-foreground">
                            {customer.fullName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {customer._count.orders === 0
                              ? "No orders yet"
                              : pluralise(customer._count.orders, "order")}
                            {customer.lastVisitAt
                              ? ` · last seen ${timeAgo(customer.lastVisitAt)}`
                              : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-[0.6875rem] text-subtle-foreground">
                          {formatShortDate(customer.createdAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
