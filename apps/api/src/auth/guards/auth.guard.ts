import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole, inferApiModuleAndAction } from '@pavti/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest();
    const { user } = req;
    if (!user) return false;

    // SUPER_ADMIN can access everything
    if (user.role === UserRole.SUPER_ADMIN) return true;

    const { module, action } = inferApiModuleAndAction(req.path, req.method);

    // 1. Per-person override always wins if explicitly set
    const overrides = user.permissionsOverride as any;
    if (overrides && module && action && overrides[module] !== undefined) {
      const actionAllowed = overrides[module][action];
      if (actionAllowed !== undefined) {
        return !!actionAllowed;
      }
    }

    // 2. Org-configurable role default (RolePermission), if one has been set for this org/role/module
    if (module && action) {
      const rolePermission = await this.prisma.rolePermission.findUnique({
        where: { orgId_role_module: { orgId: user.orgId, role: user.role, module } },
      });
      if (rolePermission) {
        return !!(rolePermission as any)[action];
      }
    }

    // 3. Fall back to the static @Roles() list (pre-customization default)
    if (!requiredRoles) return true;
    return requiredRoles.includes(user.role);
  }
}
