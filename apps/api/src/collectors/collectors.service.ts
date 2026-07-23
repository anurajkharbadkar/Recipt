import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

  async create(orgId: string, data: any) {
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

  async update(id: string, orgId: string, data: any) {
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

    const [totalResult, todayResult, recentReceipts] = await Promise.all([
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
      recentReceipts,
    };
  }
}
