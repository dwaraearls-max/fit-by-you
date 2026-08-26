/**
 * The calendar reads from five tables and presents one timeline, because a
 * tailor does not think in tables: Thursday is a fitting, a delivery and a
 * measurement, and it either fits in the day or it does not.
 *
 * The kinds and their colours live here rather than beside the query because
 * the grid that paints them is a client component.
 */
export const CALENDAR_KINDS = [
  "FITTING",
  "MEASUREMENT",
  "DELIVERY",
  "APPOINTMENT",
  "REMINDER",
] as const;

export type CalendarKind = (typeof CALENDAR_KINDS)[number];

/**
 * Colour is the only encoding a busy workshop reads reliably, so each kind of
 * work keeps one colour everywhere: fittings blue, measurements champagne,
 * deliveries green, appointments ink, money amber.
 */
export const CALENDAR_KIND_META: Record<
  CalendarKind,
  { label: string; dot: string; soft: string; text: string }
> = {
  FITTING: {
    label: "Fittings",
    dot: "bg-info",
    soft: "bg-info-soft",
    text: "text-info",
  },
  MEASUREMENT: {
    label: "Measurements",
    dot: "bg-accent",
    soft: "bg-accent-soft",
    text: "text-champagne-700 dark:text-champagne-300",
  },
  DELIVERY: {
    label: "Deliveries due",
    dot: "bg-positive",
    soft: "bg-positive-soft",
    text: "text-positive",
  },
  APPOINTMENT: {
    label: "Appointments",
    dot: "bg-ink-500",
    soft: "bg-surface-muted",
    text: "text-foreground",
  },
  REMINDER: {
    label: "Payment reminders",
    dot: "bg-caution",
    soft: "bg-caution-soft",
    text: "text-caution",
  },
};
