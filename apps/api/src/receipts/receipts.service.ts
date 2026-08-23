import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';
import { CreateReceiptDto, ReceiptQueryDto, VoidReceiptDto, UpdateReceiptDto } from './dto/receipt.dto';
import { amountToWords, generateReceiptNumber, UserRole, ReceiptStatus, toCsv, SubscriptionPlan, MAX_RECEIPTS_BY_PLAN } from '@pavti/shared';
import * as QRCode from 'qrcode';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
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

    // Free-trial cap — the only plan with a receipt limit (paid plans are
    // unlimited, see MAX_RECEIPTS_BY_PLAN). Counts every receipt the org has
    // ever created, voided or not, so voiding one doesn't free up a slot.
    const plan = (campaign.organization.subscriptionPlan as SubscriptionPlan) || SubscriptionPlan.FREE;
    const receiptLimit = MAX_RECEIPTS_BY_PLAN[plan] ?? 10;
    if (receiptLimit !== -1) {
      const existingCount = await this.prisma.receipt.count({ where: { campaign: { orgId } } });
      if (existingCount >= receiptLimit) {
        throw new ForbiddenException(
          `Your ${plan === SubscriptionPlan.FREE ? 'free trial' : plan} plan allows up to ${receiptLimit} receipts. Upgrade your plan to create more.`,
        );
      }
    }

    const amountWords = amountToWords(dto.amount);
    const receiptId = require('uuid').v4();

    // Generate QR code data (public verification URL)
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/receipt/${receiptId}`;
    const qrCodeData = await QRCode.toDataURL(verifyUrl);

    // Create receipt with retry loop for P2002 collision prevention
    let receipt: any;
    let createAttempts = 0;
    const maxRetries = 3;

    while (createAttempts < maxRetries) {
      createAttempts++;
      const { receiptNumber } = await this.generateUniqueReceiptNumber(
        dto.campaignId,
        campaign.receiptPrefix,
        orgId,
      );

      try {
        receipt = await this.prisma.receipt.create({
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
        break; // Success! Break retry loop
      } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          this.logger.warn(
            `P2002 collision creating receipt on attempt ${createAttempts}. Retrying with next sequence...`,
          );
          if (createAttempts >= maxRetries) throw err;
        } else {
          throw err;
        }
      }
    }

    // PDF generation only fires once the receipt is actually PAID — a
    // PENDING/ONLINE receipt (awaiting a Cashfree payment) has nothing
    // official to hand the donor yet. See
    // PaymentsService.applyCashfreeWebhook, which calls
    // ReceiptsService.markOnlinePaymentSuccessInTx + fireReceiptPaidPdf
    // once payment actually succeeds. WhatsApp is never sent from the
    // backend at all — sharing is a manual click-to-chat link the frontend
    // builds itself (see apps/web/src/lib/whatsappShare.ts).
    if (receipt.status === 'PAID') {
      this.generateAndStorePdf(receipt).catch((err) => this.logger.error(`PDF generation failed for receipt ${receipt.id}: ${err.message}`));
    }

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        orgId,
        userId: collectorId,
        action: 'CREATE',
        entity: 'Receipt',
        entityId: receiptId,
        newValue: { receiptNumber: receipt.receiptNumber, amount: dto.amount, donorName: dto.donorName, status: receipt.status },
        deviceInfo,
      },
    });

    return receipt;
  }

  /**
   * The DB-write half only — receipt status + audit log, run inside the
   * SAME transaction as the Payment row's update (see
   * PaymentsService.applyCashfreeWebhook). Must not generate the PDF
   * itself: a transaction can still roll back after this returns, and
   * there's no point rendering a PDF for a status change that never
   * actually committed. Call fireReceiptPaidPdf() afterward, only once the
   * transaction has actually committed.
   *
   * Returns null if the receipt doesn't exist or is already PAID (nothing
   * to do — caller should skip generating a PDF in that case too).
   */
  async markOnlinePaymentSuccessInTx(tx: Prisma.TransactionClient, receiptId: string) {
    const receipt = await tx.receipt.findUnique({
      where: { id: receiptId },
      include: { campaign: { include: { organization: true } } },
    });
    if (!receipt) {
      this.logger.error(`markOnlinePaymentSuccessInTx: receipt ${receiptId} not found — Payment says paid but the Receipt is gone`);
      return null;
    }
    if (receipt.status === 'PAID') {
      return null;
    }

    const updated = await tx.receipt.update({
      where: { id: receiptId },
      data: { status: 'PAID' },
      include: { campaign: { include: { organization: true } } },
    });

    // collectorId, not a real actor here (webhook has no logged-in user) —
    // the receipt's own collector is the natural attribution for "on whose
    // record did this payment land", same rationale as using it for the
    // CREATE audit log above.
    await tx.auditLog.create({
      data: {
        orgId: updated.campaign.orgId,
        userId: updated.collectorId,
        action: 'ONLINE_PAYMENT_CONFIRMED',
        entity: 'Receipt',
        entityId: receiptId,
        newValue: { status: 'PAID' },
      },
    });

    return updated;
  }

  /**
   * Post-commit half of markOnlinePaymentSuccessInTx — generates the PDF
   * for a receipt that just became PAID via an online payment. Must only
   * be called after the DB transaction that flipped the receipt to PAID
   * has actually committed, never from inside it. WhatsApp sharing for
   * this receipt is a manual click the collector makes from the UI, same
   * as for a cash receipt — nothing to fire automatically here.
   */
  fireReceiptPaidPdf(receipt: Prisma.ReceiptGetPayload<{ include: { campaign: { include: { organization: true } } } }>) {
    this.generateAndStorePdf(receipt).catch((err) => this.logger.error(`PDF generation failed for receipt ${receipt.id}: ${err.message}`));
  }

  async findAll(orgId: string, query: ReceiptQueryDto, userRole: string, userId: string) {
    const where: Prisma.ReceiptWhereInput = {
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

  /**
   * `scopedTo` mirrors findAll's "Collectors can only see their own
   * receipts" rule — internal callers acting on behalf of ORG_ADMIN/
   * TREASURER (update/void/updateStatus, all already role-gated to those
   * two) omit it and can look up any receipt in the org. GET /receipts/:id
   * and GET /receipts/:id/image are reachable by COLLECTOR too, though, and
   * without this were letting a collector fetch — by ID — any other
   * collector's receipt (donor name, phone, address, amount) despite the
   * list view correctly hiding them. Same data, so the same rule applies.
   */
  async findOne(id: string, orgId: string, scopedTo?: { role: string; userId: string }) {
    const where: Prisma.ReceiptWhereInput = { id, campaign: { orgId } };
    if (scopedTo?.role === UserRole.COLLECTOR) {
      where.collectorId = scopedTo.userId;
    }
    const receipt = await this.prisma.receipt.findFirst({
      where,
      include: {
        collector: true,
        campaign: { include: { organization: true } },
        area: true,
      },
    });
    if (!receipt) throw new NotFoundException('Receipt not found');
    return receipt;
  }

  /**
   * Live PNG snapshot of the pavti, generated fresh per request (same pattern
   * as ExpensesService.getVoucherPdf) — this is what "Share via WhatsApp"
   * actually attaches, since wa.me can only pre-fill text, never a file.
   */
  async getReceiptImage(id: string, orgId: string, scopedTo?: { role: string; userId: string }): Promise<Buffer> {
    const receipt = await this.findOne(id, orgId, scopedTo);
    return this.pdfService.generateReceiptImage(receipt);
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

    const data: Prisma.ReceiptUpdateInput = {};
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
        // `data` is only ever built from the scalar `if (dto.x !== undefined)
        // data.x = ...` assignments above — never a nested relation-connect
        // shape — but Prisma.ReceiptUpdateInput's *type* allows those too,
        // which is stricter than AuditLog.newValue's plain-JSON column
        // accepts. The cast is narrow and accurate to what's actually here,
        // not a blanket escape hatch.
        newValue: data as Prisma.InputJsonValue,
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

    const data: Prisma.ReceiptUpdateInput = { status };
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

  async exportCsv(orgId: string, campaignId?: string): Promise<string> {
    const where: Prisma.ReceiptWhereInput = { campaign: { orgId }, isVoided: false };
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
      'Amount (₹)', 'Amount in Words', 'Category', 'Payment Mode', 'Status',
      'Collector', 'Area', 'Campaign',
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
      r.status,
      r.collector.name,
      r.area?.name || '',
      r.campaign.name,
    ]);

    return toCsv(headers, rows);
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

  /**
   * Generates a guaranteed unique receipt number for a campaign.
   * Handles sequence gaps, concurrent creations, and multi-tenant prefix overlaps cleanly.
   */
  private async generateUniqueReceiptNumber(
    campaignId: string,
    prefix: string,
    orgId: string,
  ): Promise<{ receiptNumber: string; seq: number }> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      attempts++;
      // Increment campaign sequence atomically
      const updatedCampaign = await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { receiptSeq: { increment: 1 } },
      });

      const baseNumber = generateReceiptNumber(prefix, updatedCampaign.receiptSeq);

      // Check if this receiptNumber is already taken in the database
      const existing = await this.prisma.receipt.findUnique({
        where: { receiptNumber: baseNumber },
        select: { id: true, campaign: { select: { orgId: true } } },
      });

      if (!existing) {
        return { receiptNumber: baseNumber, seq: updatedCampaign.receiptSeq };
      }

      // If it collides with another org's receipt due to identical default prefix,
      // disambiguate with org prefix to ensure 100% global uniqueness.
      if (existing.campaign.orgId !== orgId) {
        const orgShort = orgId.substring(0, 4).toUpperCase();
        const orgDisambiguatedNumber = `${prefix}-${orgShort}-${String(updatedCampaign.receiptSeq).padStart(4, '0')}`;
        const existingOrgNumber = await this.prisma.receipt.findUnique({
          where: { receiptNumber: orgDisambiguatedNumber },
          select: { id: true },
        });

        if (!existingOrgNumber) {
          return { receiptNumber: orgDisambiguatedNumber, seq: updatedCampaign.receiptSeq };
        }
      }

      this.logger.warn(
        `Receipt number collision on attempt ${attempts} for campaign ${campaignId}: ${baseNumber} already exists. Incrementing sequence...`,
      );
    }

    // Ultimate fallback if sequence is saturated
    const timestamp = Date.now().toString().slice(-6);
    return {
      receiptNumber: `${prefix}-${timestamp}`,
      seq: 999999,
    };
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
