import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import {
  activeSessions,
  auditTrail,
  businessProfile,
  deletionImpact,
  measurementFieldUsage,
  measurementFields,
  teamMembers,
} from "@/server/queries/settings";
import type { MeasurementGroup, MembershipStatus, Role } from "@/lib/domain";
import { PageHeader } from "@/components/app/page-header";
import { TabBar } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BusinessForm } from "@/components/app/settings/business-form";
import { PreferencesForm } from "@/components/app/settings/preferences-form";
import { TeamPanel } from "@/components/app/settings/team-panel";
import { MeasurementFieldsPanel } from "@/components/app/settings/measurement-fields-panel";
import { ExportPanel } from "@/components/app/settings/export-panel";
import { AuditList } from "@/components/app/settings/audit-list";
import {
  DeleteBusinessPanel,
  PasswordForm,
  ProfileForm,
  SessionList,
} from "@/components/app/settings/account-panel";

export const metadata: Metadata = { title: "Settings" };

const TABS = [
  "business",
  "preferences",
  "team",
  "measurements",
  "account",
  "activity",
  "data",
] as const;

type Tab = (typeof TABS)[number];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requireTenant();
  const params = await searchParams;

  const canReadSettings = tenant.can("settings:read");
  const canWriteSettings = tenant.can("settings:write");
  const canReadTeam = tenant.can("team:read");
  const canWriteTeam = tenant.can("team:write");
  const canReadAudit = tenant.can("audit:read");

  // Someone without settings access still gets their own account page; the rest
  // of the tabs simply do not exist for them.
  const visible = TABS.filter((entry) => {
    if (entry === "account") return true;
    if (entry === "team") return canReadTeam;
    if (entry === "activity") return canReadAudit;
    return canReadSettings;
  });

  // A tailor has no business settings, so their first tab is their own account.
  const requested = typeof params.tab === "string" ? params.tab : null;
  if (requested && !visible.includes(requested as Tab)) notFound();
  const tab: Tab = (requested as Tab | null) ?? visible[0]!;

  const tabs = visible.map((entry) => ({
    value: entry,
    label: LABELS[entry],
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Settings"
        description="How your business works, who can see it, and what is yours to take away."
      />

      <TabBar tabs={tabs} className="mb-6" />

      {tab === "business" ? <BusinessTab canWrite={canWriteSettings} /> : null}
      {tab === "preferences" ? (
        <PreferencesTab canWrite={canWriteSettings} />
      ) : null}
      {tab === "team" ? (
        <TeamTab
          businessId={tenant.businessId}
          actorRole={tenant.role}
          actorUserId={tenant.user.id}
          canWrite={canWriteTeam}
        />
      ) : null}
      {tab === "measurements" ? (
        <MeasurementsTab
          businessId={tenant.businessId}
          canWrite={canWriteSettings}
        />
      ) : null}
      {tab === "account" ? (
        <AccountTab
          userId={tenant.user.id}
          sessionId={tenant.sessionId}
          businessId={tenant.businessId}
          businessName={tenant.business.name}
          canDelete={tenant.can("business:delete")}
        />
      ) : null}
      {tab === "activity" ? <ActivityTab businessId={tenant.businessId} /> : null}
      {tab === "data" ? <DataTab /> : null}
    </div>
  );
}

const LABELS: Record<Tab, string> = {
  business: "Business",
  preferences: "Preferences",
  team: "Team",
  measurements: "Measurements",
  account: "Your account",
  activity: "Activity",
  data: "Your data",
};

// ---------------------------------------------------------------------------

async function BusinessTab({ canWrite }: { canWrite: boolean }) {
  const tenant = await requireTenant();
  const business = await businessProfile(tenant.businessId);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Your business</CardTitle>
          <CardDescription>
            This is what appears on receipts and in the messages you send.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <BusinessForm values={business} readOnly={!canWrite} />
      </CardContent>
    </Card>
  );
}

