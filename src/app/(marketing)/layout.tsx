import { optionalTenant } from "@/lib/tenant";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export default async function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const tenant = await optionalTenant();

  return (
    <div className="flex min-h-dvh flex-col bg-ink-950">
      <MarketingNav signedIn={Boolean(tenant)} />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
