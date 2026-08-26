/**
 * Development smoke test.
 *
 * Renders every important screen against the seeded database as a real signed-in
 * owner and reports the status code, so a broken server component is caught
 * without clicking through the whole product by hand. It also fetches one
 * business's customer under the other business's session to prove tenant
 * isolation holds at the route level, not just in the query helpers.
 *
 *   npx tsx scripts/smoke.ts [baseUrl]
 */

import { createHash, randomBytes } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const prisma = new PrismaClient();
const BASE = process.argv[2] ?? "http://localhost:3000";
const COOKIE_NAME = "fby_session";

async function sessionCookieFor(email: string) {
  const secretValue = process.env.SESSION_SECRET;
  if (!secretValue || secretValue.length < 32) {
    throw new Error("SESSION_SECRET missing. Run with the app's .env loaded.");
  }
  const secret = new TextEncoder().encode(secretValue);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { orderBy: { joinedAt: "asc" }, take: 1 } },
  });
  if (!user) throw new Error(`No seeded user ${email}. Run npm run db:seed.`);

  const businessId = user.memberships[0]?.businessId ?? null;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      businessId,
      userAgent: "smoke-test",
      expiresAt,
    },
  });

  const jwt = await new SignJWT({ sessionId: session.id, userId: user.id, token })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret);

  return { cookie: `${COOKIE_NAME}=${jwt}`, businessId: businessId!, userId: user.id };
}

async function check(path: string, cookie: string, expected = 200) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { cookie },
    redirect: "manual",
  });

  const ok = response.status === expected;
  const body = ok && expected === 200 ? await response.text() : "";
  const digest =
    body.includes("Application error") || body.includes("__next_error__")
      ? " (rendered an error boundary)"
      : "";

  console.log(
    `${ok && !digest ? "  ok  " : "FAIL  "}${String(response.status).padEnd(4)} ${path}${digest}`,
  );

  return ok && !digest;
}

async function main() {
  const owner = await sessionCookieFor("ama@adjoacouture.com");
  const rival = await sessionCookieFor("nuru@nurubridal.com");

  const [customer, order, payment, rivalCustomer] = await Promise.all([
    prisma.customer.findFirst({
      where: { businessId: owner.businessId, fullName: { contains: "Amanda" } },
      select: { id: true, fullName: true },
    }),
    prisma.order.findFirst({
      where: { businessId: owner.businessId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
    prisma.payment.findFirst({
      where: { businessId: owner.businessId },
      orderBy: { receivedAt: "desc" },
      select: { id: true },
    }),
    prisma.customer.findFirst({
      where: { businessId: rival.businessId, fullName: { contains: "Amanda" } },
      select: { id: true, fullName: true },
    }),
  ]);

  const paths = [
    "/",
    "/pricing",
    "/how-it-works",
    "/app",
    "/app/customers",
    "/app/customers/new",
    "/app/orders",
    "/app/orders?filter=OVERDUE",
    "/app/orders?filter=UNPAID",
    "/app/orders/new",
    "/app/measurements",
    "/app/payments",
    "/app/payments/new",
    "/app/styles",
    "/app/calendar",
    `/app/calendar?month=${new Date().toISOString().slice(0, 7)}`,
    "/app/reports",
    "/app/settings",
    "/app/settings?tab=preferences",
    "/app/settings?tab=team",
    "/app/settings?tab=measurements",
    "/app/settings?tab=account",
    "/app/settings?tab=activity",
    "/app/settings?tab=data",
    "/api/export?format=json",
    "/api/export?format=csv&table=customers",
    "/api/export?format=csv&table=orders",
    "/api/export?format=csv&table=payments",
    "/api/export?format=csv&table=measurements",
    ...(customer
      ? [
          `/app/customers/${customer.id}`,
          `/app/customers/${customer.id}?tab=measurements`,
          `/app/customers/${customer.id}?tab=orders`,
          `/app/customers/${customer.id}?tab=payments`,
          `/app/customers/${customer.id}?tab=photos`,
          `/app/customers/${customer.id}?tab=styles`,
          `/app/customers/${customer.id}?tab=notes`,
          `/app/customers/${customer.id}/photos`,
          `/app/customers/${customer.id}/measure`,
          `/app/customers/${customer.id}/measurements/compare`,
          `/app/customers/${customer.id}/edit`,
          `/api/qr/${customer.id}`,
        ]
      : []),
    ...(order ? [`/app/orders/${order.id}`, `/app/orders/${order.id}/edit`] : []),
    ...(payment ? [`/app/payments/${payment.id}`] : []),
  ];

  console.log(`\nSmoke test against ${BASE}\n`);

  let failures = 0;
  for (const path of paths) {
    if (!(await check(path, owner.cookie))) failures += 1;
  }

  // The file proxy: an object under one business's prefix must be readable by
  // that business and invisible to the other, since the key is the only thing
  // standing between a customer's fitting photos and a stranger.
  const probeKey = `businesses/${owner.businessId}/customers/smoke-probe.png`;
  const probePath = path.join(process.cwd(), ".storage", ...probeKey.split("/"));
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
    "base64",
  );

  console.log("\nFile proxy\n");
  await mkdir(path.dirname(probePath), { recursive: true });
  await writeFile(probePath, pixel);

  if (!(await check(`/api/files/${probeKey}`, owner.cookie))) failures += 1;
  if (!(await check(`/api/files/${probeKey}`, rival.cookie, 404))) failures += 1;
  await rm(probePath, { force: true });

  console.log("\nSecond business\n");
  if (!(await check("/app", rival.cookie))) failures += 1;
  if (!(await check("/app/customers", rival.cookie))) failures += 1;

  if (rivalCustomer) {
    const own = await fetch(`${BASE}/app/customers/${rivalCustomer.id}`, {
      headers: { cookie: rival.cookie },
      redirect: "manual",
    });
    const ownBody = await own.text();
    const seesOwn = own.status === 200 && ownBody.includes("Amanda Mensah");
    console.log(
      `${seesOwn ? "  ok  " : "FAIL  "}${String(own.status).padEnd(4)} rival can open their own Amanda Mensah`,
    );
    if (!seesOwn) failures += 1;
  }

  // Tenant isolation: the other business must not be able to open this customer.
  // The status is asserted loosely because `notFound()` after the shell has
  // begun streaming cannot change an already-sent 200; what matters is that the
  // body is the not-found page and never the customer.
  if (customer) {
    console.log("\nTenant isolation\n");
    const response = await fetch(`${BASE}/app/customers/${customer.id}`, {
      headers: { cookie: rival.cookie },
      redirect: "manual",
    });
    const body = await response.text();
    const leaked = body.includes("Amanda Mensah");
    const blocked = body.includes("We couldn") || response.status === 404;

    console.log(
      `${!leaked && blocked ? "  ok  " : "FAIL  "}${String(response.status).padEnd(4)} another business's customer is ${
        leaked ? "VISIBLE — LEAK" : "not visible"
      }`,
    );
    if (leaked || !blocked) failures += 1;
  }

  await prisma.session.deleteMany({
    where: { userAgent: "smoke-test" },
  });

  console.log(
    failures === 0
      ? `\nAll ${paths.length + (customer ? 1 : 0)} checks passed.\n`
      : `\n${failures} check(s) failed.\n`,
  );

  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
