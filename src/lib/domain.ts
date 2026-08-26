import { z } from "zod";

/**
 * Every "enum" in FIT BY YOU lives here as a const tuple plus a zod schema.
 * The database stores plain strings so the schema stays portable between
 * SQLite and PostgreSQL; this file is what makes them type-safe and validated.
 */

export type Tone =
  | "neutral"
  | "accent"
  | "positive"
  | "caution"
  | "critical"
  | "info";

type Meta<T extends string> = Record<T, { label: string; tone?: Tone; hint?: string }>;

// ---------------------------------------------------------------------------
// Business
// ---------------------------------------------------------------------------

export const BUSINESS_TYPES = [
  "TAILOR",
  "SEAMSTRESS",
  "FASHION_DESIGNER",
  "BRIDAL_DESIGNER",
  "ALTERATION_SPECIALIST",
  "FASHION_HOUSE",
] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];
export const businessTypeSchema = z.enum(BUSINESS_TYPES);

export const BUSINESS_TYPE_META: Meta<BusinessType> = {
  TAILOR: { label: "Tailor" },
  SEAMSTRESS: { label: "Seamstress" },
  FASHION_DESIGNER: { label: "Fashion Designer" },
  BRIDAL_DESIGNER: { label: "Bridal Designer" },
  ALTERATION_SPECIALIST: { label: "Alteration Specialist" },
  FASHION_HOUSE: { label: "Fashion House" },
};

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export const ROLES = ["OWNER", "MANAGER", "TAILOR", "ASSISTANT"] as const;
export type Role = (typeof ROLES)[number];
export const roleSchema = z.enum(ROLES);

export const ROLE_META: Meta<Role> = {
  OWNER: { label: "Owner", tone: "accent", hint: "Full access to everything" },
  MANAGER: { label: "Manager", tone: "info", hint: "Runs the business day to day" },
  TAILOR: { label: "Tailor", tone: "neutral", hint: "Customers, measurements and orders" },
  ASSISTANT: { label: "Assistant", tone: "neutral", hint: "Limited customer and order access" },
};

export const MEMBERSHIP_STATUSES = ["ACTIVE", "INVITED", "SUSPENDED"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];
export const membershipStatusSchema = z.enum(MEMBERSHIP_STATUSES);

export const MEMBERSHIP_STATUS_META: Meta<MembershipStatus> = {
  ACTIVE: { label: "Active", tone: "positive" },
  INVITED: { label: "Invited", tone: "caution" },
  SUSPENDED: { label: "Suspended", tone: "critical" },
};

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export const GENDERS = ["FEMALE", "MALE", "OTHER", "UNSPECIFIED"] as const;
export type Gender = (typeof GENDERS)[number];
export const genderSchema = z.enum(GENDERS);

export const GENDER_META: Meta<Gender> = {
  FEMALE: { label: "Female" },
  MALE: { label: "Male" },
  OTHER: { label: "Other" },
  UNSPECIFIED: { label: "Prefer not to say" },
};

export const CUSTOMER_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
export const customerStatusSchema = z.enum(CUSTOMER_STATUSES);

export const CUSTOMER_TAGS = [
  "VIP",
  "REGULAR",
  "NEW",
  "RETURNING",
  "BRIDAL",
  "WHOLESALE",
] as const;
export type CustomerTagLabel = (typeof CUSTOMER_TAGS)[number];
export const customerTagSchema = z.enum(CUSTOMER_TAGS);

export const CUSTOMER_TAG_META: Meta<CustomerTagLabel> = {
  VIP: { label: "VIP", tone: "accent" },
  REGULAR: { label: "Regular Customer", tone: "neutral" },
  NEW: { label: "New Customer", tone: "info" },
  RETURNING: { label: "Returning", tone: "positive" },
  BRIDAL: { label: "Bridal", tone: "accent" },
  WHOLESALE: { label: "Wholesale", tone: "neutral" },
};

/** Filters on the customer list. Some are derived rather than stored. */
export const CUSTOMER_FILTERS = [
  "ALL",
  "NEW",
  "ACTIVE",
  "RETURNING",
  "VIP",
  "OUTSTANDING",
  "ARCHIVED",
] as const;
export type CustomerFilter = (typeof CUSTOMER_FILTERS)[number];

export const CUSTOMER_FILTER_META: Meta<CustomerFilter> = {
  ALL: { label: "All customers" },
  NEW: { label: "New" },
  ACTIVE: { label: "Active" },
  RETURNING: { label: "Returning" },
  VIP: { label: "VIP" },
  OUTSTANDING: { label: "Outstanding balance" },
  ARCHIVED: { label: "Archived" },
};

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

