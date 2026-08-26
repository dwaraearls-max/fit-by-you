import {
  FABRIC_PREFERENCE_META,
  OUTFIT_TYPE_META,
  PREFERRED_FIT_META,
  STYLE_PREFERENCE_META,
  labelFor,
} from "./domain";
import { formatMoney } from "./money";
import { formatLongDate, monthsSince, timeAgo } from "./dates";
import { mostCommon, pluralise } from "./utils";

/**
 * FIT MEMORY™
 *
 * The line in the brief is "the system knows the customer". This is how it
 * knows: not a language model, but a careful read of the business's own rows.
 * Every sentence below is derived, so it is always true, always instant, and
 * costs nothing per customer.
 *
 * Kept pure and free of Prisma so it can be unit-reasoned about and so the
 * shape of the query is the caller's problem, not this module's.
 */

export type FitMemoryInput = {
  customer: {
    firstName: string;
    fullName: string;
    customerSince: Date;
    lastVisitAt: Date | null;
    notes: string | null;
  };
  orders: {
    title: string;
    outfitType: string;
    fabric: string | null;
    status: string;
    priceMinor: number;
    createdAt: Date;
    deliveredAt: Date | null;
  }[];
  lastMeasuredAt: Date | null;
  measurementCount: number;
  preferredFit: string | null;
  /** StylePreference rows, already narrowed to this customer. */
  preferences: { kind: string; value: string }[];
  outstandingMinor: number;
  totalPaidMinor: number;
  currency: string;
};

export type FitMemoryFact = {
  label: string;
  value: string;
  hint?: string;
};

export type FitMemory = {
  /** True once there is enough history for the panel to be worth showing. */
  known: boolean;
  headline: string;
  facts: FitMemoryFact[];
  /** Short, plain sentences. Rendered as a paragraph. */
  narrative: string[];
  notes: string | null;
  /** Set when the customer has been away long enough to greet on arrival. */
  welcomeBack: { monthsAway: number; sentence: string } | null;
};

