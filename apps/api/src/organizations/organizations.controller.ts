import {
  Controller, Get, Patch, Post, Body, UseGuards,
  UseInterceptors, UploadedFile, Param, Delete
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/organization.dto';
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

  @Get('areas')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'List collection areas' })
  getAreas(@CurrentUser('orgId') orgId: string) {
    return this.service.getAreas(orgId);
  }

  @Post('areas')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Create a collection area' })
  createArea(@CurrentUser('orgId') orgId: string, @Body() data: any) {
    return this.service.createArea(orgId, data);
  }

  @Delete('areas/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Delete a collection area' })
  deleteArea(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.service.deleteArea(id, orgId);
  }
}
