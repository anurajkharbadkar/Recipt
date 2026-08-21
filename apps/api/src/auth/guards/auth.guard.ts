import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { UserRole, BRAND_NAME } from '@pavti/shared';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/**
 * Role check + subscription-expiry check in one guard, deliberately — a
 * *global* guard (NestJS's APP_GUARD) runs before any per-controller
 * @UseGuards(JwtAuthGuard), so a standalone global SubscriptionGuard would
 * evaluate before req.user even exists and silently never fire. RolesGuard
 * is already applied (at class or route level, alongside JwtAuthGuard) on
 * essentially every protected route in this app, always *after*
 * JwtAuthGuard populates req.user — reusing that same, already-correct
 * ordering was the reliable way to add this rather than inventing a new
 * chokepoint (2026-08 roles/subscription audit — see SUBSCRIPTION_PERIOD_DAYS
 * in packages/shared, and JwtStrategy for where req.user.organization comes
 * from).
 *
 * The expiry check only gates writes: an expired org can still view its own
 * past receipts/reports/PDFs (GET requests skip it entirely), it just can't
 * create new ones — matching how the existing PENDING_PAYMENT nag banner
 * never blocked usage outright.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: AuthenticatedUser; method: string }>();
    const { user, method } = req;
    if (!user) return false;

    if (user.role !== UserRole.SUPER_ADMIN && method !== 'GET') {
      const expiry = user.organization?.subscriptionExpiry;
      if (expiry && new Date(expiry).getTime() < Date.now()) {
        throw new ForbiddenException(`Your plan has expired. Renew to keep using ${BRAND_NAME}.`);
      }
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    // SUPER_ADMIN can access everything
    if (user.role === UserRole.SUPER_ADMIN) return true;

    return requiredRoles.includes(user.role);
  }
}
