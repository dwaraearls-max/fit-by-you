import type { Metadata } from "next";

import { ContentPage, Prose } from "@/components/marketing/content-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms of service for using FIT BY YOU.",
};

export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Terms of service."
      intro="Plain terms, written to be read rather than skipped."
      cta={false}
    >
      <Prose>
        <p className="text-xs text-subtle-foreground">
          Last updated: 26 August 2026
        </p>

        <h2>Your account</h2>
        <p>
          You are responsible for what happens under your sign-in, and for the
          staff accounts you create. Give each person their own account rather
          than sharing one — roles and the audit log are only meaningful if you
          do.
        </p>

        <h2>Your data</h2>
        <p>
          Everything you put into FIT BY YOU remains yours. You grant us only the
          permission needed to store it, display it back to you, and back it up.
          You can export it or delete it at any time.
        </p>
        <p>
          You are responsible for having the right to hold the customer
          information you enter, including photographs of people, and for handling
          it lawfully in your jurisdiction.
        </p>

        <h2>Plans and payment</h2>
        <p>
          Starter is free. Paid plans are billed monthly or yearly in advance. If
          a payment fails, your account moves to a past-due state and then back to
          Starter limits — your records are never deleted for non-payment.
        </p>
        <p>
          You can cancel at any time. Cancelling stops future billing; we do not
          refund the portion of a period already elapsed.
        </p>

        <h2>Acceptable use</h2>
        <ul>
          <li>
            Do not use FIT BY YOU to store information you have no right to hold.
          </li>
          <li>
            Do not attempt to access another business&apos;s data, or to probe,
            scan or overload the service.
          </li>
          <li>
            Do not resell access to the platform as though it were your own
            product.
          </li>
        </ul>

        <h2>Availability</h2>
        <p>
          We work to keep the service available and backed up, but it is provided
          without a guarantee of uninterrupted operation. Our liability is
          limited to the amount you have paid us in the previous twelve months.
        </p>

        <h2>Changes</h2>
        <p>
          If we change these terms materially, we will tell you inside the product
          before the change takes effect, and you may cancel if you disagree.
        </p>

        <h2>Contact</h2>
        <p>
          Anything unclear goes to{" "}
          <a href="mailto:legal@fitbyyou.com">legal@fitbyyou.com</a>.
        </p>
      </Prose>
    </ContentPage>
  );
}
