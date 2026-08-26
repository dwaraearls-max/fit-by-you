import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { getSession } from "@/lib/auth";
import { signInAction } from "@/server/auth-actions";
import { ActionForm, FieldError } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your FIT BY YOU workspace.",
};

const LOGIN_NOTICE: Record<string, string> = {
  reset: "Your password has been changed. Sign in with it now.",
  "password-changed": "Your password has been changed. Sign in with it now.",
  "signed-out-everywhere":
    "You have been signed out of every device. Sign in again when you are ready.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string; reason?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/app");

  const params = await searchParams;
  const notice =
    (params.reset ? LOGIN_NOTICE.reset : null) ??
    (params.reason ? LOGIN_NOTICE[params.reason] : null) ??
    null;

  return (
    <>
      <h1 className="display text-[2rem] leading-tight">Welcome back.</h1>
      <p className="mt-2.5 text-sm text-muted-foreground">
        Your customers are waiting where you left them.
      </p>

      {notice ? (
        <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-positive-soft px-3.5 py-3 text-[0.8125rem] text-positive">
          <CheckCircle2 className="mt-px size-4 shrink-0" aria-hidden />
          <span>{notice}</span>
        </div>
      ) : null}

      <ActionForm action={signInAction} className="mt-8 space-y-5">
        {params.next ? (
          <input type="hidden" name="next" value={params.next} />
        ) : null}

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

        <Field label="Password" htmlFor="password" required>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
          <FieldError name="password" />
        </Field>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <SubmitButton size="lg" className="w-full" pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
      </ActionForm>

      <p className="mt-8 text-sm text-muted-foreground">
        New to FIT BY YOU?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Start free
        </Link>
      </p>

      <div className="mt-12 rounded-lg border border-border bg-surface-muted/50 p-4">
        <p className="eyebrow text-subtle-foreground">Demo accounts</p>
        <dl className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex justify-between gap-3">
            <dt className="truncate">ama@adjoacouture.com</dt>
            <dd className="shrink-0 font-medium text-foreground">Owner</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="truncate">kwame@adjoacouture.com</dt>
            <dd className="shrink-0 font-medium text-foreground">Tailor</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="truncate">nuru@nurubridal.com</dt>
            <dd className="shrink-0 font-medium text-foreground">Other business</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-subtle-foreground">
          Password for all three:{" "}
          <span className="font-medium text-foreground">fitbyyou123</span>
        </p>
      </div>
    </>
  );
}
