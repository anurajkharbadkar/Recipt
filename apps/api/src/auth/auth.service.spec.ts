import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@pavti/shared';

// Regression coverage for the 2026-08 mandal-code-free login split
// (AuthService.login): a request with a mandalCode is a staff (Collector/
// Treasurer) login, scoped by org via the code since phone alone is only
// unique *within* an org; a request with no mandalCode is the founding
// ORG_ADMIN, resolved by phone alone since Organization.phone is globally
// unique. Getting this branch wrong either locks the admin out or lets a
// staff login resolve to the wrong org's user.
describe('AuthService.login', () => {
  let service: AuthService;
  let prisma: {
    user: { findFirst: jest.Mock; update: jest.Mock };
  };

  const PASSWORD = 'correct-horse-battery-staple';
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 12);
  });

  beforeEach(async () => {
    prisma = {
      user: { findFirst: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('token') } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('routes a mandalCode login to the org-scoped staff lookup, not the admin-by-phone path', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1', phone: '9000000001', passwordHash, role: UserRole.COLLECTOR, orgId: 'org1',
      organization: { id: 'org1' },
    });

    await service.login({ mandalCode: 'ab12cd', phone: '9000000001', password: PASSWORD } as any);

    expect(prisma.user.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { phone: '9000000001', isActive: true, organization: { mandalCode: 'AB12CD' } },
      include: { organization: true },
    });
  });

  // findOrgAdminByPhone used to be two sequential queries (load the org by
  // phone, then load its admin by orgId) — collapsed into one nested-
  // relation-filter query (2026-08-22, cutting a real round trip off every
  // admin login), the same pattern the mandalCode path above already used.
  it('routes a login with no mandalCode to the org-admin-by-phone path in a single query', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u2', phone: '9000000002', passwordHash, role: UserRole.ORG_ADMIN, orgId: 'org1',
      organization: { id: 'org1', phone: '9000000002' },
    });

    await service.login({ phone: '9000000002', password: PASSWORD } as any);

    expect(prisma.user.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { role: UserRole.ORG_ADMIN, isActive: true, organization: { phone: '9000000002' } },
      include: { organization: true },
    });
  });

  it('rejects a no-mandalCode login for a phone with no matching org-admin', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.login({ phone: '9999999999', password: PASSWORD } as any))
      .rejects.toThrow(UnauthorizedException);
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { role: UserRole.ORG_ADMIN, isActive: true, organization: { phone: '9999999999' } },
      include: { organization: true },
    });
  });

  it('rejects an invalid password with a generic message (no user enumeration)', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1', passwordHash, role: UserRole.COLLECTOR, orgId: 'org1', organization: {},
    });

    await expect(service.login({ mandalCode: 'AB12CD', phone: '9000000001', password: 'wrong' } as any))
      .rejects.toThrow(UnauthorizedException);
  });

  it('normalizes mandalCode input (trims and uppercases) before scoping the lookup', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1', phone: '9000000001', passwordHash, role: UserRole.COLLECTOR, orgId: 'org1', organization: {},
    });

    await service.login({ mandalCode: '  ab12cd  ', phone: '9000000001', password: PASSWORD } as any);

    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organization: { mandalCode: 'AB12CD' } }) }),
    );
  });

  // The actual perf fix (2026-08-22): lastLoginAt and refreshToken used to
  // be two separate sequential UPDATEs (the second one buried inside the
  // old generateTokens helper). On a database where each round trip was
  // measured costing 1.5-2s in production, that second UPDATE was pure
  // waste — nothing about signing a JWT needs a second trip to the DB.
  it('persists lastLoginAt and refreshToken in a single UPDATE, not two', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1', phone: '9000000001', passwordHash, role: UserRole.COLLECTOR, orgId: 'org1', organization: {},
    });

    await service.login({ mandalCode: 'AB12CD', phone: '9000000001', password: PASSWORD } as any);

    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { lastLoginAt: expect.any(Date), refreshToken: 'token' },
    });
  });
});

// Regression coverage for the 2026-08-23 self-service account page —
// distinct from CollectorsService.update's admin-sets-anyone's-password
// path, this is someone changing their own, so it must actually verify
// they know the current one first rather than just overwriting it.
describe('AuthService.changePassword', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
  };

  const PASSWORD = 'correct-horse-battery-staple';
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 12);
  });

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('token') } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('rejects the change when the current password is wrong, without touching the row', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash });

    await expect(service.changePassword('u1', { currentPassword: 'wrong', newPassword: 'new-password-1' } as any))
      .rejects.toThrow(UnauthorizedException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('hashes and saves the new password once the current one checks out', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash });

    await service.changePassword('u1', { currentPassword: PASSWORD, newPassword: 'new-password-1' } as any);

    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    const call = prisma.user.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'u1' });
    // Never store the plaintext, and never hand back the raw new password
    // as-is either — it must actually go through bcrypt.
    expect(call.data.passwordHash).not.toBe('new-password-1');
    await expect(bcrypt.compare('new-password-1', call.data.passwordHash)).resolves.toBe(true);
  });
});
