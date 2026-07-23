import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async create(orgId: string, data: any) {
    const year = data.year || new Date().getFullYear();
    const prefix = data.receiptPrefix ||
      `${data.name.substring(0, 3).toUpperCase()}-${year}`;

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
        status: data.status || 'DRAFT',
        description: data.description,
      },
    });
  }

  async update(id: string, orgId: string, data: any) {
    await this.findOne(id, orgId);
    return this.prisma.campaign.update({
      where: { id },
      data,
    });
  }

  async activate(id: string, orgId: string) {
    await this.findOne(id, orgId);
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

    const [totalResult, expenseResult, receiptCount] = await Promise.all([
      this.prisma.receipt.aggregate({
        where: { campaignId: id, isVoided: false },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where: { campaignId: id, isApproved: true },
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
    };
  }
}
