import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { CreateExpenseDto } from './dto/expense.dto';

// Expenses are a straight ledger — logged, viewed, deleted if entered in
// error. No approval workflow: whoever has access to log an expense
// (ORG_ADMIN/TREASURER) is already trusted to log it correctly, and a
// separate approval step was never something Digital Pavti's actual users
// wanted (see AC-4 / product decision — expenses are ledger entries, not a
// workflow with pending/approved states).
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
        campaign: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(orgId: string, userId: string, data: CreateExpenseDto) {
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

  async delete(id: string, orgId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, campaign: { orgId } },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    return this.prisma.expense.delete({ where: { id } });
  }

  async getVoucherPdf(id: string, orgId: string): Promise<Buffer> {
    const expense = await this.prisma.expense.findFirst({
      where: { id, campaign: { orgId } },
      include: {
        addedBy: { select: { id: true, name: true } },
        campaign: { include: { organization: true } },
      },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    return this.pdfService.generateExpenseVoucherPdf(expense);
  }
}
