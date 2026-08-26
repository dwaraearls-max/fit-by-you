import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Ruler, Users } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { getMeasurementFields } from "@/server/services/measurements";
import {
  HEADLINE_MEASUREMENT_KEYS,
  MEASUREMENT_GROUPS,
  MEASUREMENT_GROUP_META,
  labelFor,
  tenthsToDisplay,
} from "@/lib/domain";
import { formatLongDate, monthsSince, timeAgo } from "@/lib/dates";
import { pluralise } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { SearchField } from "@/components/app/list-controls";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat";

export const metadata: Metadata = { title: "Measurements" };

/** Six months without a remeasure is when a tailor should start checking. */
const STALE_MONTHS = 6;

export default async function MeasurementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requireTenant();
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();

  const staleBefore = new Date();
  staleBefore.setMonth(staleBefore.getMonth() - STALE_MONTHS);

  const [fields, sessionCount, measuredCustomers, recentSessions] = await Promise.all([
    getMeasurementFields(tenant.businessId),
    prisma.measurementSet.count({ where: { businessId: tenant.businessId } }),
    prisma.customer.count({
      where: {
        businessId: tenant.businessId,
        status: "ACTIVE",
        measurementSets: { some: {} },
      },
    }),
    prisma.measurementSet.findMany({
      where: {
        businessId: tenant.businessId,
        ...(query
          ? { customer: { searchText: { contains: query } } }
          : {}),
      },
      orderBy: { measuredAt: "desc" },
      take: 25,
      select: {
        id: true,
        measuredAt: true,
        measuredByName: true,
        unit: true,
        customer: { select: { id: true, fullName: true, phone: true } },
        values: {
          select: { fieldKey: true, fieldLabel: true, valueTenths: true, unit: true },
        },
      },
    }),
  ]);

  // "Due a refresh" is the useful working list: customers you have measured
  // before, whose numbers are old enough to be worth checking again.
  const staleCustomers = await prisma.customer.findMany({
    where: {
      businessId: tenant.businessId,
      status: "ACTIVE",
      measurementSets: { some: {} },
      NOT: { measurementSets: { some: { measuredAt: { gte: staleBefore } } } },
    },
    select: {
      id: true,
      fullName: true,
      measurementSets: {
        orderBy: { measuredAt: "desc" },
        take: 1,
        select: { measuredAt: true },
      },
    },
    take: 8,
  });

  const totalCustomers = await prisma.customer.count({
    where: { businessId: tenant.businessId, status: "ACTIVE" },
  });

  if (sessionCount === 0) {
    return (
      <div className="mx-auto max-w-[84rem]">
        <PageHeader
          title="Measurements"
          description="Every measurement you ever take, kept forever and never overwritten."
        />
        <Card>
          <EmptyState
            icon={Ruler}
            title="No measurements taken yet."
            message="Open a customer and measure them once. From then on you will be able to see how their body has changed, compare any two sessions, and cut from the exact numbers an outfit was ordered against."
            action={
              <Button asChild variant="primary">
                <Link href="/app/customers">
                  <Users />
                  Choose a customer
                </Link>
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[84rem]">
      <PageHeader
        title="Measurements"
        description="Every session across your whole customer book. Nothing here is ever overwritten."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sessions recorded"
          value={sessionCount}
          icon={Ruler}
          tone="accent"
        />
        <StatCard
          label="Customers measured"
          value={`${measuredCustomers} of ${totalCustomers}`}
          icon={Users}
          href="/app/customers"
        />
        <StatCard
          label="Due a refresh"
          value={staleCustomers.length}
          icon={Clock}
          tone={staleCustomers.length > 0 ? "caution" : "neutral"}
          hint={`Not measured in ${STALE_MONTHS} months`}
        />
        <StatCard
          label="Measurement fields"
          value={fields.length}
          href="/app/settings?tab=measurements"
          hint={`${fields.filter((field) => field.isCustom).length} of your own`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <div>
                <CardTitle>Recent sessions</CardTitle>
                <CardDescription>
                  The last {recentSessions.length} measurement sessions.
                </CardDescription>
              </div>
              <SearchField
                placeholder="Find a customer…"
                className="sm:w-56 sm:shrink-0"
              />
            </CardHeader>
            <CardContent className="pb-4">
              {recentSessions.length === 0 ? (
                <EmptyState
                  compact
                  icon={Ruler}
                  title="No sessions match."
                  message="Try a different name or phone number."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {recentSessions.map((session) => {
                    const headline = HEADLINE_MEASUREMENT_KEYS.map((key) =>
                      session.values.find((value) => value.fieldKey === key),
                    ).filter(Boolean);

                    return (
                      <li key={session.id}>
                        <Link
                          href={`/app/customers/${session.customer.id}?tab=measurements`}
                          className="-mx-2 flex items-start gap-3.5 rounded-lg px-2 py-3.5 transition-colors hover:bg-surface-muted/50"
                        >
                          <Avatar name={session.customer.fullName} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {session.customer.fullName}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatLongDate(session.measuredAt)} ·{" "}
                              {session.measuredByName} ·{" "}
                              {pluralise(session.values.length, "measurement")}
                            </p>
                            {headline.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                                {headline.map((value) => (
                                  <span
                                    key={value!.fieldKey}
                                    className="text-xs text-muted-foreground"
                                  >
                                    {value!.fieldLabel}{" "}
                                    <span className="tabular font-medium text-foreground">
                                      {tenthsToDisplay(value!.valueTenths)}
                                      {value!.unit}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <span className="shrink-0 text-[0.6875rem] text-subtle-foreground">
                            {timeAgo(session.measuredAt)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Due a refresh</CardTitle>
                <CardDescription>
                  Measured more than {STALE_MONTHS} months ago.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {staleCustomers.length === 0 ? (
                <EmptyState
                  compact
                  icon={Clock}
                  title="All current."
                  message="Every measured customer has been seen within the last six months."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {staleCustomers.map((customer) => {
                    const last = customer.measurementSets[0]?.measuredAt ?? null;
                    return (
                      <li key={customer.id}>
                        <Link
                          href={`/app/customers/${customer.id}/measure`}
                          className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-surface-muted/50"
                        >
                          <Avatar name={customer.fullName} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[0.8125rem] font-medium text-foreground">
                              {customer.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {last
                                ? `${pluralise(monthsSince(last), "month")} ago`
                                : "Never"}
                            </p>
                          </div>
                          <Badge size="sm" tone="caution">
                            Remeasure
                          </Badge>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Your measurement fields</CardTitle>
                <CardDescription>
                  What you capture in every session.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {MEASUREMENT_GROUPS.filter((group) =>
                fields.some((field) => field.group === group),
              ).map((group) => (
                <div key={group}>
                  <p className="eyebrow mb-2 text-subtle-foreground">
                    {labelFor(MEASUREMENT_GROUP_META, group)}
                  </p>
                  <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                    {fields
                      .filter((field) => field.group === group)
                      .map((field) => field.label)
                      .join(", ")}
                  </p>
                </div>
              ))}

              {tenant.can("settings:write") ? (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/app/settings?tab=measurements">
                    Add your own measurement
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
