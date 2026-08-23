import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, CategoryKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UpdateOrganizationDto } from './dto/organization.dto';
import { UserRole, SubscriptionPlan, DEFAULT_RECEIPT_THEME_ID, ReceiptTemplateSettings } from '@pavti/shared';
import { extensionFor } from '../common/pipes/image-upload.pipe';

// STANDARD/PREMIUM-exclusive per the pricing page ("UPI ID on Every Receipt",
// "Custom Branded Receipt Design") — BASIC previously got both for free
// since nothing checked plan here (2026-08 roles/subscription audit). FREE
// is included too, but only for its 7-day trial window — see
// MAX_COLLECTORS_BY_PLAN's comment for why FREE mirrors Premium there.
// Once that window closes, RolesGuard's expiry check already blocks every
// write regardless of this list, so there's no gap where an expired trial
// org keeps using these (2026-08-22 free-trial rework).
const PREMIUM_FEATURE_PLANS: SubscriptionPlan[] = [SubscriptionPlan.FREE, SubscriptionPlan.STANDARD, SubscriptionPlan.PREMIUM];

// Bank transfer details are sensitive — only admins/treasurers who actually
// reconcile funds need them. COLLECTOR/VIEWER accounts are often low-trust
// field volunteers and should never see the org's bank account number/IFSC
// just by loading the app shell (which calls GET /organizations/me).
const BANK_FIELDS_RESTRICTED_TO: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER];

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  /**
   * Lets Settings show real integration status. WhatsApp/SMS are gone from
   * here on purpose — WhatsApp sharing is a manual click-to-chat link (no
   * API, nothing to "configure"), and SMS was removed entirely. Storage is
   * the only integration left with an actual configured/not-configured
   * state worth surfacing.
   */
  getIntegrationsStatus() {
    return {
      storage: this.storage.isR2Configured() ? 'r2' : 'local',
    };
  }

  async getMe(orgId: string, role?: UserRole) {
    const [org, receiptCount] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: orgId },
        include: {
          campaigns: { where: { status: 'ACTIVE' }, take: 1 },
          _count: { select: { users: true, campaigns: true } },
        },
      }),
      // No direct Organization -> Receipt relation (receipts belong to
      // Campaign), so this can't ride along in the query above via _count —
      // cheap enough as its own indexed count. Powers the free-trial
      // progress banner ("X of 10 pavtis used"); harmless for paid plans,
      // which just don't show it.
      this.prisma.receipt.count({ where: { campaign: { orgId } } }),
    ]);
    if (!org) throw new NotFoundException('Organization not found');

    if (role && !BANK_FIELDS_RESTRICTED_TO.includes(role)) {
      const { bankAccountNumber, bankIfsc, bankBranch, ...safe } = org;
      return { ...safe, receiptCount };
    }
    return { ...org, receiptCount };
  }

  async update(orgId: string, dto: UpdateOrganizationDto) {
    const current = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { subscriptionPlan: true, upiId: true, receiptTemplateSettings: true },
    });
    const plan = (current?.subscriptionPlan as SubscriptionPlan) || SubscriptionPlan.FREE;

    if (!PREMIUM_FEATURE_PLANS.includes(plan)) {
      // Only block a genuine change to a gated value — re-saving an
      // unrelated field (e.g. the footer note) shouldn't fail just because
      // the org's already-saved theme/UPI ID predates a downgrade, or the
      // request happens to resend the same value it already has.
      if (dto.upiId && dto.upiId !== current?.upiId) {
        throw new ForbiddenException('A UPI ID on receipts is a Standard-plan feature. Upgrade your plan to add one.');
      }
      const requestedTheme = (dto.receiptTemplateSettings as ReceiptTemplateSettings | undefined)?.theme;
      const currentTheme = (current?.receiptTemplateSettings as ReceiptTemplateSettings | null)?.theme || DEFAULT_RECEIPT_THEME_ID;
      if (requestedTheme && requestedTheme !== DEFAULT_RECEIPT_THEME_ID && requestedTheme !== currentTheme) {
        throw new ForbiddenException('Custom receipt themes are a Standard-plan feature. Upgrade your plan to use this design.');
      }
    }

    const dataToUpdate: Record<string, any> = {
      ...dto,
      upiId: dto.upiId === '' ? null : dto.upiId,
      email: dto.email === '' ? null : dto.email,
      regNumber: dto.regNumber === '' ? null : dto.regNumber,
      bankName: dto.bankName === '' ? null : dto.bankName,
      bankAccountNumber: dto.bankAccountNumber === '' ? null : dto.bankAccountNumber,
      bankIfsc: dto.bankIfsc === '' ? null : dto.bankIfsc,
      bankBranch: dto.bankBranch === '' ? null : dto.bankBranch,
      nameMarathi: dto.nameMarathi === '' ? null : dto.nameMarathi,
      nameHindi: dto.nameHindi === '' ? null : dto.nameHindi,
      pincode: dto.pincode === '' ? null : dto.pincode,
    };

    return this.prisma.organization.update({
      where: { id: orgId },
      data: dataToUpdate as Prisma.OrganizationUpdateInput,
    });
  }

  async uploadLogo(orgId: string, file: Express.Multer.File) {
    const logoUrl = await this.storage.uploadFile(
      `logos/${orgId}-${Date.now()}.${extensionFor(file.mimetype)}`,
      file.buffer,
      file.mimetype,
    );
    return this.prisma.organization.update({
      where: { id: orgId },
      data: { logoUrl },
    });
  }

  /**
   * Uploads an image for the Interactive Devotional Pavti's custom idol/
   * darshan photo (settings > Interactive tab). Deliberately doesn't touch
   * the DB — unlike the logo, this URL lives inside the `receiptTemplateSettings`
   * JSON blob that the settings form already owns end-to-end, so it's only
   * persisted when the admin hits "Save Settings", same as every other
   * pavti customization field. This endpoint just gets the file onto
   * storage and hands back its URL.
   */
  async uploadIdolImage(orgId: string, file: Express.Multer.File) {
    const url = await this.storage.uploadFile(
      `idols/${orgId}-${Date.now()}.${extensionFor(file.mimetype)}`,
      file.buffer,
      file.mimetype,
    );
    return { url };
  }

  async getAreas(orgId: string) {
    return this.prisma.collectorArea.findMany({
      where: { orgId },
      include: { _count: { select: { collectors: true, receipts: true } } },
    });
  }

  // Case-insensitive dedup: collectors adding an area inline from the receipt
  // form (not just ORG_ADMIN via Settings, now that POST /areas is open to
  // them too) are typing on a phone keyboard — "ward a" vs "Ward A" shouldn't
  // silently fork into two areas. Returns the existing row instead of erroring.
  async createArea(orgId: string, data: { name: string; description?: string }) {
    const existing = await this.prisma.collectorArea.findFirst({
      where: { orgId, name: { equals: data.name, mode: 'insensitive' } },
    });
    if (existing) return existing;
    return this.prisma.collectorArea.create({
      data: { orgId, ...data },
    });
  }

  async deleteArea(areaId: string, orgId: string) {
    const area = await this.prisma.collectorArea.findFirst({
      where: { id: areaId, orgId },
    });
    if (!area) throw new NotFoundException('Area not found');
    return this.prisma.collectorArea.delete({ where: { id: areaId } });
  }

  // ─── Custom Categories ──────────────────────────────────────────────────
  // Org-added categories layered on top of the curated presets (see
  // CategoryKind's schema comment). Mirrors the Area methods above exactly,
  // including the same case-insensitive dedup rationale.

  async getCategories(orgId: string, kind: CategoryKind) {
    return this.prisma.customCategory.findMany({
      where: { orgId, kind },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createCategory(orgId: string, kind: CategoryKind, label: string) {
    const existing = await this.prisma.customCategory.findFirst({
      where: { orgId, kind, label: { equals: label, mode: 'insensitive' } },
    });
    if (existing) return existing;
    return this.prisma.customCategory.create({
      data: { orgId, kind, label },
    });
  }

  async deleteCategory(id: string, orgId: string) {
    const category = await this.prisma.customCategory.findFirst({
      where: { id, orgId },
    });
    if (!category) throw new NotFoundException('Category not found');
    return this.prisma.customCategory.delete({ where: { id } });
  }
}
