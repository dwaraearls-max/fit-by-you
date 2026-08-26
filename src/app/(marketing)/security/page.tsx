import type { Metadata } from "next";

import { ContentPage, Prose } from "@/components/marketing/content-page";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How FIT BY YOU isolates each business's data, protects sessions, and controls who can see what.",
};

export default function SecurityPage() {
  return (
    <ContentPage
      eyebrow="Security"
      title="One business can never see another."
      intro="Customer measurements are commercially sensitive. Isolation is enforced in the data layer, not by remembering to add a filter."
      cta={false}
    >
      <Prose>
        <h2>Tenant isolation</h2>
        <p>
          Every record that belongs to a business carries that business&apos;s
          identifier. No page, action or endpoint reaches the database directly —
          each one first resolves the session to a membership, which produces the
          single identifier every query is then constrained by.
        </p>
        <p>
          On top of that, a guard in the data layer inspects every query against
          business-owned tables and refuses any that is not scoped to a business.
          A developer who forgets a filter gets a loud failure rather than a
          silent leak.
        </p>

        <h2>Sessions</h2>
        <p>
          Sessions are long random tokens. Only a SHA-256 digest is stored, so a
          leaked database row cannot be replayed as a cookie, and the cookie
          itself is signed so a forged one never reaches the database. Cookies are
          HTTP-only, same-site, and secure in production.
        </p>
        <p>
          Changing a password revokes every session on every device. You can see
          and revoke active sessions from Settings.
        </p>

        <h2>Roles</h2>
        <p>
          Access is capability-based rather than a single admin flag. An Assistant
          can read customers and add photographs. A Tailor can take measurements,
          move orders along and record payments. A Manager can change settings and
          see reports. Only an Owner can manage the team or billing.
        </p>

        <h2>Photographs</h2>
        <p>
          Uploaded images are never served from a public path. Every request goes
          through an endpoint that checks your session and confirms the file
          belongs to your business, so an image URL cannot be guessed, shared or
          scraped.
        </p>

        <h2>Passwords</h2>
        <p>
          Hashed with bcrypt at a work factor of twelve. Never logged, never
          recoverable, never emailed. Two-factor authentication is available on
          your account.
        </p>

        <h2>Audit trail</h2>
        <p>
          Customer creation, measurement sessions, order status changes, payments
          and settings changes are all recorded with who did them and when. The
          log is visible to Owners and Managers under Settings.
        </p>

        <h2>Your data, on request</h2>
        <p>
          A full export of your business — customers, measurements, orders,
          payments — is available at any time from Settings. Account deletion
          removes your records permanently.
        </p>

        <h2>Reporting a vulnerability</h2>
        <p>
          If you find something, please tell us at{" "}
          <a href="mailto:security@fitbyyou.com">security@fitbyyou.com</a> before
          disclosing it publicly. We will acknowledge within two working days.
        </p>
      </Prose>
    </ContentPage>
  );
}
