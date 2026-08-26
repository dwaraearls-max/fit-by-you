import { whatsappNumber } from "./utils";
import { formatMoney } from "./money";
import { formatFriendlyDate, formatTime } from "./dates";
import { ORDER_STATUS_META, labelFor } from "./domain";

/**
 * WhatsApp is how a Ghanaian tailor actually talks to customers, so the product
 * treats it as a first-class channel — but through a `wa.me` deep link with a
 * prefilled message rather than the Business API. The tailor still presses send
 * from their own number, which is both what they trust and what keeps this
 * working today with no approval process.
 *
 * The Business API can be swapped in behind `buildMessage` later without
 * touching a single screen.
 */

export type WhatsappTemplateKind = "ORDER_UPDATE" | "PAYMENT_REMINDER" | "FITTING";

export type WhatsappContext = {
  customer: string;
  business: string;
  outfit?: string | null;
  status?: string | null;
  amountMinor?: number | null;
  currency?: string;
  date?: Date | null;
};

const DEFAULTS: Record<WhatsappTemplateKind, string> = {
  ORDER_UPDATE:
    'Hi {customer}, an update on your {outfit}: it is now at the "{status}" stage. — {business}',
  PAYMENT_REMINDER:
    "Hi {customer}, a gentle reminder that {amount} is outstanding on your {outfit}. Thank you! — {business}",
  FITTING:
    "Hi {customer}, your outfit is ready for fitting on {date} at {time}. See you then! — {business}",
};

/** Fills a template's placeholders from real order and customer data. */
export function buildMessage(
  kind: WhatsappTemplateKind,
  context: WhatsappContext,
  template?: string | null,
): string {
  const source = template?.trim() || DEFAULTS[kind];
  const currency = context.currency ?? "GHS";

  const replacements: Record<string, string> = {
    "{customer}": firstNameOf(context.customer),
    "{business}": context.business,
    "{outfit}": context.outfit ?? "outfit",
    "{status}": context.status
      ? labelFor(ORDER_STATUS_META, context.status)
      : "in progress",
    "{amount}":
      typeof context.amountMinor === "number"
        ? formatMoney(context.amountMinor, currency)
        : "the balance",
    "{date}": context.date ? formatFriendlyDate(context.date) : "the agreed date",
    "{time}": context.date ? formatTime(context.date) : "the agreed time",
  };

  return Object.entries(replacements).reduce(
    (message, [token, value]) => message.split(token).join(value),
    source,
  );
}

/** A `wa.me` link that opens WhatsApp with the message already typed. */
export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(message)}`;
}

function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}
