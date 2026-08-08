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

export interface ReceiptTemplateSettings {
  theme: ReceiptTheme | string;
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
    id: 'DEFAULT', label: 'Default Saffron', emoji: '🟠',
    primaryColor: '#C85000', gradient: 'linear-gradient(135deg, #C85000 0%, #FF8C00 100%)',
    borderWidth: 3, borderStyle: 'solid',
    amountBg: '#fff8f0', amountBorderColor: '#ffccaa', amountBorderWidth: 2, amountBorderStyle: 'solid',
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
