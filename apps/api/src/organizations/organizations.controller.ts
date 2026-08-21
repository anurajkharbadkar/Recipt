import {
  Controller, Get, Patch, Post, Body, UseGuards,
  UseInterceptors, UploadedFile, Param, Delete, Query
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoryKind } from '@prisma/client';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto, CreateAreaDto } from './dto/organization.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@pavti/shared';

@ApiTags('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private service: OrganizationsService) {}

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get current organization profile (bank transfer details are omitted for COLLECTOR/VIEWER roles)' })
  getMe(@CurrentUser('orgId') orgId: string, @CurrentUser('role') role: UserRole) {
    return this.service.getMe(orgId, role);
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Update organization profile' })
  update(@CurrentUser('orgId') orgId: string, @Body() dto: UpdateOrganizationDto) {
    return this.service.update(orgId, dto);
  }

  @Get('me/integrations-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Whether WhatsApp/SMS/R2 storage are configured (booleans only, no credentials)' })
  getIntegrationsStatus() {
    return this.service.getIntegrationsStatus();
  }

  @Post('me/logo')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload organization logo' })
  uploadLogo(
    @CurrentUser('orgId') orgId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadLogo(orgId, file);
  }

  @Post('me/idol-image')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a custom idol/darshan photo for the Interactive Devotional Pavti' })
  uploadIdolImage(
    @CurrentUser('orgId') orgId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadIdolImage(orgId, file);
  }

  @Get('areas')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'List collection areas' })
  getAreas(@CurrentUser('orgId') orgId: string) {
    return this.service.getAreas(orgId);
  }

  @Post('areas')
  @UseGuards(RolesGuard)
  // Matches POST /receipts' role set (not ORG_ADMIN-only like it used to be)
  // — a collector filling out a receipt needs to be able to add a new ward
  // inline without hitting a 403, or the inline-add UX can't reach them.
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR)
  @ApiOperation({ summary: 'Create a collection area' })
  createArea(@CurrentUser('orgId') orgId: string, @Body() data: CreateAreaDto) {
    return this.service.createArea(orgId, data);
  }

  @Delete('areas/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Delete a collection area' })
  deleteArea(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.service.deleteArea(id, orgId);
  }

  @Get('categories')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'List an org\'s custom (non-preset) categories for a given kind' })
  getCategories(@CurrentUser('orgId') orgId: string, @Query('kind') kind: CategoryKind) {
    return this.service.getCategories(orgId, kind);
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  // Union of who can create a receipt (COLLECTOR included, kind=DONATION)
  // and who can create an expense (TREASURER/ORG_ADMIN only, kind=EXPENSE).
  // A COLLECTOR could technically POST kind=EXPENSE here, but it's a no-op
  // for them in practice — ExpensesController's own POST /expenses gate
  // still blocks them from ever using an expense category.
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR)
  @ApiOperation({ summary: 'Add a custom category (kind: EXPENSE or DONATION)' })
  createCategory(@CurrentUser('orgId') orgId: string, @Body() data: { kind: CategoryKind; label: string }) {
    return this.service.createCategory(orgId, data.kind, data.label);
  }

  @Delete('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Delete a custom category' })
  deleteCategory(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.service.deleteCategory(id, orgId);
  }
}
