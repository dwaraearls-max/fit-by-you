import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Turns "Amanda Mensah" into "AM" for avatar fallbacks. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0] ?? "?").slice(0, 2).toUpperCase();
  return `${(parts[0] ?? "").charAt(0)}${(parts[parts.length - 1] ?? "").charAt(0)}`.toUpperCase();
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Ghanaian numbers are typed every way imaginable: 024..., 0244..., +233...,
 * with spaces and dashes. Normalise to E.164 so WhatsApp links always work.
 */
export function normalisePhone(input: string, countryCode = "233"): string {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith(countryCode) && digits.length > 10) return `+${digits}`;
  if (digits.startsWith("0")) return `+${countryCode}${digits.slice(1)}`;
  return `+${countryCode}${digits}`;
}

/** Display form: +233 24 123 4567 */
export function formatPhone(input: string): string {
  const e164 = normalisePhone(input);
  const match = /^\+233(\d{2})(\d{3})(\d{4})$/.exec(e164);
  if (match) return `+233 ${match[1]} ${match[2]} ${match[3]}`;
  return e164;
}

/** Digits only, for wa.me links. */
export function whatsappNumber(input: string): string {
  return normalisePhone(input).replace(/\D/g, "");
}

export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

/** "1 order", "3 orders", "2 galleries" — count and noun, agreeing. */
export function pluralise(count: number, singular: string, plural?: string) {
  const noun = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${noun}`;
}

/** Deterministic index into a palette, so a given name always gets one colour. */
export function hashToIndex(value: string, buckets: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % Math.max(buckets, 1);
}

export function uniqueBy<T, K>(items: T[], key: (item: T) => K): T[] {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

export function groupBy<T, K extends string>(
  items: T[],
  key: (item: T) => K,
): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}

export function sumBy<T>(items: T[], value: (item: T) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}

/** Highest-count value in a list, used for "favourite fabric" style insights. */
export function mostCommon<T extends string>(values: T[]): T | null {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  let best: T | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}
