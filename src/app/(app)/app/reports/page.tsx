import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Lightbulb,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";

import { requirePermission } from "@/lib/tenant";
import { businessReport } from "@/server/queries/reports";
import { formatMoney } from "@/lib/money";
import { formatLongDate } from "@/lib/dates";
import { percent, pluralise } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { RevenueChart } from "@/components/app/revenue-chart";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const tenant = await requirePermission("report:read");
  const currency = tenant.business.currency;
  const report = await businessReport(tenant.businessId, currency);

  const hasHistory =
    report.series.some((point) => point.revenueMinor > 0 || point.orders > 0) ||
    report.totalCustomers > 0;

  if (!hasHistory) {
    return (
      <div className="mx-auto max-w-[84rem]">
        <PageHeader title="Reports" description="How the business is doing." />
        <div className="rounded-xl border border-border bg-surface shadow-xs">
          <EmptyState
            icon={BarChart3}
            title="Nothing to report yet."
            message="Once you have taken a few orders and recorded some payments, this page will tell you what you are making most of, who your best customers are, and whether you are finishing on time."
          />
        </div>
      </div>
    );
  }

  const busiestMonth = [...report.series].sort(
    (a, b) => b.revenueMinor - a.revenueMinor,
  )[0]!;
  const mixTotal = report.mix.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="mx-auto max-w-[84rem]">
      <PageHeader
        title="Reports"
        description={`How the business has been doing since ${formatLongDate(report.since)}.`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Collected this month"
          value={formatMoney(report.thisMonth.revenueMinor, currency)}
          delta={
            report.revenueChange === null
              ? null
              : { value: report.revenueChange, label: "vs last month" }
          }
          icon={TrendingUp}
        />
        <StatCard
          label="Average outfit"
          value={formatMoney(report.averageOrderMinor, currency)}
          hint="What a job is worth, on average"
        />
        <StatCard
          label="Finished on time"
          value={
            report.onTimePercent === null ? "—" : `${report.onTimePercent}%`
          }
          hint={
            report.onTimePercent === null
              ? "No delivered outfits yet"
              : `of ${pluralise(report.deliveredMeasured, "delivery")}`
          }
          tone={
            report.onTimePercent !== null && report.onTimePercent >= 85
              ? "positive"
              : "caution"
          }
        />
        <StatCard
          label="Customers"
          value={String(report.totalCustomers)}
          hint={
            report.newCustomersThisMonth > 0
              ? `${report.newCustomersThisMonth} new this month`
              : "No new ones this month"
          }
          icon={Users}
          href="/app/customers"
        />
      </div>

      {/* Insights, in words */}
      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>What this means</CardTitle>
            <CardDescription>
              The same numbers, said plainly.
            </CardDescription>
          </div>
          <Badge tone="accent">
            <Lightbulb className="size-2.5" aria-hidden />
            {pluralise(report.insights.length, "insight")}
          </Badge>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3.5">
            {report.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-3">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    insight.tone === "positive"
                      ? "bg-positive"
                      : insight.tone === "caution"
                        ? "bg-caution"
                        : "bg-ink-400"
                  }`}
                  aria-hidden
                />
                <p className="text-[0.9375rem] leading-relaxed text-foreground">
                  {insight.text}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Money coming in</CardTitle>
              <CardDescription>
                Payments received, month by month. Your best month was{" "}
                {busiestMonth.label} at{" "}
                {formatMoney(busiestMonth.revenueMinor, currency)}.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={report.series} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>What you make</CardTitle>
              <CardDescription>Across every order you have taken.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {report.mix.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="space-y-3.5">
                {report.mix.map((row) => (
                  <li key={row.outfitType}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-[0.8125rem] font-medium text-foreground">
                        {row.label}
                      </p>
                      <p className="tabular shrink-0 text-xs text-muted-foreground">
                        {row.count} · {formatMoney(row.revenueMinor, currency)}
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-ink-900 dark:bg-accent"
                        style={{
                          width: `${Math.max(4, percent(row.count, Math.max(1, mixTotal)))}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Your best customers</CardTitle>
              <CardDescription>
                By what they have actually paid you.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {report.best.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No payments recorded yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {report.best.map((customer, index) => (
                  <li key={customer.id}>
                    <Link
                      href={`/app/customers/${customer.id}`}
                      className="-mx-2 flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-surface-muted/60"
                    >
                      <span className="tabular w-4 shrink-0 text-xs text-subtle-foreground">
                        {index + 1}
                      </span>
                      <Avatar name={customer.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {customer.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {pluralise(customer.orders, "outfit")} · with you since{" "}
                          {formatLongDate(customer.since)}
                        </span>
                      </span>
                      <span className="tabular shrink-0 text-sm font-semibold text-foreground">
                        {formatMoney(customer.spentMinor, currency)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>The workshop</CardTitle>
              <CardDescription>Right now.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-muted-foreground">On the bench</dt>
                <dd className="tabular text-sm font-semibold">
                  {pluralise(report.activeCount, "outfit")}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-muted-foreground">
                  Finished in six months
                </dt>
                <dd className="tabular text-sm font-semibold">
                  {report.completedCount}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-muted-foreground">Still owed</dt>
                <dd
                  className={`tabular text-sm font-semibold ${
                    report.outstandingMinor > 0 ? "text-caution" : "text-positive"
                  }`}
                >
                  {formatMoney(report.outstandingMinor, currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-muted-foreground">Orders started</dt>
                <dd className="tabular text-sm font-semibold">
                  {report.series.reduce((sum, point) => sum + point.orders, 0)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-border pt-4">
              <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <Package className="mt-px size-3.5 shrink-0" aria-hidden />
                <span>
                  Everything on this page comes from your own records. Nothing is
                  shared with anyone, ever.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