async function PreferencesTab({ canWrite }: { canWrite: boolean }) {
  const tenant = await requireTenant();
  const business = await businessProfile(tenant.businessId);

  const settings = business.settings ?? {
    defaultUnit: "in",
    timezone: "Africa/Accra",
    weekStartsOn: 1,
    receiptFooter: null,
    whatsappOrderTemplate:
      'Hi {customer}, an update on your {outfit}: it is now at the "{status}" stage. — {business}',
    whatsappPaymentTemplate:
      "Hi {customer}, a gentle reminder that {amount} is outstanding on your {outfit}. Thank you! — {business}",
    whatsappFittingTemplate:
      "Hi {customer}, your outfit is ready for fitting on {date} at {time}. See you then! — {business}",
    notifyNewOrder: true,
    notifyPaymentReceived: true,
    notifyPaymentOverdue: true,
    notifyFittingTomorrow: true,
    notifyDeliveryDue: true,
    notifyNewCustomer: true,
    notifyMeasurementUpdated: false,
    notifySubscription: true,
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>How the app behaves</CardTitle>
          <CardDescription>
            Units, receipts, the messages you send, and when the app should speak
            up.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <PreferencesForm values={settings} readOnly={!canWrite} />
      </CardContent>
    </Card>
  );
}

async function TeamTab({
  businessId,
  actorRole,
  actorUserId,
  canWrite,
}: {
  businessId: string;
  actorRole: Role;
  actorUserId: string;
  canWrite: boolean;
}) {
  const members = await teamMembers(businessId);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Your team</CardTitle>
          <CardDescription>
            {members.length === 1
              ? "It is just you at the moment."
              : `${members.length} people can sign in.`}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <TeamPanel
          actorRole={actorRole}
          canWrite={canWrite}
          members={members.map((member) => ({
            membershipId: member.id,
            name: member.user.name,
            email: member.user.email,
            role: member.role as Role,
            status: member.status as MembershipStatus,
            lastLoginAt: member.user.lastLoginAt,
            isYou: member.user.id === actorUserId,
          }))}
        />
      </CardContent>
    </Card>
  );
}

async function MeasurementsTab({
  businessId,
  canWrite,
}: {
  businessId: string;
  canWrite: boolean;
}) {
  const [fields, usage] = await Promise.all([
    measurementFields(businessId),
    measurementFieldUsage(businessId),
  ]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Measurement fields</CardTitle>
          <CardDescription>
            Make the measurement form match the way you actually work.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <MeasurementFieldsPanel
          canWrite={canWrite}
          fields={fields.map((field) => ({
            id: field.id,
            key: field.key,
            label: field.label,
            group: field.group as MeasurementGroup,
            unit: field.unit,
            isCustom: field.isCustom,
            isActive: field.isActive,
            usageCount: usage.get(field.key) ?? 0,
          }))}
        />
      </CardContent>
    </Card>
  );
}

async function AccountTab({
  userId,
  sessionId,
  businessId,
  businessName,
  canDelete,
}: {
  userId: string;
  sessionId: string;
  businessId: string;
  businessName: string;
  canDelete: boolean;
}) {
  const [user, sessions, impact] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true, phone: true },
    }),
    activeSessions(userId, sessionId),
    canDelete ? deletionImpact(businessId) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>You</CardTitle>
            <CardDescription>
              Your name appears against every measurement you take and every
              payment you record.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm values={user} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Eight characters or more. Something you will remember without
              writing it on the wall.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Where you are signed in</CardTitle>
            <CardDescription>
              If you see something you do not recognise, sign it out and change
              your password.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SessionList sessions={sessions} />
        </CardContent>
      </Card>

      {impact ? (
        <DeleteBusinessPanel businessName={businessName} impact={impact} />
      ) : null}
    </div>
  );
}

async function ActivityTab({ businessId }: { businessId: string }) {
  const rows = await auditTrail(businessId);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Activity log</CardTitle>
          <CardDescription>
            The last {rows.length} things that happened in your business, newest
            first.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <AuditList rows={rows} />
      </CardContent>
    </Card>
  );
}

function DataTab() {
  return (
    <div>
      <div className="mb-5">
        <h2 className="font-serif text-lg font-semibold tracking-tight">
          Your data is yours
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          You can take a complete copy at any time, in a format that opens
          anywhere. No notice, no request, no waiting.
        </p>
      </div>
      <ExportPanel />
    </div>
  );
}