export const MEASUREMENT_GROUPS = [
  "UPPER_BODY",
  "LOWER_BODY",
  "GARMENT",
  "CUSTOM",
] as const;
export type MeasurementGroup = (typeof MEASUREMENT_GROUPS)[number];
export const measurementGroupSchema = z.enum(MEASUREMENT_GROUPS);

export const MEASUREMENT_GROUP_META: Meta<MeasurementGroup> = {
  UPPER_BODY: {
    label: "Upper Body",
    hint: "Shoulder down to the wrist. Leave blank anything you did not measure.",
  },
  LOWER_BODY: {
    label: "Waist & Lower Body",
    hint: "Waist through to the ankle.",
  },
  GARMENT: {
    label: "Full Garment",
    hint: "Finished lengths, measured on the body or an existing piece.",
  },
  CUSTOM: {
    label: "Your Own Measurements",
    hint: "Fields you added for the way you work.",
  },
};

export const MEASUREMENT_UNITS = ["in", "cm"] as const;
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];
export const measurementUnitSchema = z.enum(MEASUREMENT_UNITS);

/**
 * The standard catalogue seeded for every new business, exactly as grouped in
 * the product brief. Businesses can add their own fields on top.
 */
export const DEFAULT_MEASUREMENT_FIELDS: ReadonlyArray<{
  key: string;
  label: string;
  group: MeasurementGroup;
}> = [
  { key: "shoulder", label: "Shoulder", group: "UPPER_BODY" },
  { key: "bust", label: "Bust", group: "UPPER_BODY" },
  { key: "under_bust", label: "Under Bust", group: "UPPER_BODY" },
  { key: "armhole", label: "Armhole", group: "UPPER_BODY" },
  { key: "sleeve_length", label: "Sleeve Length", group: "UPPER_BODY" },
  { key: "bicep", label: "Bicep", group: "UPPER_BODY" },
  { key: "wrist", label: "Wrist", group: "UPPER_BODY" },

  { key: "waist", label: "Waist", group: "LOWER_BODY" },
  { key: "hip", label: "Hip", group: "LOWER_BODY" },
  { key: "thigh", label: "Thigh", group: "LOWER_BODY" },
  { key: "knee", label: "Knee", group: "LOWER_BODY" },
  { key: "ankle", label: "Ankle", group: "LOWER_BODY" },
  { key: "trouser_length", label: "Trouser Length", group: "LOWER_BODY" },

  { key: "dress_length", label: "Dress Length", group: "GARMENT" },
  { key: "skirt_length", label: "Skirt Length", group: "GARMENT" },
  { key: "top_length", label: "Top Length", group: "GARMENT" },
  { key: "jacket_length", label: "Jacket Length", group: "GARMENT" },
  { key: "shirt_length", label: "Shirt Length", group: "GARMENT" },
];

/** The three fields shown in compact summaries and on the hero dashboard. */
export const HEADLINE_MEASUREMENT_KEYS = ["bust", "waist", "hip"] as const;

/** 32.5 in is stored as 325. */
export function tenthsToDisplay(tenths: number): string {
  const whole = Math.trunc(tenths / 10);
  const fraction = Math.abs(tenths % 10);
  return fraction === 0 ? `${whole}` : `${whole}.${fraction}`;
}

export function displayToTenths(value: string | number): number | null {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 10);
}

export function convertTenths(
  tenths: number,
  from: MeasurementUnit,
  to: MeasurementUnit,
): number {
  if (from === to) return tenths;
  if (from === "in" && to === "cm") return Math.round(tenths * 2.54);
  return Math.round(tenths / 2.54);
}

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------

export const PREFERRED_FITS = ["SLIM", "REGULAR", "RELAXED", "OVERSIZED"] as const;
export type PreferredFit = (typeof PREFERRED_FITS)[number];
export const preferredFitSchema = z.enum(PREFERRED_FITS);

export const PREFERRED_FIT_META: Meta<PreferredFit> = {
  SLIM: { label: "Slim" },
  REGULAR: { label: "Regular" },
  RELAXED: { label: "Relaxed" },
  OVERSIZED: { label: "Oversized" },
};

export const PREFERENCE_KINDS = ["STYLE", "COLOR", "FABRIC"] as const;
export type PreferenceKind = (typeof PREFERENCE_KINDS)[number];
export const preferenceKindSchema = z.enum(PREFERENCE_KINDS);

