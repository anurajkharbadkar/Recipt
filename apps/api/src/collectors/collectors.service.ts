import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectorDto, UpdateCollectorDto } from './dto/collector.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CollectorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.user.findMany({
      where: { orgId, role: { in: ['COLLECTOR', 'TREASURER'] } },
      include: {
        area: true,
        _count: { select: { receipts: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, orgId: string) {
    const collector = await this.prisma.user.findFirst({
      where: { id, orgId },
      include: { area: true },
    });
    if (!collector) throw new NotFoundException('Collector not found');
    return collector;
  }

  async create(orgId: string, data: CreateCollectorDto) {
    const existing = await this.prisma.user.findUnique({
      where: { orgId_phone: { orgId, phone: data.phone } },
    });
    if (existing) throw new ConflictException('A user with this phone already exists in your organization');

    const passwordHash = data.password
      ? await bcrypt.hash(data.password, 12)
      : await bcrypt.hash(data.phone, 12); // Default password = phone number

    return this.prisma.user.create({
      data: {
        orgId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        passwordHash,
        role: data.role || 'COLLECTOR',
        areaId: data.areaId,
        isActive: true,
      },
      include: { area: true },
    });
  }

  async update(id: string, orgId: string, data: UpdateCollectorDto) {
    await this.findOne(id, orgId);
    const updateData: any = {
      name: data.name,
      email: data.email,
      role: data.role,
      areaId: data.areaId,
      isActive: data.isActive,
      permissionsOverride: data.permissionsOverride,
    };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { area: true },
    });
  }

  async getStats(id: string, orgId: string, campaignId?: string) {
    await this.findOne(id, orgId);
    const where: any = { collectorId: id, isVoided: false };
    if (campaignId) where.campaignId = campaignId;

    // Split by collectionType: a collector's "normal" donation total and
    // their Internal Collection (member fee) total are different things —
    // internal receipts are often bulk-declared by an admin/treasurer with
    // this person only as the record's nominal collectorId, so folding both
    // into one number misrepresents what they actually went out and collected.
    const [totalResult, todayResult, donationResult, internalResult, recentReceipts] = await Promise.all([
      this.prisma.receipt.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.receipt.aggregate({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.receipt.aggregate({
        where: { ...where, collectionType: 'DONATION' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.receipt.aggregate({
        where: { ...where, collectionType: 'INTERNAL' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.receipt.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { campaign: { select: { name: true } } },
      }),
    ]);

    return {
      totalAmount: totalResult._sum.amount || 0,
      totalReceipts: totalResult._count,
      todayAmount: todayResult._sum.amount || 0,
      todayReceipts: todayResult._count,
      donationAmount: donationResult._sum.amount || 0,
      donationCount: donationResult._count,
      internalAmount: internalResult._sum.amount || 0,
      internalCount: internalResult._count,
      recentReceipts,
    };
  }
}
