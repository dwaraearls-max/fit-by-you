import type { Metadata } from "next";

import { ContentPage, Prose } from "@/components/marketing/content-page";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Help build the operating system for independent fashion professionals across Africa.",
};

const ROLES = [
  {
    title: "Product Engineer",
    location: "Accra · Hybrid",
    body: "TypeScript, React and Postgres. You will own features end to end, from the workshop visit that inspired them to the migration that ships them.",
  },
  {
    title: "Product Designer",
    location: "Accra · Hybrid",
    body: "Interfaces that a tailor can use without a tutorial, held to the standard of a luxury fashion house rather than an admin panel.",
  },
  {
    title: "Customer Success (Ghana)",
    location: "Accra · On-site",
    body: "Spend your week in workshops. Onboard fashion businesses, watch them work, and bring back what the product is getting wrong.",
  },
] as const;

export default function CareersPage() {
  return (
    <ContentPage
      eyebrow="Careers"
      title="Build for people who make things by hand."
      intro="A small team in Accra building software for an industry that software has mostly ignored."
      cta={false}
    >
      <Prose>
        <h2>How we work</h2>
        <p>
          We spend time in workshops. Nearly every good decision in this product
          came from watching someone measure a customer, not from a meeting about
          measuring customers.
        </p>
        <p>
          We build for a phone on a workbench with one bar of signal, and we treat
          performance and clarity as features rather than polish.
        </p>
      </Prose>

      <div className="mt-10 space-y-4">
        {ROLES.map((role) => (
          <div
            key={role.title}
            className="rounded-xl border border-border bg-surface p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {role.title}
              </h3>
              <span className="text-xs text-muted-foreground">{role.location}</span>
            </div>
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {role.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <Prose>
          <p>
            Nothing above quite fitting? Write to{" "}
            <a href="mailto:careers@fitbyyou.com">careers@fitbyyou.com</a> and tell
            us what you would build.
          </p>
        </Prose>
      </div>
    </ContentPage>
  );
}
