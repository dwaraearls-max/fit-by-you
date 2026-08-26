import "server-only";

import { prisma } from "./db";

/**
 * Human-facing identifiers. Customers read these out over the phone and they
 * get printed on receipts, so they need to be short, sequential and stable —
 * which rules out using the cuid primary keys.
 *
 * Sequences are derived from the highest existing value rather than a counter
 * column, so they stay correct even if rows are imported or deleted.
 */

/** "Adjoa Couture" -> "AC", "Nuru Bridal House" -> "NBH", fallback "FBY". */
export function prefixFromName(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z]/g, "").charAt(0))
    .filter(Boolean)
    .join("")
    .toUpperCase();

  if (letters.length >= 2) return letters.slice(0, 3);

  const compact = name.replace(/[^A-Za-z]/g, "").toUpperCase();
  return compact.length >= 2 ? compact.slice(0, 3) : "FBY";
}

function highestNumber(codes: string[]): number {
  let highest = 0;
  for (const code of codes) {
    const match = /(\d+)\s*$/.exec(code);
    if (!match) continue;
    const value = Number.parseInt(match[1]!, 10);
    if (Number.isFinite(value) && value > highest) highest = value;
  }
  return highest;
}

export async function nextCustomerCode(
  businessId: string,
  businessName: string,
): Promise<string> {
  const existing = await prisma.customer.findMany({
    where: { businessId },
    select: { code: true },
  });

  const prefix = prefixFromName(businessName);
  const next = highestNumber(existing.map((row) => row.code)) + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

/** Order numbers are bare integers, so "#1042" reads naturally. */
export async function nextOrderCode(businessId: string): Promise<string> {
  const existing = await prisma.order.findMany({
    where: { businessId },
    select: { code: true },
  });

  const highest = highestNumber(existing.map((row) => row.code));
  return String(Math.max(highest + 1, 1001));
}

export async function nextReceiptNumber(
  businessId: string,
  businessName: string,
): Promise<string> {
  const existing = await prisma.payment.findMany({
    where: { businessId },
    select: { receiptNumber: true },
  });

  const prefix = prefixFromName(businessName);
  const next = highestNumber(existing.map((row) => row.receiptNumber)) + 1;
  return `${prefix}-${String(next).padStart(5, "0")}`;
}

export async function nextInvoiceNumber(
  businessId: string,
  businessName: string,
): Promise<string> {
  const existing = await prisma.invoice.findMany({
    where: { businessId },
    select: { number: true },
  });

  const prefix = prefixFromName(businessName);
  const next = highestNumber(existing.map((row) => row.number)) + 1;
  return `${prefix}-INV-${String(next).padStart(4, "0")}`;
}

/** Unique slug for a new business, e.g. "adjoa-couture-2" if taken. */
export async function uniqueBusinessSlug(base: string): Promise<string> {
  const root = base || "business";
  let candidate = root;
  let suffix = 1;

  // Businesses are few and this only runs at signup, so a simple probe loop is
  // clearer than anything cleverer.
  while (await prisma.business.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }

  return candidate;
}

/** Lowercased haystack backing global search. */
export function customerSearchText(input: {
  fullName: string;
  phone: string;
  code: string;
  email?: string | null;
  city?: string | null;
}): string {
  return [input.fullName, input.phone, input.code, input.email, input.city]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function orderSearchText(input: {
  code: string;
  title: string;
  customerName: string;
  fabric?: string | null;
  description?: string | null;
}): string {
  return [
    `#${input.code}`,
    input.code,
    input.title,
    input.customerName,
    input.fabric,
    input.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
