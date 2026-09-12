import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { WhatsAppOtpService } from './whatsapp-otp.service';
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
        { provide: WhatsAppOtpService, useValue: { sendOtp: jest.fn().mockResolvedValue(true), isConfigured: jest.fn().mockReturnValue(true) } },
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
        { provide: WhatsAppOtpService, useValue: { sendOtp: jest.fn().mockResolvedValue(true), isConfigured: jest.fn().mockReturnValue(true) } },
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

// Regression coverage for the 2026-09-12 in-app account deletion (Google
// Play requires a self-service way to delete an account/its data).
describe('AuthService.deleteMyAccount', () => {
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
        { provide: WhatsAppOtpService, useValue: { sendOtp: jest.fn().mockResolvedValue(true), isConfigured: jest.fn().mockReturnValue(true) } },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  // The actual reason this guard exists: an ORG_ADMIN's phone must stay
  // equal to Organization.phone (see findOrgAdminByPhone) and they're the
  // only login that can manage staff or pay the subscription — deleting
  // it would permanently lock the organization out of its own admin login.
  it('refuses to delete an ORG_ADMIN account, without touching the row', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: UserRole.ORG_ADMIN, passwordHash });

    await expect(service.deleteMyAccount('u1', { password: PASSWORD } as any)).rejects.toThrow(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects the wrong password, without touching the row', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: UserRole.COLLECTOR, passwordHash });

    await expect(service.deleteMyAccount('u1', { password: 'wrong' } as any)).rejects.toThrow(UnauthorizedException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  // Anonymizes rather than hard-deletes — a collector's past receipts
  // reference this row and are real financial records; hard-deleting would
  // violate that foreign key the moment any receipt exists.
  it('anonymizes the row for a non-admin once the password checks out', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: UserRole.COLLECTOR, passwordHash });

    await service.deleteMyAccount('u1', { password: PASSWORD } as any);

    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    const call = prisma.user.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'u1' });
    expect(call.data).toMatchObject({
      name: 'Deleted User',
      email: null,
      passwordHash: null,
      refreshToken: null,
      isActive: false,
    });
    // Unique-per-org placeholder, not left as their real number.
    expect(call.data.phone).toMatch(/^deleted-/);
  });
});

// Regression coverage for the 2026-09-13 WhatsApp OTP "forgot password"
// flow — the only self-service recovery path an ORG_ADMIN has, since
// there's no one above them to reset it manually the way staff can.
describe('AuthService.requestPasswordReset / resetPassword', () => {
  let service: AuthService;
  let prisma: {
    user: { findFirst: jest.Mock; update: jest.Mock };
  };
  let whatsAppOtpService: { sendOtp: jest.Mock; isConfigured: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findFirst: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    };
    whatsAppOtpService = { sendOtp: jest.fn().mockResolvedValue(true), isConfigured: jest.fn().mockReturnValue(true) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('token') } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: WhatsAppOtpService, useValue: whatsAppOtpService },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('stores a hashed OTP and sends the raw code over WhatsApp when the user exists', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'u1', phone: '9000000001' });

    await service.requestPasswordReset({ phone: '9000000001' } as any);

    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    const call = prisma.user.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'u1' });
    expect(call.data.passwordResetOtpExpiresAt).toBeInstanceOf(Date);

    expect(whatsAppOtpService.sendOtp).toHaveBeenCalledTimes(1);
    const [sentPhone, sentOtp] = whatsAppOtpService.sendOtp.mock.calls[0];
    expect(sentPhone).toBe('9000000001');
    // The OTP handed to WhatsApp must be the same one whose hash got
    // stored — not a different/regenerated value.
    await expect(bcrypt.compare(sentOtp, call.data.passwordResetOtpHash)).resolves.toBe(true);
  });

  // Same response shape whether or not a match was found — a differing
  // response would let an attacker enumerate valid phone/mandal-code
  // combinations, the same concern login's own error messages account for.
  it('returns the same {sent:true} shape and sends nothing when no user matches', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    const result = await service.requestPasswordReset({ phone: '9999999999' } as any);

    expect(result).toEqual({ sent: true });
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(whatsAppOtpService.sendOtp).not.toHaveBeenCalled();
  });

  it('rejects a reset with no matching pending OTP', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'u1', passwordResetOtpHash: null, passwordResetOtpExpiresAt: null });

    await expect(
      service.resetPassword({ phone: '9000000001', otp: '123456', newPassword: 'new-password-1' } as any),
    ).rejects.toThrow(UnauthorizedException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects an expired OTP even if the code itself is correct', async () => {
    const otpHash = await bcrypt.hash('482913', 10);
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1', passwordResetOtpHash: otpHash, passwordResetOtpExpiresAt: new Date(Date.now() - 60 * 1000),
    });

    await expect(
      service.resetPassword({ phone: '9000000001', otp: '482913', newPassword: 'new-password-1' } as any),
    ).rejects.toThrow(UnauthorizedException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('sets the new password and clears the OTP + refreshToken once the code checks out', async () => {
    const otpHash = await bcrypt.hash('482913', 10);
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1', passwordResetOtpHash: otpHash, passwordResetOtpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await service.resetPassword({ phone: '9000000001', otp: '482913', newPassword: 'new-password-1' } as any);

    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    const call = prisma.user.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'u1' });
    expect(call.data).toMatchObject({ passwordResetOtpHash: null, passwordResetOtpExpiresAt: null, refreshToken: null });
    await expect(bcrypt.compare('new-password-1', call.data.passwordHash)).resolves.toBe(true);
  });
});
