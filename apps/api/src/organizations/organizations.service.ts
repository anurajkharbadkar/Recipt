import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UpdateOrganizationDto } from './dto/organization.dto';
import { UserRole } from '@pavti/shared';

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

  async getMe(orgId: string, role?: UserRole) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        campaigns: { where: { status: 'ACTIVE' }, take: 1 },
        _count: { select: { users: true, campaigns: true } },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');

    if (role && !BANK_FIELDS_RESTRICTED_TO.includes(role)) {
      const { bankAccountNumber, bankIfsc, bankBranch, ...safe } = org;
      return safe;
    }
    return org;
  }

  async update(orgId: string, dto: UpdateOrganizationDto) {
    return this.prisma.organization.update({
      where: { id: orgId },
      // receiptTemplateSettings is a validated-as-object-but-otherwise-freeform
      // JSON column; Prisma's generated input type wants its own JsonValue
      // union rather than Record<string, unknown>, so it's cast at this single
      // boundary instead of loosening the DTO's own (accurate) type.
      data: dto as Prisma.OrganizationUpdateInput,
    });
  }

  async uploadLogo(orgId: string, file: Express.Multer.File) {
    const logoUrl = await this.storage.uploadFile(
      `logos/${orgId}-${Date.now()}.png`,
      file.buffer,
      file.mimetype,
    );
    return this.prisma.organization.update({
      where: { id: orgId },
      data: { logoUrl },
    });
  }

  async getAreas(orgId: string) {
    return this.prisma.collectorArea.findMany({
      where: { orgId },
      include: { _count: { select: { collectors: true, receipts: true } } },
    });
  }

  async createArea(orgId: string, data: { name: string; description?: string }) {
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
}