export function buildFitMemory(input: FitMemoryInput): FitMemory {
  const {
    customer,
    orders,
    lastMeasuredAt,
    measurementCount,
    preferredFit,
    preferences,
    outstandingMinor,
    totalPaidMinor,
    currency,
  } = input;

  const delivered = orders.filter((order) => order.status === "DELIVERED");
  const active = orders.filter(
    (order) => order.status !== "DELIVERED" && order.status !== "CANCELLED",
  );
  const lastOrder = orders[0] ?? null;

  const signatureOutfit = mostCommon(orders.map((order) => order.outfitType));
  const signatureFabric = mostCommon(
    orders.map((order) => order.fabric).filter((value): value is string => !!value),
  );
  const styleValues = preferences
    .filter((entry) => entry.kind === "STYLE")
    .map((entry) => entry.value);
  const colourValues = preferences
    .filter((entry) => entry.kind === "COLOR")
    .map((entry) => entry.value);

  // --- Facts ---------------------------------------------------------------
  const facts: FitMemoryFact[] = [];

  facts.push({
    label: "Customer since",
    value: formatLongDate(customer.customerSince),
    hint: describeTenure(customer.customerSince),
  });

  facts.push({
    label: "Last measured",
    value: lastMeasuredAt ? formatLongDate(lastMeasuredAt) : "Not yet measured",
    hint: lastMeasuredAt
      ? `${pluralise(measurementCount, "session")} on record`
      : "Take measurements to start the history",
  });

  if (preferredFit) {
    facts.push({
      label: "Preferred fit",
      value: labelFor(PREFERRED_FIT_META, preferredFit),
    });
  }

  if (signatureOutfit) {
    facts.push({
      label: "Signature piece",
      value: labelFor(OUTFIT_TYPE_META, signatureOutfit),
      hint: `${countOf(orders, (order) => order.outfitType === signatureOutfit)} made`,
    });
  }

  if (signatureFabric) {
    facts.push({
      label: "Favourite fabric",
      value: prettyFabric(signatureFabric),
    });
  }

  facts.push({
    label: "Outfits made",
    value: String(delivered.length),
    hint: active.length > 0 ? `${active.length} in progress` : undefined,
  });

  facts.push({
    label: "Total spent",
    value: formatMoney(totalPaidMinor, currency),
    hint:
      outstandingMinor > 0
        ? `${formatMoney(outstandingMinor, currency)} outstanding`
        : "Fully settled",
  });

  // --- Narrative -----------------------------------------------------------
  const narrative: string[] = [];
  const name = customer.firstName;

  if (orders.length === 0) {
    narrative.push(
      `${name} is new here. Once you take measurements and start an outfit, this panel will remember the rest.`,
    );
  } else {
    const tenure = describeTenure(customer.customerSince);
    narrative.push(
      `${name} has been your customer for ${tenure.toLowerCase()}, and you have made ${pluralise(
        delivered.length,
        "outfit",
      )} together.`,
    );

    if (signatureOutfit) {
      const fabricPart = signatureFabric
        ? `, usually in ${prettyFabric(signatureFabric).toLowerCase()}`
        : "";
      narrative.push(
        `${name} comes to you mostly for ${labelFor(
          OUTFIT_TYPE_META,
          signatureOutfit,
        ).toLowerCase()}${fabricPart}.`,
      );
    }

    if (preferredFit || styleValues.length > 0) {
      const parts: string[] = [];
      if (preferredFit) {
        parts.push(`a ${labelFor(PREFERRED_FIT_META, preferredFit).toLowerCase()} fit`);
      }
      if (styleValues.length > 0) {
        parts.push(
          `${styleValues
            .slice(0, 2)
            .map((value) => labelFor(STYLE_PREFERENCE_META, value).toLowerCase())
            .join(" and ")} styling`,
        );
      }
      narrative.push(`${name} prefers ${parts.join(" with ")}.`);
    }

    if (colourValues.length > 0) {
      narrative.push(
        `Colours that work for ${name}: ${colourValues
          .slice(0, 3)
          .map(prettyColour)
          .join(", ")}.`,
      );
    }

    if (lastOrder) {
      narrative.push(
        `The last piece was ${lastOrder.title}, started ${timeAgo(lastOrder.createdAt)}.`,
      );
    }

    if (lastMeasuredAt && monthsSince(lastMeasuredAt) >= 6) {
      narrative.push(
        `Measurements were last taken ${timeAgo(
          lastMeasuredAt,
        )} — worth checking them before cutting.`,
      );
    }

    if (outstandingMinor > 0) {
      narrative.push(
        `${formatMoney(outstandingMinor, currency)} is still outstanding.`,
      );
    }
  }

  // --- Welcome back --------------------------------------------------------
  // A returning customer is one you have made something for, who has been away
  // long enough that you would have to think to remember them.
  const lastSeen = customer.lastVisitAt ?? lastOrder?.createdAt ?? null;
  const monthsAway = lastSeen ? monthsSince(lastSeen) : 0;
  const welcomeBack =
    lastSeen && monthsAway >= 2 && delivered.length > 0
      ? {
          monthsAway,
          sentence: buildWelcomeSentence({
            name,
            monthsAway,
            lastOrderTitle: lastOrder?.title ?? null,
            signatureFabric,
            lastMeasuredAt,
            currency,
            outstandingMinor,
          }),
        }
      : null;

  return {
    known: orders.length > 0 || measurementCount > 0,
    headline:
      orders.length === 0
        ? `You are just getting to know ${name}.`
        : `You know ${name} well.`,
    facts,
    narrative,
    notes: customer.notes?.trim() ? customer.notes.trim() : null,
    welcomeBack,
  };
}

function buildWelcomeSentence({
  name,
  monthsAway,
  lastOrderTitle,
  signatureFabric,
  lastMeasuredAt,
  currency,
  outstandingMinor,
}: {
  name: string;
  monthsAway: number;
  lastOrderTitle: string | null;
  signatureFabric: string | null;
  lastMeasuredAt: Date | null;
  currency: string;
  outstandingMinor: number;
}): string {
  const away =
    monthsAway >= 12
      ? `${Math.floor(monthsAway / 12)} ${monthsAway >= 24 ? "years" : "year"}`
      : `${monthsAway} months`;

  const bits: string[] = [`It has been about ${away} since ${name} last came in.`];

  if (lastOrderTitle) bits.push(`Last time you made ${lastOrderTitle}.`);
  if (signatureFabric) bits.push(`${name} favours ${prettyFabric(signatureFabric).toLowerCase()}.`);
  if (lastMeasuredAt && monthsSince(lastMeasuredAt) >= 6) {
    bits.push("Measurements are due a refresh.");
  }
  if (outstandingMinor > 0) {
    bits.push(`${formatMoney(outstandingMinor, currency)} is still outstanding.`);
  }

  return bits.join(" ");
}

function describeTenure(since: Date): string {
  const months = monthsSince(since);
  if (months < 1) return "Less than a month";
  if (months < 12) return pluralise(months, "month");
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (remainder === 0) return pluralise(years, "year");
  return `${pluralise(years, "year")}, ${pluralise(remainder, "month")}`;
}

function countOf<T>(items: T[], predicate: (item: T) => boolean): number {
  return items.reduce((total, item) => (predicate(item) ? total + 1 : total), 0);
}

/** Fabrics may be a catalogue value or something the tailor typed in. */
function prettyFabric(value: string): string {
  const known = FABRIC_PREFERENCE_META[value as keyof typeof FABRIC_PREFERENCE_META];
  return known ? known.label : value;
}

function prettyColour(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .join(" ");
}
