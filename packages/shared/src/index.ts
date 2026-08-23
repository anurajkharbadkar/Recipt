// ─── Brand ──────────────────────────────────────────────────────────────────
// Single source of truth for the platform's own name/tagline (distinct from
// any org's name, which is user data). Every UI string, API response and
// metadata field that names the platform should read from here rather than
// hardcode "E-PavtiBook" — that's what let it drift into "e Pavti Book",
// "e-Pavti Book" and split-weight lockups across a dozen files before this
// existed (2026-08 brand pass). Capitalization/spacing matches the actual
// designed wordmark lockup, not a generic title-case guess.
export const BRAND_NAME = 'E-PavtiBook';
export const BRAND_SHORT_NAME = 'E-Pavti';
export const BRAND_TAGLINE = 'Collect. Record. Share.';
/** The emotional/campaign headline — see BRAND_TAGLINE for the short-form one. */
export const BRAND_TAGLINE_ALT = 'Your Pavti. Now Digital.';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  TREASURER = 'TREASURER',
  COLLECTOR = 'COLLECTOR',
  VIEWER = 'VIEWER',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export enum SubscriptionStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
}

/**
 * Every plan is valid for one 30-day period from signup — set as
 * Organization.subscriptionExpiry by AuthService.register, checked on every
 * write request by apps/api's SubscriptionGuard, and worth keeping in one
 * place since it's also what the pricing page/registration form promise the
 * org they're paying for (2026-08 roles/subscription audit).
 */
export const SUBSCRIPTION_PERIOD_DAYS = 30;

// The Free Trial is intentionally shorter than a real subscription period —
// "try the full Premium experience for a week" (see MAX_ACTIVE_CAMPAIGNS_BY_PLAN
// and MAX_COLLECTORS_BY_PLAN below, both set to Premium's own values for FREE)
// rather than a month of the base tier. Checked only in AuthService.register's
// expiry calculation for a FREE signup — every other plan still uses
// SUBSCRIPTION_PERIOD_DAYS (2026-08-22 free-trial rework).
export const FREE_TRIAL_PERIOD_DAYS = 7;

// How many campaigns an org may run ACTIVE at once, by plan. Enforced when a
// campaign transitions to ACTIVE (apps/api CampaignsService.activate) — a
// campaign can always be created/edited as DRAFT regardless of this limit,
// since only ACTIVE campaigns accept receipts. Shared so the web app can
// pre-emptively disable/explain the "Activate" action instead of only
// discovering the block after a failed request.
//
// FREE matches PREMIUM, not BASIC — the 7-day trial is meant to show the
// full Premium experience, with only the receipt count actually capped
// (MAX_RECEIPTS_BY_PLAN below). BASIC's own card/comparison-table row no
// longer inherits this value from FREE (see its own explicit 'collectors'/
// 'activeFestivals' features in PRICING_PLANS) specifically so bumping
// FREE here can't silently overstate what a real ₹499 BASIC subscription
// actually gets (2026-08-22 free-trial rework).
export const MAX_ACTIVE_CAMPAIGNS_BY_PLAN: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 5,
  [SubscriptionPlan.BASIC]: 1,
  [SubscriptionPlan.STANDARD]: 2,
  [SubscriptionPlan.PREMIUM]: 5,
};

// How many staff accounts (COLLECTOR/TREASURER — not the ORG_ADMIN account
// itself) an org may add, by plan. Enforced in CollectorsService.create.
// -1 = unlimited — PREMIUM was previously capped at 10, which contradicted
// the plan being sold/intended as unlimited collectors.
//
// FREE matches PREMIUM (unlimited) for the same reason as
// MAX_ACTIVE_CAMPAIGNS_BY_PLAN above — see that constant's comment.
export const MAX_COLLECTORS_BY_PLAN: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: -1,
  [SubscriptionPlan.BASIC]: 5,
  [SubscriptionPlan.STANDARD]: 10,
  [SubscriptionPlan.PREMIUM]: -1,
};

// How many receipts (pavtis) an org may ever create, by plan — the actual
// "free trial" cap. Enforced in ReceiptsService.create, counting every
// receipt the org has ever created (voided or not — voiding one doesn't
// free up a trial slot). -1 = unlimited, same sentinel as the two limits
// above. Only FREE is actually capped today; paid plans are unlimited on
// receipt count (that's what "Unlimited Digital Receipts" on the pricing
// page promises).
export const MAX_RECEIPTS_BY_PLAN: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 10,
  [SubscriptionPlan.BASIC]: -1,
  [SubscriptionPlan.STANDARD]: -1,
  [SubscriptionPlan.PREMIUM]: -1,
};

/**
 * Renders a plan limit for display, e.g. on the pricing page — -1 (this
 * file's "unlimited" sentinel, see MAX_COLLECTORS_BY_PLAN/MAX_RECEIPTS_BY_PLAN
 * above) becomes "Unlimited", anything else becomes "Up to {n}". Centralizing
 * this is what stops a pricing bullet from ever literally printing "Up to
 * -1 Collectors" again (PREMIUM's collector limit is -1, and PRICING_PLANS
 * used to interpolate it directly).
 */
export function formatPlanLimit(n: number, unit: string): string {
  return n === -1 ? `Unlimited ${unit}` : `Up to ${n} ${unit}`;
}

// ─── Donation Split Policy (Cashfree Easy Split) ───────────────────────────
// The single source of truth for how a donation gets divided between the
// Mandal and the platform, and who eats Cashfree's gateway fee. Verified
// live in Sandbox (see Digital_Pavti_Cashfree_EasySplit_Developer_Handover.md):
// a ₹100 order with order_splits [{vendor_id, percentage: 100}] settles the
// full ₹100 gross to the Mandal's vendor account, and Cashfree's fee is then
// deducted from the *platform's own* settlement (feeHandling: 'PLATFORM'),
// not the Mandal's.
//
// Nothing calls this yet — there's no public donation endpoint built (only
// the sandbox test flow in apps/api/src/payments/cashfree), so this exists
// purely to record the decision in one typed place instead of a value some
// future caller would otherwise hardcode inline. When that endpoint gets
// built, it should read this constant for the split it sends to
// CashfreeService.createOrder's orderSplits, not repeat the numbers itself.
//
// IMPORTANT — feeHandling: 'PLATFORM' assumes Cashfree's current 0% UPI
// promotional MDR (domestic, ≤₹20L/month GTV, ≥40% UPI mix, valid through
// 2027-03-31) actually applies to the production account. That must be
// confirmed in the live Cashfree dashboard/contract, not assumed from their
// public pricing page, before this policy is treated as costing the
// platform ₹0 per donation. If the account is on the 1.95%+GST standard
// rate instead, 'PLATFORM' means the platform loses ~2.3% per donation —
// see the same handover doc for the fee-handling alternatives ('MANDAL' —
// reduce vendorShare below 100 — or a donor convenience fee, tracked
// separately since it changes the checkout amount, not the split).
export type VendorShareType = 'PERCENTAGE' | 'AMOUNT';
export type PaymentFeeHandling = 'PLATFORM' | 'MANDAL';

export interface DonationSplitPolicy {
  /** Always 0 today — Digital Pavti charges no commission on donations,
   *  only the org's subscription fee. Kept explicit (not just "100 - vendorShare")
   *  so a future 3-way split (platform commission + Mandal + fee) doesn't
   *  have to guess this was always meant to be zero. */
  platformCommissionPercent: number;
  vendorShareType: VendorShareType;
  /** 100 under vendorShareType 'PERCENTAGE' == the full gross donation, per
   *  the verified Sandbox result above. */
  vendorShare: number;
  feeHandling: PaymentFeeHandling;
}

export const DEFAULT_DONATION_SPLIT_POLICY: DonationSplitPolicy = {
  platformCommissionPercent: 0,
  vendorShareType: 'PERCENTAGE',
  vendorShare: 100,
  feeHandling: 'PLATFORM',
};

// ─── Pricing (public plan catalog) ─────────────────────────────────────────
// Single source of truth for the marketing pricing page AND the registration
// plan picker, so the price/feature list a visitor sees before signing up is
// guaranteed to match what they're actually offered on the signup form —
// same "one definition, multiple consumers" approach as RECEIPT_THEMES.
/** Groups a feature for the "Compare all plans" table (see
 *  resolvePlanFeatures/FEATURE_CATEGORY_LABELS below) — purely a display
 *  taxonomy, doesn't affect the card ladder. Optional: a bullet that isn't a
 *  categorizable capability (e.g. FREE's "No Payment Needed to Start") just
 *  doesn't appear in the comparison table. */
export type PricingFeatureCategory =
  | 'pavti' | 'collections' | 'donors' | 'payments'
  | 'expenses' | 'reports' | 'branding' | 'team' | 'support';

