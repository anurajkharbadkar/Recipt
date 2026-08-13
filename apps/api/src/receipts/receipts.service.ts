import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { SmsService } from '../sms/sms.service';
import { StorageService } from '../storage/storage.service';
import { CreateReceiptDto, ReceiptQueryDto, VoidReceiptDto, UpdateReceiptDto } from './dto/receipt.dto';
import { amountToWords, generateReceiptNumber, UserRole, ReceiptStatus } from '@pavti/shared';
import * as QRCode from 'qrcode';

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

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
    this.generateAndStorePdf(receipt).catch((err) => this.logger.error(`PDF generation failed for receipt ${receiptId}: ${err.message}`));

    // Send WhatsApp if donor phone provided
    if (dto.sendWhatsapp !== false && dto.donorPhone) {
      this.whatsappService
        .sendReceiptNotification(dto.donorPhone, {
          donorName: dto.donorName,
          amount: dto.amount,
          receiptNumber,
          organizationName: campaign.organization.name,
          receiptUrl: verifyUrl,
          category: dto.category,
          receiptTemplateSettings: (campaign.organization as any)?.receiptTemplateSettings,
        })
        .then((result) => this.recordWhatsappResult(receiptId, result))
        .catch((err) => this.logger.error(`WhatsApp send crashed for receipt ${receiptId}: ${err.message}`));
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
        .then((result) => this.recordSmsResult(receiptId, result))
        .catch((err) => this.logger.error(`SMS send crashed for receipt ${receiptId}: ${err.message}`));
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
              // Include theme + UPI so the public verify page (which reuses
              // ReceiptPreview) renders identically to the dashboard preview
              // and the PDF, instead of silently falling back to defaults.
              select: { name: true, nameMarathi: true, logoUrl: true, address: true, upiId: true, receiptTemplateSettings: true },
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

  /**
   * Lets a treasurer correct a receipt after issuance (e.g. a mistyped amount,
   * or dialing in an Internal Collection member's contribution away from the
   * declared default). Void+reissue is the alternative but throws away the
   * receipt number and history — this instead audit-logs the before/after and
   * regenerates the PDF so it never goes stale relative to the stored data.
   */
  async update(id: string, dto: UpdateReceiptDto, userId: string, orgId: string) {
    const existing = await this.findOne(id, orgId);
    if (existing.isVoided) throw new BadRequestException('Cannot edit a voided receipt');

    const data: any = {};
    if (dto.donorName !== undefined) data.donorName = dto.donorName;
    if (dto.donorPhone !== undefined) data.donorPhone = dto.donorPhone;
    if (dto.donorAddress !== undefined) data.donorAddress = dto.donorAddress;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.paymentMode !== undefined) data.paymentMode = dto.paymentMode;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate;
    if (dto.amount !== undefined) {
      data.amount = dto.amount;
      data.amountInWords = amountToWords(dto.amount);
    }

    const updated = await this.prisma.receipt.update({
      where: { id },
      data,
      include: {
        collector: true,
        campaign: { include: { organization: true } },
        area: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'UPDATE',
        entity: 'Receipt',
        entityId: id,
        oldValue: { donorName: existing.donorName, amount: existing.amount, category: existing.category, paymentMode: existing.paymentMode, notes: existing.notes },
        newValue: data,
      },
    });

    // The previously-generated PDF (if any) now shows stale data — regenerate
    // it the same fire-and-forget way receipt creation does.
    this.generateAndStorePdf(updated).catch((err) => this.logger.error(`PDF regeneration failed for receipt ${id}: ${err.message}`));

    return updated;
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
    if (!receipt.donorPhone) {
      throw new BadRequestException('This receipt has no donor phone number to resend to');
    }

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/receipt/${id}`;
    // Awaited (unlike the fire-and-forget send at creation time) since this is
    // an explicit user action — they're clicking "Resend" specifically to find
    // out whether it worked, so the result has to reach them, not just a log.
    const result = await this.whatsappService.sendReceiptNotification(receipt.donorPhone, {
      donorName: receipt.donorName,
      amount: receipt.amount,
      receiptNumber: receipt.receiptNumber,
      organizationName: receipt.campaign.organization.name,
      receiptUrl: verifyUrl,
      category: receipt.category,
      receiptTemplateSettings: (receipt.campaign?.organization as any)?.receiptTemplateSettings,
    });
    await this.recordWhatsappResult(id, result);

    if (result.skipped) {
      throw new BadRequestException('WhatsApp delivery isn\'t configured yet — ask your admin to set up WHATSAPP_ACCESS_TOKEN.');
    }
    if (!result.success) {
      throw new BadRequestException(`WhatsApp delivery failed: ${result.error}`);
    }

    return { message: 'Receipt resent successfully' };
  }

  /** Persists a WhatsApp send outcome onto the receipt — `skipped` (not
   *  configured) writes nothing, since there's no attempt to record. */
  private async recordWhatsappResult(receiptId: string, result: { success: boolean; skipped?: boolean; error?: string }) {
    if (result.skipped) return;
    try {
      await this.prisma.receipt.update({
        where: { id: receiptId },
        data: result.success
          ? { whatsappSent: true, whatsappError: null }
          : { whatsappSent: false, whatsappError: result.error?.slice(0, 500) },
      });
    } catch (err) {
      this.logger.error(`Failed to record WhatsApp result for receipt ${receiptId}: ${err.message}`);
    }
  }

  private async recordSmsResult(receiptId: string, result: { success: boolean; skipped?: boolean; error?: string }) {
    if (result.skipped) return;
    try {
      await this.prisma.receipt.update({
        where: { id: receiptId },
        data: result.success
          ? { smsSent: true, smsError: null }
          : { smsSent: false, smsError: result.error?.slice(0, 500) },
      });
    } catch (err) {
      this.logger.error(`Failed to record SMS result for receipt ${receiptId}: ${err.message}`);
    }
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
    // DB-level dedup (Prisma `distinct`) instead of pulling every historical
    // receipt into Node memory just to dedupe by donorPhone in JS — scales with
    // unique donor count instead of total receipt count.
    return this.prisma.receipt.findMany({
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
      distinct: ['donorPhone'],
      orderBy: { createdAt: 'desc' },
    });
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
      this.logger.error(`PDF generation failed for receipt ${receipt.id}: ${error.message}`);
    }
  }
}
