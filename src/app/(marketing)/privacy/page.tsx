import type { Metadata } from "next";

import { ContentPage, Prose } from "@/components/marketing/content-page";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How FIT BY YOU handles your business data and your customers' personal information.",
};

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy."
      intro="Your customer list is the most valuable thing your business owns. Here is exactly what we do with it."
      cta={false}
    >
      <Prose>
        <p className="text-xs text-subtle-foreground">
          Last updated: 26 August 2026
        </p>

        <h2>The short version</h2>
        <ul>
          <li>
            Your customers&apos; records belong to you, not to us. We do not sell
            them, rent them, or use them to advertise to anyone.
          </li>
          <li>
            No other business on FIT BY YOU can see your customers. Data is
            isolated per business at the database level, not by a filter in the
            interface.
          </li>
          <li>
            You can export everything, at any time, from Settings — and you can
            delete your account and all of its records permanently.
          </li>
        </ul>

        <h2>What we store</h2>
        <p>
          <strong>About you:</strong> your name, email address, hashed password,
          and the business you belong to. Passwords are hashed with bcrypt and
          are never stored or logged in a readable form.
        </p>
        <p>
          <strong>About your customers:</strong> whatever you enter — names,
          phone numbers, addresses, measurements, style preferences, photographs,
          orders and payment records. We are a processor of this information; you
          are the controller of it.
        </p>
        <p>
          <strong>About your usage:</strong> sign-in times, the browser and IP
          address a session was created from, and an audit log of changes made
          within your business. This exists so you can see who changed what, and
          so we can investigate a security concern if one arises.
        </p>

        <h2>What we do not do</h2>
        <ul>
          <li>We do not sell or share your data with advertisers or data brokers.</li>
          <li>
            We do not use your customers&apos; measurements or photographs to
            train machine-learning models.
          </li>
          <li>
            We do not read your records except when you ask us to help with a
            specific support request.
          </li>
        </ul>

        <h2>Your customers&apos; rights</h2>
        <p>
          If one of your customers asks what you hold about them, the customer
          portal shows them their own measurements, orders, appointments and
          payment history. If they ask to be removed, deleting them from your
          customer list removes their personal record and their photographs.
        </p>

        <h2>Security</h2>
        <p>
          Data is encrypted in transit. Photographs are served only through an
          authorising endpoint that checks your session and your business — an
          image URL cannot be guessed or shared out of context. Sessions are
          opaque tokens stored as hashes, so a stolen database row cannot be
          replayed as a login.
        </p>

        <h2>Retention</h2>
        <p>
          Records are kept for as long as your account exists. If you delete your
          account, business data is removed within thirty days, except where we
          are required to keep financial records for tax purposes.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about any of this go to{" "}
          <a href="mailto:privacy@fitbyyou.com">privacy@fitbyyou.com</a>.
        </p>
      </Prose>
    </ContentPage>
  );
}
