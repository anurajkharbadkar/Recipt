import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMandalPageConfigDto } from './dto/mandal-page.dto';

@Injectable()
export class MandalPagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches public page config by slug (public endpoint, no auth required).
   */
  async findBySlug(slug: string) {
    const config = await this.prisma.mandalPageConfig.findUnique({
      where: { slug },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            nameMarathi: true,
            nameHindi: true,
            mandalCode: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            phone: true,
            email: true,
            logoUrl: true,
            socialLinks: true,
            paymentEnabled: true,
            cashfreeVendorStatus: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
          },
        },
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            events: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        sponsors: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!config || !config.isPublic) {
      throw new NotFoundException('Mandal public page not found');
    }

    return config;
  }

  /**
   * Gets or initializes the MandalPageConfig for an organization (admin dashboard).
   */
  async getMyConfig(orgId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({ where: { id: orgId } });

    let config = await this.prisma.mandalPageConfig.findUnique({
      where: { orgId },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: { events: { orderBy: { sortOrder: 'asc' } } },
        },
        sponsors: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!config) {
      // Auto-create initial default config using organization slug
      config = await this.prisma.mandalPageConfig.create({
        data: {
          orgId,
          slug: org.slug,
          tagline: `${org.name} Official Public Bulletin & Schedule`,
          aboutHistory: `${org.name} welcomes all devotees to join our annual celebrations.`,
        },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: { events: { orderBy: { sortOrder: 'asc' } } },
          },
          sponsors: { orderBy: { sortOrder: 'asc' } },
        },
      });
    }

    return config;
  }

  /**
   * Updates page config, schedules, and sponsors in a single transaction.
   */
  async updateConfig(orgId: string, dto: UpdateMandalPageConfigDto) {
    let config = await this.prisma.mandalPageConfig.findUnique({ where: { orgId } });
    const org = await this.prisma.organization.findUniqueOrThrow({ where: { id: orgId } });

    if (!config) {
      config = await this.prisma.mandalPageConfig.create({
        data: { orgId, slug: dto.slug || org.slug },
      });
    }

    if (dto.slug && dto.slug !== config.slug) {
      const existingSlug = await this.prisma.mandalPageConfig.findUnique({ where: { slug: dto.slug } });
      if (existingSlug && existingSlug.id !== config.id) {
        throw new BadRequestException('This custom web URL slug is already taken by another Mandal.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Update top-level config
      await tx.mandalPageConfig.update({
        where: { id: config.id },
        data: {
          slug: dto.slug ?? undefined,
          isPublic: dto.isPublic ?? undefined,
          tagline: dto.tagline ?? undefined,
          aboutHistory: dto.aboutHistory ?? undefined,
          coverImageUrl: dto.coverImageUrl ?? undefined,
          themeColor: dto.themeColor ?? undefined,
          googleMapUrl: dto.googleMapUrl ?? undefined,
          bankName: dto.bankName ?? undefined,
          bankAccountNumber: dto.bankAccountNumber ?? undefined,
          bankIfsc: dto.bankIfsc ?? undefined,
          upiId: dto.upiId ?? undefined,
          qrImageUrl: dto.qrImageUrl ?? undefined,
        },
      });

      // Update days and events if provided
      if (dto.days) {
        // Clear existing days & cascade events
        await tx.mandalDaySchedule.deleteMany({ where: { pageConfigId: config.id } });

        for (const day of dto.days) {
          await tx.mandalDaySchedule.create({
            data: {
              pageConfigId: config.id,
              dayNumber: day.dayNumber,
              date: day.date ? new Date(day.date) : null,
              title: day.title,
              dressCodeColor: day.dressCodeColor,
              colorHex: day.colorHex,
              deityAvatar: day.deityAvatar,
              events: day.events
                ? {
                    create: day.events.map((e, idx) => ({
                      time: e.time,
                      title: e.title,
                      description: e.description,
                      eventType: e.eventType || 'AARTI',
                      sortOrder: e.sortOrder ?? idx,
                    })),
                  }
                : undefined,
            },
          });
        }
      }

      // Update sponsors if provided
      if (dto.sponsors) {
        await tx.mandalSponsor.deleteMany({ where: { pageConfigId: config.id } });

        for (let idx = 0; idx < dto.sponsors.length; idx++) {
          const sp = dto.sponsors[idx];
          await tx.mandalSponsor.create({
            data: {
              pageConfigId: config.id,
              name: sp.name,
              logoUrl: sp.logoUrl,
              tier: sp.tier || 'GOLD',
              websiteUrl: sp.websiteUrl,
              phone: sp.phone,
              sortOrder: sp.sortOrder ?? idx,
            },
          });
        }
      }

      return tx.mandalPageConfig.findUniqueOrThrow({
        where: { id: config.id },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: { events: { orderBy: { sortOrder: 'asc' } } },
          },
          sponsors: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });
  }

  /**
   * Applies a preset festival template (Navratri 9-Day or Ganeshotsav 10-Day).
   */
  async applyPresetTemplate(orgId: string, presetType: 'NAVRATRI' | 'GANESHOTSAV') {
    const config = await this.getMyConfig(orgId);

    const navratriDays = [
      { dayNumber: 1, title: 'घटस्थापना', dressCodeColor: 'पिवळा (Yellow)', colorHex: '#EAB308', deityAvatar: 'शैलपुत्री देवी', events: [{ time: '07:00 AM', title: 'घटस्थापना व काकड आरती', eventType: 'POOJA' }, { time: '08:00 PM', title: 'महाआरती व दांडिया रास', eventType: 'CULTURAL' }] },
      { dayNumber: 2, title: 'द्वितीया', dressCodeColor: 'हिरवा (Green)', colorHex: '#22C55E', deityAvatar: 'ब्रह्मचारिणी देवी', events: [{ time: '07:30 AM', title: 'प्रभात आरती', eventType: 'AARTI' }, { time: '08:00 PM', title: 'महिला भजन संध्या व आरती', eventType: 'CULTURAL' }] },
      { dayNumber: 3, title: 'तृतीया', dressCodeColor: 'राखाडी (Grey)', colorHex: '#64748B', deityAvatar: 'चंद्रघंटा देवी', events: [{ time: '07:30 AM', title: 'प्रभात आरती', eventType: 'AARTI' }, { time: '08:00 PM', title: 'गरबा व रास रसोत्सव', eventType: 'CULTURAL' }] },
      { dayNumber: 4, title: 'चतुर्थी', dressCodeColor: 'नारंगी (Orange)', colorHex: '#F97316', deityAvatar: 'कूष्मांडा देवी', events: [{ time: '07:30 AM', title: 'प्रभात आरती', eventType: 'AARTI' }, { time: '01:00 PM', title: 'मोफत आरोग्य व रक्तदान शिबीर', eventType: 'SPECIAL' }, { time: '08:00 PM', title: 'महाआरती', eventType: 'AARTI' }] },
      { dayNumber: 5, title: 'पंचमी', dressCodeColor: 'पांढरा (White)', colorHex: '#F8FAFC', deityAvatar: 'स्कंदमाता देवी', events: [{ time: '07:30 AM', title: 'प्रभात आरती', eventType: 'AARTI' }, { time: '08:00 PM', title: 'धनुरास व दीपउत्सव आरती', eventType: 'AARTI' }] },
      { dayNumber: 6, title: 'षष्ठी', dressCodeColor: 'लाल (Red)', colorHex: '#EF4444', deityAvatar: 'कात्यायनी देवी', events: [{ time: '07:30 AM', title: 'प्रभात आरती', eventType: 'AARTI' }, { time: '07:30 PM', title: 'विशेष ललिता सहस्रनाम स्तोत्र', eventType: 'POOJA' }, { time: '08:30 PM', title: 'महाआरती', eventType: 'AARTI' }] },
      { dayNumber: 7, title: 'सप्तमी', dressCodeColor: 'निळा (Royal Blue)', colorHex: '#1D4ED8', deityAvatar: 'कालरात्री देवी', events: [{ time: '07:30 AM', title: 'प्रभात आरती', eventType: 'AARTI' }, { time: '08:00 PM', title: 'महाकीर्तन व रास दांडिया', eventType: 'CULTURAL' }] },
      { dayNumber: 8, title: 'दुर्गाष्टमी', dressCodeColor: 'गुलाबी (Pink)', colorHex: '#EC4899', deityAvatar: 'महागौरी देवी', events: [{ time: '08:00 AM', title: 'महाहवन व चंडी होमम्', eventType: 'POOJA' }, { time: '01:00 PM', title: 'महाप्रसाद भंडारा', eventType: 'PRASAD' }, { time: '08:00 PM', title: 'भव्य दुर्गाष्टमी महाआरती', eventType: 'AARTI' }] },
      { dayNumber: 9, title: 'महानवमी / विजयादशमी', dressCodeColor: 'जांभळा (Purple)', colorHex: '#9333EA', deityAvatar: 'सिद्धिदात्री देवी', events: [{ time: '09:00 AM', title: 'कन्या पूजन व सुवासिनी पूजन', eventType: 'POOJA' }, { time: '08:00 PM', title: 'विसर्जन मिरवणूक व महाआरती', eventType: 'SPECIAL' }] },
    ];

    const ganeshDays = [
      { dayNumber: 1, title: 'श्री गणेश प्रतिष्ठापना', dressCodeColor: 'पिवळा / पीतांबर', colorHex: '#EAB308', deityAvatar: 'श्री गणेश स्थापना', events: [{ time: '08:00 AM', title: 'गणेश स्थापना व षोडशोपचार पूजा', eventType: 'POOJA' }, { time: '08:00 PM', title: 'महाआरती व ढोल ताशा वादन', eventType: 'AARTI' }] },
      { dayNumber: 2, title: 'शहनाई वादन व भजन संध्या', dressCodeColor: 'भगवा (Saffron)', colorHex: '#D97706', deityAvatar: 'शहनाई वादन अलंकार', events: [{ time: '07:30 AM', title: 'काकड आरती', eventType: 'AARTI' }, { time: '08:00 PM', title: 'पारंपरिक शास्त्रीय भजन संध्या', eventType: 'CULTURAL' }] },
      { dayNumber: 3, title: 'छप्पन भोग नैवेद्य', dressCodeColor: 'लाल (Red)', colorHex: '#EF4444', deityAvatar: 'राजस अलंकार', events: [{ time: '07:30 AM', title: 'काकड आरती', eventType: 'AARTI' }, { time: '07:00 PM', title: 'छप्पन भोग नैवेद्य व सायंकालीन आरती', eventType: 'PRASAD' }] },
      { dayNumber: 4, title: 'अथर्वशीर्ष आवर्तन', dressCodeColor: 'नारंगी (Orange)', colorHex: '#F97316', deityAvatar: 'विद्याप्रद अलंकार', events: [{ time: '07:00 AM', title: '१००० अथर्वशीर्ष आवर्तन', eventType: 'POOJA' }, { time: '08:00 PM', title: 'सायंकालीन आरती', eventType: 'AARTI' }] },
      { dayNumber: 5, title: 'गौरी आगमन व स्थापना', dressCodeColor: 'गुलाबी (Pink)', colorHex: '#EC4899', deityAvatar: 'महालक्ष्मी व गौरी आगमन', events: [{ time: '09:00 AM', title: 'गौरी आवाहन व स्थापना', eventType: 'POOJA' }, { time: '08:00 PM', title: 'गौरी आरती व हळदीकुंकू', eventType: 'SPECIAL' }] },
      { dayNumber: 6, title: 'गौरी पूजन व महाप्रसाद', dressCodeColor: 'हिरवा (Green)', colorHex: '#22C55E', deityAvatar: 'गौरी पूजन अलंकार', events: [{ time: '08:00 AM', title: 'गौरी पूजन व नैवेद्य', eventType: 'POOJA' }, { time: '01:00 PM', title: 'महाप्रसाद वाटप', eventType: 'PRASAD' }, { time: '08:00 PM', title: 'महाआरती', eventType: 'AARTI' }] },
      { dayNumber: 7, title: 'गौरी विसर्जन', dressCodeColor: 'पिवळा (Yellow)', colorHex: '#EAB308', deityAvatar: 'गौरी उत्तरपूजा', events: [{ time: '10:00 AM', title: 'गौरी उत्तरपूजा व विसर्जन', eventType: 'SPECIAL' }, { time: '08:00 PM', title: 'सायंकालीन आरती', eventType: 'AARTI' }] },
      { dayNumber: 8, title: 'सांस्कृतिक कार्यक्रम संध्या', dressCodeColor: 'निळा (Royal Blue)', colorHex: '#1D4ED8', deityAvatar: 'दरबार अलंकार', events: [{ time: '07:30 AM', title: 'प्रभात आरती', eventType: 'AARTI' }, { time: '07:30 PM', title: 'युवक व महिला मंडळ सांस्कृतिक नाटक व संगीत संध्या', eventType: 'CULTURAL' }] },
      { dayNumber: 9, title: 'महाकीर्तन व महाआरती', dressCodeColor: 'जांभळा (Maroon)', colorHex: '#800000', deityAvatar: 'महाअलंकार', events: [{ time: '07:30 AM', title: 'प्रभात आरती', eventType: 'AARTI' }, { time: '07:00 PM', title: 'ह.भ.प. कीर्तनकारांचे भव्य कीर्तन', eventType: 'CULTURAL' }, { time: '09:00 PM', title: 'उत्तरपूजापूर्व भव्य महाआरती', eventType: 'AARTI' }] },
      { dayNumber: 10, title: 'अनंत चतुर्दशी विसर्जन मिरवणूक', dressCodeColor: 'भगवा व पांढरा', colorHex: '#D97706', deityAvatar: 'उत्तरपूजा व विसर्जन मिरवणूक', events: [{ time: '09:00 AM', title: 'उत्तरपूजा व भव्य विसर्जन मिरवणूक', eventType: 'SPECIAL' }] },
    ];

    const selectedDays = presetType === 'NAVRATRI' ? navratriDays : ganeshDays;

    return this.updateConfig(orgId, {
      tagline: presetType === 'NAVRATRI' ? 'Sharad Navratri Utsav - Daily Schedule & Aarti Bulletin' : 'Ganeshotsav Celebration - Daily Schedule & Aarti Bulletin',
      days: selectedDays as any,
    });
  }
}
