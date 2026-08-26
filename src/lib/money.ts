/**
 * Money is always an integer in minor units (pesewas for GHS, cents for USD).
 * Floats are never used for currency anywhere in FIT BY YOU.
 */

export const CURRENCIES = {
  GHS: { code: "GHS", symbol: "GH₵", name: "Ghana Cedi", minorUnits: 100 },
  NGN: { code: "NGN", symbol: "₦", name: "Nigerian Naira", minorUnits: 100 },
  KES: { code: "KES", symbol: "KSh", name: "Kenyan Shilling", minorUnits: 100 },
  ZAR: { code: "ZAR", symbol: "R", name: "South African Rand", minorUnits: 100 },
  USD: { code: "USD", symbol: "$", name: "US Dollar", minorUnits: 100 },
  GBP: { code: "GBP", symbol: "£", name: "Pound Sterling", minorUnits: 100 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", minorUnits: 100 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export function isCurrencyCode(value: string): value is CurrencyCode {
  return value in CURRENCIES;
}

export function currencySymbol(code: string): string {
  return isCurrencyCode(code) ? CURRENCIES[code].symbol : code;
}

/**
 * Renders GH₵1,200 — and GH₵1,200.50 only when there are pesewas to show.
 * Tailors read whole cedis far more often than fractions.
 */
export function formatMoney(
  minor: number,
  code: string = "GHS",
  options: { showDecimals?: boolean; signed?: boolean } = {},
): string {
  const symbol = currencySymbol(code);
  const negative = minor < 0;
  const abs = Math.abs(Math.round(minor));
  const major = Math.floor(abs / 100);
  const remainder = abs % 100;
  const showDecimals = options.showDecimals ?? remainder !== 0;

  const majorText = major.toLocaleString("en-US");
  const body = showDecimals
    ? `${majorText}.${remainder.toString().padStart(2, "0")}`
    : majorText;

  const sign = negative ? "-" : options.signed && minor > 0 ? "+" : "";
  return `${sign}${symbol}${body}`;
}

/** Compact form for chart axes and dense stat strips: GH₵24.8k */
export function formatMoneyCompact(minor: number, code: string = "GHS"): string {
  const symbol = currencySymbol(code);
  const abs = Math.abs(minor) / 100;
  const sign = minor < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${symbol}${trimZero(abs / 1_000_000)}m`;
  if (abs >= 1_000) return `${sign}${symbol}${trimZero(abs / 1_000)}k`;
  return `${sign}${symbol}${Math.round(abs).toLocaleString("en-US")}`;
}

function trimZero(value: number): string {
  const fixed = value.toFixed(1);
  return fixed.endsWith(".0") ? fixed.slice(0, -2) : fixed;
}

/**
 * Parses user input ("1200", "1,200.50", "GH₵1200") into minor units.
 * Returns null when the input is not a usable amount.
 */
export function parseMoneyToMinor(input: string | number): number | null {
  if (typeof input === "number") {
    return Number.isFinite(input) ? Math.round(input * 100) : null;
  }
  const cleaned = input.replace(/[^\d.-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/** Minor units to a plain major-unit number, for form inputs. */
export function minorToMajor(minor: number): number {
  return Math.round(minor) / 100;
}

export function majorToMinor(major: number): number {
  return Math.round(major * 100);
}
