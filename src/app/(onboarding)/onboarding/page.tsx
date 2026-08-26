import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { optionalTenant } from "@/lib/tenant";
import {
  BUSINESS_TYPES,
  BUSINESS_TYPE_META,
  GENDERS,
  GENDER_META,
  OUTFIT_TYPES,
  OUTFIT_TYPE_META,
  labelFor,
} from "@/lib/domain";
import {
  addFirstCustomerAction,
  createBusinessAction,
  createFirstOrderAction,
  finishOnboardingAction,
  skipOnboardingStepAction,
} from "@/server/onboarding-actions";
import { ActionForm, FieldError } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Logo } from "@/components/ui/logo";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Set up your workspace",
  robots: { index: false, follow: false },
};

const STEPS = [
  { number: 1, label: "Your business" },
  { number: 2, label: "First customer" },
  { number: 3, label: "First order" },
  { number: 4, label: "Ready" },
] as const;

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = await optionalTenant();
  const params = await searchParams;

  // The furthest step the account has actually reached. The URL can move
  // backwards through completed steps but never skip ahead of the data.
  const reached = tenant ? tenant.business.onboardingStep + 1 : 1;
  if (tenant && tenant.business.onboardedAt) redirect("/app");

  const requested = Number.parseInt(params.step ?? "", 10);
  const step = Math.min(
    Number.isFinite(requested) && requested >= 1 ? requested : reached,
    Math.min(reached, 4),
  );

  const firstCustomer = tenant
    ? await prisma.customer.findFirst({
        where: { businessId: tenant.businessId },
        orderBy: { createdAt: "desc" },
        select: { id: true, fullName: true, firstName: true },
      })
    : null;

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-12 sm:py-16">
      <header className="flex items-center justify-between">
        <Logo />
        <p className="tabular text-xs text-subtle-foreground">
          Step {step} of 4
        </p>
      </header>

      {/* Progress rail */}
      <ol className="mt-8 flex items-center gap-2" aria-label="Setup progress">
        {STEPS.map((entry) => {
          const done = entry.number < step;
          const current = entry.number === step;
          return (
            <li key={entry.number} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  done || current ? "bg-ink-950" : "bg-border",
                )}
              />
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs font-medium text-muted-foreground">
        {STEPS[step - 1]?.label}
      </p>

      <div className="mt-9">
        {step === 1 ? <StepBusiness /> : null}
        {step === 2 ? <StepCustomer /> : null}
        {step === 3 ? (
          <StepOrder
            customer={firstCustomer}
            businessName={tenant?.business.name ?? "your business"}
          />
        ) : null}
        {step === 4 ? <StepDone businessName={tenant?.business.name ?? ""} /> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function StepBusiness() {
  return (
    <>
      <h1 className="display text-[2rem] leading-tight">
        Tell us about your business.
      </h1>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
        This is what your customers will see on receipts and reminders. You can
        change any of it later.
      </p>

      <ActionForm action={createBusinessAction} className="mt-8 space-y-5">
        <Field label="Business name" htmlFor="name" required>
          <Input
            id="name"
            name="name"
            placeholder="Adjoa Couture"
            required
            autoFocus
          />
          <FieldError name="name" />
        </Field>

        <Field label="What kind of business is it?" htmlFor="type" required>
          <Select id="type" name="type" defaultValue="TAILOR" required>
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {labelFor(BUSINESS_TYPE_META, type)}
              </option>
            ))}
          </Select>
          <FieldError name="type" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Town or city" htmlFor="city" required>
            <Input id="city" name="city" placeholder="Accra" required />
            <FieldError name="city" />
          </Field>

          <Field
            label="Phone"
            htmlFor="phone"
            hint="Used for WhatsApp messages."
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="024 123 4567"
            />
            <FieldError name="phone" />
          </Field>
        </div>

        <SubmitButton size="lg" className="w-full" pendingLabel="Creating…">
          Continue
          <ArrowRight />
        </SubmitButton>
      </ActionForm>
    </>
  );
}

// ---------------------------------------------------------------------------

