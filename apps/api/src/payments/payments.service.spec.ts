import { Test } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReceiptsService } from '../receipts/receipts.service';

// Regression coverage for a real, previously-live bug (2026-08-23),
// reproduced directly against production: both SubscriptionPaymentController
// and DonationsController's idempotent order-reuse used to re-derive
// payment_session_id via CashfreeService.getOrder() before handing it back
// for reuse. Cashfree's GET /orders/{id} was confirmed to return a
// *different* payment_session_id string on every single call — even a
// fraction of a second apart, for the same still-ACTIVE order — which is
// exactly what was producing "payment_session_id is not present or is
// invalid" on Cashfree's own checkout page. isPaymentSessionReusable is the
// one place both controllers now decide "reuse the stored session" vs.
// "create a fresh order", so its time-window logic needs to be right.
describe('PaymentsService.isPaymentSessionReusable', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: {} },
        { provide: ReceiptsService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(PaymentsService);
  });

  it('is reusable when created moments ago with a stored session', () => {
    expect(service.isPaymentSessionReusable({ paymentSessionId: 'session_abc', createdAt: new Date() })).toBe(true);
  });

  it('is not reusable once created well outside the reuse window — the actual bug this fixes', () => {
    const createdAt = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    expect(service.isPaymentSessionReusable({ paymentSessionId: 'session_abc', createdAt })).toBe(false);
  });

  it('is reusable right at the edge, just inside the window', () => {
    const createdAt = new Date(Date.now() - 4 * 60 * 1000); // 4 minutes ago
    expect(service.isPaymentSessionReusable({ paymentSessionId: 'session_abc', createdAt })).toBe(true);
  });

  it('is not reusable without a stored session id, no matter how recent', () => {
    expect(service.isPaymentSessionReusable({ paymentSessionId: null, createdAt: new Date() })).toBe(false);
  });
});

// Regression coverage for the 2026-08-23 subscription page's Change Plan
// action: resolveSubscriptionPaymentContext used to unconditionally refuse
// an already-ACTIVE org ("Your subscription is already active.") — correct
// for a plain re-pay, but it would have blocked upgrading/downgrading an
// active subscription entirely, since that's also "already ACTIVE" from
// the old check's point of view.
describe('PaymentsService.resolveSubscriptionPaymentContext', () => {
  let service: PaymentsService;
  let prisma: {
    organization: { findUniqueOrThrow: jest.Mock };
    payment: { findFirst: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      organization: { findUniqueOrThrow: jest.fn() },
      payment: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ReceiptsService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(PaymentsService);
  });

  it('refuses a plain re-pay when already ACTIVE on the same plan (no targetPlan given)', async () => {
    prisma.organization.findUniqueOrThrow.mockResolvedValue({ id: 'org1', subscriptionPlan: 'STANDARD', subscriptionStatus: 'ACTIVE' });
    await expect(service.resolveSubscriptionPaymentContext('org1')).rejects.toThrow('already active on this plan');
  });

  it('allows an ACTIVE org to price a different plan — the actual Change Plan case this fixes', async () => {
    prisma.organization.findUniqueOrThrow.mockResolvedValue({ id: 'org1', subscriptionPlan: 'STANDARD', subscriptionStatus: 'ACTIVE' });
    const { plan } = await service.resolveSubscriptionPaymentContext('org1', 'PREMIUM' as any);
    expect(plan.id).toBe('PREMIUM');
  });

  it('still refuses FREE as a target — nothing to pay for it', async () => {
    prisma.organization.findUniqueOrThrow.mockResolvedValue({ id: 'org1', subscriptionPlan: 'STANDARD', subscriptionStatus: 'ACTIVE' });
    await expect(service.resolveSubscriptionPaymentContext('org1', 'FREE' as any)).rejects.toThrow('nothing to pay');
  });

  it('scopes the existing-payment lookup to the plan actually being priced', async () => {
    prisma.organization.findUniqueOrThrow.mockResolvedValue({ id: 'org1', subscriptionPlan: 'STANDARD', subscriptionStatus: 'PENDING_PAYMENT' });
    await service.resolveSubscriptionPaymentContext('org1', 'PREMIUM' as any);
    expect(prisma.payment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ targetPlan: 'PREMIUM' }) }),
    );
  });
});