export const FEATURE_CATEGORY_LABELS: Record<PricingFeatureCategory, string> = {
  pavti: 'Digital Pavti',
  collections: 'Collections',
  donors: 'Donors',
  payments: 'Payments',
  expenses: 'Expenses',
  reports: 'Reports & Analytics',
  branding: 'Branding',
  team: 'Team & Access',
  support: 'Support',
};

export interface PricingPlanFeature {
  label: string;
  description?: string;
  /** Feature is listed for transparency about what's coming, but not usable yet. */
  comingSoon?: boolean;
  category?: PricingFeatureCategory;
  /** Stable id for the capability this bullet describes (e.g. 'collectors',
   *  'receipts', 'activeFestivals') — set on any feature whose *value*
   *  changes between tiers. resolvePlanFeatures uses it to let a higher
   *  tier's value supersede a lower tier's when computing the cumulative
   *  set for the comparison table, instead of both stacking up (Standard
   *  would otherwise show "Up to 5 Collectors" *and* "Up to 10 Collectors"
   *  side by side — contradictory, not a real limit). Leave unset on a
   *  bullet that only ever appears once (e.g. "No Payment Needed to
   *  Start") — nothing to supersede. */
  key?: string;
}

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  tagline: string;
  /** Short value statement above the plan name — "Experience", "Go Digital",
   *  "Manage Better", "Elevate the Experience" (2026-08 brand pass). The
   *  progression itself, not just a price ladder. */
  positioningLine: string;
  /** Marathi descriptor shown as a secondary line under the plan name —
   *  personality/positioning layer, not a translation of the feature list
   *  (which stays English; see PricingCard). */
  marathiDescriptor: string;
  priceInr: number;
  priceNote: string;
  highlighted?: boolean;
  collectorLimit: number;
  /** -1 = unlimited, matching collectorLimit's convention. */
  receiptLimit: number;
  /** Name of the tier this one builds on — when set, `features` lists only
   *  what's *added* on top of that tier ("Everything in {includesFrom},
   *  plus:") instead of repeating every base feature again. Absent on FREE,
   *  the base of the ladder. This is what keeps a card from growing one
   *  full copy of the shared feature set per tier — the actual cause of the
   *  pricing section's runaway vertical height (2026-08 brand pass). */
  includesFrom?: string;
  features: PricingPlanFeature[];
}

// A tiered ladder, not four independent lists: FREE spells out the full
// base feature set once; every paid tier only lists what it *adds* on top
// of the one before it (see includesFrom above). Descriptions are reserved
// for Coming Soon items, which need the explanation — every included
// feature is a single-line label so a tier's real weight comes through as
// list *length*, not padding.
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: SubscriptionPlan.FREE,
    name: 'Take your first step towards digital collections',
    tagline: 'Experience the Future of Digital Receipts',
    positioningLine: 'Experience',
    marathiDescriptor: 'डिजिटल पावती',
    priceInr: 0,
    priceNote: `Free for ${FREE_TRIAL_PERIOD_DAYS} days, no payment needed`,
    collectorLimit: MAX_COLLECTORS_BY_PLAN[SubscriptionPlan.FREE],
    receiptLimit: MAX_RECEIPTS_BY_PLAN[SubscriptionPlan.FREE],
    // Deliberately NOT listing the Standard+ features (UPI ID on receipts,
    // custom branding) that FREE also gets during its 7-day window — those
    // are unlocked functionally (see organizations.service.ts's PREMIUM_
    // FEATURE_PLANS), but adding them here as keyed bullets would bubble
    // up through BASIC's `includesFrom` inheritance and falsely claim BASIC
    // has them too — this ladder has no way to grant a lower tier something
    // a higher one intentionally doesn't get. A trial user discovers those
    // in the app itself rather than the pricing page overpromising what
    // BASIC actually buys (2026-08-22).
    features: [
      { label: formatPlanLimit(MAX_RECEIPTS_BY_PLAN[SubscriptionPlan.FREE], 'Digital Receipts'), category: 'pavti', key: 'receipts' },
      { label: `Up to ${MAX_ACTIVE_CAMPAIGNS_BY_PLAN[SubscriptionPlan.FREE]} Active Events at Once`, category: 'collections', key: 'activeFestivals' },
      { label: formatPlanLimit(MAX_COLLECTORS_BY_PLAN[SubscriptionPlan.FREE], 'Collectors'), category: 'team', key: 'collectors' },
      { label: 'Internal Collection & Expense Tracking', category: 'collections', key: 'internalCollection' },
      { label: 'Multi-Role Access', category: 'team', key: 'multiRole' },
      { label: 'Reports & Analytics', category: 'reports', key: 'reports' },
      { label: 'No Payment Needed to Start' },
    ],
  },
  {
    id: SubscriptionPlan.BASIC,
    name: 'Basic',
    tagline: 'For small mandals starting their digital journey',
    positioningLine: 'Go Digital',
    marathiDescriptor: 'छोट्या मंडळांसाठी',
    priceInr: 499,
    priceNote: `Valid for ${SUBSCRIPTION_PERIOD_DAYS} days from signup`,
    collectorLimit: MAX_COLLECTORS_BY_PLAN[SubscriptionPlan.BASIC],
    receiptLimit: MAX_RECEIPTS_BY_PLAN[SubscriptionPlan.BASIC],
    includesFrom: 'Take your first step towards digital collections',
    features: [
      { label: formatPlanLimit(MAX_RECEIPTS_BY_PLAN[SubscriptionPlan.BASIC], 'Digital Receipts'), category: 'pavti', key: 'receipts' },
      { label: formatPlanLimit(MAX_COLLECTORS_BY_PLAN[SubscriptionPlan.BASIC], 'Collectors'), category: 'team', key: 'collectors' },
      { label: `Up to ${MAX_ACTIVE_CAMPAIGNS_BY_PLAN[SubscriptionPlan.BASIC]} Active Event at a Time`, category: 'collections', key: 'activeFestivals' },
    ],
  },
  {
    id: SubscriptionPlan.STANDARD,
    name: 'Standard',
    tagline: 'For apartments, societies & public mandals',
    positioningLine: 'Manage Better',
    marathiDescriptor: 'अपार्टमेंट्स, सोसायट्या व मंडळांसाठी',
    priceInr: 799,
    priceNote: `Valid for ${SUBSCRIPTION_PERIOD_DAYS} days from signup`,
    highlighted: true,
    collectorLimit: MAX_COLLECTORS_BY_PLAN[SubscriptionPlan.STANDARD],
    receiptLimit: MAX_RECEIPTS_BY_PLAN[SubscriptionPlan.STANDARD],
    includesFrom: 'Basic',
    features: [
      { label: formatPlanLimit(MAX_COLLECTORS_BY_PLAN[SubscriptionPlan.STANDARD], 'Collectors'), category: 'team', key: 'collectors' },
      { label: `Up to ${MAX_ACTIVE_CAMPAIGNS_BY_PLAN[SubscriptionPlan.STANDARD]} Active Events at Once`, category: 'collections', key: 'activeFestivals' },
      { label: 'Dynamic UPI QR for Instant Collection', category: 'payments', key: 'upiId' },
      { label: 'Shareable WhatsApp Link for Unpaid Pavtis', category: 'payments', key: 'unpaidLink' },
      { label: 'Custom Branded Receipt Design', category: 'branding', key: 'customBranding' },
    ],
  },
  {
    id: SubscriptionPlan.PREMIUM,
    name: 'Premium',
    tagline: 'For mandals who want the highest limits',
    positioningLine: 'Elevate the Experience',
    marathiDescriptor: 'मोठ्या देवस्थान व संस्थांसाठी',
    priceInr: 1999,
    priceNote: `Valid for ${SUBSCRIPTION_PERIOD_DAYS} days from signup`,
    collectorLimit: MAX_COLLECTORS_BY_PLAN[SubscriptionPlan.PREMIUM],
    receiptLimit: MAX_RECEIPTS_BY_PLAN[SubscriptionPlan.PREMIUM],
    includesFrom: 'Standard',
    // Everything gated Standard+ (UPI ID, custom themes) is already true at
    // Standard — Premium's only *enforced* differences today are higher
    // collector/campaign caps. Not listing anything beyond that here (no
    // Dedicated Web Page, no other unbuilt extras) — see MAX_COLLECTORS_BY_PLAN
    // / MAX_ACTIVE_CAMPAIGNS_BY_PLAN for the actual numbers this reflects.
    // The Interactive/Devotional Pavti Experience isn't plan-gated at all
    // (every tier already has it — see InteractivePavtiView/
    // INTERACTIVE_PAVTI_TEMPLATES) so it's not listed as a checkmark feature
    // here; PricingCard gives Premium a dedicated visual callout for it
    // instead, without claiming exclusivity that isn't real.
    features: [
      { label: formatPlanLimit(MAX_COLLECTORS_BY_PLAN[SubscriptionPlan.PREMIUM], 'Collectors'), category: 'team', key: 'collectors' },
      { label: `Up to ${MAX_ACTIVE_CAMPAIGNS_BY_PLAN[SubscriptionPlan.PREMIUM]} Active Events at Once`, category: 'collections', key: 'activeFestivals' },
    ],
  },
];

