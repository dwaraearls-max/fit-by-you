"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney, formatMoneyCompact, minorToMajor } from "@/lib/money";
import type { RevenuePoint } from "@/server/queries/dashboard";

type Datum = RevenuePoint & { revenue: number };

export function RevenueChart({
  data,
  currency,
}: {
  data: RevenuePoint[];
  currency: string;
}) {
  // Recharts works in major units so the axis ticks read like money rather than
  // pesewas; the tooltip formats back from the original minor value.
  const points = React.useMemo<Datum[]>(
    () => data.map((point) => ({ ...point, revenue: minorToMajor(point.revenueMinor) })),
    [data],
  );

  const allZero = points.every((point) => point.revenue === 0);

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-champagne-500)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-champagne-500)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="var(--color-border)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--color-subtle-foreground)" }}
            dy={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={68}
            tick={{ fontSize: 11, fill: "var(--color-subtle-foreground)" }}
            domain={allZero ? [0, 1000] : [0, "auto"]}
            tickFormatter={(value: number) =>
              formatMoneyCompact(Math.round(value * 100), currency)
            }
          />
          <Tooltip
            cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const datum = payload[0]!.payload as Datum;
              return (
                <div className="rounded-lg border border-border bg-elevated px-3 py-2.5 shadow-lg">
                  <p className="text-xs font-semibold text-foreground">{datum.month}</p>
                  <p className="tabular mt-1 text-sm font-semibold text-foreground">
                    {formatMoney(datum.revenueMinor, currency)}
                  </p>
                  <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
                    {datum.orders} {datum.orders === 1 ? "order" : "orders"} started
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-champagne-600)"
            strokeWidth={2}
            fill="url(#revenueFill)"
            dot={false}
            activeDot={{
              r: 4,
              fill: "var(--color-champagne-600)",
              stroke: "var(--color-elevated)",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
