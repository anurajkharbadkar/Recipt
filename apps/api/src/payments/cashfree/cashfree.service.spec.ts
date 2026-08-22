import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CashfreeService } from './cashfree.service';
import { CashfreeOrderResponse } from './cashfree.types';

// Regression coverage for a real, previously-live bug (2026-08-22): the
// subscription/donation order-reuse paths trusted any non-empty
// payment_session_id returned by GET /orders/{id}, including one from an
// order created hours/days earlier. Cashfree's checkout page rejects that
// stale session outright ("payment_session_id is not present or is
// invalid") rather than silently refreshing it — reproduced live against
// production. isOrderSessionUsable is the one place that now decides
// "usable" vs "must create a fresh order", so it needs to be right for
// every order_status Cashfree actually returns.
describe('CashfreeService.isOrderSessionUsable', () => {
  let service: CashfreeService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CashfreeService, { provide: ConfigService, useValue: { get: jest.fn() } }],
    }).compile();
    service = moduleRef.get(CashfreeService);
  });

  const order = (patch: Partial<CashfreeOrderResponse>): CashfreeOrderResponse => ({
    order_id: 'order_1',
    order_status: 'ACTIVE',
    payment_session_id: 'session_abc',
    ...patch,
  });

  it('is usable when the order is ACTIVE with a session id', () => {
    expect(service.isOrderSessionUsable(order({}))).toBe(true);
  });

  it('is not usable once Cashfree marks the order EXPIRED — the actual bug this fixes', () => {
    expect(service.isOrderSessionUsable(order({ order_status: 'EXPIRED' }))).toBe(false);
  });

  it('is not usable once the order is already PAID (nothing left to check out)', () => {
    expect(service.isOrderSessionUsable(order({ order_status: 'PAID' }))).toBe(false);
  });

  it('is not usable if order_status is ACTIVE but Cashfree omitted the session id', () => {
    expect(service.isOrderSessionUsable(order({ payment_session_id: undefined }))).toBe(false);
  });

  it('is not usable for a TERMINATED order', () => {
    expect(service.isOrderSessionUsable(order({ order_status: 'TERMINATED' }))).toBe(false);
  });
});