/**
 * Walks a plan's `includesFrom` chain and returns its full *cumulative*
 * feature set (its own features plus everything every tier below it
 * already has) — what the "Everything in {includesFrom}, plus:" cards
 * deliberately don't spell out, but a full side-by-side comparison table
 * needs. Single implementation so the table can't drift from what the
 * ladder cards actually promise.
 */
export function resolvePlanFeatures(planId: SubscriptionPlan): PricingPlanFeature[] {
  const plan = PRICING_PLANS.find((p) => p.id === planId);
  if (!plan) return [];
  const parent = plan.includesFrom
    ? PRICING_PLANS.find((p) => p.name === plan.includesFrom)
    : undefined;
  const inherited = parent ? resolvePlanFeatures(parent.id) : [];
  const combined = [...inherited, ...plan.features];

  // A later (higher-tier) feature sharing a `key` supersedes an earlier one
  // describing the same capability — e.g. Standard's "Up to 10 Collectors"
  // replaces Free/Basic's "Up to 5 Collectors" instead of both showing up
  // side by side, which would read as a self-contradictory limit. Keyless
  // features (things that only ever appear once, like FREE's "No Payment
  // Needed to Start") always pass through untouched. Order is preserved by
  // each key's *first* appearance, so the ladder still reads top to bottom
  // the way the individual cards do.
  const latestByKey = new Map<string, PricingPlanFeature>();
  for (const f of combined) if (f.key) latestByKey.set(f.key, f);
  const seenKeys = new Set<string>();
  const result: PricingPlanFeature[] = [];
  for (const f of combined) {
    if (!f.key) {
      result.push(f);
    } else if (!seenKeys.has(f.key)) {
      seenKeys.add(f.key);
      result.push(latestByKey.get(f.key)!);
    }
  }
  return result;
}

export enum CollectionType {
  DONATION = 'DONATION',
  INTERNAL = 'INTERNAL',
}

export enum ReceiptStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentMode {
  CASH = 'CASH',
  UPI = 'UPI',
  CHEQUE = 'CHEQUE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ONLINE = 'ONLINE',
}

export enum DonationCategory {
  GENERAL = 'GENERAL',
  DECORATION = 'DECORATION',
  FOOD = 'FOOD',
  SOUND = 'SOUND',
  FIREWORKS = 'FIREWORKS',
  PRASAD = 'PRASAD',
  CONSTRUCTION = 'CONSTRUCTION',
  OTHER = 'OTHER',
  SPONSOR = 'SPONSOR',
  COMMITTEE_MEMBER = 'COMMITTEE_MEMBER',
  MEMBERSHIP_FEE = 'MEMBERSHIP_FEE',
  STALL_CHARGE = 'STALL_CHARGE',
  EVENT_REGISTRATION = 'EVENT_REGISTRATION',
}

export enum ExpenseCategory {
  DECORATION = 'DECORATION',
  SOUND_SYSTEM = 'SOUND_SYSTEM',
  FOOD = 'FOOD',
  FIREWORKS = 'FIREWORKS',
  VENUE = 'VENUE',
  PRINTING = 'PRINTING',
  TRANSPORT = 'TRANSPORT',
  MISC = 'MISC',
  DJ_SOUND = 'DJ_SOUND',
  LIGHTING = 'LIGHTING',
  SECURITY = 'SECURITY',
  STAGE = 'STAGE',
  ELECTRICITY = 'ELECTRICITY',
  PERMISSIONS = 'PERMISSIONS',
}

export enum Language {
  EN = 'en',
  HI = 'hi',
  MR = 'mr',
}

export enum ReceiptTheme {
  DEFAULT = 'DEFAULT',
  GANESHOTSAV = 'GANESHOTSAV',
  EID = 'EID',
  BHAGAT_SINGH = 'BHAGAT_SINGH',
  NAVRATRI = 'NAVRATRI',
  TEMPLE_GOLD = 'TEMPLE_GOLD',
  ELEGANT_TRUST = 'ELEGANT_TRUST',
}

export interface ReceiptLanguageLines {
  headerTagline?: string;
  receiptTitle?: string;
  donorPrefix?: string;
  footerNote?: string;
  shareMessage?: string;
}

export interface ReceiptTemplateSettings {
  theme?: ReceiptTheme | string;
  language?: 'mr' | 'hi' | 'en';
  /** Respective customized lines stored per language */
  languages?: {
    mr?: ReceiptLanguageLines;
    hi?: ReceiptLanguageLines;
    en?: ReceiptLanguageLines;
  };
  headerTagline?: string;
  receiptTitle?: string;
  donorPrefix?: string;
  footerNote?: string;
  shareMessage?: string;
  // Interactive Pavti Offering (Devotional 4-Slide Experience)
  interactivePavtiEnabled?: boolean;
  interactiveTemplate?: 'GANESHA_ROYAL_MAROON' | 'GANESHA_LANDSCAPE_GOLD' | string;
  customDarshanUrl?: string;
  blessingMessage?: string;
}

export const DEFAULT_SHARE_MESSAGE_TEMPLATES: Record<'mr' | 'hi' | 'en', string> = {
  mr: `🙏 नमस्कार {donorName} जी!

आपले {organizationName} ला ₹{amount} चे योगदान प्राप्त झाले आहे.

📋 पावती क्र.: {receiptNumber}
📅 दिनांक: {date}

🔗 डिजिटल पावती पाहण्यासाठी खालील लिंकवर क्लिक करा:
{receiptUrl}

आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद! 🙏
- {organizationName}`,

  hi: `🙏 नमस्कार {donorName} जी!

{organizationName} को आपका ₹{amount} का सहयोग प्राप्त हुआ है।

📋 रसीद क्र.: {receiptNumber}
📅 दिनांक: {date}

🔗 डिजिटल रसीद देखने के लिए नीचे दिए लिंक पर क्लिक करें:
{receiptUrl}

आपके अमूल्य सहयोग के लिए हार्दिक धन्यवाद! 🙏
- {organizationName}`,

  en: `🙏 Dear {donorName},

Thank you for your generous contribution of ₹{amount} to {organizationName}.

📋 Receipt No: {receiptNumber}
📅 Date: {date}

🔗 Click the link below to view your official digital receipt:
{receiptUrl}

Thank you for your valuable support! 🙏
- {organizationName}`,
};

export const SHARE_MESSAGE_PRESETS: Record<'mr' | 'hi' | 'en', { label: string; template: string }[]> = {
  mr: [
    {
      label: 'मानक संदेश (Standard)',
      template: DEFAULT_SHARE_MESSAGE_TEMPLATES.mr,
    },
    {
      label: 'संक्षिप्त / छोटा संदेश (Short & Quick)',
      template: `🙏 नमस्कार {donorName} जी, {organizationName} ला ₹{amount} ची पावती (क्र. {receiptNumber}) तयार झाली आहे. पावती पाहण्यासाठी: {receiptUrl} धन्यवाद! 🙏`,
    },
    {
      label: 'कृतज्ञता व आशीर्वाद (Devotional & Blessing)',
      template: `🚩 || श्री गणेशाय नमः || 🚩

सस्नेह नमस्कार {donorName} जी!
{organizationName} च्या कार्यात आपले ₹{amount} चे अमूल्य योगदान लाभले.

📋 पावती क्र.: {receiptNumber}
🔗 डिजिटल पावती: {receiptUrl}

बाप्पा आपल्या संसारास सुख, समृद्धी आणि उत्तम आरोग्य देवो हीच प्रार्थना! 🙏`,
    },
  ],
  hi: [
    {
      label: 'मानक संदेश (Standard)',
      template: DEFAULT_SHARE_MESSAGE_TEMPLATES.hi,
    },
    {
      label: 'संक्षिप्त संदेश (Short)',
      template: `🙏 नमस्कार {donorName} जी, {organizationName} की ओर से ₹{amount} की रसीद (क्र. {receiptNumber}) जारी की गई है। देखने के लिए: {receiptUrl} धन्यवाद! 🙏`,
    },
    {
      label: 'आशीर्वाद एवं आभार (Devotional)',
      template: `🚩 || श्री गणेशाय नमः || 🚩

सादर प्रणाम {donorName} जी!
{organizationName} के कार्य में आपका ₹{amount} का अमूल्य दान प्राप्त हुआ।

📋 रसीद क्र.: {receiptNumber}
🔗 डिजिटल रसीद: {receiptUrl}

ईश्वर आप पर सदैव कृपा बनाए रखें! 🙏`,
    },
  ],
  en: [
    {
      label: 'Standard Formal',
      template: DEFAULT_SHARE_MESSAGE_TEMPLATES.en,
    },
    {
      label: 'Short & Direct',
      template: `🙏 Dear {donorName}, receipt #{receiptNumber} for ₹{amount} from {organizationName} is ready. View here: {receiptUrl}. Thank you! 🙏`,
    },
    {
      label: 'Tax & Exemption Note',
      template: `🙏 Dear {donorName},

We acknowledge receipt of ₹{amount} towards {organizationName}.

📋 Receipt No: {receiptNumber}
🔗 Download/View Receipt: {receiptUrl}

Thank you for your generous support! 🙏`,
    },
  ],
};

