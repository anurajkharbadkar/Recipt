import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { UserRole, SubscriptionStatus, SubscriptionPlan, SUBSCRIPTION_PERIOD_DAYS, FREE_TRIAL_PERIOD_DAYS } from '@pavti/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if org phone already exists
    const existing = await this.prisma.organization.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException('An organization with this phone number already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const slug = this.generateSlug(dto.organizationName);
    const mandalCode = await this.generateMandalCode();

    const org = await this.prisma.organization.create({
      data: {
        name: dto.organizationName,
        nameMarathi: dto.organizationNameMarathi,
        nameHindi: dto.organizationNameHindi,
        slug,
        mandalCode,
        address: dto.address,
        city: dto.city,
        state: dto.state || 'Maharashtra',
        phone: dto.phone,
        email: dto.email,
        subscriptionPlan: dto.subscriptionPlan,
        // FREE has nothing to pay, so it's ACTIVE immediately — no pending-
        // payment nag banner, no manual confirmation step. Every paid plan
        // still gets full access right away too (no gateway wired up yet),
        // but stays PENDING_PAYMENT until an admin confirms the seasonal fee
        // was actually received and flips it.
        subscriptionStatus: dto.subscriptionPlan === SubscriptionPlan.FREE
          ? SubscriptionStatus.ACTIVE
          : SubscriptionStatus.PENDING_PAYMENT,
        // FREE gets a short 7-day trial window (full Premium feature/limit
        // access, just capped on receipt count — see MAX_COLLECTORS_BY_PLAN
        // etc. in packages/shared); every paid plan is a full 30-day period
        // from signup regardless of whether payment was ever confirmed —
        // PENDING_PAYMENT isn't a free pass past that date either, both
        // enforced the same way by RolesGuard (2026-08-22 free-trial rework).
        subscriptionExpiry: new Date(
          Date.now() +
          (dto.subscriptionPlan === SubscriptionPlan.FREE ? FREE_TRIAL_PERIOD_DAYS : SUBSCRIPTION_PERIOD_DAYS) * 24 * 60 * 60 * 1000,
        ),
        users: {
          create: {
            name: dto.adminName,
            phone: dto.phone,
            email: dto.email,
            passwordHash,
            role: UserRole.ORG_ADMIN,
            isActive: true,
          },
        },
      },
      include: { users: true },
    });

    const admin = org.users[0];
    const tokens = await this.generateTokens(admin.id, admin.role, org.id);

    return {
      organization: org,
      user: admin,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = dto.mandalCode
      ? await this.findUserByMandalCode(dto.mandalCode, dto.phone)
      : await this.findOrgAdminByPhone(dto.phone);

    if (!user) {
      throw new UnauthorizedException(
        dto.mandalCode
          ? 'Invalid credentials — check your Mandal Code, phone and password'
          : 'No Mandal Admin account found for this phone number — Collectors and Treasurers need to sign in with their Mandal Code instead',
      );
    }

    if (!user.passwordHash) {
      throw new BadRequestException('This account has no password set — contact your admin.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.role, user.orgId);
    return { user, organization: user.organization, ...tokens };
  }

  // Staff path (COLLECTOR/TREASURER, and ORG_ADMIN if they choose to use
  // it too): a phone number is only unique *within* an org (User's real
  // constraint is @@unique([orgId, phone])) — two mandals can easily end
  // up with staff sharing a number. Scoping by mandalCode first is what
  // makes this findFirst actually deterministic instead of returning
  // "whichever org Postgres happens to return first" the moment that
  // collision occurs.
  private async findUserByMandalCode(mandalCodeInput: string, phone: string) {
    const mandalCode = mandalCodeInput.trim().toUpperCase();
    return this.prisma.user.findFirst({
      where: { phone, isActive: true, organization: { mandalCode } },
      include: { organization: true },
    });
  }

  // Mandal Admin shortcut (2026-08 login-ease pass): Organization.phone is
  // genuinely globally unique (@unique in the schema, enforced at
  // registration) — and the ORG_ADMIN created at registration always gets
  // phone = that same org phone, with no UI anywhere to change either one
  // since. So for the founding admin specifically, phone alone already
  // resolves their org with zero ambiguity — no mandal code needed. This
  // does NOT extend to collectors/treasurers added later: their phones
  // are only unique within their own org, which is exactly the ambiguity
  // findUserByMandalCode exists to resolve.
  private async findOrgAdminByPhone(phone: string) {
    const organization = await this.prisma.organization.findUnique({ where: { phone } });
    if (!organization) return null;
    return this.prisma.user.findFirst({
      where: { orgId: organization.id, role: UserRole.ORG_ADMIN, isActive: true },
      include: { organization: true },
    });
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        // No fallback default: env validation (config/env.validation.ts) guarantees
        // this is set at boot, so a missing/weak hardcoded secret can never ship.
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { organization: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user.id, user.role, user.orgId);
      return { user, organization: user.organization, ...tokens };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        area: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async generateTokens(userId: string, role: string, orgId: string) {
    const payload = { sub: userId, role, orgId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        // No fallback default: env validation (config/env.validation.ts) guarantees
        // this is set at boot, so a missing/weak hardcoded secret can never ship.
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    return `${base}-${uuidv4().substring(0, 6)}`;
  }

  // Short (6-char), memorable, unique login identifier a collector types
  // alongside their phone + password — see Organization.mandalCode's schema
  // comment for why this exists (phone alone is only unique *within* an
  // org). Excludes 0/O and 1/I/L — characters that are easy to mix up when
  // read off a phone screen or handwritten note. Retries on the (very
  // unlikely, ~32^6 space) chance of a collision.
  private readonly MANDAL_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  private async generateMandalCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += this.MANDAL_CODE_CHARS[Math.floor(Math.random() * this.MANDAL_CODE_CHARS.length)];
      }
      const existing = await this.prisma.organization.findUnique({ where: { mandalCode: code } });
      if (!existing) return code;
    }
    // Practically unreachable (10 consecutive collisions in a ~1B-code
    // space) — fail loudly rather than silently hand out a duplicate.
    throw new Error('Could not generate a unique mandal code after 10 attempts');
  }
}
