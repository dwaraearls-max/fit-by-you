"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { tenthsToDisplay } from "@/lib/domain";

export type TrendPoint = {
  measuredAt: string;
  label: string;
  value: number;
  unit: string;
};

/**
 * One field over time — the answer to "has her waist changed since last year?"
 * The Y axis is deliberately tight around the data, because a two-inch change
 * across a year is the whole story and a 0-to-40 axis would hide it.
 */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const domain = React.useMemo<[number, number]>(() => {
    if (points.length === 0) return [0, 1];
    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max(1, (max - min) * 0.35);
    return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
  }, [points]);

  if (points.length < 2) {
    return (
      <p className="px-1 py-8 text-center text-sm text-muted-foreground">
        One session so far. A second set of measurements will draw the trend.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--color-subtle-foreground)" }}
            dy={8}
          />
          <YAxis
            domain={domain}
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fontSize: 11, fill: "var(--color-subtle-foreground)" }}
            tickFormatter={(value: number) => String(value)}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]!.payload as TrendPoint;
              return (
                <div className="rounded-lg border border-border bg-elevated px-3 py-2 shadow-lg">
                  <p className="text-xs text-muted-foreground">{point.measuredAt}</p>
                  <p className="tabular mt-1 text-sm font-semibold text-foreground">
                    {tenthsToDisplay(Math.round(point.value * 10))}
                    {point.unit}
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-champagne-600)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-champagne-600)", strokeWidth: 0 }}
            activeDot={{
              r: 5,
              fill: "var(--color-champagne-600)",
              stroke: "var(--color-elevated)",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
