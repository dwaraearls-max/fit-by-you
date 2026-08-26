import {
  addMonths,
  differenceInCalendarDays,
  differenceInMonths,
  endOfDay,
  endOfMonth,
  format,
  formatDistanceToNowStrict,
  isThisYear,
  isToday,
  isTomorrow,
  isYesterday,
  startOfDay,
  startOfMonth,
} from "date-fns";

/** "August 26, 2026" — the long form used on profiles and receipts. */
export function formatLongDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMMM d, yyyy");
}

/** "26 Aug 2026" — compact form for tables. */
export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "d MMM yyyy");
}

/** "August 2026" — for measurement history headings. */
export function formatMonthYear(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMMM yyyy");
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "h:mm a");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "d MMM yyyy, h:mm a");
}

/**
 * Friendly, calendar-aware phrasing: "Today, 2:00 PM", "Tomorrow, 9:30 AM",
 * then falls back to a date.
 */
export function formatFriendlyDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const value = new Date(date);
  if (isToday(value)) return `Today, ${format(value, "h:mm a")}`;
  if (isTomorrow(value)) return `Tomorrow, ${format(value, "h:mm a")}`;
  if (isYesterday(value)) return `Yesterday, ${format(value, "h:mm a")}`;
  if (isThisYear(value)) return format(value, "d MMM, h:mm a");
  return format(value, "d MMM yyyy, h:mm a");
}

export function formatFriendlyDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const value = new Date(date);
  if (isToday(value)) return "Today";
  if (isTomorrow(value)) return "Tomorrow";
  if (isYesterday(value)) return "Yesterday";
  if (isThisYear(value)) return format(value, "d MMM");
  return format(value, "d MMM yyyy");
}

/** "3 months ago" */
export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return `${formatDistanceToNowStrict(new Date(date))} ago`;
}

/**
 * Negative when overdue. Used to colour delivery dates on the orders board.
 */
export function daysUntil(date: Date | string): number {
  return differenceInCalendarDays(new Date(date), new Date());
}

export function monthsSince(date: Date | string): number {
  return differenceInMonths(new Date(), new Date(date));
}

/** "Due in 3 days" / "2 days overdue" / "Due today" */
export function describeDeadline(date: Date | string | null | undefined): {
  text: string;
  tone: "neutral" | "caution" | "critical" | "positive";
} {
  if (!date) return { text: "No date set", tone: "neutral" };
  const days = daysUntil(date);
  if (days < 0) {
    const n = Math.abs(days);
    return { text: `${n} ${n === 1 ? "day" : "days"} overdue`, tone: "critical" };
  }
  if (days === 0) return { text: "Due today", tone: "critical" };
  if (days === 1) return { text: "Due tomorrow", tone: "caution" };
  if (days <= 3) return { text: `Due in ${days} days`, tone: "caution" };
  return { text: `Due in ${days} days`, tone: "neutral" };
}

export function dayBounds(date: Date = new Date()) {
  return { start: startOfDay(date), end: endOfDay(date) };
}

/**
 * Calendar month bounds, offset in whole months from the current one, so
 * `monthBounds(-1)` is last month. Comparisons against "this month" run all
 * over the product, and they all need the same edges.
 */
export function monthBounds(offset = 0, from: Date = new Date()) {
  const anchor = addMonths(from, offset);
  return {
    start: startOfMonth(anchor),
    end: endOfMonth(anchor),
    label: format(anchor, "MMMM yyyy"),
  };
}

/** Parses a `<input type="datetime-local">` or date value coming from a form. */
export function parseFormDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Formats a Date for a `<input type="date">` value. */
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  return format(new Date(date), "yyyy-MM-dd");
}

/** Formats a Date for a `<input type="datetime-local">` value. */
export function toDateTimeInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
}
