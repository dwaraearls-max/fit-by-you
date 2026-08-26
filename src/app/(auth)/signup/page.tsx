import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";

import { getSession } from "@/lib/auth";
import { signUpAction } from "@/server/auth-actions";
import { ActionForm, FieldError } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata: Metadata = {
  title: "Start free",
  description:
    "Create your FIT BY YOU workspace. No card required — start with your first customer.",
};

const REASSURANCES = [
  "No card required",
  "Free forever on Starter",
  "Set up in under two minutes",
];

export default async function SignUpPage() {
  const session = await getSession();
  if (session) redirect("/app");

  return (
    <>
      <h1 className="display text-[2rem] leading-tight">Start free.</h1>
      <p className="mt-2.5 text-sm text-muted-foreground">
        Give your fashion business a memory. It takes about two minutes.
      </p>

      <ActionForm action={signUpAction} className="mt-8 space-y-5">
        <Field label="Your name" htmlFor="name" required>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Ama Boateng"
            required
            autoFocus
          />
          <FieldError name="name" />
        </Field>

        <Field label="Email" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@yourbusiness.com"
            required
          />
          <FieldError name="email" />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          hint="At least 8 characters."
          required
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            required
          />
          <FieldError name="password" />
        </Field>

        <SubmitButton size="lg" className="w-full" pendingLabel="Creating your workspace…">
          Create my workspace
        </SubmitButton>
      </ActionForm>

      <ul className="mt-7 space-y-2">
        {REASSURANCES.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <Check className="size-3.5 shrink-0 text-positive" aria-hidden />
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>

      <p className="mt-6 text-xs leading-relaxed text-subtle-foreground">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </>
  );
}
