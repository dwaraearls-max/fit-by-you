import type { Metadata } from "next";

import { PricingTable } from "@/components/marketing/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free forever on Starter. Upgrade for analytics, WhatsApp tools, a customer portal and staff accounts. Prices in Ghana Cedi.",
};

const FAQ = [
  {
    question: "Do I need a card to start?",
    answer:
      "No. Starter is free forever and asks for nothing but your name, email and business name. You can add a card later if you outgrow it.",
  },
  {
    question: "What happens to my data if I stop paying?",
    answer:
      "Nothing is deleted. Your account drops back to Starter limits, your records stay exactly where they are, and you can export everything at any time from Settings.",
  },
  {
    question: "Can my staff have their own accounts?",
    answer:
      "Yes, on Professional and Business. Each person gets their own sign-in and a role — Manager, Tailor or Assistant — that decides what they can see and change. Measurements are attributed to whoever took them.",
  },
  {
    question: "Can I use it on my phone?",
    answer:
      "That is where most of it happens. The phone layout is designed separately from the desktop one, so you can search a customer, take a measurement, photograph a fabric and record a payment while standing at the counter.",
  },
  {
    question: "Does it work with mobile money?",
    answer:
      "Payments are recorded with the method used — cash, mobile money, bank transfer or card — and a receipt number is generated for each one. FIT BY YOU does not move the money itself; it keeps the record straight.",
  },
  {
    question: "Can I switch currency later?",
    answer:
      "Yes. Ghana Cedi is the default, and USD, NGN, KES, ZAR, GBP and EUR are supported. Amounts are stored as exact integers, so nothing is lost rounding between them.",
  },
] as const;

export default function PricingPage() {
  return (
    <>
      <header className="relative overflow-hidden px-5 pt-16 pb-16 sm:px-8 sm:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 h-96 opacity-[0.11]"
          style={{
            background:
              "radial-gradient(50% 60% at 50% 30%, var(--champagne-400) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="eyebrow text-champagne-400">Pricing</p>
          <h1 className="display mt-5 text-[2.5rem] leading-[1.05] text-ivory-100 sm:text-5xl">
            Start free. Grow when you are ready.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ivory-100/60">
            One tailor or a whole fashion house — the same system, priced for
            where you actually are.
          </p>
        </div>
      </header>

      <div className="bg-background px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <PricingTable />

          <div className="mt-24">
            <h2 className="display text-center text-[1.75rem] sm:text-[2rem]">
              Questions worth asking.
            </h2>
            <dl className="mx-auto mt-10 max-w-2xl divide-y divide-border">
              {FAQ.map((entry) => (
                <div key={entry.question} className="py-6">
                  <dt className="text-[0.9375rem] font-semibold tracking-tight text-foreground">
                    {entry.question}
                  </dt>
                  <dd className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
                    {entry.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}
