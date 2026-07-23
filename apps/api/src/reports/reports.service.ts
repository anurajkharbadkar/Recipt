import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(orgId: string, campaignId?: string) {
    const receiptWhere: any = { campaign: { orgId }, isVoided: false };
    const expenseWhere: any = { campaign: { orgId }, isApproved: true };
    if (campaignId) {
      receiptWhere.campaignId = campaignId;
      expenseWhere.campaignId = campaignId;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalResult,
      todayResult,
      expenseResult,
      pendingExpenses,
      activeCollectors,
    ] = await Promise.all([
      this.prisma.receipt.aggregate({ where: receiptWhere, _sum: { amount: true }, _count: true }),
      this.prisma.receipt.aggregate({
        where: { ...receiptWhere, createdAt: { gte: todayStart } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({ where: expenseWhere, _sum: { amount: true } }),
      this.prisma.expense.count({ where: { ...expenseWhere, isApproved: false } }),
      this.prisma.user.count({
        where: { orgId, role: 'COLLECTOR', isActive: true },
      }),
    ]);

    const totalCollections = totalResult._sum.amount || 0;
    const totalExpenses = expenseResult._sum.amount || 0;

    return {
      totalCollections,
      todayCollections: todayResult._sum.amount || 0,
      totalReceipts: totalResult._count,
      todayReceipts: todayResult._count,
      totalExpenses,
      netBalance: totalCollections - totalExpenses,
      activeCollectors,
      pendingExpenses,
    };
  }

  async getDailyCollections(orgId: string, campaignId?: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      campaign: { orgId },
      isVoided: false,
      createdAt: { gte: startDate },
    };
    if (campaignId) where.campaignId = campaignId;

    const receipts = await this.prisma.receipt.findMany({
      where,
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dateMap = new Map<string, { amount: number; count: number }>();
    receipts.forEach((r) => {
      const date = r.createdAt.toISOString().split('T')[0];
      const existing = dateMap.get(date) || { amount: 0, count: 0 };
      dateMap.set(date, { amount: existing.amount + r.amount, count: existing.count + 1 });
    });

    return Array.from(dateMap.entries()).map(([date, stats]) => ({
      date,
      amount: stats.amount,
      count: stats.count,
    }));
  }

  async getCollectorStats(orgId: string, campaignId?: string) {
    const where: any = { campaign: { orgId }, isVoided: false };
    if (campaignId) where.campaignId = campaignId;

    const results = await this.prisma.receipt.groupBy({
      by: ['collectorId'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    const collectorIds = results.map((r) => r.collectorId);
    const collectors = await this.prisma.user.findMany({
      where: { id: { in: collectorIds } },
      include: { area: true },
    });

    const collectorMap = new Map(collectors.map((c) => [c.id, c]));

    return results.map((r) => {
      const collector = collectorMap.get(r.collectorId);
      return {
        collectorId: r.collectorId,
        collectorName: collector?.name || 'Unknown',
        areaName: collector?.area?.name,
        totalAmount: r._sum.amount || 0,
        receiptCount: r._count,
      };
    });
  }

  async getAreaStats(orgId: string, campaignId?: string) {
    const where: any = { campaign: { orgId }, isVoided: false, areaId: { not: null } };
    if (campaignId) where.campaignId = campaignId;

    const results = await this.prisma.receipt.groupBy({
      by: ['areaId'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    const areaIds = results.map((r) => r.areaId).filter(Boolean);
    const areas = await this.prisma.collectorArea.findMany({
      where: { id: { in: areaIds as string[] } },
    });
    const areaMap = new Map(areas.map((a) => [a.id, a]));

    return results.map((r) => ({
      areaId: r.areaId,
      areaName: r.areaId ? areaMap.get(r.areaId)?.name || 'Unknown' : 'No Area',
      totalAmount: r._sum.amount || 0,
      receiptCount: r._count,
    }));
  }

  async getCategoryStats(orgId: string, campaignId?: string) {
    const where: any = { campaign: { orgId }, isVoided: false };
    if (campaignId) where.campaignId = campaignId;

    return this.prisma.receipt.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });
  }

  async getCollectionTypeStats(orgId: string, campaignId?: string) {
    const where: any = { campaign: { orgId }, isVoided: false };
    if (campaignId) where.campaignId = campaignId;

    return this.prisma.receipt.groupBy({
      by: ['collectionType'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });
  }

  async getIncomeVsExpenseTrend(orgId: string, campaignId?: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const receiptWhere: any = { campaign: { orgId }, isVoided: false, createdAt: { gte: startDate } };
    const expenseWhere: any = { campaign: { orgId }, isApproved: true, expenseDate: { gte: startDate } };
    if (campaignId) {
      receiptWhere.campaignId = campaignId;
      expenseWhere.campaignId = campaignId;
    }

    const [receipts, expenses] = await Promise.all([
      this.prisma.receipt.findMany({ where: receiptWhere, select: { amount: true, createdAt: true } }),
      this.prisma.expense.findMany({ where: expenseWhere, select: { amount: true, expenseDate: true } }),
    ]);

    const dateMap = new Map<string, { income: number; expense: number }>();
    receipts.forEach((r) => {
      const date = r.createdAt.toISOString().split('T')[0];
      const existing = dateMap.get(date) || { income: 0, expense: 0 };
      dateMap.set(date, { ...existing, income: existing.income + r.amount });
    });
    expenses.forEach((e) => {
      const date = e.expenseDate.toISOString().split('T')[0];
      const existing = dateMap.get(date) || { income: 0, expense: 0 };
      dateMap.set(date, { ...existing, expense: existing.expense + e.amount });
    });

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({ date, income: stats.income, expense: stats.expense }));
  }

  async getTopDonors(orgId: string, campaignId?: string, limit = 10) {
    const where: any = { campaign: { orgId }, isVoided: false };
    if (campaignId) where.campaignId = campaignId;

    const results = await this.prisma.receipt.groupBy({
      by: ['donorPhone', 'donorName'],
      where: { ...where, donorPhone: { not: null } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    return results.map((r) => ({
      donorName: r.donorName,
      donorPhone: r.donorPhone,
      totalAmount: r._sum.amount || 0,
      donationCount: r._count,
    }));
  }
}