function StepCustomer() {
  return (
    <>
      <h1 className="display text-[2rem] leading-tight">
        Add your first customer.
      </h1>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
        Start with someone you measured recently. Their measurements will be kept
        forever, and you will never have to ask for them again.
      </p>

      <ActionForm action={addFirstCustomerAction} className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" required>
            <Input
              id="firstName"
              name="firstName"
              placeholder="Amanda"
              required
              autoFocus
            />
            <FieldError name="firstName" />
          </Field>

          <Field label="Last name" htmlFor="lastName">
            <Input id="lastName" name="lastName" placeholder="Mensah" />
            <FieldError name="lastName" />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" htmlFor="phone" required>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="024 488 1420"
              required
            />
            <FieldError name="phone" />
          </Field>

          <Field label="Gender" htmlFor="gender">
            <Select id="gender" name="gender" defaultValue="FEMALE">
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {labelFor(GENDER_META, gender)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <fieldset className="rounded-xl border border-border bg-surface p-4">
          <legend className="eyebrow px-1.5 text-subtle-foreground">
            Measurements — inches, optional
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {(
              [
                { key: "bust", label: "Bust", placeholder: "36" },
                { key: "waist", label: "Waist", placeholder: "32" },
                { key: "hip", label: "Hip", placeholder: "40" },
              ] as const
            ).map((entry) => (
              <Field key={entry.key} label={entry.label} htmlFor={entry.key}>
                <Input
                  id={entry.key}
                  name={entry.key}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder={entry.placeholder}
                />
              </Field>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            You can record the full set of measurements — shoulder, sleeve, thigh
            and the rest — from their profile in a moment.
          </p>
        </fieldset>

        <SubmitButton size="lg" className="w-full" pendingLabel="Saving…">
          Continue
          <ArrowRight />
        </SubmitButton>
      </ActionForm>
    </>
  );
}

// ---------------------------------------------------------------------------

function StepOrder({
  customer,
  businessName,
}: {
  customer: { id: string; fullName: string; firstName: string } | null;
  businessName: string;
}) {
  if (!customer) {
    return (
      <>
        <h1 className="display text-[2rem] leading-tight">
          Create your first order.
        </h1>
        <p className="mt-2.5 text-sm text-muted-foreground">
          Add a customer first and this step will be waiting for you.
        </p>
        <Button asChild className="mt-6">
          <Link href="/onboarding?step=2">Add a customer</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <h1 className="display text-[2rem] leading-tight">
        Create your first order.
      </h1>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
        What are you making for {customer.firstName}? {businessName} will track it
        from cutting through to delivery.
      </p>

      <ActionForm action={createFirstOrderAction} className="mt-8 space-y-5">
        <input type="hidden" name="customerId" value={customer.id} />

        <Field label="Outfit" htmlFor="title" required>
          <Input
            id="title"
            name="title"
            placeholder="Custom African Print Dress"
            required
            autoFocus
          />
          <FieldError name="title" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Type" htmlFor="outfitType">
            <Select id="outfitType" name="outfitType" defaultValue="DRESS">
              {OUTFIT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {labelFor(OUTFIT_TYPE_META, type)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Price" htmlFor="price" hint="In cedis." required>
            <Input
              id="price"
              name="price"
              inputMode="decimal"
              placeholder="1200"
              required
            />
            <FieldError name="price" />
          </Field>
        </div>

        <Field label="Delivery date" htmlFor="deliveryDate">
          <Input id="deliveryDate" name="deliveryDate" type="date" />
          <FieldError name="deliveryDate" />
        </Field>

        <SubmitButton size="lg" className="w-full" pendingLabel="Creating…">
          Continue
          <ArrowRight />
        </SubmitButton>
      </ActionForm>

      <form action={skipOnboardingStepAction} className="mt-4">
        <input type="hidden" name="step" value="3" />
        <button
          type="submit"
          className="w-full text-center text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Skip for now
        </button>
      </form>
    </>
  );
}

// ---------------------------------------------------------------------------

function StepDone({ businessName }: { businessName: string }) {
  return (
    <div className="text-center">
      <span className="inline-flex items-center justify-center rounded-full border border-accent-border bg-accent-soft p-4">
        <Sparkles
          className="size-6 text-champagne-700 dark:text-champagne-300"
          aria-hidden
        />
      </span>

      <h1 className="display mt-7 text-[2.25rem] leading-tight">
        You&apos;re ready.
      </h1>
      <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
        Your fashion business now has a memory.
      </p>

      <ul className="mx-auto mt-9 max-w-sm space-y-3 text-left">
        {[
          "Every measurement you take is kept, dated and attributed.",
          "Every order moves through cutting, sewing, fitting and delivery.",
          "Every cedi paid and outstanding is recorded against the customer.",
        ].map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      <form action={finishOnboardingAction} className="mt-10">
        <SubmitButton size="xl" className="w-full" pendingLabel="Opening…">
          Open {businessName || "my dashboard"}
          <ArrowRight />
        </SubmitButton>
      </form>
    </div>
  );
}
