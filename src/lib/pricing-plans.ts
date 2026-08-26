/** Static pricing catalogue — matches prisma/seed.ts and used when the DB is unreachable. */
export type PricingPlan = {
  id: string;
  code: string;
  name: string;
  tagline: string;
  description: string;
  priceMonthlyMinor: number;
  priceYearlyMinor: number;
  currency: string;
  features: { id: string; label: string; included: boolean }[];
};

export const FALLBACK_PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    code: "STARTER",
    name: "Starter",
    tagline: "For individual tailors.",
    description:
      "Everything you need to stop running your business from memory. Free to start.",
    priceMonthlyMinor: 0,
    priceYearlyMinor: 0,
    currency: "GHS",
    features: [
      { id: "s1", label: "Customer management", included: true },
      { id: "s2", label: "Digital measurements with full history", included: true },
      { id: "s3", label: "Order tracking", included: true },
      { id: "s4", label: "Basic payment records", included: true },
      { id: "s5", label: "Up to 50 customers", included: true },
      { id: "s6", label: "1 staff account", included: true },
      { id: "s7", label: "Advanced analytics", included: false },
      { id: "s8", label: "WhatsApp tools", included: false },
      { id: "s9", label: "Customer portal", included: false },
      { id: "s10", label: "Style library", included: false },
    ],
  },
  {
    id: "professional",
    code: "PROFESSIONAL",
    name: "Professional",
    tagline: "For growing fashion businesses.",
    description:
      "For the tailor whose notebook ran out of pages. Analytics, WhatsApp and a portal for your customers.",
    priceMonthlyMinor: 12000,
    priceYearlyMinor: 115000,
    currency: "GHS",
    features: [
      { id: "p1", label: "Everything in Starter", included: true },
      { id: "p2", label: "Unlimited measurements and photos", included: true },
      { id: "p3", label: "Advanced analytics and insights", included: true },
      { id: "p4", label: "WhatsApp communication tools", included: true },
      { id: "p5", label: "Customer portal", included: true },
      { id: "p6", label: "Style library", included: true },
      { id: "p7", label: "Automatic payment reminders", included: true },
      { id: "p8", label: "Up to 5 staff accounts", included: true },
      { id: "p9", label: "Multiple locations", included: false },
      { id: "p10", label: "Custom branding", included: false },
    ],
  },
  {
    id: "business",
    code: "BUSINESS",
    name: "Business",
    tagline: "For established fashion houses.",
    description:
      "Multiple locations, a real team, and the reporting to run all of it properly.",
    priceMonthlyMinor: 32000,
    priceYearlyMinor: 310000,
    currency: "GHS",
    features: [
      { id: "b1", label: "Everything in Professional", included: true },
      { id: "b2", label: "Multiple locations", included: true },
      { id: "b3", label: "Unlimited staff accounts", included: true },
      { id: "b4", label: "Advanced reporting and exports", included: true },
      { id: "b5", label: "Team management and permissions", included: true },
      { id: "b6", label: "Custom branding", included: true },
      { id: "b7", label: "Priority support", included: true },
    ],
  },
];

async function loadPricingPlans(): Promise<PricingPlan[]> {
  try {
    const { prisma } = await import("@/lib/db");
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { features: { orderBy: { sortOrder: "asc" } } },
    });
    if (plans.length === 0) return FALLBACK_PRICING_PLANS;
    return plans.map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      tagline: plan.tagline,
      description: plan.description,
      priceMonthlyMinor: plan.priceMonthlyMinor,
      priceYearlyMinor: plan.priceYearlyMinor,
      currency: plan.currency,
      features: plan.features.map((feature) => ({
        id: feature.id,
        label: feature.label,
        included: feature.included,
      })),
    }));
  } catch (error) {
    console.error("pricing plans unavailable, using fallback", error);
    return FALLBACK_PRICING_PLANS;
  }
}

export { loadPricingPlans };
