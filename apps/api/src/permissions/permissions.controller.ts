import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@pavti/shared';

@ApiTags('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private service: PermissionsService) {}

  @Get('roles')
  @ApiOperation({ summary: "Get the organization's role-default permission matrix (any authenticated user, so the UI can resolve its own effective permissions)" })
  getRoleDefaults(@CurrentUser('orgId') orgId: string) {
    return this.service.getRoleDefaults(orgId);
  }

  @Put('roles')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN)
  @ApiOperation({ summary: "Update the organization's role-default permission matrix" })
  updateRoleDefaults(@CurrentUser('orgId') orgId: string, @Body() matrix: any[]) {
    return this.service.updateRoleDefaults(orgId, matrix);
  }
}
