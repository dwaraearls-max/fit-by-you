/**
 * FIT BY YOU — demo data.
 *
 * Two independent businesses are created, each with a customer named
 * "Amanda Mensah" holding different measurements and order history. Logging in
 * as one and then the other is the fastest way to see tenant isolation working.
 *
 * Run with: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  DEFAULT_MEASUREMENT_FIELDS,
  type MeasurementGroup,
  type OrderStatus,
} from "../src/lib/domain";

const prisma = new PrismaClient();

const PASSWORD = "fitbyyou123";

// ---------------------------------------------------------------------------
// Deterministic randomness — the same seed always produces the same database,
// so screenshots, tests and demos stay stable.
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260826);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)] as T;
}

function pickMany<T>(items: readonly T[], count: number): T[] {
  const pool = [...items];
  const out: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    out.push(...pool.splice(Math.floor(rand() * pool.length), 1));
  }
  return out;
}

function between(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function chance(probability: number): boolean {
  return rand() < probability;
}

function daysAgo(days: number, hour = 10, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function daysAhead(days: number, hour = 10, minute = 0): Date {
  return daysAgo(-days, hour, minute);
}

function monthsAgo(months: number, day = 15): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  date.setDate(Math.min(day, 28));
  date.setHours(between(9, 17), pick([0, 15, 30, 45]), 0, 0);
  return date;
}

function cedis(amount: number): number {
  return Math.round(amount * 100);
}

// ---------------------------------------------------------------------------
// Ghanaian name pools
// ---------------------------------------------------------------------------

const FEMALE_NAMES = [
  "Akosua", "Adjoa", "Abena", "Akua", "Yaa", "Afua", "Ama", "Esi", "Efua", "Aba",
  "Adwoa", "Serwaa", "Akorfa", "Sedina", "Naa", "Dede", "Aku", "Gifty", "Comfort",
  "Grace", "Mercy", "Priscilla", "Bernice", "Sandra", "Linda", "Vida", "Doris",
  "Cynthia", "Rita", "Josephine", "Patience", "Hannah", "Rebecca", "Deborah",
  "Sarah", "Naomi", "Ruth", "Emelia", "Regina", "Beatrice", "Felicia", "Rosemary",
  "Charity", "Selina", "Juliet", "Perpetual", "Elikem", "Maame", "Abigail", "Portia",
];

const MALE_NAMES = [
  "Kwame", "Kofi", "Kwesi", "Yaw", "Kwabena", "Kojo", "Kwaku", "Nii", "Tetteh",
  "Emmanuel", "Samuel", "Michael", "Daniel", "Isaac", "Joseph", "Richard", "Eric",
  "Francis", "Prince", "Nathaniel", "Bright", "Ebenezer", "Godfred", "Solomon",
  "Stephen", "Frank", "Kelvin", "Bernard", "Collins", "Desmond",
];

const SURNAMES = [
  "Mensah", "Osei", "Boateng", "Asante", "Owusu", "Appiah", "Addo", "Amankwah",
  "Danso", "Frimpong", "Nkrumah", "Agyeman", "Ofori", "Sarpong", "Antwi", "Baffour",
  "Quartey", "Lartey", "Tetteh", "Nartey", "Ankrah", "Dodoo", "Aryee", "Adjei",
  "Annan", "Kyei", "Bediako", "Gyamfi", "Oppong", "Acheampong", "Amoah", "Darko",
  "Twum", "Yeboah", "Bonsu", "Wiredu", "Nyarko", "Larbi", "Otoo", "Hammond",
  "Blankson", "Essien", "Koomson", "Aidoo", "Arthur", "Ackah", "Mireku", "Opoku",
  "Manu", "Sowah",
];

const CITIES = [
  "Accra", "Kumasi", "Tema", "Takoradi", "Cape Coast", "Tamale", "Koforidua",
  "Sunyani", "Ho", "Madina", "East Legon", "Osu", "Adenta", "Spintex",
];

// ---------------------------------------------------------------------------
// Garment catalogue
// ---------------------------------------------------------------------------

const WOMENS_OUTFITS = [
  { title: "Kente Evening Dress", type: "DRESS", fabric: "Kente", min: 700, max: 1800 },
  { title: "Ankara Peplum Dress", type: "DRESS", fabric: "Ankara", min: 350, max: 900 },
  { title: "Custom African Print Dress", type: "DRESS", fabric: "Ankara", min: 500, max: 1400 },
  { title: "Lace Kaba and Slit", type: "TWO_PIECE", fabric: "Lace", min: 600, max: 1600 },
  { title: "Corporate Pencil Skirt Suit", type: "SUIT", fabric: "Linen", min: 700, max: 1500 },
  { title: "Silk Wrap Blouse", type: "BLOUSE", fabric: "Silk", min: 250, max: 600 },
  { title: "Velvet Evening Gown", type: "GOWN", fabric: "Velvet", min: 1200, max: 3200 },
  { title: "Bridal Reception Gown", type: "GOWN", fabric: "Lace", min: 2500, max: 6500 },
  { title: "Ankara Maxi Skirt", type: "SKIRT", fabric: "Ankara", min: 220, max: 520 },
  { title: "Chiffon Bridesmaid Dress", type: "DRESS", fabric: "Chiffon", min: 450, max: 1100 },
  { title: "Kente Graduation Outfit", type: "TWO_PIECE", fabric: "Kente", min: 600, max: 1400 },
  { title: "Satin Cocktail Dress", type: "DRESS", fabric: "Satin", min: 550, max: 1300 },
];

const MENS_OUTFITS = [
  { title: "Three-Piece Wedding Suit", type: "SUIT", fabric: "Linen", min: 1400, max: 3600 },
  { title: "Embroidered Kaftan", type: "KAFTAN", fabric: "Cotton", min: 400, max: 1100 },
  { title: "Northern Smock", type: "SMOCK", fabric: "Cotton", min: 350, max: 900 },
  { title: "Agbada Set", type: "AGBADA", fabric: "Lace", min: 900, max: 2400 },
  { title: "Corporate Shirt Set", type: "SHIRT", fabric: "Cotton", min: 180, max: 450 },
  { title: "Kente Cloth Fitting", type: "OTHER", fabric: "Kente", min: 500, max: 1500 },
  { title: "Tailored Chinos", type: "TROUSERS", fabric: "Cotton", min: 200, max: 480 },
  { title: "Ankara Shirt", type: "SHIRT", fabric: "Ankara", min: 200, max: 520 },
];

const STYLE_NOTES = [
  "Prefers slightly loose sleeves and longer dress length.",
  "Does not like tight waistlines — always leave a little room.",
  "Prefers hidden zippers on everything.",
  "Likes a high neckline and covered shoulders.",
  "Always asks for pockets.",
  "Prefers longer sleeves, even on evening wear.",
  "Wants the hem to sit just below the knee.",
  "Sensitive to itchy linings — use cotton lining.",
];

const TAILOR_NOTE_POOL = [
  "Very particular about finishing. Double-check the hem.",
  "Usually collects on Saturdays.",
  "Pays promptly, often in full up front.",
  "Bring the fabric samples out when she visits.",
  "Refers a lot of friends — look after her.",
  "Prefers to be reached on WhatsApp, not calls.",
];

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

async function reset() {
  // Order matters less than it looks — cascades handle most of it — but being
  // explicit keeps the script safe to re-run on a partially seeded database.
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.paymentReminder.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.fitting.deleteMany();
  await prisma.orderTimelineEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.styleLibraryItem.deleteMany();
  await prisma.customerPhoto.deleteMany();
  await prisma.order.deleteMany();
  await prisma.measurementValue.deleteMany();
  await prisma.measurementSet.deleteMany();
  await prisma.stylePreference.deleteMany();
  await prisma.styleProfile.deleteMany();
  await prisma.customerTag.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.measurementField.deleteMany();
  await prisma.businessSettings.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.business.deleteMany();
  await prisma.planFeature.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

async function seedPlans() {
  const plans = [
    {
      code: "STARTER",
      name: "Starter",
      tagline: "For individual tailors.",
      description:
        "Everything you need to stop running your business from memory. Free to start.",
      priceMonthlyMinor: cedis(0),
      priceYearlyMinor: cedis(0),
      customerLimit: 50,
      staffLimit: 1,
      storageMb: 512,
      sortOrder: 1,
      features: [
        "Customer management",
        "Digital measurements with full history",
        "Order tracking",
        "Basic payment records",
        "Up to 50 customers",
        "1 staff account",
      ],
      excluded: ["Advanced analytics", "WhatsApp tools", "Customer portal", "Style library"],
    },
    {
      code: "PROFESSIONAL",
      name: "Professional",
      tagline: "For growing fashion businesses.",
      description:
        "For the tailor whose notebook ran out of pages. Analytics, WhatsApp and a portal for your customers.",
      priceMonthlyMinor: cedis(120),
      priceYearlyMinor: cedis(1150),
      customerLimit: 1000,
      staffLimit: 5,
      storageMb: 10240,
      sortOrder: 2,
      features: [
        "Everything in Starter",
        "Unlimited measurements and photos",
        "Advanced analytics and insights",
        "WhatsApp communication tools",
        "Customer portal",
        "Style library",
        "Automatic payment reminders",
        "Up to 5 staff accounts",
      ],
      excluded: ["Multiple locations", "Custom branding"],
    },
    {
      code: "BUSINESS",
      name: "Business",
      tagline: "For established fashion houses.",
      description:
        "Multiple locations, a real team, and the reporting to run all of it properly.",
      priceMonthlyMinor: cedis(320),
      priceYearlyMinor: cedis(3100),
      customerLimit: null,
      staffLimit: null,
      storageMb: 102400,
      sortOrder: 3,
      features: [
        "Everything in Professional",
        "Multiple locations",
        "Unlimited staff accounts",
        "Advanced reporting and exports",
        "Team management and permissions",
        "Custom branding",
        "Priority support",
      ],
      excluded: [],
    },
  ] as const;

  for (const plan of plans) {
    const created = await prisma.plan.create({
      data: {
        code: plan.code,
        name: plan.name,
        tagline: plan.tagline,
        description: plan.description,
        priceMonthlyMinor: plan.priceMonthlyMinor,
        priceYearlyMinor: plan.priceYearlyMinor,
        customerLimit: plan.customerLimit,
        staffLimit: plan.staffLimit,
        storageMb: plan.storageMb,
        sortOrder: plan.sortOrder,
      },
    });

    await prisma.planFeature.createMany({
      data: [
        ...plan.features.map((label, index) => ({
          planId: created.id,
          label,
          included: true,
          sortOrder: index,
        })),
        ...plan.excluded.map((label, index) => ({
          planId: created.id,
          label,
          included: false,
          sortOrder: plan.features.length + index,
        })),
      ],
    });
  }

  console.log("  plans: 3");
}

// ---------------------------------------------------------------------------
// Business scaffolding
// ---------------------------------------------------------------------------

type StaffMember = { id: string; name: string };

async function createBusiness(input: {
  name: string;
  slug: string;
  type: string;
  tagline: string;
  city: string;
  phone: string;
  email: string;
  planCode: string;
  owner: { name: string; email: string };
  staff?: { name: string; email: string; role: string }[];
}) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const business = await prisma.business.create({
    data: {
      name: input.name,
      slug: input.slug,
      type: input.type,
      tagline: input.tagline,
      city: input.city,
      country: "GH",
      currency: "GHS",
      phone: input.phone,
      whatsapp: input.phone,
      email: input.email,
      addressLine: `${between(3, 88)} ${pick(["Liberation", "Oxford", "Spintex", "Ring", "Cantonments"])} Road`,
      onboardingStep: 4,
      onboardedAt: monthsAgo(18),
    },
  });

  await prisma.businessSettings.create({
    data: { businessId: business.id, receiptFooter: `Thank you for choosing ${input.name}.` },
  });

  const owner = await prisma.user.create({
    data: {
      email: input.owner.email,
      passwordHash,
      name: input.owner.name,
      phone: input.phone,
      lastLoginAt: daysAgo(0, 8, 12),
    },
  });

  await prisma.membership.create({
    data: {
      userId: owner.id,
      businessId: business.id,
      role: "OWNER",
      status: "ACTIVE",
      joinedAt: monthsAgo(18),
    },
  });

  const staff: StaffMember[] = [{ id: owner.id, name: input.owner.name }];

  for (const member of input.staff ?? []) {
    const user = await prisma.user.create({
      data: {
        email: member.email,
        passwordHash,
        name: member.name,
        lastLoginAt: daysAgo(between(0, 5), 9, 30),
      },
    });
    await prisma.membership.create({
      data: {
        userId: user.id,
        businessId: business.id,
        role: member.role,
        status: "ACTIVE",
        joinedAt: monthsAgo(between(3, 12)),
      },
    });
    staff.push({ id: user.id, name: member.name });
  }

  const plan = await prisma.plan.findUniqueOrThrow({ where: { code: input.planCode } });
  const periodStart = monthsAgo(0, 1);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscription = await prisma.subscription.create({
    data: {
      businessId: business.id,
      planId: plan.id,
      status: plan.priceMonthlyMinor === 0 ? "ACTIVE" : "ACTIVE",
      interval: "MONTHLY",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  });

  if (plan.priceMonthlyMinor > 0) {
    for (let i = 2; i >= 0; i -= 1) {
      const start = monthsAgo(i, 1);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      await prisma.invoice.create({
        data: {
          businessId: business.id,
          subscriptionId: subscription.id,
          number: `${input.slug.toUpperCase().slice(0, 3)}-INV-${1000 + (3 - i)}`,
          amountMinor: plan.priceMonthlyMinor,
          currency: "GHS",
          status: i === 0 ? "OPEN" : "PAID",
          issuedAt: start,
          paidAt: i === 0 ? null : start,
          periodStart: start,
          periodEnd: end,
        },
      });
    }
  }

  await prisma.measurementField.createMany({
    data: DEFAULT_MEASUREMENT_FIELDS.map((field, index) => ({
      businessId: business.id,
      key: field.key,
      label: field.label,
      group: field.group,
      unit: "in",
      sortOrder: index,
    })),
  });

  return { business, owner, staff };
}

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

/** A plausible, internally consistent body. Values are in tenths of an inch. */
function bodyProfile(gender: "FEMALE" | "MALE") {
  if (gender === "FEMALE") {
    const bust = between(320, 440);
    const waist = bust - between(50, 90);
    const hip = bust + between(20, 70);
    return {
      shoulder: between(140, 175),
      bust,
      under_bust: bust - between(40, 60),
      armhole: between(150, 190),
      sleeve_length: between(200, 245),
      bicep: between(105, 145),
      wrist: between(60, 75),
      waist,
      hip,
      thigh: Math.round(hip / 1.85),
      knee: between(140, 175),
      ankle: between(85, 105),
      trouser_length: between(370, 420),
      dress_length: between(440, 560),
      skirt_length: between(240, 380),
      top_length: between(230, 280),
      jacket_length: between(250, 300),
      shirt_length: between(260, 300),
    };
  }

  const chest = between(360, 470);
  return {
    shoulder: between(165, 200),
    bust: chest,
    under_bust: chest - between(20, 40),
    armhole: between(180, 220),
    sleeve_length: between(230, 265),
    bicep: between(120, 160),
    wrist: between(70, 90),
    waist: chest - between(40, 80),
    hip: chest - between(10, 40),
    thigh: between(210, 260),
    knee: between(150, 185),
    ankle: between(95, 115),
    trouser_length: between(400, 445),
    dress_length: between(0, 0),
    skirt_length: between(0, 0),
    top_length: between(270, 310),
    jacket_length: between(290, 330),
    shirt_length: between(290, 320),
  };
}

