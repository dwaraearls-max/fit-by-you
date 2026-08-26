import type { Metadata } from "next";

import { ContentPage, Prose } from "@/components/marketing/content-page";

export const metadata: Metadata = {
  title: "About",
  description:
    "FIT BY YOU is the digital memory of a fashion business — built in Ghana for independent fashion professionals across Africa.",
};

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="About"
      title="The digital memory of a fashion business."
      intro="Not measurement software. Not another CRM. The system a fashion professional runs their whole business from."
    >
      <Prose>
        <p>
          Every tailor, seamstress and designer we have ever spoken to keeps the
          same things in the same scattered places. Measurements in a notebook.
          Style references in a WhatsApp thread. Finished outfits somewhere in a
          camera roll of four thousand photos. Balances owed, in their head.
        </p>
        <p>
          It works, until it does not. A notebook goes missing. A customer
          returns after eight months and asks for “the same as last time”. A
          deposit is remembered differently by two people. And every single time,
          the same sentence gets said out loud:{" "}
          <strong>“Madam, please remind me of your waist measurement.”</strong>
        </p>

        <h2>What we are building</h2>
        <p>
          FIT BY YOU turns all of that into one system that remembers on your
          behalf. Not by digitising a notebook, but by understanding what the
          work is actually made of — measurements that change over time, fabrics
          that customers return to, fittings that need to happen before delivery,
          deposits that need chasing.
        </p>
        <p>
          The measurement history is the clearest example. Most software would
          store a waist measurement and overwrite it next time. We keep every
          session, dated and attributed, because a body changes and a good tailor
          needs to see how. That single decision is why you can open a customer
          and watch a waist move from 30 to 32 inches across a year.
        </p>

        <h2>Where we are starting</h2>
        <p>
          Ghana first, and properly rather than superficially: Ghana Cedi, Ghana
          phone numbers, mobile money as a first-class payment method, WhatsApp as
          the way people actually communicate, and Kente, Ankara, smock, kaftan
          and traditional wear as real categories rather than an “other” field.
        </p>
        <p>
          The architecture, though, was built for more than one market. Multiple
          currencies, multiple locations and multiple languages are structural,
          not bolted on — so expanding across Africa and beyond does not mean
          starting again.
        </p>

        <h2>Where it goes</h2>
        <p>
          The long-term ambition is for a fashion professional to run their entire
          business from FIT BY YOU: customer acquisition, measurements, orders,
          production, fittings, payments, communication, analytics and retention.
          The operating system for independent fashion professionals.
        </p>
        <p>
          We will know it is working when a tailor says{" "}
          <strong>“finally, someone built this for us”</strong> — and their
          customer says <strong>“they actually remember me”</strong>.
        </p>
      </Prose>
    </ContentPage>
  );
}
