import type { Metadata } from "next";
import Link from "next/link";

import { ContentPage, Prose } from "@/components/marketing/content-page";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Answers to the questions tailors actually ask about FIT BY YOU — measurements, orders, payments, staff and WhatsApp.",
};

const TOPICS = [
  {
    title: "Why can I not edit an old measurement?",
    body: "Because it happened. A measurement session is a record of what you measured on a particular day, so it is never overwritten — you record a new session instead, and both stay in the history. If you genuinely mistyped a value, record a corrected session; the trend view will show the correction and the note explaining it.",
  },
  {
    title: "How do I compare two measurement dates?",
    body: "Open the customer, go to the Measurements tab, and use Compare. Pick any two sessions and every field is shown side by side with the difference, so a waist that moved from 30 to 32 inches is obvious at a glance.",
  },
  {
    title: "Can I add a measurement we take that you do not have?",
    body: "Yes. Settings → Measurement fields lets you add your own, choose which group it belongs to, and set the order it appears in. It then shows up on every measurement form from that point on.",
  },
  {
    title: "How do balances work?",
    body: "An order has a price. Every payment you record against it reduces the balance. The dashboard adds up all outstanding balances and tells you which customers they belong to, worst first, with a WhatsApp reminder already written.",
  },
  {
    title: "What can each staff role do?",
    body: "Assistants read customers and add photographs. Tailors take measurements, move orders through the workshop and record payments. Managers additionally change settings and see reports. Owners additionally manage the team and billing.",
  },
  {
    title: "Does the WhatsApp button send the message automatically?",
    body: "It opens WhatsApp with the message already written, addressed to that customer, so you can read it before it goes. Nothing is sent without you pressing send.",
  },
  {
    title: "What is a customer QR code for?",
    body: "Print it on a loyalty card, an appointment card or a receipt. Scanning it opens that customer's profile immediately, which is faster than searching when someone walks in with their card.",
  },
  {
    title: "How do I get my data out?",
    body: "Settings → Data export produces a complete file of your customers, measurements, orders and payments. It is yours; take it whenever you want.",
  },
] as const;

export default function HelpPage() {
  return (
    <ContentPage
      eyebrow="Help Center"
      title="Answers, without the jargon."
      intro="A tailor should never need a tutorial to use FIT BY YOU. When something is not obvious, it is on us — but here are the questions we get asked most."
    >
      <dl className="divide-y divide-border">
        {TOPICS.map((topic) => (
          <div key={topic.title} className="py-6 first:pt-0">
            <dt className="text-[0.9375rem] font-semibold tracking-tight text-foreground">
              {topic.title}
            </dt>
            <dd className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {topic.body}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-12">
        <Prose>
          <h2>Still stuck?</h2>
          <p>
            Message us on WhatsApp from the{" "}
            <Link href="/contact">contact page</Link> — it is the fastest way to
            reach a person, and usually the fastest way to get an answer.
          </p>
        </Prose>
      </div>
    </ContentPage>
  );
}
