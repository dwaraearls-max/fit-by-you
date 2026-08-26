"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "./button";

/**
 * Knows on its own whether the enclosing form is submitting, so no page needs
 * to thread a `pending` boolean through props.
 */
export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
