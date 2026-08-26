"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CALENDAR_KIND_META, type CalendarKind } from "@/lib/calendar";
import { cn } from "@/lib/utils";

export type GridEvent = {
  id: string;
  kind: CalendarKind;
  /** ISO day key, `yyyy-MM-dd`, computed on the server to avoid timezone drift. */
  day: string;
  time: string | null;
  title: string;
  href: string;
};

export type GridDay = {
  key: string;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
  weekday: string;
};

export function MonthGrid({
  days,
  events,
  selectedDay,
}: {
  days: GridDay[];
  events: GridEvent[];
  selectedDay: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const byDay = React.useMemo(() => {
    const map = new Map<string, GridEvent[]>();
    for (const event of events) {
      const list = map.get(event.day) ?? [];
      list.push(event);
      map.set(event.day, list);
    }
    return map;
  }, [events]);

  function selectDay(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedDay === key) {
      params.delete("day");
    } else {
      params.set("day", key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
      <div className="grid grid-cols-7 border-b border-border bg-surface-muted/50">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
          <div
            key={label}
            className="px-2 py-2.5 text-center text-[0.6875rem] font-semibold tracking-[0.08em] text-subtle-foreground uppercase"
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.charAt(0)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = byDay.get(day.key) ?? [];
          const selected = selectedDay === day.key;

          return (
            <button
              key={day.key}
              type="button"
              onClick={() => selectDay(day.key)}
              aria-current={day.isToday ? "date" : undefined}
              aria-pressed={selected}
              className={cn(
                "group relative min-h-20 cursor-pointer border-r border-b border-border p-1.5 text-left align-top transition-colors last-of-type:border-r-0 sm:min-h-28 sm:p-2",
                day.inMonth ? "bg-surface" : "bg-surface-muted/30",
                selected ? "bg-ink-950/[0.04]" : "hover:bg-surface-muted/60",
              )}
            >
              <span
                className={cn(
                  "tabular inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  day.isToday
                    ? "bg-ink-950 text-ivory-100"
                    : day.inMonth
                      ? "text-foreground"
                      : "text-subtle-foreground",
                )}
              >
                {day.dayOfMonth}
              </span>

              {/* Phones get dots; there is no room for titles. */}
              <span className="mt-1.5 flex flex-wrap gap-1 sm:hidden">
                {dayEvents.slice(0, 4).map((event) => (
                  <span
                    key={event.id}
                    className={cn(
                      "size-1.5 rounded-full",
                      CALENDAR_KIND_META[event.kind].dot,
                    )}
                  />
                ))}
              </span>

              <span className="mt-1.5 hidden flex-col gap-1 sm:flex">
                {dayEvents.slice(0, 3).map((event) => (
                  <span
                    key={event.id}
                    className={cn(
                      "flex items-center gap-1.5 truncate rounded px-1.5 py-1 text-[0.6875rem] leading-tight",
                      CALENDAR_KIND_META[event.kind].soft,
                      CALENDAR_KIND_META[event.kind].text,
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        CALENDAR_KIND_META[event.kind].dot,
                      )}
                    />
                    <span className="truncate">
                      {event.time ? `${event.time} ` : ""}
                      {event.title}
                    </span>
                  </span>
                ))}
                {dayEvents.length > 3 ? (
                  <span className="px-1.5 text-[0.6875rem] text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function KindLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {(Object.keys(CALENDAR_KIND_META) as CalendarKind[]).map((kind) => (
        <li key={kind} className="flex items-center gap-1.5">
          <span
            className={cn("size-2 rounded-full", CALENDAR_KIND_META[kind].dot)}
            aria-hidden
          />
          <span className="text-xs text-muted-foreground">
            {CALENDAR_KIND_META[kind].label}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The list beneath the grid: either the selected day, or what is coming up. */
export function DayList({
  heading,
  description,
  events,
}: {
  heading: string;
  description: string;
  events: (GridEvent & { detail: string | null; dayLabel: string })[];
}) {
  return (
    <div>
      <div className="mb-3.5">
        <h2 className="text-sm font-semibold tracking-tight">{heading}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-strong px-4 py-6 text-center text-sm text-muted-foreground">
          Nothing here. A quiet day is allowed.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={event.href}
                className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-muted/60"
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    CALENDAR_KIND_META[event.kind].dot,
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] font-medium text-foreground">
                    {event.title}
                  </span>
                  {event.detail ? (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {event.detail}
                    </span>
                  ) : null}
                </span>
                <span className="tabular shrink-0 text-xs text-muted-foreground">
                  {event.time ?? event.dayLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
