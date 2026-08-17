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

// How many campaigns an org may run ACTIVE at once, by plan. Enforced when a
// campaign transitions to ACTIVE (apps/api CampaignsService.activate) — a
// campaign can always be created/edited as DRAFT regardless of this limit,
// since only ACTIVE campaigns accept receipts. Shared so the web app can
// pre-emptively disable/explain the "Activate" action instead of only
// discovering the block after a failed request.
export const MAX_ACTIVE_CAMPAIGNS_BY_PLAN: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 1,
  [SubscriptionPlan.BASIC]: 1,
  [SubscriptionPlan.STANDARD]: 2,
  [SubscriptionPlan.PREMIUM]: 5,
};

// How many staff accounts (COLLECTOR/TREASURER — not the ORG_ADMIN account
// itself) an org may add, by plan. Enforced in CollectorsService.create.
// -1 = unlimited (same sentinel SUBSCRIPTION_PLANS already uses for
// maxUsers/maxReceipts) — PREMIUM was previously capped at 10, which
// contradicted the plan being sold/intended as unlimited collectors.
export const MAX_COLLECTORS_BY_PLAN: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 5,
  [SubscriptionPlan.BASIC]: 5,
  [SubscriptionPlan.STANDARD]: 10,
  [SubscriptionPlan.PREMIUM]: -1,
};

// ─── Pricing (public plan catalog) ─────────────────────────────────────────
// Single source of truth for the marketing pricing page AND the registration
// plan picker, so the price/feature list a visitor sees before signing up is
// guaranteed to match what they're actually offered on the signup form —
// same "one definition, multiple consumers" approach as RECEIPT_THEMES.
// There's no FREE tier on offer publicly — FREE stays in the SubscriptionPlan
// enum only for internal/legacy use.
export interface PricingPlanFeature {
  label: string;
  description?: string;
  /** Feature is listed for transparency about what's coming, but not usable yet. */
  comingSoon?: boolean;
}

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  tagline: string;
  priceInr: number;
  priceNote: string;
  highlighted?: boolean;
  collectorLimit: number;
  features: PricingPlanFeature[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: SubscriptionPlan.BASIC,
    name: 'Basic',
    tagline: 'For small mandals starting their digital journey',
    priceInr: 499,
    priceNote: 'For whole Ganpati Utsav 2026',
    collectorLimit: MAX_COLLECTORS_BY_PLAN[SubscriptionPlan.BASIC],
    features: [
      { label: 'Digital Receipts', description: 'Generate and share digital pavtis instantly' },
      { label: 'Internal Donation Collection', description: 'Track member subscriptions & mandal contributions' },
      { label: 'Donation Management & Expense Tracking' },
      { label: 'Multi-Role Access', description: 'Admin, Treasurer, Collector & Viewer roles' },
      { label: `${MAX_COLLECTORS_BY_PLAN[SubscriptionPlan.BASIC]} Collectors` },
      { label: 'Reports & Analytics' },
    ],
  },
  {
    id: SubscriptionPlan.STANDARD,
    name: 'Standard',
    tagline: 'For growing mandals who want more',
    priceInr: 799,
    priceNote: 'For whole Ganpati Utsav 2026',
    highlighted: true,
    collectorLimit: MAX_COLLECTORS_BY_PLAN[SubscriptionPlan.STANDARD],
    features: [
      { label: 'Unlimited Digital Receipts', description: 'Generate and share unlimited digital receipts' },
      { label: 'Internal Donation Collection' },
      { label: 'Donation Management & Expense Tracking' },
      { label: 'Multi-Role Access', description: 'Admin, Treasurer, Collector & Viewer roles' },
      { label: 'UPI ID on Every Receipt', description: 'Donors pay you directly — fast & hassle-free' },
      { label: `Up to ${MAX_COLLECTORS_BY_PLAN[SubscriptionPlan.STANDARD]} Collectors` },
      { label: 'Advanced Reports & Analytics', description: 'Data-driven insights for better decisions' },
      { label: 'Custom Branded Receipt Design', description: 'Pick a premium design that matches your mandal' },
    ],
  },
  {
    id: SubscriptionPlan.PREMIUM,
    name: 'Premium',
    tagline: 'For mandals who want the complete festival experience',
    priceInr: 1499,
    priceNote: 'For whole Ganpati Utsav 2026',
    collectorLimit: MAX_COLLECTORS_BY_PLAN[SubscriptionPlan.PREMIUM],
    features: [
      { label: 'Unlimited Digital Receipts' },
      { label: 'Internal Donation Collection' },
      { label: 'Donation Management & Expense Tracking' },
      { label: 'Multi-Role Access', description: 'Admin, Treasurer, Collector & Viewer roles' },
      { label: 'UPI ID on Every Receipt' },
      { label: `Up to ${MAX_COLLECTORS_BY_PLAN[SubscriptionPlan.PREMIUM]} Collectors` },
      { label: 'Advanced Reports & Analytics' },
      { label: 'Custom Branded Receipt Design' },
      { label: 'Dedicated Web Page for Your Mandal', description: "History, festival program, dress code, bhandara & visarjan info — your mandal's own page", comingSoon: true },
    ],
  },
];

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
export interface ReceiptThemeStyle {
  id: string;
  label: string;
  emoji: string;
  primaryColor: string;
  gradient: string;
  borderWidth: number;
  borderStyle: 'solid' | 'double' | 'dashed';
  amountBg: string;
  amountBorderColor: string;
  amountBorderWidth: number;
  amountBorderStyle: 'solid' | 'dashed';
  /** Small emoji rendered in the top-right corner of the header. */
  bannerEmoji?: string;
  /** BHAGAT_SINGH-only: a saffron/white/green stripe instead of a banner emoji. */
  tricolorBanner?: boolean;
}

