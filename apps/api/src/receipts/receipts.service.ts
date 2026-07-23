import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { SmsService } from '../sms/sms.service';
import { StorageService } from '../storage/storage.service';
import { CreateReceiptDto, ReceiptQueryDto, VoidReceiptDto } from './dto/receipt.dto';
import { amountToWords, generateReceiptNumber, UserRole, ReceiptStatus } from '@pavti/shared';
import * as QRCode from 'qrcode';

@Injectable()
export class ReceiptsService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private whatsappService: WhatsappService,
    private smsService: SmsService,
    private storageService: StorageService,
  ) {}

  async create(dto: CreateReceiptDto, collectorId: string, orgId: string, deviceInfo?: string) {
    // Validate campaign belongs to org
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: dto.campaignId, orgId },
      include: { organization: true },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status !== 'ACTIVE') {
      throw new BadRequestException('Campaign is not active');
    }

    // Atomic receipt number generation
    const updatedCampaign = await this.prisma.campaign.update({
      where: { id: dto.campaignId },
      data: { receiptSeq: { increment: 1 } },
    });

    const receiptNumber = generateReceiptNumber(
      campaign.receiptPrefix,
      updatedCampaign.receiptSeq,
    );

    const amountWords = amountToWords(dto.amount);
    const receiptId = require('uuid').v4();

    // Generate QR code data (public verification URL)
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/receipt/${receiptId}`;
    const qrCodeData = await QRCode.toDataURL(verifyUrl);

    // Create receipt
    const receipt = await this.prisma.receipt.create({
      data: {
        id: receiptId,
        campaignId: dto.campaignId,
        collectorId,
        areaId: dto.areaId || undefined,
        receiptNumber,
        donorName: dto.donorName,
        donorPhone: dto.donorPhone,
        donorAddress: dto.donorAddress,
        amount: dto.amount,
        amountInWords: amountWords,
        category: dto.category || 'GENERAL',
        paymentMode: dto.paymentMode || 'CASH',
        chequeNumber: dto.chequeNumber,
        notes: dto.notes,
        qrCodeData,
        latitude: dto.latitude,
        longitude: dto.longitude,
        deviceInfo,
        collectionType: dto.collectionType || 'DONATION',
        status: dto.status || 'PAID',
        dueDate: dto.dueDate,
        contributorType: dto.contributorType,
        supportingDocUrl: dto.supportingDocUrl,
      },
      include: {
        collector: true,
        campaign: { include: { organization: true } },
        area: true,
      },
    });

    // Generate PDF asynchronously
    this.generateAndStorePdf(receipt).catch(console.error);

    // Send WhatsApp if donor phone provided
    if (dto.sendWhatsapp !== false && dto.donorPhone) {
      this.whatsappService
        .sendReceiptNotification(dto.donorPhone, {
          donorName: dto.donorName,
          amount: dto.amount,
          receiptNumber,
          organizationName: campaign.organization.name,
          receiptUrl: verifyUrl,
        })
        .then(() => {
          this.prisma.receipt.update({
            where: { id: receiptId },
            data: { whatsappSent: true },
          });
        })
        .catch(console.error);
    }

    // Send SMS if requested
    if (dto.sendSms && dto.donorPhone) {
      this.smsService
        .sendReceiptSms(dto.donorPhone, {
          donorName: dto.donorName,
          amount: dto.amount,
          receiptNumber,
          organizationName: campaign.organization.name,
        })
        .then(() => {
          this.prisma.receipt.update({
            where: { id: receiptId },
            data: { smsSent: true },
          });
        })
        .catch(console.error);
    }

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        orgId,
        userId: collectorId,
        action: 'CREATE',
        entity: 'Receipt',
        entityId: receiptId,
        newValue: { receiptNumber, amount: dto.amount, donorName: dto.donorName },
        deviceInfo,
      },
    });

    return receipt;
  }

  async findAll(orgId: string, query: ReceiptQueryDto, userRole: string, userId: string) {
    const where: any = {
      campaign: { orgId },
    };

    // Collectors can only see their own receipts
    if (userRole === UserRole.COLLECTOR) {
      where.collectorId = userId;
    }

    if (query.campaignId) where.campaignId = query.campaignId;
    if (query.collectorId && userRole !== UserRole.COLLECTOR) {
      where.collectorId = query.collectorId;
    }
    if (query.areaId) where.areaId = query.areaId;
    if (query.collectionType) where.collectionType = query.collectionType;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { donorName: { contains: query.search, mode: 'insensitive' } },
        { receiptNumber: { contains: query.search, mode: 'insensitive' } },
        { donorPhone: { contains: query.search } },
      ];
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo + 'T23:59:59');
    }

    const [total, data] = await Promise.all([
      this.prisma.receipt.count({ where }),
      this.prisma.receipt.findMany({
        where,
        include: {
          collector: { select: { id: true, name: true, phone: true } },
          campaign: { select: { id: true, name: true, receiptPrefix: true } },
          area: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: ((query.page || 1) - 1) * (query.limit || 20),
        take: query.limit || 20,
      }),
    ]);

    return {
      data,
      total,
      page: query.page || 1,
      limit: query.limit || 20,
      totalPages: Math.ceil(total / (query.limit || 20)),
    };
  }

  async findOne(id: string, orgId: string) {
    const receipt = await this.prisma.receipt.findFirst({
      where: { id, campaign: { orgId } },
      include: {
        collector: true,
        campaign: { include: { organization: true } },
        area: true,
      },
    });
    if (!receipt) throw new NotFoundException('Receipt not found');
    return receipt;
  }

  async findPublic(id: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: {
        collector: { select: { name: true } },
        campaign: {
          include: {
            organization: {
              select: { name: true, nameMarathi: true, logoUrl: true, address: true },
            },
          },
        },
        area: { select: { name: true } },
      },
    });
    if (!receipt) throw new NotFoundException('Receipt not found');
    // Return only public fields
    return {
      receiptNumber: receipt.receiptNumber,
      donorName: receipt.donorName,
      amount: receipt.amount,
      amountInWords: receipt.amountInWords,
      category: receipt.category,
      paymentMode: receipt.paymentMode,
      createdAt: receipt.createdAt,
      isVoided: receipt.isVoided,
      collector: receipt.collector,
      campaign: receipt.campaign,
      area: receipt.area,
    };
  }

  async void(id: string, dto: VoidReceiptDto, userId: string, orgId: string) {
    const receipt = await this.findOne(id, orgId);
    if (receipt.isVoided) throw new BadRequestException('Receipt is already voided');

    const updated = await this.prisma.receipt.update({
      where: { id },
      data: {
        isVoided: true,
        voidReason: dto.reason,
        voidedAt: new Date(),
        voidedById: userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'VOID',
        entity: 'Receipt',
        entityId: id,
        oldValue: { isVoided: false },
        newValue: { isVoided: true, voidReason: dto.reason },
      },
    });

    return updated;
  }

  async updateStatus(id: string, status: ReceiptStatus, userId: string, orgId: string) {
    const receipt = await this.findOne(id, orgId);

    const data: any = { status };
    if (status === ReceiptStatus.CANCELLED) {
      data.isVoided = true;
      data.voidedAt = new Date();
      data.voidedById = userId;
      data.voidReason = 'Status updated to Cancelled';
    } else {
      data.isVoided = false;
      data.voidedAt = null;
      data.voidedById = null;
      data.voidReason = null;
    }

    const updated = await this.prisma.receipt.update({
      where: { id },
      data,
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'UPDATE_STATUS',
        entity: 'Receipt',
        entityId: id,
        oldValue: { status: receipt.status },
        newValue: { status },
      },
    });

    return updated;
  }

  async resend(id: string, orgId: string) {
    const receipt = await this.findOne(id, orgId);

    if (receipt.donorPhone) {
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/receipt/${id}`;
      await this.whatsappService.sendReceiptNotification(receipt.donorPhone, {
        donorName: receipt.donorName,
        amount: receipt.amount,
        receiptNumber: receipt.receiptNumber,
        organizationName: receipt.campaign.organization.name,
        receiptUrl: verifyUrl,
      });

      await this.prisma.receipt.update({
        where: { id },
        data: { whatsappSent: true },
      });
    }

    return { message: 'Receipt resent successfully' };
  }

  async exportCsv(orgId: string, campaignId?: string): Promise<string> {
    const where: any = { campaign: { orgId }, isVoided: false };
    if (campaignId) where.campaignId = campaignId;

    const receipts = await this.prisma.receipt.findMany({
      where,
      include: {
        collector: { select: { name: true } },
        campaign: { select: { name: true } },
        area: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const headers = [
      'Receipt No', 'Date', 'Donor Name', 'Donor Phone', 'Donor Address',
      'Amount (₹)', 'Amount in Words', 'Category', 'Payment Mode',
      'Collector', 'Area', 'Campaign', 'WhatsApp Sent', 'SMS Sent',
    ];

    const rows = receipts.map((r) => [
      r.receiptNumber,
      new Date(r.createdAt).toLocaleDateString('en-IN'),
      r.donorName,
      r.donorPhone || '',
      r.donorAddress || '',
      r.amount,
      r.amountInWords,
      r.category,
      r.paymentMode,
      r.collector.name,
      r.area?.name || '',
      r.campaign.name,
      r.whatsappSent ? 'Yes' : 'No',
      r.smsSent ? 'Yes' : 'No',
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  async findUniqueDonors(orgId: string) {
    const receipts = await this.prisma.receipt.findMany({
      where: {
        campaign: { orgId },
        donorPhone: { not: null },
      },
      select: {
        donorName: true,
        donorPhone: true,
        donorAddress: true,
        areaId: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const seen = new Set<string>();
    const uniqueDonors = [];
    for (const r of receipts) {
      if (r.donorPhone && !seen.has(r.donorPhone)) {
        seen.add(r.donorPhone);
        uniqueDonors.push(r);
      }
    }
    return uniqueDonors;
  }

  private async generateAndStorePdf(receipt: any) {
    try {
      const pdfBuffer = await this.pdfService.generateReceiptPdf(receipt);
      const pdfUrl = await this.storageService.uploadFile(
        `receipts/${receipt.id}.pdf`,
        pdfBuffer,
        'application/pdf',
      );
      await this.prisma.receipt.update({
        where: { id: receipt.id },
        data: { pdfUrl },
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  }
}
