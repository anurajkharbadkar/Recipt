import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';
import { MAX_ACTIVE_CAMPAIGNS_BY_PLAN, SubscriptionPlan } from '@pavti/shared';
import { CampaignStatus } from '@prisma/client';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.campaign.findMany({
      where: { orgId },
      include: {
        _count: { select: { receipts: true, expenses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, orgId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, orgId },
      include: {
        organization: true,
        _count: { select: { receipts: true, expenses: true } },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async create(orgId: string, data: CreateCampaignDto) {
    const year = data.year || new Date().getFullYear();
    const prefix = data.receiptPrefix ||
      `${data.name.substring(0, 3).toUpperCase()}-${year}`;

    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    const plan = (org?.subscriptionPlan as SubscriptionPlan) || SubscriptionPlan.FREE;
    const limit = MAX_ACTIVE_CAMPAIGNS_BY_PLAN[plan] ?? 1;

    let initialStatus: CampaignStatus = (data.status as CampaignStatus) || CampaignStatus.ACTIVE;
    if (initialStatus === 'ACTIVE') {
      const activeCount = await this.prisma.campaign.count({
        where: { orgId, status: 'ACTIVE' },
      });
      if (activeCount >= limit) {
        if (data.status === 'ACTIVE') {
          throw new ForbiddenException(
            `Your ${plan} plan allows up to ${limit} active campaign${limit === 1 ? '' : 's'} at a time. Complete or pause an existing campaign, or upgrade your plan to run this one alongside it.`,
          );
        }
        // If status was omitted/defaulted to ACTIVE, set to DRAFT so campaign creation succeeds without violating limits
        initialStatus = 'DRAFT';
      }
    }

    return this.prisma.campaign.create({
      data: {
        orgId,
        name: data.name,
        nameMarathi: data.nameMarathi,
        nameHindi: data.nameHindi,
        year,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        targetAmount: data.targetAmount,
        receiptPrefix: prefix,
        status: initialStatus,
        description: data.description,
      },
    });
  }

  // Deliberately spreads through an allowlisted DTO (not the raw request body)
  // so a client can never smuggle orgId/receiptPrefix/receiptSeq overrides
  // into this update — receiptSeq in particular backs atomic receipt-number
  // generation (see ReceiptsService.create) and must never be client-writable.
  async update(id: string, orgId: string, data: UpdateCampaignDto) {
    await this.findOne(id, orgId);
    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameMarathi !== undefined && { nameMarathi: data.nameMarathi }),
        ...(data.nameHindi !== undefined && { nameHindi: data.nameHindi }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  async activate(id: string, orgId: string) {
    const campaign = await this.findOne(id, orgId);
    if (campaign.status === 'ACTIVE') return campaign;

    const plan = (campaign.organization.subscriptionPlan as SubscriptionPlan) || SubscriptionPlan.FREE;
    const limit = MAX_ACTIVE_CAMPAIGNS_BY_PLAN[plan] ?? 1;
    const activeCount = await this.prisma.campaign.count({
      where: { orgId, status: 'ACTIVE', id: { not: id } },
    });
    if (activeCount >= limit) {
      throw new ForbiddenException(
        `Your ${plan} plan allows ${limit} active campaign${limit === 1 ? '' : 's'} at a time. `
        + `Complete or pause an existing campaign, or upgrade your plan to run this one alongside it.`,
      );
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async complete(id: string, orgId: string) {
    await this.findOne(id, orgId);
    return this.prisma.campaign.update({
      where: { id },
      data: { status: 'COMPLETED', endDate: new Date() },
    });
  }

  async getStats(id: string, orgId: string) {
    await this.findOne(id, orgId);

    const [totalResult, pendingResult, expenseResult, receiptCount] = await Promise.all([
      // Only PAID receipts count as "collected" — a PENDING receipt is a due
      // amount, not cash in hand (see reports.service.ts getDashboardSummary).
      this.prisma.receipt.aggregate({
        where: { campaignId: id, isVoided: false, status: 'PAID' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.receipt.aggregate({
        where: { campaignId: id, isVoided: false, status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      // All logged expenses, not just approved ones — approval is an audit
      // workflow flag, not a gate on whether the money was actually spent.
      this.prisma.expense.aggregate({
        where: { campaignId: id },
        _sum: { amount: true },
      }),
      this.prisma.receipt.count({ where: { campaignId: id } }),
    ]);

    const totalCollected = totalResult._sum.amount || 0;
    const totalExpenses = expenseResult._sum.amount || 0;

    return {
      totalCollected,
      totalExpenses,
      netBalance: totalCollected - totalExpenses,
      receiptCount,
      pendingCollections: pendingResult._sum.amount || 0,
      pendingCollectionsCount: pendingResult._count,
    };
  }
}
