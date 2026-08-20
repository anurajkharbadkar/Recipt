import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toCsv } from '@pavti/shared';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(orgId: string, campaignId?: string) {
    // "Collected" means actually paid — a PENDING (unpaid/due) receipt is a
    // promise, not cash in hand, so it's tracked separately as
    // pendingCollections instead of inflating totalCollections/netBalance.
    const paidReceiptWhere: any = { campaign: { orgId }, isVoided: false, status: 'PAID' };
    const pendingReceiptWhere: any = { campaign: { orgId }, isVoided: false, status: 'PENDING' };
    // Expenses are a plain ledger, no approval workflow — every logged
    // expense counts toward the balance as soon as it's entered.
    const expenseWhere: any = { campaign: { orgId } };
    if (campaignId) {
      paidReceiptWhere.campaignId = campaignId;
      pendingReceiptWhere.campaignId = campaignId;
      expenseWhere.campaignId = campaignId;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalResult,
      todayResult,
      pendingCollectionsResult,
      expenseResult,
      activeCollectors,
    ] = await Promise.all([
      this.prisma.receipt.aggregate({ where: paidReceiptWhere, _sum: { amount: true }, _count: true }),
      this.prisma.receipt.aggregate({
        where: { ...paidReceiptWhere, createdAt: { gte: todayStart } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.receipt.aggregate({ where: pendingReceiptWhere, _sum: { amount: true }, _count: true }),
      this.prisma.expense.aggregate({ where: expenseWhere, _sum: { amount: true }, _count: true }),
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
      totalExpenseCount: expenseResult._count,
      netBalance: totalCollections - totalExpenses,
      activeCollectors,
      pendingCollections: pendingCollectionsResult._sum.amount || 0,
      pendingCollectionsCount: pendingCollectionsResult._count,
    };
  }

  async getDailyCollections(orgId: string, campaignId?: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      campaign: { orgId },
      isVoided: false,
      status: 'PAID',
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
    const where: any = { campaign: { orgId }, isVoided: false, status: 'PAID' };
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
    const where: any = { campaign: { orgId }, isVoided: false, status: 'PAID', areaId: { not: null } };
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
    const where: any = { campaign: { orgId }, isVoided: false, status: 'PAID' };
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
    const where: any = { campaign: { orgId }, isVoided: false, status: 'PAID' };
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

    const receiptWhere: any = { campaign: { orgId }, isVoided: false, status: 'PAID', createdAt: { gte: startDate } };
    const expenseWhere: any = { campaign: { orgId }, expenseDate: { gte: startDate } };
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

  /**
   * The formal, committee/audit-facing view of the books: total income by
   * category vs. total expense by category for the org (or one campaign),
   * with a net surplus/deficit. This is the data behind both the on-screen
   * "Income & Expenditure Statement" panel and its PDF export — one source
   * of truth so the screen and the printed report never disagree.
   */
  async getIncomeExpenditureStatement(orgId: string, campaignId?: string) {
    const receiptWhere: any = { campaign: { orgId }, isVoided: false, status: 'PAID' };
    const expenseWhere: any = { campaign: { orgId } };
    if (campaignId) {
      receiptWhere.campaignId = campaignId;
      expenseWhere.campaignId = campaignId;
    }

    const [org, campaign, incomeByCategory, expenseByCategory, receiptDateRange] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: orgId } }),
      campaignId ? this.prisma.campaign.findUnique({ where: { id: campaignId } }) : null,
      this.prisma.receipt.groupBy({
        by: ['category'],
        where: receiptWhere,
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        where: expenseWhere,
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.prisma.receipt.aggregate({
        where: receiptWhere,
        _min: { createdAt: true },
        _max: { createdAt: true },
      }),
    ]);

    const income = incomeByCategory.map((c) => ({
      category: c.category,
      amount: c._sum.amount || 0,
      count: c._count,
    }));
    const expense = expenseByCategory.map((c) => ({
      category: c.category,
      amount: c._sum.amount || 0,
      count: c._count,
    }));

    const totalIncome = income.reduce((s, c) => s + c.amount, 0);
    const totalExpense = expense.reduce((s, c) => s + c.amount, 0);

    return {
      organization: org
        ? { name: org.name, nameMarathi: org.nameMarathi, address: org.address, city: org.city, state: org.state, regNumber: org.regNumber, logoUrl: org.logoUrl, brandColor: org.brandColor }
        : null,
      campaign: campaign ? { name: campaign.name, year: campaign.year, startDate: campaign.startDate, endDate: campaign.endDate } : null,
      periodFrom: receiptDateRange._min.createdAt,
      periodTo: receiptDateRange._max.createdAt,
      income,
      expense,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      generatedAt: new Date(),
    };
  }

  async getExpenseRegisterCsv(orgId: string, campaignId?: string): Promise<string> {
    const where: any = { campaign: { orgId } };
    if (campaignId) where.campaignId = campaignId;

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        addedBy: { select: { name: true } },
        campaign: { select: { name: true } },
      },
      orderBy: { expenseDate: 'asc' },
    });

    const headers = [
      'Date', 'Category', 'Description', 'Paid To', 'Phone', 'GST Number',
      'Amount (₹)', 'Payment Mode', 'Added By', 'Campaign',
    ];

    const rows = expenses.map((e) => [
      new Date(e.expenseDate).toLocaleDateString('en-IN'),
      String(e.category).replace(/_/g, ' '),
      e.description,
      e.paidTo,
      e.beneficiaryPhone || '',
      e.gstNumber || '',
      e.amount,
      e.paymentMode,
      e.addedBy.name,
      e.campaign.name,
    ]);

    return toCsv(headers, rows);
  }

  async getTopDonors(orgId: string, campaignId?: string, limit = 10) {
    const where: any = { campaign: { orgId }, isVoided: false, status: 'PAID' };
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
