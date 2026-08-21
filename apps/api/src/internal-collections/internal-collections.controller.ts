import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InternalCollectionsService } from './internal-collections.service';
import { DeclareInternalCollectionDto } from './dto/internal-collection.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@pavti/shared';

@ApiTags('internal-collections')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('internal-collections')
export class InternalCollectionsController {
  constructor(private service: InternalCollectionsService) {}

  @Post('declare')
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER)
  @ApiOperation({ summary: 'Bulk-declare a fee/contribution for a set of members under a campaign' })
  declare(@CurrentUser() user: AuthenticatedUser, @Body() dto: DeclareInternalCollectionDto) {
    return this.service.declare(user.orgId, user.id, dto);
  }

  // Paid/unpaid-by-name is the same class of sensitive roster data as
  // Members — ORG_ADMIN/TREASURER only, not COLLECTOR/VIEWER (2026-08 roles audit).
  @Get('roster')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER)
  @ApiOperation({ summary: 'Paid/unpaid roster + totals for a campaign\'s Internal Collection' })
  roster(@CurrentUser('orgId') orgId: string, @Query('campaignId') campaignId: string) {
    return this.service.roster(orgId, campaignId);
  }
}
