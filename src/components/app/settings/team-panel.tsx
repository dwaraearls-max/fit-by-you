"use client";

import * as React from "react";
import { useActionState } from "react";
import { MoreHorizontal, UserPlus } from "lucide-react";

import {
  changeMemberRoleAction,
  inviteMemberAction,
  setMemberStatusAction,
} from "@/server/settings-actions";
import {
  MEMBERSHIP_STATUS_META,
  ROLES,
  ROLE_META,
  type MembershipStatus,
  type Role,
} from "@/lib/domain";
import { canManageRole } from "@/lib/permissions";
import { timeAgo } from "@/lib/dates";
import { ActionForm, FieldError } from "@/components/ui/action-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { ChoiceCard, Field, Input, Select } from "@/components/ui/field";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { SubmitButton } from "@/components/ui/submit-button";

export type TeamMember = {
  membershipId: string;
  name: string;
  email: string;
  role: Role;
  status: MembershipStatus;
  lastLoginAt: Date | null;
  isYou: boolean;
};

export function TeamPanel({
  members,
  actorRole,
  canWrite,
}: {
  members: TeamMember[];
  actorRole: Role;
  canWrite: boolean;
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
          Everyone here can see your customers. Give people the smallest role
          that lets them do their job.
        </p>
        {canWrite ? <InviteButton actorRole={actorRole} /> : null}
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {members.map((member) => (
          <li
            key={member.membershipId}
            className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:gap-4"
          >
            <Avatar name={member.name} size="sm" />

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                {member.name}
                {member.isYou ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    (you)
                  </span>
                ) : null}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {member.email}
                {member.lastLoginAt
                  ? ` · last seen ${timeAgo(member.lastLoginAt)}`
                  : " · has not signed in yet"}
              </p>
            </div>

            <Badge tone={MEMBERSHIP_STATUS_META[member.status].tone}>
              {MEMBERSHIP_STATUS_META[member.status].label}
            </Badge>

            {canWrite &&
            !member.isYou &&
            canManageRole(actorRole, member.role) ? (
              <div className="flex items-center gap-1.5">
                <RoleSelect
                  member={member}
                  assignable={ROLES.filter((role) =>
                    canManageRole(actorRole, role),
                  )}
                />
                <Menu>
                  <MenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`More options for ${member.name}`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </MenuTrigger>
                  <MenuContent>
                    <form action={setMemberStatusAction}>
                      <input
                        type="hidden"
                        name="membershipId"
                        value={member.membershipId}
                      />
                      <input
                        type="hidden"
                        name="status"
                        value={member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"}
                      />
                      <MenuItem
                        asChild
                        tone={member.status === "ACTIVE" ? "danger" : "default"}
                      >
                        <button type="submit" className="w-full text-left">
                          {member.status === "ACTIVE"
                            ? "Suspend access"
                            : "Restore access"}
                        </button>
                      </MenuItem>
                    </form>
                  </MenuContent>
                </Menu>
              </div>
            ) : (
              <Badge tone={ROLE_META[member.role].tone}>
                {ROLE_META[member.role].label}
              </Badge>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-lg border border-border bg-surface-muted/40 px-4 py-3.5">
        <p className="text-[0.6875rem] font-semibold tracking-[0.08em] text-subtle-foreground uppercase">
          What each role can do
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {ROLES.map((role) => (
            <li key={role} className="flex gap-2 text-xs">
              <span className="w-20 shrink-0 font-medium text-foreground">
                {ROLE_META[role].label}
              </span>
              <span className="text-muted-foreground">
                {ROLE_META[role].hint}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Changing a role submits on change: a Save button beside a dropdown inside a
 * list row is one click more than this deserves.
 */
function RoleSelect({
  member,
  assignable,
}: {
  member: TeamMember;
  assignable: Role[];
}) {
  const [state, formAction] = useActionState(changeMemberRoleAction, null);
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="membershipId" value={member.membershipId} />
      <Select
        name="role"
        defaultValue={member.role}
        aria-label={`Role for ${member.name}`}
        className="h-9 w-[8.5rem] text-[0.8125rem]"
        onChange={() => formRef.current?.requestSubmit()}
      >
        {assignable.map((role) => (
          <option key={role} value={role}>
            {ROLE_META[role].label}
          </option>
        ))}
      </Select>
      {state?.ok === false && state.message ? (
        <span className="max-w-44 text-xs leading-tight text-critical">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

function InviteButton({ actorRole }: { actorRole: Role }) {
  const [open, setOpen] = React.useState(false);
  const assignable = ROLES.filter((role) => canManageRole(actorRole, role));

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <UserPlus />
        Add someone
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add someone to the team"
        description="They can sign in straight away with the password you set here. Ask them to change it once they are in."
      >
        <ActionForm action={inviteMemberAction} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Their name"
              htmlFor="invite-name"
              required
              error={<FieldError name="name" />}
            >
              <Input id="invite-name" name="name" autoComplete="off" required />
            </Field>

            <Field
              label="Their email"
              htmlFor="invite-email"
              required
              error={<FieldError name="email" />}
            >
              <Input
                id="invite-email"
                name="email"
                type="email"
                autoComplete="off"
                required
              />
            </Field>
          </div>

          <Field
            label="Starting password"
            htmlFor="invite-password"
            hint="At least 8 characters. Share it with them once, in person."
            required
            error={<FieldError name="password" />}
          >
            <Input
              id="invite-password"
              name="password"
              type="text"
              autoComplete="off"
              required
            />
          </Field>

          <Field label="What they can do" required error={<FieldError name="role" />}>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {assignable.map((role) => (
                <ChoiceCard
                  key={role}
                  name="role"
                  value={role}
                  label={ROLE_META[role].label}
                  description={ROLE_META[role].hint}
                  defaultChecked={
                    assignable.includes("TAILOR")
                      ? role === "TAILOR"
                      : role === assignable[0]
                  }
                />
              ))}
            </div>
          </Field>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Adding…">Add to team</SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}