export interface ShareMessageContext {
  donorName?: string;
  amount?: number | string;
  receiptNumber?: string;
  organizationName?: string;
  campaignName?: string;
  receiptUrl?: string;
  date?: string;
  category?: string;
  /** Pre-formatted via formatSocialLinksText — inserted verbatim, no further processing. */
  socialLinksText?: string;
}

export function formatShareMessage(
  template: string | undefined,
  ctx: ShareMessageContext,
  lang: 'mr' | 'hi' | 'en' = 'mr',
): string {
  const tpl = template || DEFAULT_SHARE_MESSAGE_TEMPLATES[lang] || DEFAULT_SHARE_MESSAGE_TEMPLATES.mr;
  const formattedAmount = typeof ctx.amount === 'number'
    ? ctx.amount.toLocaleString('en-IN')
    : (ctx.amount || '0');

  return tpl
    .replace(/\{donorName\}/g, ctx.donorName || (lang === 'en' ? 'Donor' : lang === 'hi' ? 'दानकर्ता' : 'देणगीदार'))
    .replace(/\{amount\}/g, formattedAmount)
    .replace(/\{receiptNumber\}/g, ctx.receiptNumber || '')
    .replace(/\{organizationName\}/g, ctx.organizationName || (lang === 'en' ? 'Organization' : lang === 'hi' ? 'संस्था' : 'मंडळ'))
    .replace(/\{campaignName\}/g, ctx.campaignName || '')
    .replace(/\{receiptUrl\}/g, ctx.receiptUrl || '')
    .replace(/\{date\}/g, ctx.date || new Date().toLocaleDateString('en-IN'))
    .replace(/\{category\}/g, ctx.category || '')
    .replace(/\{socialLinks\}/g, ctx.socialLinksText || '');
}

// ─── Social Links ─────────────────────────────────────────────────────────────
// Single source of truth for which platforms are supported and how they're
// labeled/iconed, consumed by Settings (input fields), ReceiptPreview.tsx
// (screen + public verify page), pdf.service.ts (PDF), and the WhatsApp
// share-message {socialLinks} tag — same "one definition" pattern as
// RECEIPT_THEMES.
export interface OrganizationSocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
}

export const SOCIAL_PLATFORMS: { key: keyof OrganizationSocialLinks; label: string; emoji: string }[] = [
  { key: 'instagram', label: 'Instagram', emoji: '📷' },
  { key: 'facebook', label: 'Facebook', emoji: '📘' },
  { key: 'youtube', label: 'YouTube', emoji: '▶️' },
  { key: 'website', label: 'Website', emoji: '🌐' },
];

/** Compact "📷 url | 📘 url" line for contexts (like the WhatsApp share text) that need plain text rather than clickable icons. */
export function formatSocialLinksText(links?: OrganizationSocialLinks | null): string {
  if (!links) return '';
  return SOCIAL_PLATFORMS
    .filter((p) => links[p.key])
    .map((p) => `${p.emoji} ${links[p.key]}`)
    .join('  |  ');
}

/**
 * Single source of truth for the field labels printed on a pavti — donor,
 * address, amount, category, etc. Three separate renderers show this same
 * data (ReceiptPreview.tsx's on-screen preview, pdf.service.ts's actual PDF,
 * and InteractivePavtiView.tsx's "Digital Pavti" slide); before this existed
 * each kept its own copy and they drifted — the interactive slide ended up
 * with a mobile-number field the PDF never had, and a "देणगी प्रकार" label
 * over the payment-mode value. One object, one place to fix a label.
 */
export const RECEIPT_FIELD_LABELS: Record<'en' | 'hi' | 'mr', {
  receipt: string; no: string; donor: string; address: string; amount: string; words: string;
  category: string; mode: string; collector: string; area: string; notes: string;
  sign: string; scan: string; paid: string; unpaid: string; internalReceipt: string;
}> = {
  en: {
    receipt: 'RECEIPT', no: 'No.', donor: 'Donor Name', address: 'Address', amount: 'Amount', words: 'Amount in Words',
    category: 'Category', mode: 'Payment Mode', collector: 'Collector', area: 'Area', notes: 'Notes',
    sign: 'Authorized Signature', scan: 'Scan to verify', paid: 'Paid', unpaid: 'Unpaid', internalReceipt: 'Internal Receipt',
  },
  hi: {
    receipt: 'रसीद', no: 'क्र.', donor: 'दानकर्ता', address: 'पता', amount: 'राशि', words: 'शब्दों में',
    category: 'श्रेणी', mode: 'भुगतान विधि', collector: 'संग्रहकर्ता', area: 'क्षेत्र', notes: 'टिप्पणी',
    sign: 'अधिकृत हस्ताक्षर', scan: 'सत्यापन हेतु स्कैन करें', paid: 'प्राप्त', unpaid: 'बकाया', internalReceipt: 'आंतरिक रसीद',
  },
  mr: {
    receipt: 'पावती', no: 'क्र.', donor: 'देणगीदार', address: 'पत्ता', amount: 'रक्कम', words: 'अक्षरी',
    category: 'प्रकार', mode: 'देय पद्धत', collector: 'संग्राहक', area: 'क्षेत्र', notes: 'टीप',
    sign: 'अधिकृत स्वाक्षरी', scan: 'सत्यापनासाठी स्कॅन करा', paid: 'प्राप्त', unpaid: 'थकबाकी', internalReceipt: 'अंतर्गत पावती',
  },
};

export const LANGUAGE_DEFAULT_LINES: Record<'mr' | 'hi' | 'en', Required<ReceiptLanguageLines>> = {
  mr: {
    headerTagline: '|| श्री गणेशाय नमः ||',
    receiptTitle: 'देणगी पावती',
    donorPrefix: 'श्री / सौ / मे.',
    footerNote: 'आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद! 🙏',
    shareMessage: DEFAULT_SHARE_MESSAGE_TEMPLATES.mr,
  },
  hi: {
    headerTagline: '|| श्री गणेशाय नमः ||',
    receiptTitle: 'दान रसीद',
    donorPrefix: 'श्री / श्रीमती / मे.',
    footerNote: 'आपके सहयोग के लिए हार्दिक धन्यवाद! 🙏',
    shareMessage: DEFAULT_SHARE_MESSAGE_TEMPLATES.hi,
  },
  en: {
    headerTagline: '|| In the Name of God ||',
    receiptTitle: 'Donation Receipt',
    donorPrefix: 'Shri / Smt / M/s',
    footerNote: 'Thank you for your generous contribution! 🙏',
    shareMessage: DEFAULT_SHARE_MESSAGE_TEMPLATES.en,
  },
};

export const DEFAULT_RECEIPT_SETTINGS: ReceiptTemplateSettings = {
  theme: 'DEFAULT',
  language: 'mr',
  languages: {
    mr: { ...LANGUAGE_DEFAULT_LINES.mr },
    hi: { ...LANGUAGE_DEFAULT_LINES.hi },
    en: { ...LANGUAGE_DEFAULT_LINES.en },
  },
  headerTagline: LANGUAGE_DEFAULT_LINES.mr.headerTagline,
  receiptTitle: LANGUAGE_DEFAULT_LINES.mr.receiptTitle,
  donorPrefix: LANGUAGE_DEFAULT_LINES.mr.donorPrefix,
  footerNote: LANGUAGE_DEFAULT_LINES.mr.footerNote,
  shareMessage: LANGUAGE_DEFAULT_LINES.mr.shareMessage,
};

