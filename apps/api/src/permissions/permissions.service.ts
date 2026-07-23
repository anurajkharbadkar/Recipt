import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSION_MODULES, PermissionModule, ModulePermissions, UserRole } from '@pavti/shared';

const EMPTY_PERMS: ModulePermissions = {
  canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, canApprove: false,
};

// Mirrors the app's pre-existing hardcoded @Roles()/Sidebar behavior, so seeding these
// rows doesn't change access for an org until an ORG_ADMIN actually edits them.
const DEFAULT_ROLE_PERMISSIONS: Record<string, Partial<Record<PermissionModule, Partial<ModulePermissions>>>> = {
  [UserRole.TREASURER]: {
    Receipts: { canView: true, canCreate: true, canEdit: true, canExport: true },
    Expenses: { canView: true, canCreate: true, canDelete: true },
    Campaigns: { canView: true },
    Reports: { canView: true },
  },
  [UserRole.COLLECTOR]: {
    Receipts: { canView: true, canCreate: true },
  },
  [UserRole.VIEWER]: {
    Receipts: { canView: true },
    Expenses: { canView: true },
    Campaigns: { canView: true },
    Collectors: { canView: true },
    Reports: { canView: true },
    Settings: { canView: true },
  },
};

const CONFIGURABLE_ROLES: UserRole[] = [UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER];

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async getRoleDefaults(orgId: string) {
    const existing = await this.prisma.rolePermission.findMany({ where: { orgId } });
    if (existing.length > 0) return existing;

    await this.seedDefaults(orgId);
    return this.prisma.rolePermission.findMany({ where: { orgId } });
  }

  private async seedDefaults(orgId: string) {
    const rows = [];
    for (const role of CONFIGURABLE_ROLES) {
      for (const module of PERMISSION_MODULES) {
        const overrides = DEFAULT_ROLE_PERMISSIONS[role]?.[module] || {};
        rows.push({ orgId, role, module, ...EMPTY_PERMS, ...overrides });
      }
    }
    await this.prisma.rolePermission.createMany({ data: rows, skipDuplicates: true });
  }

  async updateRoleDefaults(
    orgId: string,
    matrix: Array<{ role: string; module: string } & Partial<ModulePermissions>>,
  ) {
    for (const row of matrix) {
      if (!CONFIGURABLE_ROLES.includes(row.role as UserRole)) {
        throw new ForbiddenException(`Role ${row.role} defaults are not configurable`);
      }
      if (!(PERMISSION_MODULES as readonly string[]).includes(row.module)) {
        throw new ForbiddenException(`Unknown module ${row.module}`);
      }

      const data = {
        canView: !!row.canView,
        canCreate: !!row.canCreate,
        canEdit: !!row.canEdit,
        canDelete: !!row.canDelete,
        canExport: !!row.canExport,
        canApprove: !!row.canApprove,
      };

      await this.prisma.rolePermission.upsert({
        where: { orgId_role_module: { orgId, role: row.role as any, module: row.module } },
        update: data,
        create: { orgId, role: row.role as any, module: row.module, ...data },
      });
    }
    return this.prisma.rolePermission.findMany({ where: { orgId } });
  }
}
