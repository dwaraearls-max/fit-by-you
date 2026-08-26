import Link from "next/link";

import { Logo } from "@/components/ui/logo";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Editorial panel — hidden on phones, where it would only push the form
          below the fold. */}
      <aside className="relative hidden overflow-hidden bg-ink-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 size-[34rem] rounded-full opacity-[0.14]"
          style={{
            background:
              "radial-gradient(circle, var(--champagne-400) 0%, transparent 65%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-52 -left-32 size-[30rem] rounded-full opacity-[0.08]"
          style={{
            background:
              "radial-gradient(circle, var(--champagne-200) 0%, transparent 70%)",
          }}
        />

        <Link href="/" className="relative w-fit">
          <Logo inverted />
        </Link>

        <div className="relative max-w-lg">
          <p className="eyebrow text-champagne-400">Fit Memory</p>
          <h2 className="display mt-5 text-[2.75rem] leading-[1.05] text-ivory-100">
            Your fashion business has a memory.
          </h2>
          <p className="mt-5 text-[0.9375rem] leading-relaxed text-ivory-100/60">
            Measurements, styles, orders, photos and payments — every detail of
            every customer, remembered for you.
          </p>

          <figure className="mt-12 border-l border-champagne-400/30 pl-5">
            <blockquote className="text-[0.9375rem] leading-relaxed text-ivory-100/80">
              “Before FIT BY YOU, I had three notebooks and hundreds of WhatsApp
              messages. Now everything is in one place.”
            </blockquote>
            <figcaption className="mt-3 text-xs text-ivory-100/45">
              Akosua Danso — Seamstress, Kumasi
            </figcaption>
          </figure>
        </div>

        <p className="relative text-xs text-ivory-100/35">
          Built for people who make people look good.
        </p>
      </aside>

      <main className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-block lg:hidden">
            <Logo />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
