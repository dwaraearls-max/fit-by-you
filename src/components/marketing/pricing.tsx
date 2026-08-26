import Link from "next/link";
import { Check, Minus } from "lucide-react";

import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Reads the real Plan rows rather than hardcoding a price list, so the
 * marketing page and what the app actually enforces can never drift apart.
 */
export async function PricingTable({ compact = false }: { compact?: boolean }) {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { features: { orderBy: { sortOrder: "asc" } } },
  });

  if (plans.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Pricing is being updated. Please check back shortly.
      </p>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {plans.map((plan) => {
        const featured = plan.code === "PROFESSIONAL";
        const free = plan.priceMonthlyMinor === 0;

        return (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-2xl border p-6 sm:p-7",
              featured
                ? "border-ink-950/15 bg-surface shadow-lg lg:-my-3 lg:py-10"
                : "border-border bg-surface/60",
            )}
          >
            {featured ? (
              <span className="absolute -top-3 left-6 rounded-full bg-ink-950 px-3 py-1 text-[0.625rem] font-semibold tracking-[0.12em] text-ivory-100 uppercase">
                Most popular
              </span>
            ) : null}

            <h3 className="display text-2xl">{plan.name}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{plan.tagline}</p>

            <div className="mt-6 flex items-baseline gap-1.5">
              <span className="tabular text-[2.25rem] leading-none font-semibold tracking-tight text-foreground">
                {free ? "Free" : formatMoney(plan.priceMonthlyMinor, plan.currency)}
              </span>
              {free ? null : (
                <span className="text-sm text-muted-foreground">/month</span>
              )}
            </div>
            {free ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Forever. No card required.
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                or {formatMoney(plan.priceYearlyMinor, plan.currency)} a year —
                two months free
              </p>
            )}

            {compact ? null : (
              <p className="mt-5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                {plan.description}
              </p>
            )}

            <ul className="mt-7 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li
                  key={feature.id}
                  className={cn(
                    "flex items-start gap-2.5 text-[0.8125rem] leading-relaxed",
                    feature.included
                      ? "text-foreground"
                      : "text-subtle-foreground",
                  )}
                >
                  {feature.included ? (
                    <Check className="mt-0.5 size-3.5 shrink-0 text-positive" aria-hidden />
                  ) : (
                    <Minus className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  )}
                  {feature.label}
                </li>
              ))}
            </ul>

            <Button
              asChild
              size="lg"
              variant={featured ? "primary" : "outline"}
              className="mt-8 w-full"
            >
              <Link href="/signup">{free ? "Start free" : `Choose ${plan.name}`}</Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