export const PAVTI_HEADER_TAGLINE_PRESETS: Record<'mr' | 'hi' | 'en', { id: string; label: string; value: string }[]> = {
  mr: [
    { id: 'ganesh', label: 'श्री गणेश', value: '|| श्री गणेशाय नमः ||' },
    { id: 'shivaji', label: 'जय शिवराय', value: '|| जय भवानी जय शिवाजी ||' },
    { id: 'shiva', label: 'ॐ नमः शिवाय', value: '|| ॐ नमः शिवाय ||' },
    { id: 'durga', label: 'जय माता दी', value: '|| ॐ श्री दुर्गायै नमः ||' },
    { id: 'swami', label: 'श्री स्वामी समर्थ', value: '|| श्री स्वामी समर्थ ||' },
    { id: 'satya', label: 'सत्यमेव जयते', value: '|| सत्यमेव जयते ||' },
    { id: 'sarvadharma', label: 'सर्वधर्म समभाव', value: '|| सर्वधर्म समभाव ||' },
    { id: 'bismillah', label: 'Bismillah', value: '|| Bismillah-ir-Rahman-ir-Rahim ||' },
    { id: 'none', label: 'काही नाही (None)', value: '' },
  ],
  hi: [
    { id: 'ganesh', label: 'श्री गणेश', value: '|| श्री गणेशाय नमः ||' },
    { id: 'shiva', label: 'ॐ नमः शिवाय', value: '|| ॐ नमः शिवाय ||' },
    { id: 'durga', label: 'जय माता दी', value: '|| जय माता दी ||' },
    { id: 'ram', label: 'जय श्री राम', value: '|| जय श्री राम ||' },
    { id: 'satya', label: 'सत्यमेव जयते', value: '|| सत्यमेव जयते ||' },
    { id: 'sarvadharma', label: 'सर्वधर्म समभाव', value: '|| सर्वधर्म समभाव ||' },
    { id: 'bismillah', label: 'Bismillah', value: '|| Bismillah-ir-Rahman-ir-Rahim ||' },
    { id: 'none', label: 'कोई नहीं (None)', value: '' },
  ],
  en: [
    { id: 'god', label: 'God Bless', value: '|| In the Name of God ||' },
    { id: 'divine', label: 'Divine Blessings', value: '|| With Divine Blessings ||' },
    { id: 'satya', label: 'Truth Prevails', value: '|| Truth Always Triumphs ||' },
    { id: 'om', label: 'Om Shanti', value: '|| Om Shanti ||' },
    { id: 'none', label: 'None', value: '' },
  ],
};

export const PAVTI_TITLE_PRESETS: Record<'mr' | 'hi' | 'en', { label: string; value: string }[]> = {
  mr: [
    { label: 'देणगी पावती', value: 'देणगी पावती' },
    { label: 'वर्गणी पावती', value: 'वर्गणी पावती' },
    { label: 'अधिकृत देणगी पावती', value: 'अधिकृत देणगी पावती' },
    { label: 'पावती', value: 'पावती' },
  ],
  hi: [
    { label: 'दान रसीद', value: 'दान रसीद' },
    { label: 'चंदा रसीद', value: 'चंदा रसीद' },
    { label: 'अधिकृत दान रसीद', value: 'अधिकृत दान रसीद' },
    { label: 'रसीद', value: 'रसीद' },
  ],
  en: [
    { label: 'Donation Receipt', value: 'Donation Receipt' },
    { label: 'Subscription Receipt', value: 'Subscription Receipt' },
    { label: 'Official Receipt', value: 'Official Receipt' },
    { label: 'Receipt', value: 'Receipt' },
  ],
};

export const PAVTI_DONOR_PREFIX_PRESETS: Record<'mr' | 'hi' | 'en', { label: string; value: string }[]> = {
  mr: [
    { label: 'श्री / सौ / मे.', value: 'श्री / सौ / मे.' },
    { label: 'श्री / श्रीमती', value: 'श्री / श्रीमती' },
    { label: 'मा. श्री / सौ', value: 'मा. श्री / सौ' },
    { label: 'काही नाही (None)', value: '' },
  ],
  hi: [
    { label: 'श्री / श्रीमती / मे.', value: 'श्री / श्रीमती / मे.' },
    { label: 'श्री / श्रीमती', value: 'श्री / श्रीमती' },
    { label: 'माननीय', value: 'माननीय' },
    { label: 'None', value: '' },
  ],
  en: [
    { label: 'Shri / Smt / M/s', value: 'Shri / Smt / M/s' },
    { label: 'Mr / Mrs / Ms', value: 'Mr / Mrs / Ms' },
    { label: 'Respected', value: 'Respected' },
    { label: 'None', value: '' },
  ],
};

export const PAVTI_FOOTER_NOTE_PRESETS: Record<'mr' | 'hi' | 'en', { label: string; value: string }[]> = {
  mr: [
    { label: 'सहकार्याबद्दल धन्यवाद', value: 'आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद! 🙏' },
    { label: 'मंडळ कार्य सहकार्य', value: 'मंडळाच्या कार्यात सहकार्य केल्याबद्दल धन्यवाद!' },
    { label: 'संगणकीय पावती सूचना', value: 'ही संगणकीय पावती असल्याने स्वाक्षरीची आवश्यकता नाही.' },
    { label: 'काही नाही (None)', value: '' },
  ],
  hi: [
    { label: 'सहयोग हेतु धन्यवाद', value: 'आपके सहयोग के लिए हार्दिक धन्यवाद! 🙏' },
    { label: 'मंडल कार्य सहयोग', value: 'मंडल के सामाजिक कार्य में सहयोग हेतु धन्यवाद!' },
    { label: 'कंप्यूटरीकृत रसीद', value: 'यह कंप्यूटरीकृत रसीद है, हस्ताक्षर की आवश्यकता नहीं है।' },
    { label: 'None', value: '' },
  ],
  en: [
    { label: 'Thank You Message', value: 'Thank you for your generous contribution! 🙏' },
    { label: 'Community Support', value: 'Thank you for supporting our community initiatives!' },
    { label: 'Computer Generated', value: 'Computer generated receipt, signature not required.' },
    { label: '80G Tax Exemption', value: 'Donations are eligible for tax exemption under 80G.' },
    { label: 'None', value: '' },
  ],
};

export function resolveReceiptSettings(
  settings?: any,
  targetLangOverride?: 'mr' | 'hi' | 'en',
): Required<ReceiptTemplateSettings> & { lines: Required<ReceiptLanguageLines> } {
  const lang: 'mr' | 'hi' | 'en' = targetLangOverride || ((settings?.language === 'hi' || settings?.language === 'en' || settings?.language === 'mr') ? settings.language : 'mr');
  const defaults = LANGUAGE_DEFAULT_LINES[lang];
  const langSpecific = settings?.languages?.[lang] || {};

  const headerTagline = langSpecific.headerTagline !== undefined
    ? langSpecific.headerTagline
    : (settings?.headerTagline !== undefined && (settings?.language === lang || !settings?.languages) ? settings.headerTagline : defaults.headerTagline);

  const receiptTitle = langSpecific.receiptTitle ||
    ((settings?.receiptTitle && (settings?.language === lang || !settings?.languages)) ? settings.receiptTitle : defaults.receiptTitle);

  const donorPrefix = langSpecific.donorPrefix !== undefined
    ? langSpecific.donorPrefix
    : (settings?.donorPrefix !== undefined && (settings?.language === lang || !settings?.languages) ? settings.donorPrefix : defaults.donorPrefix);

  const footerNote = langSpecific.footerNote !== undefined
    ? langSpecific.footerNote
    : (settings?.footerNote !== undefined && (settings?.language === lang || !settings?.languages) ? settings.footerNote : defaults.footerNote);

  const shareMessage = langSpecific.shareMessage !== undefined
    ? langSpecific.shareMessage
    : (settings?.shareMessage !== undefined && (settings?.language === lang || !settings?.languages) ? settings.shareMessage : defaults.shareMessage);

  return {
    theme: settings?.theme || 'DEFAULT',
    language: lang,
    languages: settings?.languages || {
      mr: { ...LANGUAGE_DEFAULT_LINES.mr },
      hi: { ...LANGUAGE_DEFAULT_LINES.hi },
      en: { ...LANGUAGE_DEFAULT_LINES.en },
    },
    headerTagline,
    receiptTitle,
    donorPrefix,
    footerNote,
    shareMessage,
    interactivePavtiEnabled: settings?.interactivePavtiEnabled ?? true,
    interactiveTemplate: settings?.interactiveTemplate || 'GANESHA_ROYAL_MAROON',
    customDarshanUrl: settings?.customDarshanUrl || '',
    blessingMessage: settings?.blessingMessage || 'गणपती बाप्पा आपल्या सर्व मनोकामना पूर्ण करोत आणि आपल्या घरात सुख, समृद्धी आणि आरोग्य लाभो!',
    lines: {
      headerTagline,
      receiptTitle,
      donorPrefix,
      footerNote,
      shareMessage,
    },
  };
}

