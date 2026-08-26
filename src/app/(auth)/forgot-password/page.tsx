import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requestPasswordResetAction } from "@/server/auth-actions";
import { ActionForm, FieldError } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata: Metadata = {
  title: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <Link
        href="/login"
        className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to sign in
      </Link>

      <h1 className="display text-[2rem] leading-tight">Reset your password.</h1>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
        Enter the email you signed up with and we will send you a link to choose a
        new password.
      </p>

      <ActionForm action={requestPasswordResetAction} className="mt-8 space-y-5">
        <Field label="Email" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@yourbusiness.com"
            required
            autoFocus
          />
          <FieldError name="email" />
        </Field>

        <SubmitButton size="lg" className="w-full" pendingLabel="Sending…">
          Send reset link
        </SubmitButton>
      </ActionForm>

      <p className="mt-8 text-xs leading-relaxed text-subtle-foreground">
        Email delivery is not configured in this environment. The reset link is
        written to the server console so the flow can be completed end to end.
      </p>
    </>
  );
}
