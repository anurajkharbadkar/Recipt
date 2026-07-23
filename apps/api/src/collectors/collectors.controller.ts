import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CollectorsService } from './collectors.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@pavti/shared';

@ApiTags('collectors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('collectors')
export class CollectorsController {
  constructor(private service: CollectorsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  findAll(@CurrentUser('orgId') orgId: string) {
    return this.service.findAll(orgId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  findOne(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.service.findOne(id, orgId);
  }

  @Get(':id/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  getStats(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Query('campaignId') campaignId?: string,
  ) {
    return this.service.getStats(id, orgId, campaignId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN)
  create(@CurrentUser('orgId') orgId: string, @Body() data: any) {
    return this.service.create(orgId, data);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN)
  update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() data: any,
  ) {
    return this.service.update(id, orgId, data);
  }
}
