import { PrismaClient } from "@prisma/client";

/**
 * Models that hold tenant-owned data. Every query against one of these must be
 * constrained by `businessId`, and the extension below enforces it.
 *
 * Deliberately absent:
 *   User, Session, PasswordResetToken — global identity, keyed by the session
 *   Business                          — the tenant root itself, keyed by id
 *   Plan, PlanFeature                 — the public price list
 */
const TENANT_MODELS = new Set([
  "BusinessSettings",
  "Membership",
  "Customer",
  "CustomerTag",
  "MeasurementField",
  "MeasurementSet",
  "MeasurementValue",
  "StyleProfile",
  "StylePreference",
  "CustomerPhoto",
  "StyleLibraryItem",
  "Order",
  "OrderItem",
  "OrderTimelineEvent",
  "Fitting",
  "Appointment",
  "Payment",
  "PaymentReminder",
  "Notification",
  "Subscription",
  "Invoice",
  "AuditLog",
]);

/** Operations whose `where` clause must name the tenant. */
const WHERE_SCOPED = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

/** Operations whose payload must carry the tenant. */
const DATA_SCOPED = new Set(["create", "createMany", "createManyAndReturn"]);

/**
 * `Membership` is the join between global identity and a tenant, so it is the
 * one model with a second safe scope: constraining by `userId` returns only the
 * signed-in user's own rows, which is exactly what the business switcher needs
 * before an active business has been chosen.
 */
const ALTERNATE_SCOPES: Record<string, string> = { Membership: "userId" };

export class TenantScopeError extends Error {
  constructor(model: string, operation: string) {
    super(
      `Tenant leak guard: ${model}.${operation}() was called without a businessId filter. ` +
        `Every query against tenant data must be scoped — see src/lib/tenant.ts.`,
    );
    this.name = "TenantScopeError";
  }
}

/** Recursively looks for a scoping key anywhere in a filter or payload. */
function mentionsScope(value: unknown, keys: string[], depth = 0): boolean {
  if (depth > 6 || value === null || typeof value !== "object") return false;

  if (Array.isArray(value)) {
    return value.some((entry) => mentionsScope(entry, keys, depth + 1));
  }

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (keys.includes(key)) return true;
    // Compound unique selectors and boolean combinators nest the real filter.
    if (
      key === "AND" ||
      key === "OR" ||
      key === "NOT" ||
      keys.some((scope) => key.includes(scope)) ||
      (typeof nested === "object" && nested !== null)
    ) {
      if (mentionsScope(nested, keys, depth + 1)) return true;
    }
  }

  return false;
}

function assertScoped(model: string, operation: string, args: unknown) {
  const payload = (args ?? {}) as Record<string, unknown>;
  const alternate = ALTERNATE_SCOPES[model];
  const readKeys = alternate ? ["businessId", alternate] : ["businessId"];

  if (WHERE_SCOPED.has(operation) && !mentionsScope(payload.where, readKeys)) {
    throw new TenantScopeError(model, operation);
  }

  // Writes always name the business, even on Membership: creating a row for a
  // user without saying which business it joins is never correct.
  if (DATA_SCOPED.has(operation) && !mentionsScope(payload.data, ["businessId"])) {
    throw new TenantScopeError(model, operation);
  }

  if (operation === "upsert") {
    if (
      !mentionsScope(payload.where, readKeys) ||
      !mentionsScope(payload.create, ["businessId"])
    ) {
      throw new TenantScopeError(model, operation);
    }
  }
}

function createPrismaClient() {
  const base = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [{ level: "warn", emit: "stdout" }, { level: "error", emit: "stdout" }]
        : [{ level: "error", emit: "stdout" }],
  });

  return base.$extends({
    name: "tenant-scope-guard",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // The guard is a development tripwire: it turns a silent cross-tenant
          // read into a loud failure while the feature is being written. In
          // production the cost of reflecting over every payload is not worth
          // paying, and by then the call sites are already proven.
          if (
            process.env.NODE_ENV !== "production" &&
            model &&
            TENANT_MODELS.has(model)
          ) {
            assertScoped(model, operation, args);
          }
          return query(args);
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma?: ExtendedPrismaClient;
};

/**
 * A single client is reused across hot reloads in development, otherwise every
 * edit would open another pool of connections.
 */
export const prisma: ExtendedPrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