export const RECEIPT_THEMES: ReceiptThemeStyle[] = [
  {
    id: 'DEFAULT', label: 'Default Heritage Chocolate & Gold', emoji: '📜',
    primaryColor: '#592E09', gradient: 'linear-gradient(135deg, #592E09 0%, #71471D 50%, #D2A46D 100%)',
    borderWidth: 3, borderStyle: 'solid',
    amountBg: '#FCF3E4', amountBorderColor: '#D2A46D', amountBorderWidth: 2, amountBorderStyle: 'solid',
  },
  {
    id: 'GANESHOTSAV', label: 'Ganeshotsav Special', emoji: '🪔',
    primaryColor: '#E65100', gradient: 'linear-gradient(135deg, #E65100 0%, #F57C00 50%, #FFB300 100%)',
    borderWidth: 4, borderStyle: 'double',
    amountBg: '#FFF8E1', amountBorderColor: '#FFE082', amountBorderWidth: 2, amountBorderStyle: 'dashed',
    bannerEmoji: '🪔',
  },
  {
    id: 'EID', label: 'Eid Special', emoji: '🌙',
    primaryColor: '#004D20', gradient: 'linear-gradient(135deg, #004D20 0%, #00873C 100%)',
    borderWidth: 3, borderStyle: 'solid',
    amountBg: '#E8F5E9', amountBorderColor: '#A5D6A7', amountBorderWidth: 2, amountBorderStyle: 'solid',
    bannerEmoji: '🌙',
  },
  {
    id: 'NAVRATRI', label: 'Navratri Special', emoji: '💃',
    primaryColor: '#9C1B5C', gradient: 'linear-gradient(135deg, #9C1B5C 0%, #C2185B 50%, #E91E8C 100%)',
    borderWidth: 4, borderStyle: 'double',
    amountBg: '#FCE4EC', amountBorderColor: '#F48FB1', amountBorderWidth: 2, amountBorderStyle: 'dashed',
    bannerEmoji: '💃',
  },
  {
    id: 'TEMPLE_GOLD', label: 'Temple Gold', emoji: '🛕',
    primaryColor: '#7B1E1E', gradient: 'linear-gradient(135deg, #7B1E1E 0%, #A52A2A 50%, #D4A017 100%)',
    borderWidth: 4, borderStyle: 'double',
    amountBg: '#FFF9E6', amountBorderColor: '#D4A017', amountBorderWidth: 2, amountBorderStyle: 'solid',
    bannerEmoji: '🛕',
  },
  {
    id: 'BHAGAT_SINGH', label: 'Tricolor Mandal', emoji: '🇮🇳',
    primaryColor: '#1A2530', gradient: 'linear-gradient(135deg, #1A2530 0%, #2c3e50 100%)',
    borderWidth: 3, borderStyle: 'solid',
    amountBg: '#ECEFF1', amountBorderColor: '#B0BEC5', amountBorderWidth: 2, amountBorderStyle: 'solid',
    tricolorBanner: true,
  },
  {
    id: 'ELEGANT_TRUST', label: 'Elegant Trust', emoji: '📘',
    primaryColor: '#0D3B66', gradient: 'linear-gradient(135deg, #0D3B66 0%, #14568C 100%)',
    borderWidth: 2, borderStyle: 'solid',
    amountBg: '#F8FAFC', amountBorderColor: '#E2E8F0', amountBorderWidth: 2, amountBorderStyle: 'solid',
  },
];

