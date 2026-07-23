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
import { SmsService } from '../sms/sms.service';
import {
  RegisterDto,
  LoginDto,
  SendOtpDto,
  VerifyOtpDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { UserRole, SubscriptionPlan } from '@pavti/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private smsService: SmsService,
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

    const org = await this.prisma.organization.create({
      data: {
        name: dto.organizationName,
        nameMarathi: dto.organizationNameMarathi,
        nameHindi: dto.organizationNameHindi,
        slug,
        address: dto.address,
        city: dto.city,
        state: dto.state || 'Maharashtra',
        phone: dto.phone,
        email: dto.email,
        subscriptionPlan: SubscriptionPlan.FREE,
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
    const user = await this.prisma.user.findFirst({
      where: {
        phone: dto.phone,
        isActive: true,
      },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('This account uses OTP login. Please use OTP to sign in.');
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

  async sendOtp(dto: SendOtpDto) {
    const user = await this.prisma.user.findFirst({
      where: { phone: dto.phone, isActive: true },
    });

    if (!user) {
      // Return success anyway to prevent phone enumeration
      return { message: 'OTP sent if account exists' };
    }

    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpiry },
    });

    await this.smsService.sendOtp(dto.phone, otp);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findFirst({
      where: { phone: dto.phone, isActive: true },
      include: { organization: true },
    });

    if (!user || !user.otpCode || !user.otpExpiry) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (user.otpExpiry < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    if (user.otpCode !== dto.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Clear OTP
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiry: null, lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.role, user.orgId);
    return { user, organization: user.organization, ...tokens };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'refresh-secret'),
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
        secret: this.configService.get('JWT_REFRESH_SECRET', 'refresh-secret'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
}
