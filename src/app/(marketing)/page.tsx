import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CreditCard,
  Images,
  MessageCircle,
  QrCode,
  Ruler,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { HeroDashboard } from "@/components/marketing/hero-dashboard";
import { ProblemTransformation } from "@/components/marketing/problem-transformation";
import { PricingTable } from "@/components/marketing/pricing";

const FEATURES = [
  {
    id: "customers",
    icon: Users,
    title: "One profile per customer",
    body: "Phone, address, tags, notes, photos, style profile and every order they have ever placed — on one page you can read in five seconds.",
  },
  {
    id: "measurements",
    icon: Ruler,
    title: "Measurements that remember",
    body: "Nothing is ever overwritten. Every session is dated and attributed, so you can see how a waist moved from 30 to 32 inches over a year — and compare any two dates side by side.",
  },
  {
    id: "orders",
    icon: CreditCard,
    title: "Orders from cutting to delivery",
    body: "New, measuring, cutting, sewing, fitting, adjustments, ready, delivered. Every outfit has a stage and a timeline, so you always know where it stands.",
  },
  {
    id: "payments",
    icon: BarChart3,
    title: "Deposits and balances, settled",
    body: "Record cash, mobile money, bank transfer or card. See exactly who owes what, print a receipt, and send a polite reminder without typing it yourself.",
  },
  {
    id: "photos",
    icon: Images,
    title: "Photos where they belong",
    body: "Fabric, inspiration, fittings and finished outfits, filed against the customer and the order instead of buried in a camera roll.",
  },
  {
    id: "calendar",
    icon: CalendarDays,
    title: "A calendar built for fittings",
    body: "Measurement sessions, fittings, delivery dates and deadlines in one view, colour-coded so tomorrow is obvious at a glance.",
  },
] as const;

const SIGNATURE = [
  {
    icon: Search,
    title: "Search that actually finds",
    body: "Type “Amanda”, “32 waist”, “Kente dress” or “#1042”. Results appear as you type.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp, one tap away",
    body: "Order updates, payment reminders and fitting confirmations, pre-written and ready to send.",
  },
  {
    icon: QrCode,
    title: "A card for every customer",
    body: "Give each customer a QR code. Scan it and their profile opens instantly.",
  },
  {
    icon: Smartphone,
    title: "Made for a phone in one hand",
    body: "Search, measure, photograph, order and take payment while standing in front of the customer.",
  },
] as const;