export const DEFAULT_RECEIPT_THEME_ID = 'DEFAULT';

/** Resolves a (possibly stale/unknown) stored theme id to a style, falling back to DEFAULT. */
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
  whatsappSent: boolean;
  smsSent: boolean;
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

export interface Expense {
  id: string;
  campaignId: string;
  addedById: string;
  approvedById?: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receiptUrl?: string;
  isApproved: boolean;
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
  [CollectionType.INTERNAL]: { en: 'Member Contribution', hi: 'सदस्य योगदान', mr: 'सभासद वर्गणी' },
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

export const SUBSCRIPTION_PLANS = {
  [SubscriptionPlan.FREE]: { maxUsers: 2, maxReceipts: 100, priceMonthly: 0 },
  [SubscriptionPlan.BASIC]: { maxUsers: 2, maxReceipts: 2000, priceMonthly: 399 },
  [SubscriptionPlan.STANDARD]: { maxUsers: 10, maxReceipts: 10000, priceMonthly: 999 },
  [SubscriptionPlan.PREMIUM]: { maxUsers: -1, maxReceipts: -1, priceMonthly: 2999 },
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

export const PERMISSION_MODULES = [
  'Receipts', 'Expenses', 'Campaigns', 'Collectors', 'Members', 'Reports', 'Settings',
] as const;
export type PermissionModule = typeof PERMISSION_MODULES[number];

export interface ModulePermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canApprove: boolean;
}

export type PermissionAction = keyof ModulePermissions;

/**
 * Maps an API request (path + HTTP method) to the {module, action} pair used by
 * RolesGuard for both permissionsOverride (per-user) and RolePermission (per-role default)
 * checks. Kept as the single source of truth — previously hand-duplicated in
 * apps/api RolesGuard and apps/web Sidebar.
 */
export function inferApiModuleAndAction(
  path: string,
  method: string,
): { module: PermissionModule | null; action: PermissionAction | null } {
  let module: PermissionModule | null = null;
  let action: PermissionAction | null = null;

  if (path.includes('/receipts')) {
    module = 'Receipts';
    if (method === 'GET') action = 'canView';
    else if (method === 'POST') action = 'canCreate';
    else if (method === 'PATCH' || method === 'PUT') action = 'canEdit';
    else if (method === 'DELETE') action = 'canDelete';
  } else if (path.includes('/expenses')) {
    module = 'Expenses';
    if (method === 'GET') action = 'canView';
    else if (method === 'POST') action = 'canCreate';
    else if (method === 'PATCH' && path.includes('/approve')) action = 'canApprove';
    else if (method === 'DELETE') action = 'canDelete';
  } else if (path.includes('/collectors')) {
    module = 'Collectors';
    if (method === 'GET') action = 'canView';
    else if (method === 'POST') action = 'canCreate';
    else if (method === 'PATCH' || method === 'PUT') action = 'canEdit';
    else if (method === 'DELETE') action = 'canDelete';
  } else if (path.includes('/campaigns')) {
    module = 'Campaigns';
    if (method === 'GET') action = 'canView';
    else if (method === 'POST') action = 'canCreate';
    else if (method === 'PATCH' || method === 'PUT') action = 'canEdit';
    else if (method === 'DELETE') action = 'canDelete';
  } else if (path.includes('/members') || path.includes('/internal-collections')) {
    module = 'Members';
    if (method === 'GET') action = 'canView';
    else if (method === 'POST') action = 'canCreate';
    else if (method === 'PATCH' || method === 'PUT') action = 'canEdit';
    else if (method === 'DELETE') action = 'canDelete';
  } else if (path.includes('/reports')) {
    module = 'Reports';
    if (method === 'GET') action = 'canView';
  } else if (path.includes('/settings') || path.includes('/organizations')) {
    module = 'Settings';
    if (method === 'GET') action = 'canView';
    else action = 'canEdit';
  }

  return { module, action };
}

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
