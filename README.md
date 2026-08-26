# FIT BY YOU

**Your Fashion Business Has a Memory.**

A multi-tenant SaaS platform for tailors, seamstresses, fashion designers, alteration
businesses and clothing brands. Customer measurements, styles, orders, photos and
payment records live in one workspace instead of scattered across notebooks,
WhatsApp chats and memory.

---

## Getting started

```bash
npm install
cp .env.example .env      # then edit SESSION_SECRET
npm run db:push           # create the SQLite database
npm run db:seed           # load demo businesses and customers
npm run dev
```

Open <http://localhost:3000>.

### Demo accounts

The seed creates two independent businesses so tenant isolation is provable — log in
as each and confirm neither can see the other's customers.

| Business            | Email                      | Password      |
| ------------------- | -------------------------- | ------------- |
| Adjoa Couture       | `ama@adjoacouture.com`     | `fitbyyou123` |
| Adjoa Couture (staff) | `kwame@adjoacouture.com` | `fitbyyou123` |
| Nuru Bridal House   | `nuru@nurubridal.com`      | `fitbyyou123` |

Both businesses have a customer named Amanda Mensah with different measurements and
order history, which is the sharpest way to see the isolation working.

---

## Scripts

| Script               | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Development server                               |
| `npm run build`      | Generate the Prisma client and build for production |
| `npm start`          | Serve the production build                       |
| `npm run lint`       | ESLint                                           |
| `npm run typecheck`  | `tsc --noEmit`                                   |
| `npm run db:push`    | Sync the schema without a migration              |
| `npm run db:migrate` | Create and apply a migration                     |
| `npm run db:seed`    | Reseed demo data                                 |
| `npm run db:studio`  | Prisma Studio                                    |
| `npm run db:reset`   | Drop, recreate and reseed                        |

---

## Architecture

```
src/
  app/
    (marketing)/        Landing, pricing, how it works
    (auth)/             Login, signup, password reset
    (onboarding)/       Four-step first-run flow
    (app)/app/          The product, behind authentication
    api/                File serving, QR codes
  components/
    ui/                 Design-system primitives
    marketing/          Landing page sections
    app/                Product components
  lib/
    domain.ts           Every status/role/category as a typed union + zod schema
    permissions.ts      Capability matrix per role
    tenant.ts           requireTenant — the single door into tenant data
    db.ts               Prisma client with the tenant-scope guard extension
    money.ts            Integer minor-unit currency handling
    fit-memory.ts       The FIT MEMORY summary
    storage/            Pluggable file storage (local disk / S3)
  server/               Server Actions, grouped by module
prisma/
  schema.prisma         25 entities
  seed.ts               Demo data
```

### Multi-tenancy

Every tenant-owned row carries `businessId`. Server Actions and route handlers never
reach for Prisma directly — they call `requireTenant()`, which resolves the session
cookie to a membership and returns the active `businessId` plus the caller's role.

A Prisma client extension inspects every query against a tenant-scoped model and
throws when the `where` clause omits `businessId`. A forgotten filter fails loudly in
development instead of quietly leaking one business's customers to another.

### Measurements are append-only

There is no measurements table hanging off the customer. Each measuring session
inserts an immutable `MeasurementSet` (dated, attributed to whoever measured) holding
many `MeasurementValue` rows. "Current measurements" is a read of the newest set.

This is what makes the trend view and Compare Measurements work, and it means a
tailor can always answer "what was her waist last September?"

### Money

Every amount is an `Int` in minor units — pesewas for GHS. Floats are never used for
currency. `formatMoney()` renders `GH₵1,200`.

### Portability

The schema is written so the only change needed to move from SQLite to PostgreSQL is
the `provider` line in `prisma/schema.prisma`. That means no `enum`, no `Json`, no
scalar lists and no `@db.` native types. See the header comment in the schema.

---

## What is deliberately stubbed

Three things are modelled properly but not wired to a live provider, each behind a
clean interface:

- **Billing.** Plans and subscriptions are real rows and the UI enforces plan limits,
  but no card is charged. Swap in Paystack or Stripe at `src/lib/billing.ts`.
- **WhatsApp.** The platform composes the message and opens a real `wa.me` deep link,
  which is what a Ghanaian tailor actually uses today. The Business API can replace
  the link at `src/lib/whatsapp.ts` without touching any caller.
- **AI.** The assistant answers from real aggregates over the business's own data
  rather than a language model, so it is never wrong about a number.

---

## Deploying to PostgreSQL

1. Change `provider` to `"postgresql"` in `prisma/schema.prisma`.
2. Point `DATABASE_URL` at the cluster.
3. `npx prisma migrate deploy`
4. Set `STORAGE_DRIVER=s3` and the `S3_*` variables so uploads leave local disk.
5. Set a strong `SESSION_SECRET`.
