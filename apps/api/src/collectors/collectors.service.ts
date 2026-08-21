import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectorDto, UpdateCollectorDto } from './dto/collector.dto';
import { MAX_COLLECTORS_BY_PLAN, SubscriptionPlan } from '@pavti/shared';
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

    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    const plan = (org?.subscriptionPlan as SubscriptionPlan) || SubscriptionPlan.FREE;
    const limit = MAX_COLLECTORS_BY_PLAN[plan] ?? 5;
    // -1 = unlimited (e.g. PREMIUM) — skip the count query entirely rather
    // than comparing against a negative number.
    if (limit !== -1) {
      const currentCount = await this.prisma.user.count({
        where: { orgId, role: { in: ['COLLECTOR', 'TREASURER'] } },
      });
      if (currentCount >= limit) {
        throw new ForbiddenException(
          `Your ${plan} plan allows up to ${limit} collectors. Remove an inactive one or upgrade your plan to add more.`,
        );
      }
    }

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
        // '' ("No specific area" in the picker) must clear the FK, not set
        // it literally — areaId is a raw scalar column here (not a
        // `connect`), so an empty string would violate the foreign key
        // constraint against CollectorArea.
        areaId: data.areaId || null,
        isActive: true,
      },
      include: { area: true },
    });
  }

  async update(id: string, orgId: string, data: UpdateCollectorDto) {
    await this.findOne(id, orgId);
    // Unchecked, not the plain UpdateInput — this assigns the raw areaId
    // scalar column directly (matching create()'s same pattern just above),
    // not a relation `area: { connect/disconnect }` object.
    const updateData: Prisma.UserUncheckedUpdateInput = {
      name: data.name,
      email: data.email,
      role: data.role,
      // Same '' → null normalization as create() — lets an edit explicitly
      // clear a collector's area instead of silently failing the FK
      // constraint. `undefined` (field omitted) still leaves it untouched.
      areaId: data.areaId === undefined ? undefined : (data.areaId || null),
      isActive: data.isActive,
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
    const where: Prisma.ReceiptWhereInput = { collectorId: id, isVoided: false };
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
