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
    organization: { findUnique: jest.Mock };
  };

  const PASSWORD = 'correct-horse-battery-staple';
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 12);
  });

  beforeEach(async () => {
    prisma = {
      user: { findFirst: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      organization: { findUnique: jest.fn() },
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

    expect(prisma.organization.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { phone: '9000000001', isActive: true, organization: { mandalCode: 'AB12CD' } },
      include: { organization: true },
    });
  });

  it('routes a login with no mandalCode to the org-admin-by-phone path', async () => {
    prisma.organization.findUnique.mockResolvedValue({ id: 'org1', phone: '9000000002' });
    prisma.user.findFirst.mockResolvedValue({
      id: 'u2', phone: '9000000002', passwordHash, role: UserRole.ORG_ADMIN, orgId: 'org1',
      organization: { id: 'org1' },
    });

    await service.login({ phone: '9000000002', password: PASSWORD } as any);

    expect(prisma.organization.findUnique).toHaveBeenCalledWith({ where: { phone: '9000000002' } });
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { orgId: 'org1', role: UserRole.ORG_ADMIN, isActive: true },
      include: { organization: true },
    });
  });

  it('rejects a no-mandalCode login for a phone with no matching organization, without ever querying users', async () => {
    prisma.organization.findUnique.mockResolvedValue(null);

    await expect(service.login({ phone: '9999999999', password: PASSWORD } as any))
      .rejects.toThrow(UnauthorizedException);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
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
});
