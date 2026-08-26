import "server-only";

import { z } from "zod";

import { ForbiddenError } from "@/lib/permissions";
import { TenantScopeError } from "@/lib/db";

/**
 * The shape every Server Action returns, consumed by `useActionState` on the
 * client. Keeping one shape means no form has to invent its own error plumbing.
 */
export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Echoed back so a rejected form can repopulate without a round trip. */
  values?: Record<string, string>;
  /** Client navigates here after a successful auth action sets the session cookie. */
  redirectTo?: string;
} | null;

export const EMPTY_FORM_STATE: FormState = null;

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    // First message per field wins; a stack of messages under one input reads
    // as noise.
    out[key] ??= issue.message;
  }
  return out;
}

export function fail(message: string, fieldErrors?: Record<string, string>): FormState {
  return { ok: false, message, fieldErrors };
}

export function succeed(message?: string, redirectTo?: string): FormState {
  return { ok: true, message, redirectTo };
}

/**
 * Parses `FormData` against a schema, returning either the typed value or a
 * ready-to-render error state.
 */
export function parseForm<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): { ok: true; data: z.output<T> } | { ok: false; state: FormState } {
  const raw: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    // Repeated keys (multi-select pills, checkbox groups) collect into arrays.
    if (key in raw) {
      const existing = raw[key];
      raw[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      raw[key] = value;
    }
  }

  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };

  return {
    ok: false,
    state: {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(result.error),
    },
  };
}

/** Collects every value for a repeated form field, e.g. multi-select pills. */
export function getAll(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string" && value !== "");
}

export function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getOptionalString(formData: FormData, key: string): string | null {
  const value = getString(formData, key);
  return value === "" ? null : value;
}

/**
 * Wraps an action body so authorisation failures and tenant-guard trips become
 * a message in the form rather than an unhandled server error. `redirect()`
 * works by throwing, so its signal is deliberately re-thrown untouched.
 */
export async function guarded(
  body: () => Promise<FormState>,
): Promise<FormState> {
  try {
    return await body();
  } catch (error) {
    if (isRedirectError(error)) throw error;

    if (error instanceof ForbiddenError) {
      return fail(error.message);
    }

    if (error instanceof TenantScopeError) {
      // A programming error, not a user error. Surface it loudly in dev.
      console.error(error);
      return fail("Something went wrong. This has been logged.");
    }

    console.error(error);
    return fail("Something went wrong. Please try again.");
  }
}

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    ((error as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
      (error as { digest: string }).digest === "NEXT_NOT_FOUND")
  );
}

// ---------------------------------------------------------------------------
// Shared field schemas
// ---------------------------------------------------------------------------

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(254)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address.")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(200, "That password is too long.");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter a name.")
  .max(120, "That name is too long.");

export const phoneSchema = z
  .string()
  .trim()
  .min(9, "Enter a valid phone number.")
  .max(24, "Enter a valid phone number.")
  .regex(/^[\d+\s()-]+$/, "Phone numbers can only contain digits and + ( ) -");

/** Accepts "", "1200", "1,200.50" and yields minor units. */
export const moneySchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[^\d.]/g, ""))
  .refine((value) => value === "" || Number.isFinite(Number.parseFloat(value)), {
    message: "Enter a valid amount.",
  })
  .transform((value) =>
    value === "" ? 0 : Math.round(Number.parseFloat(value) * 100),
  )
  .refine((value) => value >= 0, "Amounts cannot be negative.");

export const optionalDateSchema = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .refine(
    (value) => value === null || !Number.isNaN(new Date(value).getTime()),
    "Enter a valid date.",
  )
  .transform((value) => (value === null ? null : new Date(value)));

export const requiredDateSchema = z
  .string()
  .trim()
  .min(1, "Pick a date.")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date.")
  .transform((value) => new Date(value));