// ─── Receipt Theme Style Registry ──────────────────────────────────────────────
// Single source of truth for theme visuals, consumed by BOTH the PDF renderer
// (apps/api/src/pdf/pdf.service.ts) and the on-screen preview
// (apps/web/src/components/receipt/ReceiptPreview.tsx) plus the theme picker
// (apps/web settings page) — so what an admin sees on screen is guaranteed to
// match the actual PDF sent to donors, and adding a theme means editing one place.
/**
 * Deliberately small palette, not a per-theme layout switch. The card's
 * *structure* (double gold-and-ink frame, seal medallion amount, hairline
 * rules) is fixed and shared by every theme — see ReceiptPreview.tsx and
 * pdf.service.ts's buildReceiptHtml. A theme only supplies the mood: three
 * colors and a corner motif. That's what keeps a 3-way "wallpaper picker"
 * honest — each option is a genuinely different feel, not a repaint of the
 * same swatch seven times.
 */
export interface ReceiptThemeStyle {
  id: string;
  label: string;
  labelMarathi: string;
  /** One-line mood description shown under the label in the theme gallery. */
  tagline: string;
  /** Ink — headings, borders, amount figure, QR modules. Also the header text color, since the header shares the card's one paper background rather than carrying its own color band. */
  primaryColor: string;
  /** Warm paper background used consistently across the whole card — header included. Never pure white (that read as a generic SaaS card), and deliberately the *same* tone top to bottom for a calm, single-canvas ledger feel instead of a colored banner. */
  paperBg: string;
  /** Amount seal medallion fill — a soft tint close to paperBg, not a contrasting block. */
  amountBg: string;
  /** Corner ornament, rendered as an inline SVG monoline glyph. */
  motif: 'lotus' | 'diya' | 'chakra';
}

/** Shared gold accent for the outer hairline frame — ties all themes to one brand identity regardless of mood. */
export const RECEIPT_GOLD_ACCENT = '#C9A227';

export const RECEIPT_THEMES: ReceiptThemeStyle[] = [
  {
    id: 'DEFAULT', label: 'Heritage Maroon & Gold', labelMarathi: 'पारंपरिक मरून व सुवर्ण',
    tagline: 'Classic ledger warmth — the trusted, traditional choice.',
    primaryColor: '#6B1D14',
    paperBg: '#FEFCFA', amountBg: '#FBF6EC', motif: 'diya',
  },
  {
    id: 'FESTIVE', label: 'Festive Saffron & Gold', labelMarathi: 'उत्सवी केशरी व सुवर्ण',
    tagline: 'Bright and celebratory — for festival season collections.',
    primaryColor: '#B5490C',
    paperBg: '#FEFCFA', amountBg: '#FDF3E7', motif: 'lotus',
  },
  {
    id: 'MODERN', label: 'Modern Slate & Gold', labelMarathi: 'आधुनिक स्लेट व सुवर्ण',
    tagline: 'Understated and professional — for a businesslike trust.',
    primaryColor: '#1E3A5F',
    paperBg: '#FDFEFE', amountBg: '#F3F6F9', motif: 'chakra',
  },
];

export const DEFAULT_RECEIPT_THEME_ID = 'DEFAULT';

/** Resolves a (possibly stale/unknown, e.g. one of the retired themes) stored theme id to a style, falling back to DEFAULT. */
export function resolveReceiptTheme(themeId?: string | null): ReceiptThemeStyle {
  return RECEIPT_THEMES.find((t) => t.id === themeId) || RECEIPT_THEMES[0];
}

// ─── DTOs / Interfaces ────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  nameMarathi?: string;
  nameHindi?: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  phone: string;
  email?: string;
  logoUrl?: string;
  regNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiry?: Date;
  createdAt: Date;
}

