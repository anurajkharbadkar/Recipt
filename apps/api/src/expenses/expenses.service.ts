import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService, private pdfService: PdfService) {}

  async findAll(orgId: string, campaignId?: string) {
    const where: any = { campaign: { orgId } };
    if (campaignId) where.campaignId = campaignId;

    return this.prisma.expense.findMany({
      where,
      include: {
        addedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(orgId: string, userId: string, data: any) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: data.campaignId, orgId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    return this.prisma.expense.create({
      data: {
        campaignId: data.campaignId,
        addedById: userId,
        category: data.category,
        amount: data.amount,
        description: data.description,
        receiptUrl: data.receiptUrl,
        paidTo: data.paidTo || '',
        beneficiaryPhone: data.beneficiaryPhone,
        gstNumber: data.gstNumber,
        paymentMode: data.paymentMode || 'CASH',
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
      },
      include: {
        addedBy: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true } },
      },
    });
  }

  async approve(id: string, orgId: string, userId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, campaign: { orgId } },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.isApproved) throw new ForbiddenException('Expense already approved');

    return this.prisma.expense.update({
      where: { id },
      data: { isApproved: true, approvedById: userId, approvedAt: new Date() },
    });
  }

  async delete(id: string, orgId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, campaign: { orgId } },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.isApproved) throw new ForbiddenException('Cannot delete an approved expense');

    return this.prisma.expense.delete({ where: { id } });
  }

  async getVoucherPdf(id: string, orgId: string): Promise<Buffer> {
    const expense = await this.prisma.expense.findFirst({
      where: { id, campaign: { orgId } },
      include: {
        addedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        campaign: { include: { organization: true } },
      },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    return this.pdfService.generateExpenseVoucherPdf(expense);
  }
}
