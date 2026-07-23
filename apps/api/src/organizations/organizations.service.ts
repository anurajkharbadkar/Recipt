import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async getMe(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        campaigns: { where: { status: 'ACTIVE' }, take: 1 },
        _count: { select: { users: true, campaigns: true } },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(orgId: string, data: any) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data,
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

  async uploadReceiptTemplateImage(
    orgId: string,
    file: Express.Multer.File,
    width?: number,
    height?: number,
  ) {
    const ext = file.mimetype === 'image/jpeg' ? 'jpg'
      : file.mimetype === 'image/png' ? 'png'
      : file.mimetype === 'image/webp' ? 'webp'
      : 'png';

    const customImageUrl = await this.storage.uploadFile(
      `receipt-templates/${orgId}-${Date.now()}.${ext}`,
      file.buffer,
      file.mimetype,
    );

    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    const current = (org?.receiptTemplateSettings as any) || {};

    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        receiptTemplateSettings: {
          ...current,
          theme: 'CUSTOM_IMAGE',
          customImageUrl,
          imageWidth: width,
          imageHeight: height,
        },
      },
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
