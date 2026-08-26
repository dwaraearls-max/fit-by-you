import { PrismaClient } from "@prisma/client";
import { createSession, getSession, verifyPassword } from "../src/lib/auth";

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: "ama@adjoacouture.com" },
    include: {
      memberships: { where: { status: "ACTIVE" }, take: 1 },
    },
  });

  if (!user) throw new Error("Demo user missing. Run npm run db:seed.");

  const ok = await verifyPassword("fitbyyou123", user.passwordHash);
  console.log("password:", ok);

  await createSession({
    userId: user.id,
    businessId: user.memberships[0]?.businessId ?? null,
    userAgent: "login-check",
  });

  const session = await getSession();
  console.log("session user:", session?.user.email ?? "NONE");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
