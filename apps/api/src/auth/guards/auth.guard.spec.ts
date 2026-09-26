import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './auth.guard';
import { UserRole, SubscriptionPlan, SubscriptionStatus } from '@pavti/shared';
import { SKIP_SUBSCRIPTION_GATE_KEY } from '../decorators/skip-subscription-gate.decorator';

describe('RolesGuard subscription checks', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  function mockContext(req: any) {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('allows GET requests even if subscription is expired', async () => {
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    const ctx = mockContext({
      method: 'GET',
      user: {
        role: UserRole.ORG_ADMIN,
        organization: { subscriptionExpiry: expiredDate },
      },
    });

    reflector.getAllAndOverride.mockReturnValue(undefined);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('blocks non-GET write requests if subscription is expired without @SkipSubscriptionGate()', async () => {
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    const ctx = mockContext({
      method: 'POST',
      user: {
        role: UserRole.ORG_ADMIN,
        organization: { subscriptionExpiry: expiredDate },
      },
    });

    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === SKIP_SUBSCRIPTION_GATE_KEY) return false;
      return undefined;
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('allows non-GET write requests on endpoints decorated with @SkipSubscriptionGate() even if subscription is expired', async () => {
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    const ctx = mockContext({
      method: 'POST',
      user: {
        role: UserRole.ORG_ADMIN,
        organization: { subscriptionExpiry: expiredDate },
      },
    });

    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === SKIP_SUBSCRIPTION_GATE_KEY) return true;
      return undefined;
    });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('allows non-GET write requests on endpoints decorated with @SkipSubscriptionGate() even if PENDING_PAYMENT', async () => {
    const ctx = mockContext({
      method: 'POST',
      user: {
        role: UserRole.ORG_ADMIN,
        organization: {
          subscriptionPlan: SubscriptionPlan.STANDARD,
          subscriptionStatus: SubscriptionStatus.PENDING_PAYMENT,
        },
      },
    });

    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === SKIP_SUBSCRIPTION_GATE_KEY) return true;
      return undefined;
    });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
