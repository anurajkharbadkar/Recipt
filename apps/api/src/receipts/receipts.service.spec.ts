import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';

// Regression coverage for the direct-UPI payment flow (2026-09-06): since
// there's no payment gateway in that path (see lib/upi.ts), there's no
// webhook to confirm a payment either — claimPaid is the donor's own
// self-report after paying, and must never be mistaken for actual
// confirmation. It only records *when* they claimed it; a human on staff
// still has to check their bank app and flip status via the existing
// PATCH /receipts/:id/status action.
describe('ReceiptsService.claimPaid', () => {
  let service: ReceiptsService;
  let prisma: {
    receipt: { findUnique: jest.Mock; update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      receipt: { findUnique: jest.fn(), update: jest.fn() },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReceiptsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PdfService, useValue: {} },
        { provide: StorageService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(ReceiptsService);
  });

  it('throws for a receipt that does not exist', async () => {
    prisma.receipt.findUnique.mockResolvedValue(null);
    await expect(service.claimPaid('missing-id')).rejects.toThrow(NotFoundException);
  });

  it('records the claim timestamp for a PENDING receipt, never touching status', async () => {
    prisma.receipt.findUnique.mockResolvedValue({ id: 'r1', status: 'PENDING', donorClaimedPaidAt: null });
    prisma.receipt.update.mockResolvedValue({ donorClaimedPaidAt: new Date('2026-09-06T10:00:00Z') });

    await service.claimPaid('r1');

    expect(prisma.receipt.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { donorClaimedPaidAt: expect.any(Date) },
      select: { donorClaimedPaidAt: true },
    });
  });

  it('is a no-op for an already-resolved receipt — no reason to bump a stale claim', async () => {
    prisma.receipt.findUnique.mockResolvedValue({ id: 'r1', status: 'PAID', donorClaimedPaidAt: null });

    const result = await service.claimPaid('r1');

    expect(prisma.receipt.update).not.toHaveBeenCalled();
    expect(result).toEqual({ donorClaimedPaidAt: null });
  });
});