const FIELD_GROUP: Record<string, MeasurementGroup> = Object.fromEntries(
  DEFAULT_MEASUREMENT_FIELDS.map((f) => [f.key, f.group]),
) as Record<string, MeasurementGroup>;

const FIELD_LABEL: Record<string, string> = Object.fromEntries(
  DEFAULT_MEASUREMENT_FIELDS.map((f) => [f.key, f.label]),
);

async function createMeasurementSet(input: {
  businessId: string;
  customerId: string;
  measuredAt: Date;
  measuredBy: StaffMember;
  values: Record<string, number>;
  notes?: string;
}) {
  const entries = Object.entries(input.values).filter(([, value]) => value > 0);

  return prisma.measurementSet.create({
    data: {
      businessId: input.businessId,
      customerId: input.customerId,
      measuredAt: input.measuredAt,
      measuredById: input.measuredBy.id,
      measuredByName: input.measuredBy.name,
      unit: "in",
      notes: input.notes ?? null,
      values: {
        create: entries.map(([key, valueTenths]) => ({
          businessId: input.businessId,
          fieldKey: key,
          fieldLabel: FIELD_LABEL[key] ?? key,
          group: FIELD_GROUP[key] ?? "CUSTOM",
          valueTenths,
          unit: "in",
        })),
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const TIMELINE_FOR_STATUS: Record<string, string[]> = {
  NEW: ["CREATED"],
  MEASURING: ["CREATED", "MEASUREMENT_TAKEN"],
  CUTTING: ["CREATED", "MEASUREMENT_TAKEN", "FABRIC_RECEIVED", "STATUS_CHANGED"],
  SEWING: ["CREATED", "MEASUREMENT_TAKEN", "FABRIC_RECEIVED", "STATUS_CHANGED", "STATUS_CHANGED"],
  FITTING: [
    "CREATED", "MEASUREMENT_TAKEN", "FABRIC_RECEIVED", "STATUS_CHANGED",
    "STATUS_CHANGED", "FITTING_SCHEDULED",
  ],
  ADJUSTMENTS: [
    "CREATED", "MEASUREMENT_TAKEN", "FABRIC_RECEIVED", "STATUS_CHANGED",
    "STATUS_CHANGED", "FITTING_COMPLETED", "STATUS_CHANGED",
  ],
  READY: [
    "CREATED", "MEASUREMENT_TAKEN", "FABRIC_RECEIVED", "STATUS_CHANGED",
    "STATUS_CHANGED", "FITTING_COMPLETED", "STATUS_CHANGED",
  ],
  DELIVERED: [
    "CREATED", "MEASUREMENT_TAKEN", "FABRIC_RECEIVED", "STATUS_CHANGED",
    "STATUS_CHANGED", "FITTING_COMPLETED", "STATUS_CHANGED", "DELIVERED",
  ],
  CANCELLED: ["CREATED", "CANCELLED"],
};

const TIMELINE_COPY: Record<string, { title: string; description?: string }> = {
  CREATED: { title: "Order created" },
  MEASUREMENT_TAKEN: { title: "Measurements taken" },
  FABRIC_RECEIVED: { title: "Fabric received" },
  STATUS_CHANGED: { title: "Moved to the next stage" },
  FITTING_SCHEDULED: { title: "Fitting scheduled" },
  FITTING_COMPLETED: { title: "First fitting completed" },
  PAYMENT_RECORDED: { title: "Payment recorded" },
  DELIVERED: { title: "Delivered to customer", description: "Another perfect fit completed." },
  CANCELLED: { title: "Order cancelled" },
};

async function createOrder(input: {
  businessId: string;
  customerId: string;
  customerName: string;
  code: string;
  outfit: (typeof WOMENS_OUTFITS)[number];
  status: OrderStatus;
  createdAt: Date;
  deliveryDate: Date | null;
  measurementSetId: string | null;
  staff: StaffMember[];
  priceMinor: number;
  paidMinor: number;
  deliveredAt?: Date | null;
  receiptSeed: number;
  fittingDate?: Date | null;
}) {
  const actor = pick(input.staff);

  const order = await prisma.order.create({
    data: {
      businessId: input.businessId,
      code: input.code,
      customerId: input.customerId,
      title: input.outfit.title,
      outfitType: input.outfit.type,
      description: chance(0.55)
        ? `${input.outfit.fabric} ${input.outfit.title.toLowerCase()} with ${pick(["a lined bodice", "hand-finished hems", "a concealed zip", "custom beading", "matching head wrap"])}.`
        : null,
      fabric: input.outfit.fabric,
      measurementSetId: input.measurementSetId,
      priceMinor: input.priceMinor,
      paidMinor: input.paidMinor,
      balanceMinor: input.priceMinor - input.paidMinor,
      status: input.status,
      priority: chance(0.12) ? "RUSH" : "NORMAL",
      deliveryDate: input.deliveryDate,
      fittingDate: input.fittingDate ?? null,
      completedAt: input.status === "DELIVERED" || input.status === "READY" ? input.deliveredAt ?? null : null,
      deliveredAt: input.status === "DELIVERED" ? input.deliveredAt ?? null : null,
      cancelledAt: input.status === "CANCELLED" ? input.createdAt : null,
      createdById: actor.id,
      createdAt: input.createdAt,
      searchText: [
        input.code,
        input.outfit.title,
        input.customerName,
        input.outfit.fabric,
      ]
        .join(" ")
        .toLowerCase(),
    },
  });

  const steps = TIMELINE_FOR_STATUS[input.status] ?? ["CREATED"];
  const span = Math.max(
    1,
    Math.round(
      ((input.deliveredAt ?? new Date()).getTime() - input.createdAt.getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  await prisma.orderTimelineEvent.createMany({
    data: steps.map((type, index) => {
      const occurredAt = new Date(input.createdAt);
      occurredAt.setDate(
        occurredAt.getDate() + Math.round((span / Math.max(steps.length, 1)) * index),
      );
      const copy = TIMELINE_COPY[type] ?? { title: type };
      return {
        businessId: input.businessId,
        orderId: order.id,
        type,
        title: copy.title,
        description: copy.description ?? null,
        occurredAt,
        actorId: actor.id,
        actorName: actor.name,
      };
    }),
  });

  return order;
}

async function recordPayment(input: {
  businessId: string;
  customerId: string;
  orderId: string;
  amountMinor: number;
  receivedAt: Date;
  staff: StaffMember[];
  receiptNumber: string;
}) {
  const actor = pick(input.staff);
  await prisma.payment.create({
    data: {
      businessId: input.businessId,
      customerId: input.customerId,
      orderId: input.orderId,
      amountMinor: input.amountMinor,
      method: pick(["MOBILE_MONEY", "MOBILE_MONEY", "CASH", "CASH", "BANK_TRANSFER", "CARD"]),
      reference: chance(0.4) ? `MM-${between(100000, 999999)}` : null,
      receiptNumber: input.receiptNumber,
      receivedAt: input.receivedAt,
      recordedById: actor.id,
    },
  });
}

// ---------------------------------------------------------------------------
// Customer generation
// ---------------------------------------------------------------------------

let phoneCounter = 240000000;

function nextPhone(): string {
  phoneCounter += between(11, 97);
  return `+233${phoneCounter}`;
}

async function seedCustomers(options: {
  businessId: string;
  staff: StaffMember[];
  count: number;
  codePrefix: string;
  startOrderCode: number;
  receiptPrefix: string;
  /** Number of orders that should currently be in progress. */
  activeOrders: number;
  /** Number of orders delivered in the current calendar month. */
  deliveredThisMonth: number;
  femaleBias: number;
  outfitPool: { womens: typeof WOMENS_OUTFITS; mens: typeof MENS_OUTFITS };
}) {
  const {
    businessId,
    staff,
    count,
    codePrefix,
    receiptPrefix,
    activeOrders,
    deliveredThisMonth,
    femaleBias,
    outfitPool,
  } = options;

  let orderCode = options.startOrderCode;
  let receiptSeed = 1;

  type Seeded = {
    id: string;
    name: string;
    gender: "FEMALE" | "MALE";
    latestSetId: string | null;
    customerSince: Date;
  };

  const customers: Seeded[] = [];

  for (let i = 0; i < count; i += 1) {
    const gender: "FEMALE" | "MALE" = chance(femaleBias) ? "FEMALE" : "MALE";
    const firstName = gender === "FEMALE" ? pick(FEMALE_NAMES) : pick(MALE_NAMES);
    const lastName = pick(SURNAMES);
    const fullName = `${firstName} ${lastName}`;
    const phone = nextPhone();
    const monthsBack = between(0, 20);
    const customerSince = monthsAgo(monthsBack, between(1, 28));

    const customer = await prisma.customer.create({
      data: {
        businessId,
        code: `${codePrefix}-${String(i + 1).padStart(4, "0")}`,
        firstName,
        lastName,
        fullName,
        phone,
        email: chance(0.35)
          ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`
          : null,
        gender,
        city: pick(CITIES),
        addressLine: chance(0.4) ? `${between(2, 60)} ${pick(CITIES)} Street` : null,
        notes: chance(0.25) ? pick(TAILOR_NOTE_POOL) : null,
        customerSince,
        lastVisitAt: null,
        createdById: pick(staff).id,
        createdAt: customerSince,
        searchText: `${fullName} ${phone} ${codePrefix}-${String(i + 1).padStart(4, "0")}`.toLowerCase(),
      },
    });

    // Style profile
    await prisma.styleProfile.create({
      data: {
        businessId,
        customerId: customer.id,
        preferredFit: pick(["SLIM", "REGULAR", "REGULAR", "RELAXED", "OVERSIZED"]),
        styleNotes: chance(0.45) ? pick(STYLE_NOTES) : null,
      },
    });

    const prefs = [
      ...pickMany(
        gender === "FEMALE"
          ? ["TRADITIONAL", "MODERN", "EVENING", "WEDDING", "AFRICAN_WEAR", "CORPORATE", "CASUAL"]
          : ["TRADITIONAL", "CORPORATE", "MODERN", "CASUAL", "AFRICAN_WEAR"],
        between(1, 3),
      ).map((value) => ({ kind: "STYLE", value })),
      ...pickMany(
        ["KENTE", "ANKARA", "LACE", "LINEN", "COTTON", "SILK", "VELVET", "CHIFFON"],
        between(1, 3),
      ).map((value) => ({ kind: "FABRIC", value })),
      ...pickMany(
        ["BLACK", "GOLD", "IVORY", "BURGUNDY", "EMERALD", "ROYAL_BLUE", "BLUSH", "NAVY"],
        between(1, 3),
      ).map((value) => ({ kind: "COLOR", value })),
    ];

    await prisma.stylePreference.createMany({
      data: prefs.map((pref) => ({
        businessId,
        customerId: customer.id,
        kind: pref.kind,
        value: pref.value,
      })),
    });

    // Measurement history — most customers have been measured more than once.
    const base = bodyProfile(gender);
    const setCount = monthsBack >= 12 ? between(1, 3) : between(1, 2);
    let latestSetId: string | null = null;
    let lastMeasuredAt: Date | null = null;

    for (let s = 0; s < setCount; s += 1) {
      const monthsAgoForSet = Math.max(
        0,
        Math.round(monthsBack - (monthsBack / setCount) * s),
      );
      const drift = s === 0 ? 0 : -between(0, 20);
      const values = { ...base, waist: base.waist + drift, hip: base.hip + Math.round(drift / 2) };
      const measuredAt = monthsAgo(monthsAgoForSet, between(1, 28));
      const set = await createMeasurementSet({
        businessId,
        customerId: customer.id,
        measuredAt,
        measuredBy: pick(staff),
        values,
        notes: s === 0 && chance(0.3) ? pick(STYLE_NOTES) : undefined,
      });
      if (!lastMeasuredAt || measuredAt > lastMeasuredAt) {
        lastMeasuredAt = measuredAt;
        latestSetId = set.id;
      }
    }

    customers.push({
      id: customer.id,
      name: fullName,
      gender,
      latestSetId,
      customerSince,
    });
  }

  // -------------------------------------------------------------------------
  // Orders. Built to explicit targets so the dashboard tells a coherent story
  // rather than whatever a random walk happened to produce.
  // -------------------------------------------------------------------------

  const outfitFor = (gender: "FEMALE" | "MALE") =>
    gender === "FEMALE" ? pick(outfitPool.womens) : pick(outfitPool.mens);

  const priceFor = (outfit: { min: number; max: number }) =>
    cedis(Math.round(between(outfit.min, outfit.max) / 10) * 10);

  const lastVisitByCustomer = new Map<string, Date>();

  async function makeOrder(
    customer: Seeded,
    status: OrderStatus,
    createdAt: Date,
    options2: { deliveryDate: Date | null; deliveredAt?: Date | null; paidRatio: number },
  ) {
    const outfit = outfitFor(customer.gender) as (typeof WOMENS_OUTFITS)[number];
    const priceMinor = priceFor(outfit);
    // paidRatio is a percentage; round the result to a whole cedi.
    const paidMinor = Math.min(
      priceMinor,
      Math.round((priceMinor * options2.paidRatio) / 100 / 100) * 100,
    );

    const order = await createOrder({
      businessId,
      customerId: customer.id,
      customerName: customer.name,
      code: String(orderCode++),
      outfit,
      status,
      createdAt,
      deliveryDate: options2.deliveryDate,
      deliveredAt: options2.deliveredAt ?? null,
      measurementSetId: customer.latestSetId,
      staff,
      priceMinor,
      paidMinor,
      receiptSeed: receiptSeed++,
      fittingDate:
        status === "FITTING" || status === "ADJUSTMENTS" ? daysAhead(between(1, 6), between(9, 16)) : null,
    });

    // Payments: a deposit up front, the balance on or near collection.
    if (paidMinor > 0) {
      const deposit = Math.min(paidMinor, Math.round(priceMinor * 0.5));
      await recordPayment({
        businessId,
        customerId: customer.id,
        orderId: order.id,
        amountMinor: deposit,
        receivedAt: createdAt,
        staff,
        receiptNumber: `${receiptPrefix}-${String(receiptSeed++).padStart(5, "0")}`,
      });
      const rest = paidMinor - deposit;
      if (rest > 0) {
        await recordPayment({
          businessId,
          customerId: customer.id,
          orderId: order.id,
          amountMinor: rest,
          receivedAt: options2.deliveredAt ?? daysAgo(between(0, 20)),
          staff,
          receiptNumber: `${receiptPrefix}-${String(receiptSeed++).padStart(5, "0")}`,
        });
      }
    }

    const visit = options2.deliveredAt ?? createdAt;
    const current = lastVisitByCustomer.get(customer.id);
    if (!current || visit > current) lastVisitByCustomer.set(customer.id, visit);

    return order;
  }

  // Historical delivered orders, spread across the previous 17 months.
  const historicalCount = Math.round(count * 1.5);
  for (let i = 0; i < historicalCount; i += 1) {
    const customer = pick(customers);
    if (customer.customerSince > monthsAgo(1)) continue;
    const monthOffset = between(1, 17);
    const createdAt = monthsAgo(monthOffset, between(1, 20));
    const deliveredAt = new Date(createdAt);
    deliveredAt.setDate(deliveredAt.getDate() + between(10, 32));
    if (deliveredAt > new Date()) continue;

    // A small number of delivered orders were never fully settled — this is
    // what the outstanding-balance alert is for. Kept rare on purpose: a shop
    // carrying unpaid balances on 6% of its history would be in real trouble.
    const paidRatio = chance(0.985) ? 100 : between(60, 85);
    await makeOrder(customer, "DELIVERED", createdAt, {
      deliveryDate: deliveredAt,
      deliveredAt,
      paidRatio,
    });
  }

  // Orders delivered in the current calendar month.
  const now = new Date();
  for (let i = 0; i < deliveredThisMonth; i += 1) {
    const customer = pick(customers);
    const deliveredAt = new Date(
      now.getFullYear(),
      now.getMonth(),
      between(1, Math.max(1, now.getDate())),
      between(9, 17),
      pick([0, 15, 30, 45]),
    );
    const createdAt = new Date(deliveredAt);
    createdAt.setDate(createdAt.getDate() - between(12, 30));
    await makeOrder(customer, "DELIVERED", createdAt, {
      deliveryDate: deliveredAt,
      deliveredAt,
      paidRatio: chance(0.96) ? 100 : between(65, 90),
    });
  }

  // Work currently in progress.
  const activeStatuses: OrderStatus[] = [
    "NEW", "MEASURING", "CUTTING", "SEWING", "SEWING",
    "FITTING", "ADJUSTMENTS", "READY",
  ];
  for (let i = 0; i < activeOrders; i += 1) {
    const customer = pick(customers);
    const createdAt = daysAgo(between(2, 26), between(9, 17));
    const deliveryDate = daysAhead(between(-3, 21), between(10, 17));
    // Half up front is the normal arrangement; a few are settled early and one
    // or two have not paid a deposit yet.
    await makeOrder(customer, pick(activeStatuses), createdAt, {
      deliveryDate,
      paidRatio: pick([50, 50, 50, 50, 60, 40, 70, 100, 0]),
    });
  }

  // A couple of cancellations, so the status filter is not a dead end.
  for (let i = 0; i < 3; i += 1) {
    const customer = pick(customers);
    const createdAt = monthsAgo(between(2, 10), between(1, 25));
    await makeOrder(customer, "CANCELLED", createdAt, {
      deliveryDate: null,
      paidRatio: 0,
    });
  }

  // Backfill last visit and derived tags.
  for (const customer of customers) {
    const lastVisit = lastVisitByCustomer.get(customer.id) ?? customer.customerSince;
    const orderCount = await prisma.order.count({
      where: { businessId, customerId: customer.id },
    });
    const spent = await prisma.payment.aggregate({
      where: { businessId, customerId: customer.id },
      _sum: { amountMinor: true },
    });

    await prisma.customer.update({
      where: { id: customer.id, businessId },
      data: { lastVisitAt: lastVisit },
    });

    const tags: string[] = [];
    if (orderCount === 0 || customer.customerSince > monthsAgo(2)) tags.push("NEW");
    if (orderCount >= 3) tags.push("RETURNING");
    if ((spent._sum.amountMinor ?? 0) > cedis(6000) || orderCount >= 6) tags.push("VIP");
    if (orderCount >= 2 && !tags.includes("VIP")) tags.push("REGULAR");

    if (tags.length > 0) {
      await prisma.customerTag.createMany({
        data: tags.map((label) => ({ businessId, customerId: customer.id, label })),
      });
    }
  }

  return { customers, nextOrderCode: orderCode, nextReceipt: receiptSeed };
}

// ---------------------------------------------------------------------------
// Amanda Mensah — the customer from the product brief
// ---------------------------------------------------------------------------

async function seedAmanda(input: {
  businessId: string;
  staff: StaffMember[];
  code: string;
  orderCode: number;
  receiptPrefix: string;
  receiptSeed: number;
  /** The two businesses know a different Amanda. */
  variant: "couture" | "bridal";
}) {
  const { businessId, staff, variant } = input;
  const owner = staff[0] as StaffMember;

  const customer = await prisma.customer.create({
    data: {
      businessId,
      code: input.code,
      firstName: "Amanda",
      lastName: "Mensah",
      fullName: "Amanda Mensah",
      phone: variant === "couture" ? "+233244881420" : "+233201776354",
      email: "amanda.mensah@gmail.com",
      gender: "FEMALE",
      city: variant === "couture" ? "East Legon" : "Kumasi",
      addressLine: variant === "couture" ? "14 Boundary Road, East Legon" : "8 Ahodwo Road",
      notes:
        variant === "couture"
          ? "Prefers slightly loose sleeves and longer dress length."
          : "Booked for a December wedding. Mother of the bride.",
      customerSince: new Date(2025, 0, 18, 11, 0, 0),
      createdById: owner.id,
      createdAt: new Date(2025, 0, 18, 11, 0, 0),
      searchText: `amanda mensah ${variant === "couture" ? "+233244881420" : "+233201776354"} ${input.code}`.toLowerCase(),
    },
  });

  await prisma.customerTag.createMany({
    data:
      variant === "couture"
        ? [
            { businessId, customerId: customer.id, label: "VIP" },
            { businessId, customerId: customer.id, label: "REGULAR" },
            { businessId, customerId: customer.id, label: "RETURNING" },
          ]
        : [
            { businessId, customerId: customer.id, label: "BRIDAL" },
            { businessId, customerId: customer.id, label: "NEW" },
          ],
  });

  await prisma.styleProfile.create({
    data: {
      businessId,
      customerId: customer.id,
      preferredFit: "REGULAR",
      styleNotes:
        variant === "couture"
          ? "Prefers slightly loose sleeves and longer dress length. Does not like tight waistlines. Always a hidden zipper."
          : "Wants full sleeves and a modest neckline for the ceremony.",
    },
  });

  await prisma.stylePreference.createMany({
    data:
      variant === "couture"
        ? [
            { businessId, customerId: customer.id, kind: "STYLE", value: "EVENING" },
            { businessId, customerId: customer.id, kind: "STYLE", value: "MODERN" },
            { businessId, customerId: customer.id, kind: "STYLE", value: "AFRICAN_WEAR" },
            { businessId, customerId: customer.id, kind: "FABRIC", value: "KENTE" },
            { businessId, customerId: customer.id, kind: "FABRIC", value: "LACE" },
            { businessId, customerId: customer.id, kind: "FABRIC", value: "SILK" },
            { businessId, customerId: customer.id, kind: "COLOR", value: "GOLD" },
            { businessId, customerId: customer.id, kind: "COLOR", value: "BURGUNDY" },
            { businessId, customerId: customer.id, kind: "COLOR", value: "IVORY" },
          ]
        : [
            { businessId, customerId: customer.id, kind: "STYLE", value: "WEDDING" },
            { businessId, customerId: customer.id, kind: "STYLE", value: "TRADITIONAL" },
            { businessId, customerId: customer.id, kind: "FABRIC", value: "LACE" },
            { businessId, customerId: customer.id, kind: "FABRIC", value: "CHIFFON" },
            { businessId, customerId: customer.id, kind: "COLOR", value: "IVORY" },
            { businessId, customerId: customer.id, kind: "COLOR", value: "BLUSH" },
          ],
  });

  // The exact measurement history from the brief: waist 30" → 31" → 32".
  const shared = {
    shoulder: 155,
    bust: 360,
    under_bust: 310,
    armhole: 170,
    sleeve_length: 225,
    bicep: 122,
    wrist: 68,
    thigh: 222,
    knee: 158,
    ankle: 95,
    trouser_length: 395,
    dress_length: 520,
    skirt_length: 340,
    top_length: 255,
    jacket_length: 275,
    shirt_length: 280,
  };

  const history =
    variant === "couture"
      ? [
          { measuredAt: new Date(2025, 8, 12, 10, 30), waist: 300, hip: 385, notes: "First full measurement session." },
          { measuredAt: new Date(2026, 1, 7, 15, 0), waist: 310, hip: 395, notes: null },
          {
            measuredAt: new Date(2026, 7, 26, 11, 15),
            waist: 320,
            hip: 400,
            notes: "Waist up slightly. Keep the usual ease at the waistline.",
          },
        ]
      : [
          { measuredAt: new Date(2026, 5, 3, 12, 0), waist: 315, hip: 398, notes: "Bridal consultation." },
          { measuredAt: new Date(2026, 7, 19, 9, 45), waist: 312, hip: 396, notes: null },
        ];

  let latestSetId: string | null = null;
  for (const entry of history) {
    const set = await createMeasurementSet({
      businessId,
      customerId: customer.id,
      measuredAt: entry.measuredAt,
      measuredBy: owner,
      values: { ...shared, waist: entry.waist, hip: entry.hip },
      notes: entry.notes ?? undefined,
    });
    latestSetId = set.id;
  }

  let receipt = input.receiptSeed;
  let orderCode = input.orderCode;

  if (variant === "couture") {
    // Eight completed outfits, all settled — she is a good customer.
    const completed = [
      { title: "Ankara Peplum Dress", type: "DRESS", fabric: "Ankara", price: 620, month: 17 },
      { title: "Lace Kaba and Slit", type: "TWO_PIECE", fabric: "Lace", price: 980, month: 15 },
      { title: "Corporate Pencil Skirt Suit", type: "SUIT", fabric: "Linen", price: 1150, month: 13 },
      { title: "Silk Wrap Blouse", type: "BLOUSE", fabric: "Silk", price: 420, month: 11 },
      { title: "Satin Cocktail Dress", type: "DRESS", fabric: "Satin", price: 890, month: 8 },
      { title: "Kente Graduation Outfit", type: "TWO_PIECE", fabric: "Kente", price: 1080, month: 6 },
      { title: "Chiffon Bridesmaid Dress", type: "DRESS", fabric: "Chiffon", price: 740, month: 4 },
      { title: "Kente Evening Dress", type: "DRESS", fabric: "Kente", price: 1450, month: 2 },
    ] as const;

    for (const item of completed) {
      const createdAt = monthsAgo(item.month, between(3, 14));
      const deliveredAt = new Date(createdAt);
      deliveredAt.setDate(deliveredAt.getDate() + between(14, 26));
      const priceMinor = cedis(item.price);

      const order = await createOrder({
        businessId,
        customerId: customer.id,
        customerName: "Amanda Mensah",
        code: String(orderCode++),
        outfit: { title: item.title, type: item.type, fabric: item.fabric, min: 0, max: 0 },
        status: "DELIVERED",
        createdAt,
        deliveryDate: deliveredAt,
        deliveredAt,
        measurementSetId: latestSetId,
        staff,
        priceMinor,
        paidMinor: priceMinor,
        receiptSeed: receipt,
      });

      await recordPayment({
        businessId,
        customerId: customer.id,
        orderId: order.id,
        amountMinor: Math.round(priceMinor / 2),
        receivedAt: createdAt,
        staff,
        receiptNumber: `${input.receiptPrefix}-A${String(receipt++).padStart(4, "0")}`,
      });
      await recordPayment({
        businessId,
        customerId: customer.id,
        orderId: order.id,
        amountMinor: priceMinor - Math.round(priceMinor / 2),
        receivedAt: deliveredAt,
        staff,
        receiptNumber: `${input.receiptPrefix}-A${String(receipt++).padStart(4, "0")}`,
      });
    }

    // The live order from the brief's hero: GH₵1,200 with GH₵250 outstanding.
    const createdAt = daysAgo(12, 11, 0);
    const activeOrder = await createOrder({
      businessId,
      customerId: customer.id,
      customerName: "Amanda Mensah",
      code: String(orderCode++),
      outfit: {
        title: "Custom African Print Dress",
        type: "DRESS",
        fabric: "Ankara",
        min: 0,
        max: 0,
      },
      status: "FITTING",
      createdAt,
      deliveryDate: daysAhead(6, 15, 0),
      fittingDate: daysAhead(1, 14, 0),
      measurementSetId: latestSetId,
      staff,
      priceMinor: cedis(1200),
      paidMinor: cedis(950),
      receiptSeed: receipt,
    });

    await recordPayment({
      businessId,
      customerId: customer.id,
      orderId: activeOrder.id,
      amountMinor: cedis(600),
      receivedAt: createdAt,
      staff,
      receiptNumber: `${input.receiptPrefix}-A${String(receipt++).padStart(4, "0")}`,
    });
    await recordPayment({
      businessId,
      customerId: customer.id,
      orderId: activeOrder.id,
      amountMinor: cedis(350),
      receivedAt: daysAgo(3, 16, 0),
      staff,
      receiptNumber: `${input.receiptPrefix}-A${String(receipt++).padStart(4, "0")}`,
    });

    await prisma.fitting.create({
      data: {
        businessId,
        orderId: activeOrder.id,
        customerId: customer.id,
        scheduledFor: daysAhead(1, 14, 0),
        durationMinutes: 30,
        status: "SCHEDULED",
        notes: "Second fitting. Check sleeve ease.",
      },
    });

    await prisma.appointment.create({
      data: {
        businessId,
        customerId: customer.id,
        orderId: activeOrder.id,
        type: "FITTING",
        title: "Fitting — Custom African Print Dress",
        scheduledFor: daysAhead(1, 14, 0),
        durationMinutes: 30,
        status: "SCHEDULED",
        createdById: owner.id,
      },
    });

    await prisma.customer.update({
      where: { id: customer.id, businessId },
      data: { lastVisitAt: daysAgo(3, 16, 0) },
    });
  } else {
    const createdAt = daysAgo(30, 12, 0);
    const order = await createOrder({
      businessId,
      customerId: customer.id,
      customerName: "Amanda Mensah",
      code: String(orderCode++),
      outfit: {
        title: "Mother of the Bride Lace Gown",
        type: "GOWN",
        fabric: "Lace",
        min: 0,
        max: 0,
      },
      status: "SEWING",
      createdAt,
      deliveryDate: daysAhead(34, 12, 0),
      measurementSetId: latestSetId,
      staff,
      priceMinor: cedis(3800),
      paidMinor: cedis(1900),
      receiptSeed: receipt,
    });

    await recordPayment({
      businessId,
      customerId: customer.id,
      orderId: order.id,
      amountMinor: cedis(1900),
      receivedAt: createdAt,
      staff,
      receiptNumber: `${input.receiptPrefix}-A${String(receipt++).padStart(4, "0")}`,
    });

    await prisma.customer.update({
      where: { id: customer.id, businessId },
      data: { lastVisitAt: createdAt },
    });
  }

  return { customerId: customer.id, nextOrderCode: orderCode, nextReceipt: receipt };
}

// ---------------------------------------------------------------------------
// Today's schedule, style library, notifications, audit trail
// ---------------------------------------------------------------------------

async function seedToday(businessId: string, staff: StaffMember[]) {
  const owner = staff[0] as StaffMember;

  const customers = await prisma.customer.findMany({
    where: { businessId },
    take: 14,
    orderBy: { createdAt: "desc" },
    select: { id: true, fullName: true },
  });

  if (customers.length < 8) return;

  // Three fittings and two measurement sessions today, matching the brief's
  // "Today" panel.
  const todaysAppointments = [
    { type: "FITTING", hour: 10, minute: 0, index: 0 },
    { type: "FITTING", hour: 12, minute: 30, index: 1 },
    { type: "FITTING", hour: 15, minute: 0, index: 2 },
    { type: "MEASUREMENT", hour: 9, minute: 30, index: 3 },
    { type: "MEASUREMENT", hour: 16, minute: 15, index: 4 },
    { type: "CONSULTATION", hour: 11, minute: 0, index: 5 },
  ] as const;

  for (const entry of todaysAppointments) {
    const customer = customers[entry.index];
    if (!customer) continue;
    const scheduledFor = daysAgo(0, entry.hour, entry.minute);
    await prisma.appointment.create({
      data: {
        businessId,
        customerId: customer.id,
        type: entry.type,
        title:
          entry.type === "FITTING"
            ? `Fitting — ${customer.fullName}`
            : entry.type === "MEASUREMENT"
              ? `Measurement session — ${customer.fullName}`
              : `Consultation — ${customer.fullName}`,
        scheduledFor,
        durationMinutes: entry.type === "FITTING" ? 30 : 45,
        status: "SCHEDULED",
        createdById: owner.id,
      },
    });
  }

  // A few appointments across the coming weeks so the calendar has substance.
  for (let i = 0; i < 22; i += 1) {
    const customer = pick(customers);
    await prisma.appointment.create({
      data: {
        businessId,
        customerId: customer.id,
        type: pick(["FITTING", "MEASUREMENT", "DELIVERY", "PICKUP", "CONSULTATION"]),
        title: `${pick(["Fitting", "Measurement", "Delivery", "Pickup", "Consultation"])} — ${customer.fullName}`,
        scheduledFor: daysAhead(between(1, 30), between(9, 17), pick([0, 15, 30, 45])),
        durationMinutes: pick([30, 45, 60]),
        status: "SCHEDULED",
        createdById: owner.id,
      },
    });
  }

  // Fittings attached to orders that are at the fitting stage.
  const fittingOrders = await prisma.order.findMany({
    where: { businessId, status: { in: ["FITTING", "ADJUSTMENTS"] } },
    select: { id: true, customerId: true, title: true },
    take: 8,
  });

  for (const order of fittingOrders) {
    await prisma.fitting.create({
      data: {
        businessId,
        orderId: order.id,
        customerId: order.customerId,
        scheduledFor: daysAhead(between(0, 8), between(9, 17), pick([0, 30])),
        durationMinutes: 30,
        status: "SCHEDULED",
        notes: chance(0.4) ? pick(["Check the sleeve ease.", "Confirm hem length.", "Waistline adjustment."]) : null,
      },
    });
  }
}

async function seedStyleLibrary(businessId: string, staff: StaffMember[]) {
  const owner = staff[0] as StaffMember;
  const items = [
    { title: "Gold Kente evening silhouette", category: "KENTE" },
    { title: "Ankara peplum with structured shoulder", category: "ANKARA" },
    { title: "Ivory lace kaba, scalloped edge", category: "WEDDING" },
    { title: "Two-piece corporate set, navy linen", category: "CORPORATE" },
    { title: "Long-sleeve kaftan with neck embroidery", category: "KAFTANS" },
    { title: "Bridal reception mermaid gown", category: "WEDDING" },
    { title: "High-waist trousers, wide leg", category: "TROUSERS" },
    { title: "Three-piece suit, peak lapel", category: "SUITS" },
    { title: "Smock with contrast trim", category: "TRADITIONAL" },
    { title: "Silk wrap blouse, tie waist", category: "SHIRTS" },
    { title: "Tiered maxi dress in chiffon", category: "DRESSES" },
    { title: "Kente stole for graduation", category: "KENTE" },
  ] as const;

  const customers = await prisma.customer.findMany({
    where: { businessId },
    take: 6,
    select: { id: true },
  });

  await prisma.styleLibraryItem.createMany({
    data: items.map((item, index) => ({
      businessId,
      title: item.title,
      category: item.category,
      notes: chance(0.4) ? "Customer favourite. Keep the reference." : null,
      customerId: chance(0.4) ? (customers[index % customers.length]?.id ?? null) : null,
      createdById: owner.id,
      createdAt: daysAgo(between(5, 300)),
    })),
  });
}

async function seedNotificationsAndAudit(businessId: string, staff: StaffMember[]) {
  const owner = staff[0] as StaffMember;

  const recentOrders = await prisma.order.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { id: true, code: true, title: true, customer: { select: { fullName: true } } },
  });

  const overdue = await prisma.order.findMany({
    where: { businessId, balanceMinor: { gt: 0 }, status: "DELIVERED" },
    take: 3,
    select: { id: true, customer: { select: { fullName: true } }, balanceMinor: true },
  });

  const notifications = [
    ...recentOrders.slice(0, 3).map((order, index) => ({
      businessId,
      type: "NEW_ORDER",
      title: "New order created",
      body: `Order #${order.code} — ${order.title} for ${order.customer.fullName}.`,
      entityType: "order",
      entityId: order.id,
      readAt: index === 0 ? null : daysAgo(1),
      createdAt: daysAgo(index, between(9, 17)),
    })),
    ...overdue.map((order, index) => ({
      businessId,
      type: "PAYMENT_OVERDUE",
      title: "Payment overdue",
      body: `${order.customer.fullName} still has an outstanding balance.`,
      entityType: "order",
      entityId: order.id,
      readAt: null,
      createdAt: daysAgo(index + 1, 12),
    })),
    {
      businessId,
      type: "FITTING_TOMORROW",
      title: "Fitting tomorrow",
      body: "You have a fitting scheduled for tomorrow afternoon.",
      entityType: null,
      entityId: null,
      readAt: null,
      createdAt: daysAgo(0, 7, 45),
    },
  ];

  await prisma.notification.createMany({ data: notifications });

  await prisma.auditLog.createMany({
    data: [
      {
        businessId,
        actorId: owner.id,
        actorName: owner.name,
        action: "business.created",
        entityType: "business",
        entityId: businessId,
        summary: "Business created and onboarding completed.",
        createdAt: monthsAgo(18),
      },
      ...recentOrders.slice(0, 4).map((order, index) => ({
        businessId,
        actorId: owner.id,
        actorName: owner.name,
        action: "order.created",
        entityType: "order",
        entityId: order.id,
        summary: `Created order #${order.code} for ${order.customer.fullName}.`,
        createdAt: daysAgo(index, between(9, 17)),
      })),
    ],
  });

  // Pending WhatsApp reminders for the worst offenders.
  for (const order of overdue) {
    const full = await prisma.order.findFirstOrThrow({
      where: { id: order.id, businessId },
      select: { id: true, customerId: true, title: true, balanceMinor: true },
    });
    await prisma.paymentReminder.create({
      data: {
        businessId,
        customerId: full.customerId,
        orderId: full.id,
        channel: "WHATSAPP",
        message: `Hi, a gentle reminder that GH₵${(full.balanceMinor / 100).toLocaleString("en-US")} is outstanding on your ${full.title}. Thank you!`,
        status: "PENDING",
        createdById: owner.id,
        createdAt: daysAgo(between(1, 6)),
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding FIT BY YOU…");
  await reset();
  await seedPlans();

  // -- Business one: an established couture house in Accra -------------------
  const couture = await createBusiness({
    name: "Adjoa Couture",
    slug: "adjoa-couture",
    type: "FASHION_HOUSE",
    tagline: "Bespoke African tailoring since 2018",
    city: "Accra",
    phone: "+233302761940",
    email: "hello@adjoacouture.com",
    planCode: "PROFESSIONAL",
    owner: { name: "Ama Adjoa Boateng", email: "ama@adjoacouture.com" },
    staff: [
      { name: "Kwame Osei", email: "kwame@adjoacouture.com", role: "TAILOR" },
      { name: "Esi Danso", email: "esi@adjoacouture.com", role: "MANAGER" },
    ],
  });

  const coutureSeed = await seedCustomers({
    businessId: couture.business.id,
    staff: couture.staff,
    count: 247,
    codePrefix: "FBY",
    startOrderCode: 1001,
    receiptPrefix: "AC",
    activeOrders: 16,
    deliveredThisMonth: 42,
    femaleBias: 0.78,
    outfitPool: { womens: WOMENS_OUTFITS, mens: MENS_OUTFITS },
  });

  await seedAmanda({
    businessId: couture.business.id,
    staff: couture.staff,
    code: "FBY-0248",
    orderCode: coutureSeed.nextOrderCode,
    receiptPrefix: "AC",
    receiptSeed: coutureSeed.nextReceipt,
    variant: "couture",
  });

  await seedToday(couture.business.id, couture.staff);
  await seedStyleLibrary(couture.business.id, couture.staff);
  await seedNotificationsAndAudit(couture.business.id, couture.staff);
  console.log("  Adjoa Couture: 248 customers");

  // -- Business two: a small bridal studio in Kumasi ------------------------
  const bridal = await createBusiness({
    name: "Nuru Bridal House",
    slug: "nuru-bridal-house",
    type: "BRIDAL_DESIGNER",
    tagline: "Wedding dressmaking, made personal",
    city: "Kumasi",
    phone: "+233322045118",
    email: "studio@nurubridal.com",
    planCode: "STARTER",
    owner: { name: "Nuru Abdallah", email: "nuru@nurubridal.com" },
  });

  const bridalSeed = await seedCustomers({
    businessId: bridal.business.id,
    staff: bridal.staff,
    count: 33,
    codePrefix: "NBH",
    startOrderCode: 2001,
    receiptPrefix: "NB",
    activeOrders: 6,
    deliveredThisMonth: 4,
    femaleBias: 0.94,
    outfitPool: {
      womens: WOMENS_OUTFITS.filter((o) =>
        ["GOWN", "DRESS", "TWO_PIECE"].includes(o.type),
      ) as unknown as typeof WOMENS_OUTFITS,
      mens: MENS_OUTFITS.filter((o) => o.type === "SUIT") as unknown as typeof MENS_OUTFITS,
    },
  });

  await seedAmanda({
    businessId: bridal.business.id,
    staff: bridal.staff,
    code: "NBH-0034",
    orderCode: bridalSeed.nextOrderCode,
    receiptPrefix: "NB",
    receiptSeed: bridalSeed.nextReceipt,
    variant: "bridal",
  });

  await seedToday(bridal.business.id, bridal.staff);
  await seedStyleLibrary(bridal.business.id, bridal.staff);
  await seedNotificationsAndAudit(bridal.business.id, bridal.staff);
  console.log("  Nuru Bridal House: 34 customers");

  // -- Summary --------------------------------------------------------------
  for (const business of [couture.business, bridal.business]) {
    const [customers, orders, active, outstanding] = await Promise.all([
      prisma.customer.count({ where: { businessId: business.id } }),
      prisma.order.count({ where: { businessId: business.id } }),
      prisma.order.count({
        where: {
          businessId: business.id,
          status: { notIn: ["DELIVERED", "CANCELLED"] },
        },
      }),
      prisma.order.aggregate({
        where: { businessId: business.id, status: { not: "CANCELLED" } },
        _sum: { balanceMinor: true },
      }),
    ]);

    console.log(
      `\n  ${business.name}: ${customers} customers, ${orders} orders (${active} active), ` +
        `GH₵${((outstanding._sum.balanceMinor ?? 0) / 100).toLocaleString("en-US")} outstanding`,
    );
  }

  console.log("\nSign in with any of:");
  console.log("  ama@adjoacouture.com    / fitbyyou123   (Owner)");
  console.log("  esi@adjoacouture.com    / fitbyyou123   (Manager)");
  console.log("  kwame@adjoacouture.com  / fitbyyou123   (Tailor)");
  console.log("  nuru@nurubridal.com     / fitbyyou123   (Owner, separate business)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
