import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From your first customer to a business that remembers everything: measurements, orders, fittings, payments and the customers who keep coming back.",
};

const STEPS = [
  {
    number: "01",
    title: "Add the customer once",
    body: "Name, phone and whatever else you know. FIT BY YOU gives them a customer number, a QR code and an empty profile waiting to be filled.",
    detail:
      "You never type their details twice. Every order, measurement, photo and payment from here on attaches itself to this one profile.",
  },
  {
    number: "02",
    title: "Measure them properly",
    body: "Shoulder, bust, under bust, armhole, sleeve, bicep, wrist, waist, hip, thigh, knee, ankle and every garment length — grouped the way you actually work through them.",
    detail:
      "Add your own fields if you measure something we did not think of. Each value is stamped with the date and with who took it.",
  },
  {
    number: "03",
    title: "Create the order",
    body: "Outfit, fabric, price, deposit, delivery date, fitting date. The order is cut from the exact measurement session you chose, and that link is kept.",
    detail:
      "Six months later you can open a finished outfit and see precisely which measurements it was made from.",
  },
  {
    number: "04",
    title: "Move it through the workshop",
    body: "New, measuring, cutting, sewing, fitting, adjustments, ready, delivered. One tap moves a stage and writes a timeline entry.",
    detail:
      "The orders board sorts by deadline and marks anything overdue, so nothing is discovered late.",
  },
  {
    number: "05",
    title: "Take the money and record it",
    body: "Cash, mobile money, bank transfer or card. Every payment gets a receipt number and reduces the balance on the spot.",
    detail:
      "Anyone still owing appears on the dashboard with a WhatsApp reminder already written for you.",
  },
  {
    number: "06",
    title: "Let it remember for you",
    body: "When they come back, their profile opens with FIT MEMORY at the top: preferred fit, signature style, favourite fabric, last outfit, and whether anything is outstanding.",
    detail:
      "This is the moment the customer says “they actually remember me”, and the reason they come back rather than shopping around.",
  },
] as const;

const SIXTY_SECONDS = [
  "Search the customer",
  "Open the profile",
  "Read the measurements",
  "Add a new measurement",
  "Take a photo of the fabric",
  "Create the order",
  "Record the deposit",
] as const;

export default function HowItWorksPage() {
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
        <div className="relative mx-auto max-w-3xl">
          <p className="eyebrow text-champagne-400">How it works</p>
          <h1 className="display mt-5 text-[2.5rem] leading-[1.05] text-ivory-100 sm:text-5xl">
            Six steps, and your business stops forgetting.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-ivory-100/60 sm:text-lg">
            No training, no manual, no course. If you can run a fitting, you can
            run FIT BY YOU.
          </p>
        </div>
      </header>

      <div className="bg-background px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <ol className="space-y-4">
            {STEPS.map((step, index) => (
              <Reveal key={step.number} delay={index * 50} as="li">
                <div className="grid gap-5 rounded-xl border border-border bg-surface p-6 sm:grid-cols-[auto_1fr] sm:gap-7 sm:p-8">
                  <span className="tabular display text-3xl text-champagne-500 sm:text-4xl">
                    {step.number}
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      {step.title}
                    </h2>
                    <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                    <p className="mt-3.5 border-l-2 border-accent-border pl-4 text-[0.8125rem] leading-relaxed text-muted-foreground">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>

      <section className="bg-ink-950 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow text-champagne-400">On your phone</p>
            <h2 className="display mt-5 text-[2rem] leading-tight text-ivory-100 sm:text-[2.5rem]">
              Seven things, under a minute, one hand.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ivory-100/60">
              The phone layout is designed from scratch rather than shrunk from
              the desktop one: bottom navigation, a floating action button, large
              targets and the camera one tap away. This is the whole counter
              workflow, standing in front of the customer.
            </p>
            <Button asChild size="lg" variant="inverted" className="mt-9">
              <Link href="/signup">
                Try it on your phone
                <ArrowRight />
              </Link>
            </Button>
          </Reveal>

          <Reveal delay={120}>
            <ol className="space-y-px overflow-hidden rounded-xl border border-white/10">
              {SIXTY_SECONDS.map((item, index) => (
                <li
                  key={item}
                  className="flex items-center gap-4 bg-white/[0.03] px-5 py-4"
                >
                  <span className="tabular text-xs text-champagne-400/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[0.9375rem] text-ivory-100/85">{item}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>
    </>
  );
}
