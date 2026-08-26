/** Client-safe form state shape shared by Server Actions and `useActionState`. */
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
