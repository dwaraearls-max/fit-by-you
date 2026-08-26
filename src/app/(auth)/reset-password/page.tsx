import type { Metadata } from "next";
import Link from "next/link";

import { resetPasswordAction } from "@/server/auth-actions";
import { ActionForm, FieldError } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Choose a new password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <EmptyState
        title="This link is incomplete."
        message="Reset links expire after an hour. Request a fresh one and try again."
        action={
          <Button asChild>
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <h1 className="display text-[2rem] leading-tight">Choose a new password.</h1>
      <p className="mt-2.5 text-sm text-muted-foreground">
        Once you save it, every other device will be signed out.
      </p>

      <ActionForm action={resetPasswordAction} className="mt-8 space-y-5">
        <input type="hidden" name="token" value={token} />

        <Field
          label="New password"
          htmlFor="password"
          hint="At least 8 characters."
          required
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            autoFocus
          />
          <FieldError name="password" />
        </Field>

        <Field label="Confirm new password" htmlFor="confirm" required>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <FieldError name="confirm" />
        </Field>

        <SubmitButton size="lg" className="w-full" pendingLabel="Saving…">
          Save new password
        </SubmitButton>
      </ActionForm>
    </>
  );
}
