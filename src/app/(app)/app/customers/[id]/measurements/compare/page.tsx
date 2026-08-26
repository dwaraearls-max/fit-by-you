import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, Minus, Ruler } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import {
  diffMeasurementSets,
  getMeasurementHistory,
  trendForField,
} from "@/server/services/measurements";
import {
  MEASUREMENT_GROUPS,
  MEASUREMENT_GROUP_META,
  labelFor,
  tenthsToDisplay,
} from "@/lib/domain";
import { formatLongDate, formatShortDate } from "@/lib/dates";
import { PageHeader } from "@/components/app/page-header";
import { ComparePicker } from "@/components/app/measurements/compare-picker";
import { TrendChart } from "@/components/app/measurements/trend-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Compare measurements" };

export default async function CompareMeasurementsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requireTenant();
  const { id } = await params;
  const search = await searchParams;

  const customer = await prisma.customer.findFirst({
    where: { id, businessId: tenant.businessId },
    select: { id: true, firstName: true, fullName: true },
  });
  if (!customer) notFound();

  const history = await getMeasurementHistory(tenant.businessId, customer.id);

  if (history.length < 2) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          back={{
            href: `/app/customers/${customer.id}?tab=measurements`,
            label: customer.fullName,
          }}
          title="Compare measurements"
        />
        <Card>
          <EmptyState
            icon={Ruler}
            title="Nothing to compare yet."
            message={`${customer.firstName} has been measured once. After a second session you will be able to see exactly what changed, and by how much.`}
            action={
              tenant.can("measurement:write") ? (
                <Button asChild variant="primary">
                  <Link href={`/app/customers/${customer.id}/measure`}>
                    <Ruler />
                    Measure again
                  </Link>
                </Button>
              ) : null
            }
          />
        </Card>
      </div>
    );
  }

  // History is newest-first, so the sensible default is "the previous session
  // against the current one".
  const newest = history[0]!;
  const previous = history[1]!;

  const toId = typeof search.to === "string" ? search.to : newest.id;
  const fromId = typeof search.from === "string" ? search.from : previous.id;

  const to = history.find((set) => set.id === toId) ?? newest;
  const from = history.find((set) => set.id === fromId) ?? previous;

  // Whichever way round they were picked, the earlier date is the baseline.
  const [older, later] =
    from.measuredAt <= to.measuredAt ? [from, to] : [to, from];

  const diffs = diffMeasurementSets(older, later);
  const changed = diffs.filter((diff) => diff.delta !== null && diff.delta !== 0);

  const trendKey =
    typeof search.field === "string"
      ? search.field
      : (changed[0]?.fieldKey ?? diffs[0]?.fieldKey ?? null);

  const trendField = diffs.find((diff) => diff.fieldKey === trendKey);
  const trendPoints = trendKey
    ? trendForField(history, trendKey).map((point) => ({
        measuredAt: formatLongDate(point.measuredAt),
        label: formatShortDate(point.measuredAt),
        value: point.valueTenths / 10,
        unit: point.unit,
      }))
    : [];

  const sessions = history.map((set) => ({
    id: set.id,
    label: `${formatLongDate(set.measuredAt)} — ${set.measuredByName}`,
  }));

  const dayGap = Math.round(
    (later.measuredAt.getTime() - older.measuredAt.getTime()) / 86_400_000,
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        back={{
          href: `/app/customers/${customer.id}?tab=measurements`,
          label: customer.fullName,
        }}
        title="Compare measurements"
        description={`What changed on ${customer.firstName}, and by how much.`}
      />

      <Card className="mb-6">
        <CardContent className="pt-5 sm:pt-6">
          <ComparePicker sessions={sessions} from={older.id} to={later.id} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div>
            <CardTitle>
              {changed.length === 0
                ? "Nothing changed"
                : `${changed.length} ${changed.length === 1 ? "measurement" : "measurements"} changed`}
            </CardTitle>
            <CardDescription>
              {formatLongDate(older.measuredAt)} → {formatLongDate(later.measuredAt)}
              {dayGap > 0
                ? ` · ${dayGap} ${dayGap === 1 ? "day" : "days"} apart`
                : " · same day"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-7">
          {MEASUREMENT_GROUPS.filter((group) =>
            diffs.some((diff) => diff.group === group),
          ).map((group) => (
            <div key={group}>
              <p className="eyebrow mb-3 text-subtle-foreground">
                {labelFor(MEASUREMENT_GROUP_META, group)}
              </p>
              <ul className="divide-y divide-border">
                {diffs
                  .filter((diff) => diff.group === group)
                  .map((diff) => {
                    const isSelected = diff.fieldKey === trendKey;
                    const params = new URLSearchParams();
                    params.set("from", older.id);
                    params.set("to", later.id);
                    params.set("field", diff.fieldKey);

                    return (
                      <li key={diff.fieldKey}>
                        <Link
                          href={`/app/customers/${customer.id}/measurements/compare?${params.toString()}`}
                          scroll={false}
                          className={`-mx-2 flex items-center gap-4 rounded-lg px-2 py-2.5 transition-colors ${
                            isSelected ? "bg-surface-muted/70" : "hover:bg-surface-muted/40"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                            {diff.fieldLabel}
                          </span>

                          <span className="tabular w-16 shrink-0 text-right text-sm text-muted-foreground">
                            {diff.from === null ? "—" : tenthsToDisplay(diff.from)}
                          </span>

                          <span
                            aria-hidden
                            className="shrink-0 text-xs text-subtle-foreground"
                          >
                            →
                          </span>

                          <span className="tabular w-16 shrink-0 text-right text-sm font-medium text-foreground">
                            {diff.to === null ? "—" : tenthsToDisplay(diff.to)}
                          </span>

                          <span className="w-24 shrink-0 text-right">
                            <Delta delta={diff.delta} />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {trendField ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{trendField.fieldLabel} over time</CardTitle>
              <CardDescription>
                Every session on record, oldest to newest. Pick another
                measurement above to change this.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <TrendChart points={trendPoints} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Delta({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-xs text-subtle-foreground">New</span>;
  }

  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-subtle-foreground">
        <Minus className="size-3" aria-hidden />
        No change
      </span>
    );
  }

  const up = delta > 0;
  const Icon = up ? ArrowUp : ArrowDown;

  // Growth is not "good" and shrinking is not "bad" on a body, so the colour
  // signals direction only — warm for larger, cool for smaller.
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        up ? "text-caution" : "text-info"
      }`}
    >
      <Icon className="size-3" aria-hidden />
      <span className="tabular">
        {up ? "+" : "−"}
        {tenthsToDisplay(Math.abs(delta))}
      </span>
    </span>
  );
}