export const STYLE_PREFERENCES = [
  "TRADITIONAL",
  "MODERN",
  "CORPORATE",
  "CASUAL",
  "EVENING",
  "WEDDING",
  "AFRICAN_WEAR",
] as const;
export type StylePreferenceValue = (typeof STYLE_PREFERENCES)[number];

export const STYLE_PREFERENCE_META: Meta<StylePreferenceValue> = {
  TRADITIONAL: { label: "Traditional" },
  MODERN: { label: "Modern" },
  CORPORATE: { label: "Corporate" },
  CASUAL: { label: "Casual" },
  EVENING: { label: "Evening" },
  WEDDING: { label: "Wedding" },
  AFRICAN_WEAR: { label: "African Wear" },
};

export const FABRIC_PREFERENCES = [
  "LACE",
  "KENTE",
  "ANKARA",
  "LINEN",
  "COTTON",
  "SILK",
  "VELVET",
  "DENIM",
  "CHIFFON",
  "SATIN",
] as const;
export type FabricPreferenceValue = (typeof FABRIC_PREFERENCES)[number];

export const FABRIC_PREFERENCE_META: Meta<FabricPreferenceValue> = {
  LACE: { label: "Lace" },
  KENTE: { label: "Kente" },
  ANKARA: { label: "Ankara" },
  LINEN: { label: "Linen" },
  COTTON: { label: "Cotton" },
  SILK: { label: "Silk" },
  VELVET: { label: "Velvet" },
  DENIM: { label: "Denim" },
  CHIFFON: { label: "Chiffon" },
  SATIN: { label: "Satin" },
};

export const COLOR_PREFERENCES = [
  { value: "BLACK", label: "Black", hex: "#111114" },
  { value: "WHITE", label: "White", hex: "#FAFAFA" },
  { value: "IVORY", label: "Ivory", hex: "#F2EADB" },
  { value: "GOLD", label: "Gold", hex: "#C9A24B" },
  { value: "BURGUNDY", label: "Burgundy", hex: "#6E1F2E" },
  { value: "EMERALD", label: "Emerald", hex: "#1F5D4C" },
  { value: "ROYAL_BLUE", label: "Royal Blue", hex: "#22406E" },
  { value: "TERRACOTTA", label: "Terracotta", hex: "#B4552F" },
  { value: "BLUSH", label: "Blush", hex: "#E4B7B2" },
  { value: "NAVY", label: "Navy", hex: "#1B2A44" },
  { value: "OLIVE", label: "Olive", hex: "#5C6236" },
  { value: "PURPLE", label: "Purple", hex: "#4B2E63" },
] as const;
export type ColorPreferenceValue = (typeof COLOR_PREFERENCES)[number]["value"];

export function colorHex(value: string): string {
  return COLOR_PREFERENCES.find((c) => c.value === value)?.hex ?? "#C9C9D2";
}

// ---------------------------------------------------------------------------
// Photos & style library
// ---------------------------------------------------------------------------

export const PHOTO_CATEGORIES = [
  "REFERENCE",
  "PREVIOUS_OUTFIT",
  "INSPIRATION",
  "FINISHED",
  "FITTING",
  "FABRIC",
  "STYLE_REFERENCE",
] as const;
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];
export const photoCategorySchema = z.enum(PHOTO_CATEGORIES);

export const PHOTO_CATEGORY_META: Meta<PhotoCategory> = {
  REFERENCE: { label: "Customer Reference" },
  PREVIOUS_OUTFIT: { label: "Previous Outfit" },
  INSPIRATION: { label: "Inspiration" },
  FINISHED: { label: "Finished Outfit" },
  FITTING: { label: "Fitting" },
  FABRIC: { label: "Fabric" },
  STYLE_REFERENCE: { label: "Style Reference" },
};

export const STYLE_CATEGORIES = [
  "DRESSES",
  "SHIRTS",
  "TROUSERS",
  "SUITS",
  "KAFTANS",
  "KENTE",
  "ANKARA",
  "WEDDING",
  "CORPORATE",
  "TRADITIONAL",
] as const;
export type StyleCategory = (typeof STYLE_CATEGORIES)[number];
export const styleCategorySchema = z.enum(STYLE_CATEGORIES);

