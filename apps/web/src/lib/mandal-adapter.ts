import { demoMandal } from '@/data/demoMandal';
import type { Mandal, FestivalDay, Sponsor } from '@/types/mandal';

export function mapDbToMandal(dbConfig: any): Mandal {
  const baseMandal = demoMandal as unknown as Mandal;
  if (!dbConfig) {
    return baseMandal;
  }

  const org = dbConfig.organization || {};

  // Map user custom festival days if provided in database, otherwise keep demo festival days
  let festivalDays: FestivalDay[] = baseMandal.festivalDays || [];
  if (Array.isArray(dbConfig.days) && dbConfig.days.length > 0) {
    const marathiDayMap: Record<string, string> = {
      'Ghatasthapana': 'घटस्थापना',
      'Dwitiya': 'द्वितीया',
      'Tritiya': 'तृतीया',
      'Chaturthi': 'चतुर्थी',
      'Panchami': 'पंचमी',
      'Shashthi': 'षष्ठी',
      'Saptami': 'सप्तमी',
      'Durgashtami': 'दुर्गाष्टमी',
      'Mahanavami / Vijaya Dashami': 'महानवमी व विजयादशमी',
      'Ganesh Chaturthi Sthapana': 'श्री गणेश प्रतिष्ठापना',
      'Shehnaai & Bhajan': 'शहनाई वादन व भजन संध्या',
      'Chappan Bhog': 'छप्पन भोग नैवेद्य',
      'Atharvashirsha Avartan': 'अथर्वशीर्ष आवर्तन',
      'Gauri Aagman': 'गौरी आगमन व स्थापना',
      'Gauri Pujan': 'गौरी पूजन व महाप्रसाद',
      'Gauri Visarjan': 'गौरी विसर्जन',
      'Cultural Night': 'सांस्कृतिक कार्यक्रम संध्या',
      'Maha Aarti & Kirtan': 'महाकीर्तन व महाआरती',
      'Anant Chaturdashi Visarjan': 'अनंत चतुर्दशी विसर्जन मिरवणूक',
    };

    festivalDays = dbConfig.days.map((day: any) => {
      const rawTitle = day.title || '';
      const cleanTitle = rawTitle.replace(/^Day\s+\d+\s*[-–:]\s*/i, '').trim();
      const finalTitle = marathiDayMap[cleanTitle] || cleanTitle || `दिवस ${day.dayNumber}`;

      return {
        dayNumber: day.dayNumber,
        day: day.dayNumber,
        date: day.date ? new Date(day.date).toISOString().split('T')[0] : `2026-10-${10 + day.dayNumber}`,
        title: { mr: finalTitle, hi: finalTitle, en: cleanTitle || finalTitle },
        goddess: day.deityAvatar ? { mr: day.deityAvatar, hi: day.deityAvatar, en: day.deityAvatar } : undefined,
        color: day.dressCodeColor || 'Yellow',
        colorHex: day.colorHex || '#EAB308',
        dressCode: {
          dayNumber: day.dayNumber,
          date: day.date ? new Date(day.date).toISOString().split('T')[0] : `2026-10-${10 + day.dayNumber}`,
          theme: { mr: day.dressCodeColor || '', hi: day.dressCodeColor || '', en: day.dressCodeColor || '' },
        },
        events: Array.isArray(day.events)
          ? day.events.map((e: any) => ({
              id: e.id,
              title: { mr: e.title, hi: e.title, en: e.title },
              startTime: e.time,
              time: e.time,
              description: e.description ? { mr: e.description, en: e.description } : undefined,
              eventType: e.eventType || 'AARTI',
              eventCategory: e.eventType || 'AARTI',
            }))
          : [],
      };
    });
  }

  // Map user custom sponsors if provided in database, otherwise keep demo sponsors
  let sponsors: Sponsor[] = baseMandal.sponsors || [];
  if (Array.isArray(dbConfig.sponsors) && dbConfig.sponsors.length > 0) {
    sponsors = dbConfig.sponsors.map((sp: any) => ({
      id: sp.id,
      slug: sp.id,
      name: { mr: sp.name, hi: sp.name, en: sp.name },
      logoUrl: sp.logoUrl || undefined,
      tier: (sp.tier?.toLowerCase() as any) || 'gold',
      website: sp.websiteUrl || undefined,
      phone: sp.phone || undefined,
      featured: sp.tier === 'PLATINUM' || sp.tier === 'PRESENTING' || sp.tier === 'GOLD',
    }));
  }

  // Parse custom aboutHistory text, timeline milestones, community stats, initiatives, and achievements if JSON formatted
  let historyDescription = dbConfig.aboutHistory || '';
  let customMilestones: any[] | null = null;
  let showHistory = true;
  let showCommunityStats = true;
  let customCommunityStats: any = null;
  let showSocialInitiatives = true;
  let customSocialInitiatives: any[] | null = null;
  let showAchievements = true;
  let customAchievements: any[] | null = null;

  let customSections: any[] = [];

  if (typeof dbConfig.aboutHistory === 'string' && dbConfig.aboutHistory.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(dbConfig.aboutHistory);
      if (parsed.showHistory !== undefined) {
        showHistory = Boolean(parsed.showHistory);
      }
      if (parsed.showCommunityStats !== undefined) {
        showCommunityStats = Boolean(parsed.showCommunityStats);
      }
      if (parsed.showSocialInitiatives !== undefined) {
        showSocialInitiatives = Boolean(parsed.showSocialInitiatives);
      }
      if (parsed.showAchievements !== undefined) {
        showAchievements = Boolean(parsed.showAchievements);
      }
      if (parsed.description !== undefined) {
        historyDescription = parsed.description;
      }
      if (parsed.communityStats && typeof parsed.communityStats === 'object') {
        customCommunityStats = {
          families: Number(parsed.communityStats.families ?? 250),
          volunteers: Number(parsed.communityStats.volunteers ?? 120),
          yearsActive: Number(parsed.communityStats.yearsActive ?? 28),
          socialInitiatives: Number(parsed.communityStats.socialInitiatives ?? 15),
          culturalPrograms: Number(parsed.communityStats.culturalPrograms ?? 25),
        };
      }
      if (Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
        customMilestones = parsed.milestones.map((m: any, idx: number) => ({
          id: m.id || `m-${idx + 1}`,
          year: Number(m.year) || 2000,
          category: m.category || 'foundation',
          title: typeof m.title === 'string' ? { mr: m.title, hi: m.title, en: m.title } : (m.title || { mr: '', hi: '', en: '' }),
          description: typeof m.description === 'string' ? { mr: m.description, hi: m.description, en: m.description } : (m.description || { mr: '', hi: '', en: '' }),
        }));
      }
      if (Array.isArray(parsed.socialInitiatives) && parsed.socialInitiatives.length > 0) {
        customSocialInitiatives = parsed.socialInitiatives.map((si: any, idx: number) => ({
          id: si.id || `si-${idx + 1}`,
          category: si.category || 'health',
          icon: si.icon || si.category || 'health',
          title: typeof si.title === 'string' ? { mr: si.title, hi: si.title, en: si.title } : (si.title || { mr: '', hi: '', en: '' }),
          description: typeof si.description === 'string' ? { mr: si.description, hi: si.description, en: si.description } : (si.description || { mr: '', hi: '', en: '' }),
        }));
      }
      if (Array.isArray(parsed.achievements) && parsed.achievements.length > 0) {
        customAchievements = parsed.achievements.map((ach: any, idx: number) => ({
          id: ach.id || `ach-${idx + 1}`,
          year: ach.year ? Number(ach.year) : undefined,
          title: typeof ach.title === 'string' ? { mr: ach.title, hi: ach.title, en: ach.title } : (ach.title || { mr: '', hi: '', en: '' }),
          description: typeof ach.description === 'string' ? { mr: ach.description, hi: ach.description, en: ach.description } : (ach.description || undefined),
          conferredBy: typeof ach.conferredBy === 'string' ? { mr: ach.conferredBy, hi: ach.conferredBy, en: ach.conferredBy } : (ach.conferredBy || undefined),
        }));
      }
      if (Array.isArray(parsed.customSections) && parsed.customSections.length > 0) {
        customSections = parsed.customSections.map((sec: any, idx: number) => ({
          id: sec.id || `csec-${idx + 1}`,
          title: typeof sec.title === 'string' ? { mr: sec.title, hi: sec.title, en: sec.title } : (sec.title || { mr: '', hi: '', en: '' }),
          subtitle: typeof sec.subtitle === 'string' ? { mr: sec.subtitle, hi: sec.subtitle, en: sec.subtitle } : (sec.subtitle || undefined),
          layout: sec.layout || 'cards',
          enabled: sec.enabled !== false,
          items: Array.isArray(sec.items)
            ? sec.items.map((item: any, iIdx: number) => ({
                id: item.id || `item-${iIdx + 1}`,
                title: typeof item.title === 'string' ? { mr: item.title, hi: item.title, en: item.title } : (item.title || { mr: '', hi: '', en: '' }),
                description: typeof item.description === 'string' ? { mr: item.description, hi: item.description, en: item.description } : (item.description || undefined),
                tag: typeof item.tag === 'string' ? { mr: item.tag, hi: item.tag, en: item.tag } : (item.tag || undefined),
                value: item.value || undefined,
                year: item.year ? Number(item.year) : undefined,
                icon: item.icon || undefined,
              }))
            : [],
        }));
      }
    } catch {
      // Fallback if not JSON
    }
  }

  const mandalNameMr = org.nameMarathi || org.name || baseMandal.identity?.name?.mr || 'मंडल';
  const mandalNameEn = org.name || baseMandal.identity?.name?.en || 'Mandal';

  const mergedStats = {
    ...(baseMandal.communityStats || baseMandal.history?.communityStats || {
      families: 250,
      volunteers: 120,
      yearsActive: 28,
      socialInitiatives: 15,
      culturalPrograms: 25,
    }),
    ...(customCommunityStats || {}),
    showStats: showCommunityStats,
  };

  const finalSocialInitiatives = showSocialInitiatives
    ? (customSocialInitiatives || baseMandal.socialInitiatives || baseMandal.history?.socialActivities || [])
    : [];

  const finalAchievements = showAchievements
    ? (customAchievements || baseMandal.achievements || baseMandal.history?.achievements || [])
    : [];

  const historyObj = {
    ...baseMandal.history,
    enabled: showHistory,
    showHistory,
    description: historyDescription
      ? { mr: historyDescription, hi: historyDescription, en: historyDescription }
      : baseMandal.history?.description,
    milestones: customMilestones || baseMandal.history?.milestones || [],
    communityStats: mergedStats,
    socialActivities: finalSocialInitiatives,
    achievements: finalAchievements,
  };

  return {
    ...baseMandal,
    identity: {
      ...baseMandal.identity,
      name: {
        mr: mandalNameMr,
        hi: org.nameHindi || org.name || baseMandal.identity?.name?.hi || mandalNameMr,
        en: mandalNameEn,
      },
      nameMarathi: mandalNameMr,
      slug: dbConfig.slug || org.slug || baseMandal.identity?.slug || 'mandal',
      tagline: dbConfig.tagline
        ? { mr: dbConfig.tagline, hi: dbConfig.tagline, en: dbConfig.tagline }
        : baseMandal.identity?.tagline,
      heroImageUrl: dbConfig.coverImageUrl || baseMandal.identity?.heroImageUrl,
      logoUrl: org.logoUrl || baseMandal.identity?.logoUrl,
      description: historyDescription
        ? { mr: historyDescription, hi: historyDescription, en: historyDescription }
        : baseMandal.identity?.description,
    },
    history: historyObj,
    communityStats: mergedStats,
    milestones: customMilestones || (baseMandal as any).milestones || baseMandal.history?.milestones || [],
    socialInitiatives: finalSocialInitiatives,
    achievements: finalAchievements,
    customSections: customSections,
    festival: {
      ...baseMandal.festival,
      name: {
        mr: org.nameMarathi ? `${org.nameMarathi} उत्सव २०२६` : baseMandal.festival?.name?.mr || 'महोत्सव २०२६',
        hi: org.nameHindi ? `${org.nameHindi} उत्सव २०२६` : baseMandal.festival?.name?.hi || 'उत्सव २०२६',
        en: org.name ? `${org.name} Celebration 2026` : baseMandal.festival?.name?.en || 'Celebration 2026',
      },
      startDate: festivalDays[0]?.date || baseMandal.festival?.startDate || '2026-10-11',
      endDate: festivalDays[festivalDays.length - 1]?.date || baseMandal.festival?.endDate || '2026-10-19',
      totalDays: festivalDays.length || baseMandal.festival?.totalDays || 9,
    },
    festivalDays,
    schedule: festivalDays,
    sponsors,
    gallery: baseMandal.gallery || [],
    location: {
      ...baseMandal.location,
      venue: {
        mr: org.nameMarathi || org.name || baseMandal.location?.venue?.mr || 'मुख्य मंडप',
        hi: org.nameHindi || org.name || baseMandal.location?.venue?.hi || 'मुख्य मंडप',
        en: org.name || baseMandal.location?.venue?.en || 'Main Pavilion',
      },
      address: org.address
        ? { mr: org.address, hi: org.address, en: org.address }
        : baseMandal.location?.address,
      city: org.city
        ? { mr: org.city, hi: org.city, en: org.city }
        : baseMandal.location?.city,
      state: org.state
        ? { mr: org.state, hi: org.state, en: org.state }
        : baseMandal.location?.state,
      mapsUrl: dbConfig.googleMapUrl || baseMandal.location?.mapsUrl,
    },
    contact: {
      phone: org.phone || baseMandal.contact?.phone,
      email: org.email || baseMandal.contact?.email,
    },
    donation: {
      ...baseMandal.donation,
      enabled: true,
      upiId: dbConfig.upiId || org.upiId || baseMandal.donation?.upiId,
      qrImage: dbConfig.qrImageUrl || baseMandal.donation?.qrImage,
      bankDetails: {
        accountName: org.name || baseMandal.donation?.bankDetails?.accountName || '',
        accountNumber: dbConfig.bankAccountNumber || org.bankAccountNumber || baseMandal.donation?.bankDetails?.accountNumber || '',
        bankName: dbConfig.bankName || org.bankName || baseMandal.donation?.bankDetails?.bankName || '',
        ifsc: dbConfig.bankIfsc || org.bankIfsc || baseMandal.donation?.bankDetails?.ifsc || '',
      },
    },
  } as Mandal;
}
