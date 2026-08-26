"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import type { FormState } from "@/lib/form-state";
import { cn } from "@/lib/utils";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const FormStateContext = React.createContext<FormState>(null);

export function useFormState() {
  return React.useContext(FormStateContext);
}

/**
 * Thin wrapper around `useActionState` so every form in the product renders
 * errors and success messages the same way.
 */
export function ActionForm({
  action,
  children,
  className,
  id,
  bannerPosition = "top",
  followRedirect = false,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** Inline forms inside a card read better with the banner underneath. */
  bannerPosition?: "top" | "bottom" | "none";
  /** When true, navigates client-side if the action returns `redirectTo`. */
  followRedirect?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);

  React.useEffect(() => {
    if (!followRedirect || !state?.ok || !state.redirectTo) return;
    // Full navigation so the new session cookie is always sent on the next
    // request. Soft client routing after auth often lands on a blank shell.
    window.location.assign(state.redirectTo);
  }, [followRedirect, state]);

  return (
    <FormStateContext.Provider value={state}>
      <form id={id} action={formAction} className={className} noValidate>
        {bannerPosition === "top" ? <FormBanner state={state} /> : null}
        {children}
        {bannerPosition === "bottom" ? (
          <FormBanner state={state} className="mt-4 mb-0" />
        ) : null}
      </form>
    </FormStateContext.Provider>
  );
}

export function FormBanner({
  state,
  className,
}: {
  state: FormState;
  className?: string;
}) {
  if (!state?.message) return null;

  const good = state.ok === true;
  const Icon = good ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={good ? "status" : "alert"}
      className={cn(
        "mb-5 flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[0.8125rem] leading-relaxed",
        good
          ? "border-transparent bg-positive-soft text-positive"
          : "border-transparent bg-critical-soft text-critical",
        className,
      )}
      style={{ animation: "fade-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <Icon className="mt-px size-4 shrink-0" aria-hidden />
      <span>{state.message}</span>
    </div>
  );
}

/** Reads the field error for a given input out of the enclosing form's state. */
export function FieldError({ name }: { name: string }) {
  const state = useFormState();
  const message = state?.fieldErrors?.[name];
  if (!message) return null;
  return <p className="text-xs font-medium text-critical">{message}</p>;
}