export const STYLE_CATEGORY_META: Meta<StyleCategory> = {
  DRESSES: { label: "Dresses" },
  SHIRTS: { label: "Shirts" },
  TROUSERS: { label: "Trousers" },
  SUITS: { label: "Suits" },
  KAFTANS: { label: "Kaftans" },
  KENTE: { label: "Kente" },
  ANKARA: { label: "Ankara" },
  WEDDING: { label: "Wedding" },
  CORPORATE: { label: "Corporate" },
  TRADITIONAL: { label: "Traditional" },
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const OUTFIT_TYPES = [
  "DRESS",
  "GOWN",
  "SHIRT",
  "BLOUSE",
  "TROUSERS",
  "SKIRT",
  "SUIT",
  "KAFTAN",
  "SMOCK",
  "AGBADA",
  "TWO_PIECE",
  "OTHER",
] as const;
export type OutfitType = (typeof OUTFIT_TYPES)[number];
export const outfitTypeSchema = z.enum(OUTFIT_TYPES);

export const OUTFIT_TYPE_META: Meta<OutfitType> = {
  DRESS: { label: "Dress" },
  GOWN: { label: "Gown" },
  SHIRT: { label: "Shirt" },
  BLOUSE: { label: "Blouse" },
  TROUSERS: { label: "Trousers" },
  SKIRT: { label: "Skirt" },
  SUIT: { label: "Suit" },
  KAFTAN: { label: "Kaftan" },
  SMOCK: { label: "Smock" },
  AGBADA: { label: "Agbada" },
  TWO_PIECE: { label: "Two Piece" },
  OTHER: { label: "Other" },
};

export const ORDER_STATUSES = [
  "NEW",
  "MEASURING",
  "CUTTING",
  "SEWING",
  "FITTING",
  "ADJUSTMENTS",
  "READY",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const orderStatusSchema = z.enum(ORDER_STATUSES);

/** The happy path, in order. CANCELLED sits outside the flow. */
export const ORDER_STATUS_FLOW = [
  "NEW",
  "MEASURING",
  "CUTTING",
  "SEWING",
  "FITTING",
  "ADJUSTMENTS",
  "READY",
  "DELIVERED",
] as const satisfies ReadonlyArray<OrderStatus>;

export const ORDER_STATUS_META: Meta<OrderStatus> = {
  NEW: { label: "New", tone: "info" },
  MEASURING: { label: "Measuring", tone: "info" },
  CUTTING: { label: "Cutting", tone: "caution" },
  SEWING: { label: "Sewing", tone: "caution" },
  FITTING: { label: "Fitting", tone: "caution" },
  ADJUSTMENTS: { label: "Adjustments", tone: "caution" },
  READY: { label: "Ready", tone: "positive" },
  DELIVERED: { label: "Delivered", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "critical" },
};

/** Statuses that count as work in progress on the dashboard. */
export const ACTIVE_ORDER_STATUSES = [
  "NEW",
  "MEASURING",
  "CUTTING",
  "SEWING",
  "FITTING",
  "ADJUSTMENTS",
  "READY",
] as const satisfies ReadonlyArray<OrderStatus>;

export function orderStatusIndex(status: string): number {
  return (ORDER_STATUS_FLOW as readonly string[]).indexOf(status);
}

export function orderProgress(status: string): number {
  if (status === "CANCELLED") return 0;
  const index = orderStatusIndex(status);
  if (index < 0) return 0;
  return Math.round((index / (ORDER_STATUS_FLOW.length - 1)) * 100);
}

export const ORDER_PRIORITIES = ["NORMAL", "RUSH"] as const;
export type OrderPriority = (typeof ORDER_PRIORITIES)[number];
export const orderPrioritySchema = z.enum(ORDER_PRIORITIES);

export const TIMELINE_EVENT_TYPES = [
  "CREATED",
  "STATUS_CHANGED",
  "MEASUREMENT_TAKEN",
  "FABRIC_RECEIVED",
  "FITTING_SCHEDULED",
  "FITTING_COMPLETED",
  "PAYMENT_RECORDED",
  "PHOTO_ADDED",
  "NOTE_ADDED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

export const FITTING_STATUSES = ["SCHEDULED", "COMPLETED", "MISSED", "CANCELLED"] as const;
export type FittingStatus = (typeof FITTING_STATUSES)[number];
export const fittingStatusSchema = z.enum(FITTING_STATUSES);

export const APPOINTMENT_TYPES = [
  "MEASUREMENT",
  "FITTING",
  "CONSULTATION",
  "DELIVERY",
  "PICKUP",
  "OTHER",
] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];
export const appointmentTypeSchema = z.enum(APPOINTMENT_TYPES);

export const APPOINTMENT_TYPE_META: Meta<AppointmentType> = {
  MEASUREMENT: { label: "Measurement", tone: "info" },
  FITTING: { label: "Fitting", tone: "accent" },
  CONSULTATION: { label: "Consultation", tone: "neutral" },
  DELIVERY: { label: "Delivery", tone: "positive" },
  PICKUP: { label: "Pickup", tone: "positive" },
  OTHER: { label: "Other", tone: "neutral" },
};

export const APPOINTMENT_STATUSES = [
  "SCHEDULED",
  "COMPLETED",
  "MISSED",
  "CANCELLED",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES);

export const APPOINTMENT_STATUS_META: Meta<AppointmentStatus> = {
  SCHEDULED: { label: "Scheduled", tone: "info" },
  COMPLETED: { label: "Completed", tone: "positive" },
  MISSED: { label: "Missed", tone: "critical" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

/** Colour keys for calendar chips, kept deliberately muted. */
export const CALENDAR_EVENT_KINDS = [
  "APPOINTMENT",
  "FITTING",
  "DELIVERY",
  "DEADLINE",
  "REMINDER",
] as const;
export type CalendarEventKind = (typeof CALENDAR_EVENT_KINDS)[number];

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

export const PAYMENT_METHODS = [
  "CASH",
  "MOBILE_MONEY",
  "BANK_TRANSFER",
  "CARD",
  "OTHER",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);

export const PAYMENT_METHOD_META: Meta<PaymentMethod> = {
  CASH: { label: "Cash" },
  MOBILE_MONEY: { label: "Mobile Money" },
  BANK_TRANSFER: { label: "Bank Transfer" },
  CARD: { label: "Card" },
  OTHER: { label: "Other" },
};

export const REMINDER_CHANNELS = ["WHATSAPP", "SMS", "EMAIL"] as const;
export type ReminderChannel = (typeof REMINDER_CHANNELS)[number];
export const reminderChannelSchema = z.enum(REMINDER_CHANNELS);

export const REMINDER_STATUSES = ["PENDING", "SENT", "DISMISSED"] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

// ---------------------------------------------------------------------------
// Platform
// ---------------------------------------------------------------------------

export const NOTIFICATION_TYPES = [
  "NEW_ORDER",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "FITTING_TOMORROW",
  "DELIVERY_DUE",
  "NEW_CUSTOMER",
  "MEASUREMENT_UPDATED",
  "SUBSCRIPTION_RENEWAL",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_META: Meta<NotificationType> = {
  NEW_ORDER: { label: "New order", tone: "info" },
  PAYMENT_RECEIVED: { label: "Payment received", tone: "positive" },
  PAYMENT_OVERDUE: { label: "Payment overdue", tone: "critical" },
  FITTING_TOMORROW: { label: "Fitting tomorrow", tone: "accent" },
  DELIVERY_DUE: { label: "Delivery due", tone: "caution" },
  NEW_CUSTOMER: { label: "New customer", tone: "info" },
  MEASUREMENT_UPDATED: { label: "Measurement updated", tone: "neutral" },
  SUBSCRIPTION_RENEWAL: { label: "Subscription renewal", tone: "neutral" },
};

export const PLAN_CODES = ["STARTER", "PROFESSIONAL", "BUSINESS"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];
export const planCodeSchema = z.enum(PLAN_CODES);

export const SUBSCRIPTION_STATUSES = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELLED",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_STATUS_META: Meta<SubscriptionStatus> = {
  TRIALING: { label: "Free trial", tone: "accent" },
  ACTIVE: { label: "Active", tone: "positive" },
  PAST_DUE: { label: "Past due", tone: "critical" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export const BILLING_INTERVALS = ["MONTHLY", "YEARLY"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const INVOICE_STATUSES = ["DRAFT", "OPEN", "PAID", "VOID"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

/** Falls back to a humanised version of the raw value rather than throwing. */
export function labelFor<T extends string>(
  meta: Partial<Record<string, { label: string }>>,
  value: T | string | null | undefined,
  fallback = "—",
): string {
  if (!value) return fallback;
  return meta[value]?.label ?? humanise(value);
}

export function toneFor(
  meta: Partial<Record<string, { tone?: Tone }>>,
  value: string | null | undefined,
): Tone {
  if (!value) return "neutral";
  return meta[value]?.tone ?? "neutral";
}

export function humanise(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
