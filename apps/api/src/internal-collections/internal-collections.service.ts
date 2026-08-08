import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { DeclareInternalCollectionDto } from './dto/internal-collection.dto';
import { amountToWords, generateReceiptNumber, DonationCategory, PaymentMode, CollectionType, ReceiptStatus } from '@pavti/shared';

/**
 * "Internal Collection" (a.k.a. Mandal Contribution / member subscription):
 * bulk-declares a fee for a set of registered Members under a campaign by
 * creating one PENDING Receipt per member (collectionType=INTERNAL,
 * category=MEMBERSHIP_FEE) — reusing the existing Receipt/status machinery
 * rather than a parallel ledger, so marking a member paid is just the
 * existing PATCH /receipts/:id/status, and correcting their amount is the
 * existing PATCH /receipts/:id.
 */
@Injectable()
export class InternalCollectionsService {
  constructor(private prisma: PrismaService) {}

  async declare(orgId: string, collectorId: string, dto: DeclareInternalCollectionDto) {
    const campaign = await this.prisma.campaign.findFirst({ where: { id: dto.campaignId, orgId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status !== 'ACTIVE') throw new BadRequestException('Campaign is not active');

    const candidateMembers = await this.prisma.member.findMany({
      where: { id: { in: dto.memberIds }, orgId, isActive: true },
    });
    if (candidateMembers.length === 0) {
      throw new BadRequestException('No valid, active members were selected');
    }

    // Skip members already declared for this campaign so re-running the same
    // bulk action (e.g. after adding a few late members to the list) never
    // double-bills someone already on the roster.
    const alreadyDeclared = await this.prisma.receipt.findMany({
      where: { campaignId: dto.campaignId, collectionType: CollectionType.INTERNAL, memberId: { in: candidateMembers.map((m) => m.id) } },
      select: { memberId: true },
    });
    const alreadyDeclaredIds = new Set(alreadyDeclared.map((r) => r.memberId));
    const members = candidateMembers.filter((m) => !alreadyDeclaredIds.has(m.id));

    if (members.length === 0) {
      return { created: 0, skipped: candidateMembers.length, message: 'All selected members are already on this campaign\'s roster' };
    }

    // One atomic increment for the whole batch (instead of N sequential
    // read-increment round trips) — reserves a contiguous block of receipt
    // numbers for this declaration.
    const updatedCampaign = await this.prisma.campaign.update({
      where: { id: dto.campaignId },
      data: { receiptSeq: { increment: members.length } },
    });
    const startSeq = updatedCampaign.receiptSeq - members.length + 1;
    const amountInWords = amountToWords(dto.amount);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const receiptsData = await Promise.all(
      members.map(async (m, i) => {
        const id = uuidv4();
        const verifyUrl = `${frontendUrl}/receipt/${id}`;
        const qrCodeData = await QRCode.toDataURL(verifyUrl);
        return {
          id,
          campaignId: dto.campaignId,
          collectorId,
          memberId: m.id,
          receiptNumber: generateReceiptNumber(campaign.receiptPrefix, startSeq + i),
          donorName: m.name,
          donorPhone: m.phone,
          donorAddress: m.address,
          amount: dto.amount,
          amountInWords,
          category: DonationCategory.MEMBERSHIP_FEE,
          paymentMode: PaymentMode.CASH,
          collectionType: CollectionType.INTERNAL,
          status: ReceiptStatus.PENDING,
          dueDate: dto.dueDate,
          notes: dto.notes,
          qrCodeData,
        };
      }),
    );

    await this.prisma.receipt.createMany({ data: receiptsData });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        userId: collectorId,
        action: 'DECLARE_INTERNAL_COLLECTION',
        entity: 'Campaign',
        entityId: dto.campaignId,
        newValue: { memberCount: members.length, amount: dto.amount, dueDate: dto.dueDate },
      },
    });

    return { created: members.length, skipped: candidateMembers.length - members.length };
  }

  async roster(orgId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({ where: { id: campaignId, orgId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const receipts = await this.prisma.receipt.findMany({
      where: { campaignId, collectionType: CollectionType.INTERNAL, memberId: { not: null }, isVoided: false },
      orderBy: { createdAt: 'asc' },
    });

    const paid = receipts.filter((r) => r.status === ReceiptStatus.PAID);
    const totalDeclared = receipts.reduce((sum, r) => sum + r.amount, 0);
    const totalPaid = paid.reduce((sum, r) => sum + r.amount, 0);

    return {
      campaignId,
      totalDeclared,
      totalPaid,
      totalPending: totalDeclared - totalPaid,
      paidCount: paid.length,
      unpaidCount: receipts.length - paid.length,
      members: receipts.map((r) => ({
        receiptId: r.id,
        memberId: r.memberId,
        name: r.donorName,
        phone: r.donorPhone,
        amount: r.amount,
        status: r.status,
        dueDate: r.dueDate,
        receiptNumber: r.receiptNumber,
      })),
    };
  }
}
