import Link from "next/link";

import { Logo, Tagline } from "@/components/ui/logo";

/**
 * Brand glyphs are hand-rolled: lucide dropped its brand icon set in v1, and
 * pulling a second icon dependency in for four marks is not worth the weight.
 */
type IconProps = { className?: string };

function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.4" cy="6.6" r="1.15" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M14.5 8.5h2.2V5.4h-2.6c-2.4 0-3.9 1.5-3.9 4v2.1H8v3.1h2.2V21h3.3v-6.4h2.3l.4-3.1h-2.7V9.7c0-.8.3-1.2 1-1.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M13.6 3v9.9a3 3 0 1 1-2.4-2.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M13.6 3.6c.4 2.3 2 3.8 4.4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M3.6 20.4l1.2-3.9A8.2 8.2 0 1 1 8 19.3l-4.4 1.1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 9.2c0 2.4 2.4 4.8 4.8 4.8.6 0 1.2-.5 1.2-1.1l-1.3-.7-.8.8c-1-.4-1.9-1.3-2.3-2.3l.8-.8L10.7 8c-.6 0-1.7.6-1.7 1.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/#customers", label: "Customers" },
      { href: "/#measurements", label: "Measurements" },
      { href: "/#orders", label: "Orders" },
      { href: "/#payments", label: "Payments" },
      { href: "/#analytics", label: "Analytics" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/pricing", label: "Pricing" },
      { href: "/contact", label: "Contact" },
      { href: "/careers", label: "Careers" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: "/help", label: "Help Center" },
      { href: "/how-it-works", label: "Guides" },
      { href: "/contact", label: "Support" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/security", label: "Security" },
    ],
  },
] as const;

const SOCIAL = [
  { href: "https://instagram.com", label: "Instagram", icon: InstagramIcon },
  { href: "https://facebook.com", label: "Facebook", icon: FacebookIcon },
  { href: "https://tiktok.com", label: "TikTok", icon: TikTokIcon },
  { href: "https://wa.me/233302761940", label: "WhatsApp", icon: WhatsAppIcon },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/[0.07] bg-ink-950 px-5 pt-16 pb-10 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          <div>
            <Logo inverted />
            <Tagline inverted className="mt-4 max-w-xs text-[0.9375rem]" />
            <div className="mt-7 flex items-center gap-2">
              {SOCIAL.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="rounded-md border border-white/10 p-2 text-ivory-100/55 transition-colors hover:border-white/25 hover:text-ivory-100"
                >
                  <item.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <p className="eyebrow text-champagne-400/80">{column.heading}</p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[0.8125rem] text-ivory-100/55 transition-colors hover:text-ivory-100"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col-reverse items-start justify-between gap-4 border-t border-white/[0.07] pt-7 sm:flex-row sm:items-center">
          <p className="text-xs text-ivory-100/35">
            © {new Date().getFullYear()} FIT BY YOU. Built in Ghana, for fashion
            businesses everywhere.
          </p>
          <p className="text-xs text-ivory-100/35">
            Prices in Ghana Cedi (GH₵)
          </p>
        </div>
      </div>
    </footer>
  );
}
