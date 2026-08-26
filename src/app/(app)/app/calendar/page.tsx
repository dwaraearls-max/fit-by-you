import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { calendarEvents } from "@/server/queries/calendar";
import { formatLongDate, formatTime } from "@/lib/dates";
import { pluralise } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { AddAppointmentButton } from "@/components/app/calendar/add-appointment";
import {
  DayList,
  KindLegend,
  MonthGrid,
  type GridDay,
  type GridEvent,
} from "@/components/app/calendar/month-grid";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Calendar" };

const DAY_KEY = "yyyy-MM-dd";
const MONTH_KEY = "yyyy-MM";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requireTenant();
  const params = await searchParams;

  const monthParam = typeof params.month === "string" ? params.month : "";
  const parsedMonth = monthParam
    ? parse(monthParam, MONTH_KEY, new Date())
    : new Date();
  const anchor = Number.isNaN(parsedMonth.getTime()) ? new Date() : parsedMonth;

  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  // The grid always shows whole weeks, Monday first, so it never jumps height.
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const selectedDay = typeof params.day === "string" ? params.day : null;
  const selectedDate = selectedDay
    ? parse(selectedDay, DAY_KEY, new Date())
    : null;

  const [events, customers] = await Promise.all([
    calendarEvents(tenant.businessId, { start: gridStart, end: gridEnd }),
    tenant.can("calendar:write")
      ? prisma.customer.findMany({
          where: { businessId: tenant.businessId, status: "ACTIVE" },
          select: { id: true, fullName: true },
          orderBy: { fullName: "asc" },
          take: 300,
        })
      : Promise.resolve([]),
  ]);

  const days: GridDay[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
    days.push({
      key: format(cursor, DAY_KEY),
      dayOfMonth: cursor.getDate(),
      inMonth: cursor.getMonth() === monthStart.getMonth(),
      isToday: isToday(cursor),
      weekday: format(cursor, "EEE"),
    });
  }

  const gridEvents: GridEvent[] = events.map((event) => ({
    id: event.id,
    kind: event.kind,
    day: format(event.at, DAY_KEY),
    time: event.timed ? formatTime(event.at) : null,
    title: event.title,
    href: event.href,
  }));

  // The list below the grid: the chosen day, or the next fortnight.
  const listSource =
    selectedDate && !Number.isNaN(selectedDate.getTime())
      ? events.filter((event) => isSameDay(event.at, selectedDate))
      : events.filter(
          (event) =>
            event.at >= new Date(new Date().setHours(0, 0, 0, 0)) &&
            event.at <= addDays(new Date(), 14),
        );

  const listEvents = listSource.map((event) => ({
    id: event.id,
    kind: event.kind,
    day: format(event.at, DAY_KEY),
    time: event.timed ? formatTime(event.at) : null,
    title: event.title,
    detail: event.detail,
    href: event.href,
    dayLabel: format(event.at, "d MMM"),
  }));

  const previous = format(addMonths(monthStart, -1), MONTH_KEY);
  const next = format(addMonths(monthStart, 1), MONTH_KEY);
  const thisMonthEvents = events.filter(
    (event) => event.at >= monthStart && event.at <= monthEnd,
  );

  return (
    <div className="mx-auto max-w-[84rem]">
      <PageHeader
        title="Calendar"
        description={
          thisMonthEvents.length === 0
            ? "Nothing scheduled this month."
            : `${pluralise(thisMonthEvents.length, "thing")} happening in ${format(monthStart, "MMMM")}.`
        }
        actions={
          tenant.can("calendar:write") ? (
            <AddAppointmentButton
              customers={customers}
              defaultDay={selectedDay}
            />
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <Button asChild variant="outline" size="iconSm">
            <Link
              href={`/app/calendar?month=${previous}`}
              aria-label="Previous month"
            >
              <ChevronLeft />
            </Link>
          </Button>
          <Button asChild variant="outline" size="iconSm">
            <Link href={`/app/calendar?month=${next}`} aria-label="Next month">
              <ChevronRight />
            </Link>
          </Button>
          <p className="ml-2 font-serif text-lg font-semibold tracking-tight">
            {format(monthStart, "MMMM yyyy")}
          </p>
          {format(new Date(), MONTH_KEY) !== format(monthStart, MONTH_KEY) ? (
            <Button asChild variant="ghost" size="xs" className="ml-1">
              <Link href="/app/calendar">Today</Link>
            </Button>
          ) : null}
        </div>

        <KindLegend />
      </div>

      <MonthGrid days={days} events={gridEvents} selectedDay={selectedDay} />

      <div className="mt-6 max-w-2xl">
        <DayList
          heading={
            selectedDate && !Number.isNaN(selectedDate.getTime())
              ? formatLongDate(selectedDate)
              : "Coming up"
          }
          description={
            selectedDate && !Number.isNaN(selectedDate.getTime())
              ? "Tap the day again to go back to what is coming up."
              : "The next two weeks, in order."
          }
          events={listEvents}
        />
      </div>
    </div>
  );
}
