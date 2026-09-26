/**
 * E-PavtiBook — Mandal TypeScript Definitions
 *
 * Core data entities for the public Mandal website with complete
 * multilingual support across Marathi (mr), Hindi (hi), and English (en).
 */

import type { LocalizedText } from './language';

export type { LocalizedText } from './language';

// ==================================================
// 1. MANDAL HISTORY / LEGACY
// ==================================================

export type MilestoneCategory =
  | 'foundation'
  | 'festival'
  | 'community'
  | 'social'
  | 'cultural'
  | 'achievement';

export type MandalMilestone = {
  id: string;
  year: number;
  title: LocalizedText;
  description: LocalizedText;
  image?: string;
  category?: MilestoneCategory | string;
};

export type CommunityStats = {
  families?: number;
  volunteers?: number;
  yearsActive?: number;
  socialInitiatives?: number;
  culturalPrograms?: number;
};

export type SocialInitiative = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  category?: string;
  icon?: string;
  year?: number;
};

export type MandalAchievement = {
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  year?: number;
  conferredBy?: LocalizedText;
};

export type MandalHistory = {
  establishmentYear?: number;
  description: LocalizedText;
  milestones: MandalMilestone[];
  communityStats?: CommunityStats;
  achievements?: (LocalizedText | MandalAchievement)[];
  socialActivities?: (LocalizedText | SocialInitiative)[];
};

// ==================================================
// 2. 10-DAY FESTIVAL PROGRAM (9, 10, or more days)
// ==================================================

export type FestivalDayEvent = {
  id?: string;
  title: LocalizedText;
  titleMarathi?: string;
  startTime: string;
  time?: string; // Backwards-compatible alias for startTime
  endTime?: string;
  venue?: LocalizedText;
  description?: LocalizedText;
  eventCategory?: string; // e.g. "Pooja", "Aarti", "Garba", "Cultural"
  eventType?: string; // Backwards-compatible alias for eventCategory
  activities?: LocalizedText[];
  participationInfo?: LocalizedText;
  image?: string;
  sponsorId?: string;
};

// ==================================================
// 3. DAILY DRESS CODE
// ==================================================

export type DressCode = {
  dayNumber: number;
  date: string;
  theme: LocalizedText;
  description?: LocalizedText;
  image?: string;
};

export type FestivalDay = {
  dayNumber: number;
  day: number; // Backwards-compatible alias for dayNumber
  date: string; // ISO date string (YYYY-MM-DD)
  title?: LocalizedText;
  description?: LocalizedText;
  goddess?: LocalizedText;
  goddessMarathi?: string; // Legacy fallback
  color?: string; // e.g. "Orange", "Yellow"
  colorHex?: string; // e.g. "#E87A2F"
  dressCode?: DressCode;
  events: FestivalDayEvent[];
  activities?: LocalizedText[];
  participationInfo?: LocalizedText;
  eventCategory?: string;
  image?: string;
  sponsorId?: string;
};

// ==================================================
// 4. BHANDARA (MAHAPRASAD)
// ==================================================

export type BhandaraMenuItem = {
  id: string;
  name: LocalizedText;
  category?: LocalizedText;
};

export type Bhandara = {
  title: LocalizedText;
  date: string;
  startTime?: string;
  endTime?: string;
  venue: LocalizedText;
  address?: LocalizedText;
  landmark?: LocalizedText;
  mapsUrl?: string;
  menu: BhandaraMenuItem[];
  description?: LocalizedText;
  instructions?: LocalizedText[];
  sponsorId?: string;
  image?: string;
};

// ==================================================
// 5. VISARJAN
// ==================================================

export type VisarjanRouteStop = {
  order: number;
  name: LocalizedText;
  landmark?: LocalizedText;
  estimatedTime?: string;
};

export type VisarjanLocation = {
  name: LocalizedText;
  address?: LocalizedText;
  mapsUrl?: string;
};

export type Visarjan = {
  title: LocalizedText;
  date: string;
  startTime: string;
  endTime?: string;
  assemblyPoint: LocalizedText | VisarjanLocation;
  assemblyAddress?: LocalizedText;
  assemblyMapsUrl?: string;
  route: VisarjanRouteStop[];
  endPoint: LocalizedText | VisarjanLocation;
  endAddress?: LocalizedText;
  endMapsUrl?: string;
  description?: LocalizedText;
  importantInstructions?: LocalizedText[];
  contact?: ActivityContact | string;
  sponsorId?: string;
};

// ==================================================
// 6. COMPETITIONS / ACTIVITIES
// ==================================================

export type ActivityContact = {
  name?: LocalizedText;
  phone?: string;
  whatsapp?: string;
};

export type Competition = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  date?: string;
  startTime?: string;
  endTime?: string;
  venue?: LocalizedText;
  eligibility?: LocalizedText;
  registrationInfo?: LocalizedText;
  registrationRequired?: boolean;
  registrationUrl?: string;
  rules?: LocalizedText[];
  contact?: ActivityContact | string;
  sponsorId?: string;
  category?: string;
  isFeatured?: boolean;
  image?: string;
};

