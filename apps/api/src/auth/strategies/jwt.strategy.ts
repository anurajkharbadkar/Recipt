import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // No fallback default: env validation (config/env.validation.ts) guarantees
      // this is set at boot, so a missing/weak hardcoded secret can never ship.
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; role: string; orgId: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      // organization.subscriptionExpiry/Plan/Status ride along on the same
      // lookup this strategy already does per request — RolesGuard reads
      // them off req.user.organization without a second query.
      select: {
        id: true, role: true, orgId: true,
        organization: { select: { subscriptionExpiry: true, subscriptionPlan: true, subscriptionStatus: true } },
      }
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}
