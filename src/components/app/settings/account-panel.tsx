"use client";

import * as React from "react";
import { LogOut, Monitor, Smartphone, TriangleAlert } from "lucide-react";

import {
  changePasswordAction,
  deleteBusinessAction,
  revokeSessionAction,
  signOutEverywhereAction,
  updateProfileAction,
} from "@/server/settings-actions";
import { timeAgo } from "@/lib/dates";
import { pluralise } from "@/lib/utils";
import { ActionForm, FieldError } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProfileForm({
  values,
}: {
  values: { name: string; email: string; phone: string | null };
}) {
  return (
    <ActionForm action={updateProfileAction} bannerPosition="bottom">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Your name"
          htmlFor="profile-name"
          required
          error={<FieldError name="name" />}
        >
          <Input
            id="profile-name"
            name="name"
            defaultValue={values.name}
            autoComplete="name"
            required
          />
        </Field>

        <Field label="Your phone" htmlFor="profile-phone">
          <Input
            id="profile-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={values.phone ?? ""}
            autoComplete="tel"
          />
        </Field>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        You sign in with <span className="font-medium">{values.email}</span>.
        Changing your email is not available yet.
      </p>

      <div className="mt-5 flex justify-end">
        <SubmitButton size="sm">Save</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PasswordForm() {
  return (
    <ActionForm action={changePasswordAction} bannerPosition="bottom">
      <div className="space-y-5">
        <Field
          label="Current password"
          htmlFor="current-password"
          required
          error={<FieldError name="currentPassword" />}
        >
          <Input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="New password"
            htmlFor="new-password"
            hint="At least 8 characters."
            required
            error={<FieldError name="newPassword" />}
          >
            <Input
              id="new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </Field>

          <Field
            label="Type it again"
            htmlFor="confirm-password"
            required
            error={<FieldError name="confirmPassword" />}
          >
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox name="signOutEverywhere" value="1" className="mt-0.5" />
          <span className="text-[0.8125rem] leading-relaxed text-muted-foreground">
            Sign me out on every device, including this one. Do this if you think
            someone else knows your password.
          </span>
        </label>

        <div className="flex justify-end">
          <SubmitButton size="sm" pendingLabel="Changing…">
            Change password
          </SubmitButton>
        </div>
      </div>
    </ActionForm>
  );
}

export type SessionRow = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: Date;
  isCurrent: boolean;
};

export function SessionList({ sessions }: { sessions: SessionRow[] }) {
  return (
    <div>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {sessions.map((session) => {
          const phone = /mobile|android|iphone/i.test(session.userAgent ?? "");
          const Icon = phone ? Smartphone : Monitor;

          return (
            <li key={session.id} className="flex items-center gap-3.5 px-4 py-3.5">
              <Icon className="size-4 shrink-0 text-subtle-foreground" aria-hidden />

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-foreground">
                  {describeDevice(session.userAgent)}
                  {session.isCurrent ? (
                    <Badge tone="positive">This device</Badge>
                  ) : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {session.ipAddress ? `${session.ipAddress} · ` : ""}
                  last used {timeAgo(session.lastUsedAt)}
                </p>
              </div>

              {session.isCurrent ? null : (
                <form action={revokeSessionAction}>
                  <input type="hidden" name="id" value={session.id} />
                  <Button type="submit" variant="ghost" size="xs">
                    Sign out
                  </Button>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      <form action={signOutEverywhereAction} className="mt-4 flex justify-end">
        <Button type="submit" variant="outline" size="sm">
          <LogOut />
          Sign out everywhere
        </Button>
      </form>
    </div>
  );
}

function describeDevice(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  const browser = /Edg/.test(userAgent)
    ? "Edge"
    : /Chrome/.test(userAgent)
      ? "Chrome"
      : /Safari/.test(userAgent)
        ? "Safari"
        : /Firefox/.test(userAgent)
          ? "Firefox"
          : "Browser";
  const platform = /Android/.test(userAgent)
    ? "Android"
    : /iPhone|iPad/.test(userAgent)
      ? "iOS"
      : /Mac OS/.test(userAgent)
        ? "Mac"
        : /Windows/.test(userAgent)
          ? "Windows"
          : "device";
  return `${browser} on ${platform}`;
}

export function DeleteBusinessPanel({
  businessName,
  impact,
}: {
  businessName: string;
  impact: {
    customers: number;
    orders: number;
    payments: number;
    photos: number;
    measurementSets: number;
  };
}) {
  const [open, setOpen] = React.useState(false);

  const lines = [
    pluralise(impact.customers, "customer"),
    pluralise(impact.measurementSets, "measurement session"),
    pluralise(impact.orders, "order"),
    pluralise(impact.payments, "payment record"),
    pluralise(impact.photos, "photo"),
  ];

  return (
    <div className="rounded-xl border border-critical/30 bg-critical-soft/40 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-critical" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-critical">
            Delete {businessName}
          </h3>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
            This removes everything, permanently and immediately. There is no
            undo and no backup we can restore for you. Export your data first if
            there is any chance you will want it.
          </p>

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {lines.map((line) => (
              <li key={line} className="text-xs text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>

          <Button
            variant="outline"
            size="sm"
            className="mt-4 border-critical/40 text-critical hover:bg-critical-soft"
            onClick={() => setOpen(true)}
          >
            Delete this business
          </Button>
        </div>
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${businessName}?`}
        description="Everything above goes with it. Type the business name and your password to confirm."
        size="sm"
      >
        <ActionForm action={deleteBusinessAction} className="space-y-5">
          <Field
            label={`Type "${businessName}"`}
            htmlFor="confirm-name"
            required
            error={<FieldError name="confirmName" />}
          >
            <Input
              id="confirm-name"
              name="confirmName"
              autoComplete="off"
              required
            />
          </Field>

          <Field
            label="Your password"
            htmlFor="delete-password"
            required
            error={<FieldError name="password" />}
          >
            <Input
              id="delete-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Keep my business
            </Button>
            <SubmitButton variant="danger" pendingLabel="Deleting…">
              Delete permanently
            </SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </div>
  );
}