// ==================================================
// 7. ANNOUNCEMENTS
// ==================================================

export type Announcement = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  date: string;
  priority: 'normal' | 'important' | 'urgent';
  active: boolean;
};

// ==================================================
// 8. MANDAL CORE ENTITIES
// ==================================================

export type DeviInfo = {
  name: LocalizedText;
  avatar?: LocalizedText;
  description?: LocalizedText;
  imageUrl?: string;
  blessingMessage?: LocalizedText;
};

export type CommunityInfo = {
  size: LocalizedText;
  description?: LocalizedText;
  president?: LocalizedText;
  secretary?: LocalizedText;
  committeeMembers?: {
    name: LocalizedText;
    role: LocalizedText;
  }[];
};

export type MandalIdentity = {
  name: LocalizedText;
  nameMarathi?: string;
  slug: string;
  tagline: LocalizedText;
  taglineMarathi?: string;
  established?: number;
  communitySize?: LocalizedText;
  description?: LocalizedText;
  descriptionMarathi?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  aboutImageUrl?: string;
};

export type Festival = {
  name: LocalizedText;
  nameMarathi?: string;
  startDate: string;
  endDate: string;
  dussehraDate?: string;
  year: string;
  totalDays?: number;
  description?: LocalizedText;
  theme?: LocalizedText;
};

export type SponsorTier =
  | 'presenting'
  | 'platinum'
  | 'gold'
  | 'silver'
  | 'community'
  | 'festival'
  | 'supporter';

export type SponsorOffer = {
  title: LocalizedText;
  description?: LocalizedText;
  badge?: LocalizedText;
  discount?: string;
  code?: string;
  validUntil?: string;
  terms?: LocalizedText | string;
};

export type Sponsor = {
  id: string;
  slug?: string;
  name: LocalizedText;
  logo?: string;
  logoUrl?: string;
  tier: SponsorTier;
  category?: LocalizedText | string;
  description?: LocalizedText;
  shortDescription?: LocalizedText;
  fullDescription?: LocalizedText;
  initials?: string;
  offer?: SponsorOffer;
  website?: string;
  instagram?: string;
  facebook?: string;
  phone?: string;
  whatsapp?: string;
  address?: LocalizedText;
  mapsUrl?: string;
  featured?: boolean;
  eventAssociation?: LocalizedText | string;
  eventId?: string;
  eventIds?: string[];
  sponsorOfTheDay?: boolean;
};

export type GalleryCategory =
  | 'darshan'
  | 'aarti'
  | 'garba'
  | 'cultural'
  | 'community'
  | 'decoration'
  | 'bhandara'
  | 'visarjan'
  | 'previous-years';

export type GalleryImage = {
  id: string;
  src: string;
  image?: string; // Backwards-compatible alias for src
  alt: LocalizedText;
  altText?: LocalizedText; // Backwards-compatible alias for alt
  caption?: LocalizedText;
  category?: GalleryCategory | string;
  date?: string;
  year?: number;
  sponsorId?: string;
  featured?: boolean;
  order?: number;
};

export type MandalLocation = {
  venue: LocalizedText;
  address: LocalizedText;
  landmark?: LocalizedText;
  city: LocalizedText;
  state: LocalizedText;
  mapsUrl?: string;
  lat?: number;
  lng?: number;
};

export type Contact = {
  phone?: string;
  email?: string;
  whatsapp?: string;
};

export type Social = {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
};

export type BankDetails = {
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifsc: string;
  branch?: string;
  accountType?: string;
};

export type DonationContact = {
  name?: LocalizedText;
  phone?: string;
  whatsapp?: string;
};

export type DonationConfig = {
  enabled: boolean;
  title?: LocalizedText;
  description?: LocalizedText;
  upiId?: string;
  upiName?: string;
  qrImage?: string;
  paymentUrl?: string;
  bankDetails?: BankDetails;
  suggestedAmounts?: number[];
  contact?: DonationContact;
  instructions?: LocalizedText[];
  thankYouMessage?: LocalizedText;
  transparencyNote?: LocalizedText;
};

// ==================================================
// CONCEPTUAL MANDAL MODEL
// ==================================================

export type Mandal = {
  identity: MandalIdentity;
  devi?: DeviInfo;
  festival: Festival;
  establishedYear?: number;
  history?: MandalHistory;
  milestones?: MandalMilestone[];
  communityStats?: CommunityStats;
  socialInitiatives?: SocialInitiative[];
  achievements?: MandalAchievement[];
  festivalDays?: FestivalDay[];
  schedule: FestivalDay[]; // Backwards-compatible alias for existing components
  dailyDressCodes?: DressCode[];
  bhandara?: Bhandara | null;
  competitions?: Competition[];
  announcements?: Announcement[];
  visarjan?: Visarjan | null;
  community?: CommunityInfo;
  sponsors: Sponsor[];
  sponsorOfTheDay?: Sponsor | string;
  gallery: GalleryImage[];
  location: MandalLocation;
  contact?: Contact;
  social?: Social;
  donation?: DonationConfig | null;
};

export default {};
