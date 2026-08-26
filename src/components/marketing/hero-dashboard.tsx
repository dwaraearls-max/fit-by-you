import {
  Bell,
  CalendarDays,
  CreditCard,
  Images,
  LayoutDashboard,
  Notebook,
  Ruler,
  Search,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A faithful, static rendering of a real FIT BY YOU customer profile.
 *
 * The brief asks the hero to demonstrate the product rather than describe it,
 * so this is deliberately built from the same tokens and spacing as the actual
 * app — not an illustration of one. The numbers match Amanda Mensah's seeded
 * record so the marketing page and the product agree.
 */

const NAV: { icon: LucideIcon; label: string; active?: boolean }[] = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Users, label: "Customers", active: true },
  { icon: Ruler, label: "Measurements" },
  { icon: ShoppingBag, label: "Orders" },
  { icon: CreditCard, label: "Payments" },
  { icon: Images, label: "Style Library" },
  { icon: CalendarDays, label: "Calendar" },
];

const MEASUREMENTS = [
  { label: "Bust", value: "36" },
  { label: "Waist", value: "32" },
  { label: "Hip", value: "40" },
  { label: "Shoulder", value: "15.5" },
  { label: "Sleeve", value: "22.5" },
  { label: "Length", value: "52" },
] as const;

export function HeroDashboard() {
  return (
    <div className="relative">
      {/* Glow behind the panel */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-12 -top-10 bottom-0 opacity-40"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 40%, var(--champagne-500) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative overflow-hidden rounded-xl border border-white/[0.09] bg-ivory-100 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)] sm:rounded-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-ivory-300 bg-ivory-200/70 px-4 py-2.5">
          <span className="size-2 rounded-full bg-ink-300" />
          <span className="size-2 rounded-full bg-ink-200" />
          <span className="size-2 rounded-full bg-ink-200" />
          <div className="ml-3 flex h-6 flex-1 items-center gap-1.5 rounded-md bg-white/80 px-2.5 text-[0.5625rem] text-ink-400">
            <Search className="size-2.5" aria-hidden />
            Search customers, orders, measurements…
            <span className="ml-auto rounded border border-ivory-400 px-1 font-medium">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden w-40 shrink-0 flex-col gap-0.5 border-r border-ivory-300 bg-ivory-200/40 p-2.5 sm:flex lg:w-44">
            {NAV.map((item) => (
              <span
                key={item.label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-[0.4375rem] text-[0.625rem] font-medium",
                  item.active
                    ? "bg-ink-950 text-ivory-100"
                    : "text-ink-500",
                )}
              >
                <item.icon className="size-3" aria-hidden />
                {item.label}
              </span>
            ))}
          </aside>

          {/* Profile */}
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            {/* Header row */}
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-champagne-100 text-[0.8125rem] font-semibold text-champagne-800 sm:size-12">
                AM
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[0.9375rem] leading-none font-semibold tracking-tight text-ink-900 sm:text-base">
                    Amanda Mensah
                  </h3>
                  <span className="rounded-full border border-champagne-200 bg-champagne-50 px-1.5 py-0.5 text-[0.5rem] font-medium text-champagne-700">
                    VIP
                  </span>
                  <span className="rounded-full border border-ivory-400 bg-ivory-200 px-1.5 py-0.5 text-[0.5rem] font-medium text-ink-500">
                    Regular Customer
                  </span>
                </div>
                <p className="mt-1.5 text-[0.625rem] text-ink-400">
                  FBY-0248 · +233 24 488 1420 · Customer since 2025
                </p>
              </div>
              <span className="hidden shrink-0 items-center gap-1 rounded-md bg-ink-950 px-2 py-1.5 text-[0.5625rem] font-medium text-ivory-100 sm:inline-flex">
                <Ruler className="size-2.5" aria-hidden />
                Update Measurements
              </span>
            </div>

            {/* FIT MEMORY */}
            <div className="mt-4 rounded-lg border border-champagne-200 bg-gradient-to-br from-champagne-50 to-ivory-100 p-3 sm:p-3.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-2.5 text-champagne-600" aria-hidden />
                <span className="text-[0.5rem] font-semibold tracking-[0.16em] text-champagne-700 uppercase">
                  Fit Memory
                </span>
              </div>
              <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                {[
                  { label: "Preferred fit", value: "Regular" },
                  { label: "Signature style", value: "Modern African" },
                  { label: "Favourite fabric", value: "Kente" },
                  { label: "Previous orders", value: "8" },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-[0.5rem] tracking-[0.12em] text-ink-400 uppercase">
                      {item.label}
                    </dt>
                    <dd className="mt-0.5 truncate text-[0.6875rem] font-semibold text-ink-800">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2.5 flex items-start gap-1.5 border-t border-champagne-200/70 pt-2.5 text-[0.5625rem] leading-relaxed text-ink-500 italic">
                <Notebook className="mt-px size-2.5 shrink-0 text-champagne-600" aria-hidden />
                “Prefers slightly loose sleeves and longer dress length.”
              </p>
            </div>

            {/* Measurements */}
            <div className="mt-3.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[0.5rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                  Measurements — inches
                </span>
                <span className="text-[0.5rem] text-ink-400">
                  Last measured August 26, 2026
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {MEASUREMENTS.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-md border border-ivory-300 bg-white px-2 py-2 text-center"
                  >
                    <p className="text-[0.5rem] tracking-[0.1em] text-ink-400 uppercase">
                      {item.label}
                    </p>
                    <p className="mt-1 text-[0.8125rem] leading-none font-semibold text-ink-900">
                      {item.value}
                      <span className="ml-px text-[0.5rem] font-normal text-ink-400">
                        in
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order + balance */}
            <div className="mt-3.5 grid gap-2.5 sm:grid-cols-[1.6fr_1fr]">
              <div className="rounded-lg border border-ivory-300 bg-white p-3">
                <p className="text-[0.5rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                  Recent order
                </p>
                <p className="mt-1.5 text-[0.8125rem] font-semibold text-ink-900">
                  Custom African Print Dress
                </p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  {["Cutting", "Sewing", "Fitting"].map((stage, index) => (
                    <span
                      key={stage}
                      className={cn(
                        "flex-1 rounded-full py-[0.1875rem] text-center text-[0.5rem] font-medium",
                        index < 2
                          ? "bg-ink-950 text-ivory-100"
                          : "bg-champagne-100 text-champagne-800",
                      )}
                    >
                      {stage}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[0.5625rem] text-ink-400">
                  Fitting tomorrow at 2:00 PM · Delivery in 6 days
                </p>
              </div>

              <div className="flex flex-col justify-between rounded-lg border border-ivory-300 bg-white p-3">
                <div>
                  <p className="text-[0.5rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                    Balance
                  </p>
                  <p className="mt-1.5 text-lg leading-none font-semibold text-ink-900">
                    GH₵250
                  </p>
                  <p className="mt-1 text-[0.5625rem] text-ink-400">
                    GH₵950 of GH₵1,200 paid
                  </p>
                </div>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ivory-300">
                  <div className="h-full w-[79%] rounded-full bg-positive" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating micro-interaction toast, lifted straight from the product */}
      <div className="absolute -right-2 -bottom-4 hidden items-center gap-2 rounded-lg border border-ivory-300 bg-white px-3 py-2.5 shadow-lg sm:flex lg:-right-8">
        <span className="flex size-5 items-center justify-center rounded-full bg-positive-soft">
          <Bell className="size-2.5 text-positive" aria-hidden />
        </span>
        <div>
          <p className="text-[0.625rem] font-semibold text-ink-900">
            Measurement saved
          </p>
          <p className="text-[0.5rem] text-ink-400">Waist 31&quot; → 32&quot;</p>
        </div>
      </div>
    </div>
  );
}