export interface Campaign {
  id: string;
  orgId: string;
  name: string;
  nameMarathi?: string;
  nameHindi?: string;
  year: number;
  startDate: Date;
  endDate?: Date;
  targetAmount?: number;
  receiptPrefix: string;
  status: CampaignStatus;
  description?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  areaId?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CollectorArea {
  id: string;
  orgId: string;
  name: string;
  description?: string;
}

export interface Receipt {
  id: string;
  campaignId: string;
  collectorId: string;
  receiptNumber: string;
  donorName: string;
  donorPhone?: string;
  donorAddress?: string;
  amount: number;
  amountInWords: string;
  category: DonationCategory;
  paymentMode: PaymentMode;
  notes?: string;
  pdfUrl?: string;
  latitude?: number;
  longitude?: number;
  collectionType: CollectionType;
  status: ReceiptStatus;
  dueDate?: Date;
  contributorType?: string;
  supportingDocUrl?: string;
  createdAt: Date;
  collector?: User;
  campaign?: Campaign;
  organization?: Organization;
}

// Plain ledger entry — no approval workflow.
export interface Expense {
  id: string;
  campaignId: string;
  addedById: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receiptUrl?: string;
  paidTo: string;
  beneficiaryPhone?: string;
  gstNumber?: string;
  paymentMode: PaymentMode;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: Date;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalCollections: number;
  todayCollections: number;
  totalReceipts: number;
  todayReceipts: number;
  totalExpenses: number;
  netBalance: number;
  activeCollectors: number;
  pendingExpenses: number;
}

export interface CollectorStats {
  collectorId: string;
  collectorName: string;
  totalAmount: number;
  receiptCount: number;
  areaName?: string;
}

export interface DailyCollection {
  date: string;
  amount: number;
  count: number;
}

export interface AreaCollection {
  areaName: string;
  amount: number;
  count: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const RECEIPT_CATEGORIES_LABELS: Record<DonationCategory, Record<Language, string>> = {
  [DonationCategory.GENERAL]: { en: 'General Donation', hi: 'सामान्य दान', mr: 'सामान्य देणगी' },
  [DonationCategory.DECORATION]: { en: 'Decoration', hi: 'सजावट', mr: 'सजावट' },
  [DonationCategory.FOOD]: { en: 'Food / Prasad', hi: 'भोजन / प्रसाद', mr: 'भोजन / प्रसाद' },
  [DonationCategory.SOUND]: { en: 'Sound System', hi: 'ध्वनि प्रणाली', mr: 'ध्वनी यंत्रणा' },
  [DonationCategory.FIREWORKS]: { en: 'Fireworks', hi: 'आतिशबाजी', mr: 'फटाके' },
  [DonationCategory.PRASAD]: { en: 'Prasad Distribution', hi: 'प्रसाद वितरण', mr: 'प्रसाद वाटप' },
  [DonationCategory.CONSTRUCTION]: { en: 'Construction', hi: 'निर्माण', mr: 'बांधकाम' },
  [DonationCategory.OTHER]: { en: 'Other', hi: 'अन्य', mr: 'इतर' },
  [DonationCategory.SPONSOR]: { en: 'Sponsorship', hi: 'प्रायोजक', mr: 'प्रायोजक' },
  [DonationCategory.COMMITTEE_MEMBER]: { en: 'Committee Contribution', hi: 'समिती योगदान', mr: 'समिती योगदान' },
  [DonationCategory.MEMBERSHIP_FEE]: { en: 'Membership Fee', hi: 'सदस्यता शुल्क', mr: 'सदस्यत्व फी' },
  [DonationCategory.STALL_CHARGE]: { en: 'Stall Charges', hi: 'स्टॉल शुल्क', mr: 'स्टॉल फी' },
  [DonationCategory.EVENT_REGISTRATION]: { en: 'Event Registration', hi: 'कार्यक्रम पंजीकरण', mr: 'स्पर्धा नोंदणी' },
};

export const PAYMENT_MODE_LABELS: Record<PaymentMode, Record<Language, string>> = {
  [PaymentMode.CASH]: { en: 'Cash', hi: 'नकद', mr: 'रोख' },
  [PaymentMode.UPI]: { en: 'UPI', hi: 'UPI', mr: 'UPI' },
  [PaymentMode.CHEQUE]: { en: 'Cheque', hi: 'चेक', mr: 'धनादेश' },
  [PaymentMode.BANK_TRANSFER]: { en: 'Bank Transfer', hi: 'बैंक स्थानांतरण', mr: 'बँक हस्तांतरण' },
  [PaymentMode.ONLINE]: { en: 'Online', hi: 'ऑनलाइन', mr: 'ऑनलाइन' },
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, Record<Language, string>> = {
  [ExpenseCategory.DECORATION]: { en: 'Decoration', hi: 'सजावट', mr: 'सजावट' },
  [ExpenseCategory.SOUND_SYSTEM]: { en: 'Sound System', hi: 'ध्वनि प्रणाली', mr: 'ध्वनी यंत्रणा' },
  [ExpenseCategory.FOOD]: { en: 'Food', hi: 'भोजन', mr: 'भोजन' },
  [ExpenseCategory.FIREWORKS]: { en: 'Fireworks', hi: 'आतिशबाजी', mr: 'फटाके' },
  [ExpenseCategory.VENUE]: { en: 'Venue', hi: 'स्थल', mr: 'जागा / स्थळ' },
  [ExpenseCategory.PRINTING]: { en: 'Printing', hi: 'छपाई', mr: 'छपाई' },
  [ExpenseCategory.TRANSPORT]: { en: 'Transport', hi: 'परिवहन', mr: 'वाहतूक' },
  [ExpenseCategory.MISC]: { en: 'Miscellaneous', hi: 'विविध', mr: 'इतर' },
  [ExpenseCategory.DJ_SOUND]: { en: 'DJ / Sound', hi: 'डीजे / ध्वनि', mr: 'डीजे / ध्वनी' },
  [ExpenseCategory.LIGHTING]: { en: 'Lighting', hi: 'प्रकाश व्यवस्था', mr: 'प्रकाश व्यवस्था' },
  [ExpenseCategory.SECURITY]: { en: 'Security', hi: 'सुरक्षा', mr: 'सुरक्षा' },
  [ExpenseCategory.STAGE]: { en: 'Stage', hi: 'मंच', mr: 'मंच' },
  [ExpenseCategory.ELECTRICITY]: { en: 'Electricity', hi: 'बिजली', mr: 'वीज' },
  [ExpenseCategory.PERMISSIONS]: { en: 'Permissions & Licenses', hi: 'अनुमतियाँ', mr: 'परवानग्या' },
};

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, Record<Language, string>> = {
  [ReceiptStatus.PAID]: { en: 'Paid', hi: 'भुगतान हुआ', mr: 'भरणा झाला' },
  [ReceiptStatus.PENDING]: { en: 'Pending', hi: 'लंबित', mr: 'प्रलंबित' },
  [ReceiptStatus.CANCELLED]: { en: 'Cancelled', hi: 'रद्द', mr: 'रद्द' },
};

// "Member Contribution" (not "Internal Collection") is the user-facing label for
// INTERNAL — it's mandal/committee-member subscription money, not a donation from
// an outside donor. Keeping the enum value INTERNAL avoids a DB migration; only
// the displayed copy changes.
export const COLLECTION_TYPE_LABELS: Record<CollectionType, Record<Language, string>> = {
  [CollectionType.DONATION]: { en: 'Donation', hi: 'दान', mr: 'देणगी' },
  [CollectionType.INTERNAL]: { en: 'Internal Collection', hi: 'आंतरिक योगदान', mr: 'अंतर्गत वर्गणी' },
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, Record<Language, string>> = {
  [CampaignStatus.DRAFT]: { en: 'Draft', hi: 'मसौदा', mr: 'मसुदा' },
  [CampaignStatus.ACTIVE]: { en: 'Active', hi: 'सक्रिय', mr: 'सक्रिय' },
  [CampaignStatus.PAUSED]: { en: 'Paused', hi: 'रोका गया', mr: 'थांबवले' },
  [CampaignStatus.COMPLETED]: { en: 'Completed', hi: 'पूर्ण', mr: 'पूर्ण' },
};

export const USER_ROLE_LABELS: Record<UserRole, Record<Language, string>> = {
  [UserRole.SUPER_ADMIN]: { en: 'Super Admin', hi: 'सुपर एडमिन', mr: 'सुपर अ‍ॅडमिन' },
  [UserRole.ORG_ADMIN]: { en: 'Admin', hi: 'एडमिन', mr: 'प्रशासक' },
  [UserRole.TREASURER]: { en: 'Treasurer', hi: 'कोषाध्यक्ष', mr: 'खजिनदार' },
  [UserRole.COLLECTOR]: { en: 'Collector', hi: 'संग्राहक', mr: 'संग्राहक' },
  [UserRole.VIEWER]: { en: 'Viewer', hi: 'दर्शक', mr: 'निरीक्षक' },
};

// ─── Utility Functions ────────────────────────────────────────────────────────

export function amountToWords(amount: number, language: Language = Language.EN): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertBelow1000(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10] + ' ';
    return ones[Math.floor(n / 100)] + ' Hundred ' + convertBelow1000(n % 100);
  }

  if (amount === 0) return 'Zero Rupees Only';

  let result = '';
  const crore = Math.floor(amount / 10000000);
  const lakh = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const remainder = amount % 1000;

  if (crore > 0) result += convertBelow1000(crore) + 'Crore ';
  if (lakh > 0) result += convertBelow1000(lakh) + 'Lakh ';
  if (thousand > 0) result += convertBelow1000(thousand) + 'Thousand ';
  if (remainder > 0) result += convertBelow1000(remainder);

  return result.trim() + ' Rupees Only';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateReceiptNumber(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Quotes a CSV field per RFC 4180 — wraps in double quotes and escapes any
 * embedded quotes whenever the value contains a comma, quote, or newline.
 * Plain values are left unquoted so exports stay readable. Donor names,
 * addresses, and expense descriptions are free text entered by staff (e.g.
 * "Patil, Suresh") and would otherwise silently shift every column after
 * them when opened in Excel/Sheets.
 */
export function csvField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Builds a full CSV document (with header row) from row arrays, quoting every field via {@link csvField}. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(csvField).join(',')).join('\n');
}

/**
 * Single source of truth for the "date + time" stamp shown on a receipt —
 * used by both the PDF renderer (apps/api pdf.service.ts) and the on-screen
 * preview (apps/web ReceiptPreview.tsx) so they never drift, e.g. "08 Aug
 * 2026, 10:18 PM".
 */
export function formatReceiptDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${datePart}, ${timePart}`;
}

// ─── Access Management ────────────────────────────────────────────────────────

// The module vocabulary used for nav-visibility / page-guard checks — see
// inferRouteModule() below and apps/web's useModuleAccessResolver, which is
// the actual (static, role-based) access check in use. An earlier, more
// granular per-org/per-user permission system (RolePermission table,
// User.permissionsOverride, an API-request-to-module inference function)
// was scaffolded alongside this and never wired to anything; it was removed
// in the 2026-08 roles audit rather than left as dead schema/code.
export const PERMISSION_MODULES = [
  'Receipts', 'Expenses', 'Campaigns', 'Collectors', 'Members', 'Reports', 'Settings',
] as const;
export type PermissionModule = typeof PERMISSION_MODULES[number];

/** Maps a frontend route pathname to a module name, for nav-visibility / page-guard checks. */
export function inferRouteModule(pathname: string): PermissionModule | 'Dashboard' | null {
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/receipts')) return 'Receipts';
  if (pathname.startsWith('/collectors')) return 'Collectors';
  if (pathname.startsWith('/campaigns')) return 'Campaigns';
  if (pathname.startsWith('/members')) return 'Members';
  if (pathname.startsWith('/expenses')) return 'Expenses';
  if (pathname.startsWith('/reports')) return 'Reports';
  if (pathname.startsWith('/settings')) return 'Settings';
  return null;
}

// ─── Interactive Pavti Templates & Devanagari Number Converters ──────────────

export interface InteractivePavtiTemplate {
  id: string;
  name: string;
  nameMarathi: string;
  description: string;
  envelopeStyle: 'PORTRAIT_ROYAL' | 'LANDSCAPE_GOLD';
  primaryColor: string;
  goldColor: string;
  previewThumbnail: string;
  defaultBlessing: string;
}

export const INTERACTIVE_PAVTI_TEMPLATES: InteractivePavtiTemplate[] = [
  {
    id: 'GANESHA_ROYAL_MAROON',
    name: 'Royal Heritage Maroon & Gold',
    nameMarathi: 'शाही मरून आणि सुवर्ण पावती',
    description: 'Classic royal portrait wax-sealed envelope with 3D fracture, glowing Ganpati Darshan, and authentic parchment receipt.',
    envelopeStyle: 'PORTRAIT_ROYAL',
    primaryColor: '#5c1220',
    goldColor: '#c9a24a',
    previewThumbnail: '🪔',
    defaultBlessing: 'गणपती बाप्पा आपल्या सर्व मनोकामना पूर्ण करोत आणि आपल्या घरात सुख, समृद्धी आणि आरोग्य लाभो!',
  },
  {
    id: 'GANESHA_LANDSCAPE_GOLD',
    name: 'Vedic Landscape Royal Gold',
    nameMarathi: 'वैदिक लँडस्केप सुवर्ण पावती',
    description: 'Expansive landscape envelope with ceremonial light burst, flickering Diya flame, and devotional blessing card.',
    envelopeStyle: 'LANDSCAPE_GOLD',
    primaryColor: '#3a1a12',
    goldColor: '#e6d19f',
    previewThumbnail: '✨',
    defaultBlessing: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥',
  },
];

/**
 * Converts numbers into accurate Marathi Devanagari words for authentic receipts
 * e.g. 5001 -> "पाच हजार एक रुपये फक्त"
 */
export function numberToMarathiWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'शून्य रुपये फक्त';

  const units: Record<number, string> = {
    0: '', 1: 'एक', 2: 'दोन', 3: 'तीन', 4: 'चार', 5: 'पाच', 6: 'सहा', 7: 'सात', 8: 'आठ', 9: 'नऊ',
    10: 'दहा', 11: 'अकरा', 12: 'बारा', 13: 'तेरा', 14: 'चौदा', 15: 'पंधरा', 16: 'सोळा', 17: 'सतरा', 18: 'अठरा', 19: 'एकोणीस',
    20: 'वीस', 21: 'एकवीस', 22: 'बावीस', 23: 'तेवीस', 24: 'चोवीस', 25: 'पंचवीस', 26: 'सव्वीस', 27: 'सत्तावीस', 28: 'अठ्ठावीस', 29: 'एकोणतीस',
    30: 'तीस', 31: 'एकतीस', 32: 'बत्तीस', 33: 'तेहतीस', 34: 'चौतीस', 35: 'पस्तीस', 36: 'छत्तीस', 37: 'सदतीस', 38: 'अडतीस', 39: 'एकोणचाळीस',
    40: 'चाळीस', 41: 'एक्केचाळीस', 42: 'बेचाळीस', 43: 'त्रेचाळीस', 44: 'चव्वेचाळीस', 45: 'पंचेचाळीस', 46: 'शेहेचाळीस', 47: 'सत्तेचाळीस', 48: 'अठ्ठेचाळीस', 49: 'एकोणपन्नास',
    50: 'पन्नास', 51: 'एक्कावन्न', 52: 'बावन्न', 53: 'त्रेपन्न', 54: 'चावन्न', 55: 'पंचावन्न', 56: 'छप्पन्न', 57: 'सत्तावन्न', 58: 'अठ्ठावन्न', 59: 'एकोणसाठ',
    60: 'साठ', 61: 'एकसष्ठ', 62: 'पासष्ठ', 63: 'त्रेसष्ठ', 64: 'चौसष्ठ', 65: 'पासष्ठ', 66: 'सहासष्ठ', 67: 'सदुसष्ठ', 68: 'अडुसष्ठ', 69: 'एकोणसत्तर',
    70: 'सत्तर', 71: 'एकाहत्तर', 72: 'बाहत्तर', 73: 'त्र्याहत्तर', 74: 'चौर्‍याहत्तर', 75: 'पंच्याहत्तर', 76: 'शहात्तर', 77: 'सत्याहत्तर', 78: 'अठ्ठ्याहत्तर', 79: 'एकोणऐंशी',
    80: 'ऐंशी', 81: 'एक्याऐंशी', 82: 'ब्याऐंशी', 83: 'त्र्याऐंशी', 84: 'चौऱ्याऐंशी', 85: 'पंच्याऐंशी', 86: 'शहाऐंशी', 87: 'सत्त्याऐंशी', 88: 'अठ्ठ्याऐंशी', 89: 'एकोणनव्वद',
    90: 'नव्वद', 91: 'एक्याण्णव', 92: 'ब्याण्णव', 93: 'त्र्याण्णव', 94: 'चौऱ्याण्णव', 95: 'पंच्याण्णव', 96: 'शहाण्णव', 97: 'सत्त्याण्णव', 98: 'अठ्ठ्याण्णव', 99: 'नव्याण्णव',
  };

  let words = '';
  let n = Math.floor(num);

  if (n >= 10000000) {
    const crore = Math.floor(n / 10000000);
    words += (units[crore] || crore.toString()) + ' कोटी ';
    n %= 10000000;
  }
  if (n >= 100000) {
    const lakh = Math.floor(n / 100000);
    words += (units[lakh] || lakh.toString()) + ' लाख ';
    n %= 100000;
  }
  if (n >= 1000) {
    const thousand = Math.floor(n / 1000);
    words += (units[thousand] || thousand.toString()) + ' हजार ';
    n %= 1000;
  }
  if (n >= 100) {
    const hundred = Math.floor(n / 100);
    words += (hundred === 1 ? 'एकशे ' : units[hundred] + 'शे ');
    n %= 100;
  }
  if (n > 0) {
    words += units[n] + ' ';
  }

  return words.trim() + ' रुपये फक्त';
}

/**
 * Converts numbers into accurate Hindi words
 * e.g. 5001 -> "पाँच हज़ार एक रुपये मात्र"
 */
export function numberToHindiWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'शून्य रुपये मात्र';

  const units: Record<number, string> = {
    0: '', 1: 'एक', 2: 'दो', 3: 'तीन', 4: 'चार', 5: 'पाँच', 6: 'छह', 7: 'सात', 8: 'आठ', 9: 'नौ',
    10: 'दस', 11: 'ग्यारह', 12: 'बारह', 13: 'तेरह', 14: 'चौदह', 15: 'पंद्रह', 16: 'सोलह', 17: 'सत्रह', 18: 'अठारह', 19: 'उन्नीस',
    20: 'बीस', 21: 'इक्कीस', 22: 'बाईस', 23: 'तेईस', 24: 'चौबीस', 25: 'पच्चीस', 26: 'छब्बीस', 27: 'सत्ताईस', 28: 'अट्ठाईस', 29: 'उनतीस',
    30: 'तीस', 31: 'इकत्तीस', 32: 'बत्तीस', 33: 'तैंतीस', 34: 'चौंतीस', 35: 'पैंतीस', 36: 'छत्तीस', 37: 'सैंतीस', 38: 'अड़तीस', 39: 'उनतालीस',
    40: 'चालीस', 41: 'इकतालीस', 42: 'बयालीस', 43: 'तैंतालीस', 44: 'चवालीस', 45: 'पैंतालीस', 46: 'छियालीस', 47: 'सैंतालीस', 48: 'अड़तालीस', 49: 'उनचास',
    50: 'पचास', 51: 'इक्यावन', 52: 'बावन', 53: 'तिरेपन', 54: 'चौवन', 55: 'पचपन', 56: 'छप्पन', 57: 'सत्तावन', 58: 'अट्ठावन', 59: 'उनसठ',
    60: 'साठ', 61: 'इकसठ', 62: 'बासठ', 63: 'तिरसठ', 64: 'चौंसठ', 65: 'पैंसठ', 66: 'छियासठ', 67: 'सरसठ', 68: 'अड़सठ', 69: 'उनहत्तर',
    70: 'सत्तर', 71: 'इकहत्तर', 72: 'बहत्तर', 73: 'तिहत्तर', 74: 'चौहत्तर', 75: 'पचहत्तर', 76: 'छिहत्तर', 77: 'सतहत्तर', 78: 'अठहत्तर', 79: 'उनासी',
    80: 'अस्सी', 81: 'इक्यासी', 82: 'बयासी', 83: 'तिरासी', 84: 'चौरासी', 85: 'पचासी', 86: 'छियासी', 87: 'सतासी', 88: 'अठासी', 89: 'नवासी',
    90: 'नब्बे', 91: 'इक्यानवे', 92: 'बानवे', 93: 'तिरानवे', 94: 'चौरानवे', 95: 'पंचानवे', 96: 'छियानवे', 97: 'सत्तानवे', 98: 'अट्ठानवे', 99: 'निन्यानवे',
  };

  let words = '';
  let n = Math.floor(num);

  if (n >= 10000000) {
    const crore = Math.floor(n / 10000000);
    words += (units[crore] || crore.toString()) + ' करोड़ ';
    n %= 10000000;
  }
  if (n >= 100000) {
    const lakh = Math.floor(n / 100000);
    words += (units[lakh] || lakh.toString()) + ' लाख ';
    n %= 100000;
  }
  if (n >= 1000) {
    const thousand = Math.floor(n / 1000);
    words += (units[thousand] || thousand.toString()) + ' हज़ार ';
    n %= 1000;
  }
  if (n >= 100) {
    const hundred = Math.floor(n / 100);
    words += (hundred === 1 ? 'एक सौ ' : units[hundred] + ' सौ ');
    n %= 100;
  }
  if (n > 0) {
    words += units[n] + ' ';
  }

  return words.trim() + ' रुपये मात्र';
}

/**
 * Formats amount in words according to language ('mr' | 'hi' | 'en')
 */
export function formatAmountInWords(amount: number, lang: 'mr' | 'hi' | 'en' = 'mr'): string {
  if (lang === 'mr') return numberToMarathiWords(amount);
  if (lang === 'hi') return numberToHindiWords(amount);
  
  // English words fallback
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function inWords(num: number): string {
    if ((num = num.toString().length === 1 ? Number('0' + num) : num) === 0) return '';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
    return str.trim();
  }
  
  return inWords(Math.floor(amount)) + ' Rupees Only';
}

