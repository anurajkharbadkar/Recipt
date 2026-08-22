import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CollectorsService } from './collectors.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan } from '@pavti/shared';

// Regression coverage for two real, previously-latent behaviors:
//  - update()'s areaId '' -> null normalization (areaId is a raw scalar FK
//    column here, not a Prisma relation `connect`, so an empty string from
//    the "No specific area" picker option would otherwise violate the FK
//    constraint instead of clearing it).
//  - create()'s plan-based collector limit, including the -1 = unlimited
//    convention actually skipping the count query rather than comparing
//    against a negative number.
describe('CollectorsService', () => {
  let service: CollectorsService;
  let prisma: {
    user: { findFirst: jest.Mock; findUnique: jest.Mock; count: jest.Mock; create: jest.Mock; update: jest.Mock };
    organization: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 'c1', orgId: 'org1' }),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      organization: { findUnique: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [CollectorsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(CollectorsService);
  });

  describe('update — areaId normalization', () => {
    it('normalizes an empty-string areaId to null (clears the FK, not an invalid empty scalar)', async () => {
      await service.update('c1', 'org1', { areaId: '' } as any);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ areaId: null }) }),
      );
    });

    it('leaves areaId untouched (undefined) when the field is omitted from the edit', async () => {
      await service.update('c1', 'org1', { name: 'New Name' } as any);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ areaId: undefined }) }),
      );
    });

    it('passes a real areaId through unchanged', async () => {
      await service.update('c1', 'org1', { areaId: 'area-42' } as any);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ areaId: 'area-42' }) }),
      );
    });
  });

  describe('create — plan collector limit', () => {
    it('blocks adding a collector once the plan limit is reached', async () => {
      // BASIC, not FREE — FREE is unlimited (-1) for its 7-day trial
      // window (matches Premium; see MAX_COLLECTORS_BY_PLAN's comment),
      // so it's no longer an example of a capped plan.
      prisma.user.findUnique.mockResolvedValue(null); // no phone collision
      prisma.organization.findUnique.mockResolvedValue({ subscriptionPlan: SubscriptionPlan.BASIC });
      prisma.user.count.mockResolvedValue(5); // BASIC's limit

      await expect(
        service.create('org1', { name: 'X', phone: '9000000001' } as any),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('skips the count check entirely for an unlimited (-1) plan', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue({ subscriptionPlan: SubscriptionPlan.PREMIUM });

      await service.create('org1', { name: 'X', phone: '9000000001' } as any);

      expect(prisma.user.count).not.toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('FREE is also unlimited (-1) for its 7-day trial window, matching Premium', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue({ subscriptionPlan: SubscriptionPlan.FREE });

      await service.create('org1', { name: 'X', phone: '9000000001' } as any);

      expect(prisma.user.count).not.toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });
});
