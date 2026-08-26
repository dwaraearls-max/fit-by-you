import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireTenant, listMemberships } from "@/lib/tenant";
import { NAV_ITEMS } from "@/lib/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { MobileNav } from "@/components/app/mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await requireTenant();

  // A business that never finished setting up goes back to where it stopped
  // rather than landing on a dashboard with nothing in it.
  if (!tenant.business.onboardedAt) redirect("/onboarding");

  const [memberships, notifications, unreadCount, subscription] =
    await Promise.all([
      listMemberships(tenant.user.id),
      prisma.notification.findMany({
        where: {
          businessId: tenant.businessId,
          OR: [{ userId: null }, { userId: tenant.user.id }],
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.notification.count({
        where: {
          businessId: tenant.businessId,
          readAt: null,
          OR: [{ userId: null }, { userId: tenant.user.id }],
        },
      }),
      prisma.subscription.findUnique({
        where: { businessId: tenant.businessId },
        include: { plan: { select: { name: true, code: true } } },
      }),
    ]);

  // Only the permitted hrefs cross into the client shell. The nav icons are
  // React components, which cannot be serialised, so the client filters the
  // catalogue itself using this list.
  const allowed = NAV_ITEMS.filter(
    (item) => !item.permission || tenant.can(item.permission),
  ).map((item) => item.href);

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar
        allowed={allowed}
        user={{
          name: tenant.user.name,
          email: tenant.user.email,
          role: tenant.role,
        }}
        business={{
          id: tenant.businessId,
          name: tenant.business.name,
          memberships: memberships.map((entry) => ({
            id: entry.businessId,
            name: entry.business.name,
          })),
        }}
        planName={subscription?.plan.name ?? "Starter"}
        planIsFree={(subscription?.plan.code ?? "STARTER") === "STARTER"}
      />

      <div className="lg:pl-60 print:pl-0">
        <Topbar
          notifications={notifications}
          unreadCount={unreadCount}
          canCreate={tenant.can("customer:write") || tenant.can("order:write")}
        />

        <main className="px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-12 print:p-0">
          {children}
        </main>
      </div>

      <MobileNav allowed={allowed} />
    </div>
  );
}