const AUDIENCE = [
  "Tailors",
  "Seamstresses",
  "Fashion Designers",
  "Bridal Designers",
  "Alteration Specialists",
  "Fashion Houses",
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Before FIT BY YOU, I had three notebooks and hundreds of WhatsApp messages. Now everything is in one place.",
    name: "Akosua Danso",
    role: "Seamstress · Kumasi",
  },
  {
    quote:
      "A customer came back after eight months. I opened her profile and read out her measurements before she could find them in her phone. She was shocked.",
    name: "Ama Boateng",
    role: "Fashion House · East Legon",
  },
  {
    quote:
      "I used to lose track of who had paid a deposit. Now I open the dashboard in the morning and it tells me.",
    name: "Kwame Osei",
    role: "Tailor · Tema",
  },
] as const;

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params.deleted === "1" ? (
        <div className="border-b border-border bg-surface-muted px-6 py-3 text-center text-sm text-muted-foreground">
          Your business has been deleted. Nothing of yours remains on our
          servers.
        </div>
      ) : null}
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden px-5 pt-14 pb-24 sm:px-8 sm:pt-20 lg:pb-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 h-[42rem] opacity-[0.13]"
          style={{
            background:
              "radial-gradient(50% 55% at 50% 30%, var(--champagne-400) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[0.6875rem] font-medium tracking-wide text-ivory-100/70">
              <Sparkles className="size-3 text-champagne-400" aria-hidden />
              Fashion business management, built in Ghana
            </span>

            <h1 className="display mt-7 text-[2.75rem] leading-[1.02] text-ivory-100 sm:text-6xl lg:text-[4.25rem]">
              Your Fashion Business
              <br />
              Has a Memory.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ivory-100/60 sm:text-lg">
              Store customer measurements, styles, orders, photos and payment
              records in one beautifully simple workspace.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="xl" variant="inverted" className="w-full sm:w-auto">
                <Link href="/signup">
                  Start Free
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="xl"
                variant="invertedOutline"
                className="w-full sm:w-auto"
              >
                <Link href="/how-it-works">See How It Works</Link>
              </Button>
            </div>

            <p className="mt-5 text-xs text-ivory-100/40">
              Free forever on Starter · No card required · Set up in two minutes
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-5xl sm:mt-20">
            <HeroDashboard />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Problem                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-background px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-subtle-foreground">The problem</p>
            <h2 className="display mt-5 text-[2.25rem] leading-tight sm:text-[2.75rem]">
              Stop running your fashion business from memory.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Measurements in a notebook. Photos in your gallery. Balances in your
              head. Then a customer walks in after six months and asks for
              “the same as last time”.
            </p>
          </Reveal>

          <div className="mt-16">
            <ProblemTransformation />
          </div>

          <Reveal className="mt-16 text-center">
            <p className="display mx-auto max-w-xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
              “Madam, please remind me of your waist measurement.”
            </p>
            <p className="mt-4 text-sm font-medium text-foreground">
              You will never have to ask again.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Features                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="bg-surface-muted/40 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-subtle-foreground">The product</p>
            <h2 className="display mt-5 text-[2.25rem] leading-tight sm:text-[2.75rem]">
              Everything a fashion business has to remember.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Not a generic CRM with “contacts” and “deals”. Built around
              measurements, fabrics, fittings and deposits, because that is what
              the work is actually made of.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.id} delay={index * 60}>
                <article
                  id={feature.id}
                  className="group h-full rounded-xl border border-border bg-surface p-6 transition-all duration-300 hover:border-border-strong hover:shadow-md"
                >
                  <span className="inline-flex rounded-lg border border-accent-border bg-accent-soft p-2.5">
                    <feature.icon
                      className="size-4 text-champagne-700 dark:text-champagne-300"
                      aria-hidden
                    />
                  </span>
                  <h3 className="mt-5 text-base font-semibold tracking-tight text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FIT MEMORY                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-ink-950 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow text-champagne-400">Fit Memory™</p>
            <h2 className="display mt-5 text-[2.25rem] leading-tight text-ivory-100 sm:text-[2.75rem]">
              The moment a customer feels remembered.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ivory-100/60">
              Open a returning customer and FIT BY YOU has already read their
              history for you: their preferred fit, their signature style, the
              fabric they always come back to, what you made last time, and
              whether they owe you anything.
            </p>
            <p className="mt-5 text-base leading-relaxed text-ivory-100/60">
              No typing. No searching. It is simply there, the moment the profile
              opens.
            </p>
            <Button asChild size="lg" variant="inverted" className="mt-9">
              <Link href="/signup">
                See it with your own customers
                <ArrowRight />
              </Link>
            </Button>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-2xl border border-champagne-400/20 bg-gradient-to-br from-white/[0.06] to-transparent p-7">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-champagne-400" aria-hidden />
                <span className="eyebrow text-champagne-400">Fit Memory</span>
              </div>

              <p className="display mt-5 text-2xl text-ivory-100">
                Welcome back, Amanda.
              </p>

              <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5">
                {[
                  { label: "Last visit", value: "February 2026" },
                  { label: "Last measured", value: "August 26, 2026" },
                  { label: "Preferred fit", value: "Regular" },
                  { label: "Signature style", value: "Modern African" },
                  { label: "Favourite fabric", value: "Kente" },
                  { label: "Previous orders", value: "8" },
                  { label: "Last outfit", value: "Kente Evening Dress" },
                  { label: "Outstanding", value: "GH₵250" },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="eyebrow text-ivory-100/35">{item.label}</dt>
                    <dd className="mt-1.5 text-sm font-medium text-ivory-100">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-7 border-t border-white/10 pt-5">
                <p className="eyebrow text-ivory-100/35">Tailor notes</p>
                <p className="mt-2.5 text-sm leading-relaxed text-ivory-100/70 italic">
                  “Prefers slightly loose sleeves and longer dress length.”
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Signature capabilities                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-background px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 sm:grid-cols-2">
            {SIGNATURE.map((item, index) => (
              <Reveal key={item.title} delay={index * 60}>
                <div className="flex h-full items-start gap-4 rounded-xl border border-border bg-surface p-6">
                  <span className="inline-flex shrink-0 rounded-lg bg-surface-muted p-2.5">
                    <item.icon className="size-4 text-foreground" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-[0.9375rem] font-semibold tracking-tight text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-6">
            <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-center">
              <span className="inline-flex shrink-0 rounded-lg bg-surface-muted p-2.5">
                <ShieldCheck className="size-4 text-foreground" aria-hidden />
              </span>
              <div className="flex-1">
                <h3 className="text-[0.9375rem] font-semibold tracking-tight text-foreground">
                  Your customer list is yours alone
                </h3>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                  Every business is fully isolated. Role-based access for owners,
                  managers, tailors and assistants. Audit logs, session control,
                  and a full data export whenever you want it.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Social proof                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-border bg-surface-muted/40 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <p className="eyebrow text-subtle-foreground">Who it is for</p>
            <h2 className="display mt-5 text-[2.25rem] leading-tight sm:text-[2.75rem]">
              Built for people who make people look good.
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <ul className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
              {AUDIENCE.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-border-strong bg-surface px-4 py-2 text-[0.8125rem] font-medium text-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {TESTIMONIALS.map((item, index) => (
              <Reveal key={item.name} delay={index * 80}>
                <figure className="flex h-full flex-col rounded-xl border border-border bg-surface p-6">
                  <blockquote className="flex-1 text-[0.9375rem] leading-relaxed text-foreground">
                    “{item.quote}”
                  </blockquote>
                  <figcaption className="mt-6 border-t border-border pt-4">
                    <p className="text-[0.8125rem] font-semibold text-foreground">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.role}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Pricing                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section id="pricing" className="bg-background px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-subtle-foreground">Pricing</p>
            <h2 className="display mt-5 text-[2.25rem] leading-tight sm:text-[2.75rem]">
              Start free. Grow when you are ready.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              No card required to begin, and nothing to cancel if it is not for
              you.
            </p>
          </Reveal>

          <div className="mt-14">
            <PricingTable compact />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Final CTA                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-ink-950 px-5 py-24 sm:px-8 sm:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          style={{
            background:
              "radial-gradient(45% 65% at 50% 50%, var(--champagne-400) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="display text-[2.5rem] leading-[1.05] text-ivory-100 sm:text-[3.25rem]">
            Stop remembering everything.
            <br />
            <span className="text-champagne-400">
              Let FIT BY YOU remember it for you.
            </span>
          </h2>
          <p className="mx-auto mt-7 max-w-lg text-base leading-relaxed text-ivory-100/60">
            Your customers deserve the perfect fit. Your business deserves a
            better system.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="xl" variant="inverted" className="w-full sm:w-auto">
              <Link href="/signup">
                Start Your Free Account
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="invertedOutline"
              className="w-full sm:w-auto"
            >
              <Link href="/contact">Book a Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
