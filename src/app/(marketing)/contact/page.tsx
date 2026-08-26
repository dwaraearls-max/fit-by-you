import type { Metadata } from "next";
import { Mail, MessageCircle, Phone } from "lucide-react";

import { ContentPage, Prose } from "@/components/marketing/content-page";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to the FIT BY YOU team, or book a walkthrough with your own customer records.",
};

const CHANNELS = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+233 30 276 1940",
    href: "https://wa.me/233302761940",
    note: "Fastest. This is how most of our customers reach us.",
  },
  {
    icon: Mail,
    label: "Email",
    value: "hello@fitbyyou.com",
    href: "mailto:hello@fitbyyou.com",
    note: "For anything that needs attachments or a longer answer.",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+233 30 276 1940",
    href: "tel:+233302761940",
    note: "Weekdays, 8:00 AM – 6:00 PM GMT.",
  },
] as const;

export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="Contact"
      title="Talk to a person."
      intro="Book a walkthrough and we will set it up with a few of your own customers, so you can see what it looks like with your records rather than ours."
      cta={false}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map((channel) => (
          <a
            key={channel.label}
            href={channel.href}
            target={channel.href.startsWith("http") ? "_blank" : undefined}
            rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="group rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-border-strong hover:shadow-md"
          >
            <span className="inline-flex rounded-lg border border-accent-border bg-accent-soft p-2.5">
              <channel.icon
                className="size-4 text-champagne-700 dark:text-champagne-300"
                aria-hidden
              />
            </span>
            <p className="eyebrow mt-4 text-subtle-foreground">{channel.label}</p>
            <p className="mt-1.5 text-sm font-semibold text-foreground">
              {channel.value}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {channel.note}
            </p>
          </a>
        ))}
      </div>

      <div className="mt-12">
        <Prose>
          <h2>A demo with your own data</h2>
          <p>
            The most useful thirty minutes we can spend together is not a slide
            deck. Send us five or six customers — names, phone numbers,
            measurements, what you made for them and what they still owe — and we
            will load them in before the call.
          </p>
          <p>
            You will spend the call looking at your own business, which tends to
            answer the questions a demo never does.
          </p>

          <h2>Where we are</h2>
          <p>
            Accra, Ghana. We visit workshops regularly, and quite a lot of what is
            in the product came from standing in one watching someone work.
          </p>
        </Prose>
      </div>
    </ContentPage>
  );
}
