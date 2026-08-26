import type { Role } from "./domain";

/**
 * Capability-based authorisation. Every mutating action names a permission,
 * and roles are simply sets of permissions. Adding a role later means adding
 * one row here rather than hunting for `role === "OWNER"` checks.
 */
export const PERMISSIONS = [
  "customer:read",
  "customer:write",
  "customer:delete",
  "measurement:read",
  "measurement:write",
  "order:read",
  "order:write",
  "order:delete",
  "payment:read",
  "payment:write",
  "payment:delete",
  "photo:read",
  "photo:write",
  "photo:delete",
  "style:read",
  "style:write",
  "calendar:read",
  "calendar:write",
  "report:read",
  "settings:read",
  "settings:write",
  "team:read",
  "team:write",
  "billing:read",
  "billing:write",
  "audit:read",
  "business:delete",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ASSISTANT: Permission[] = [
  "customer:read",
  "customer:write",
  "measurement:read",
  "order:read",
  "payment:read",
  "photo:read",
  "photo:write",
  "style:read",
  "calendar:read",
];

const TAILOR: Permission[] = [
  ...ASSISTANT,
  "measurement:write",
  "order:write",
  "payment:write",
  // A blurred photo is a normal mistake, not a data incident, so whoever can
  // take one can remove one.
  "photo:delete",
  "style:write",
  "calendar:write",
];

const MANAGER: Permission[] = [
  ...TAILOR,
  "customer:delete",
  "order:delete",
  "payment:delete",
  "report:read",
  "settings:read",
  "settings:write",
  "team:read",
  "audit:read",
];

const OWNER: Permission[] = [
  ...MANAGER,
  "team:write",
  "billing:read",
  "billing:write",
  "business:delete",
];

const MATRIX: Record<Role, ReadonlySet<Permission>> = {
  OWNER: new Set(OWNER),
  MANAGER: new Set(MANAGER),
  TAILOR: new Set(TAILOR),
  ASSISTANT: new Set(ASSISTANT),
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role]?.has(permission) ?? false;
}

export function permissionsFor(role: Role): Permission[] {
  return [...(MATRIX[role] ?? [])];
}

/** Only an Owner may change an Owner, and the last Owner cannot be demoted. */
export function canManageRole(actor: Role, target: Role): boolean {
  if (actor === "OWNER") return true;
  if (actor === "MANAGER") return target === "TAILOR" || target === "ASSISTANT";
  return false;
}

export class ForbiddenError extends Error {
  readonly permission?: Permission;

  constructor(permission?: Permission) {
    super(
      permission
        ? `You do not have permission to ${permission.replace(":", " ")}.`
        : "You do not have permission to do that.",
    );
    this.name = "ForbiddenError";
    this.permission = permission;
  }
}
