import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@pavti/shared';

@ApiTags('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'Dashboard summary stats' })
  getSummary(@CurrentUser('orgId') orgId: string, @Query('campaignId') campaignId?: string) {
    return this.service.getDashboardSummary(orgId, campaignId);
  }

  @Get('daily')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'Daily collection trend' })
  getDaily(
    @CurrentUser('orgId') orgId: string,
    @Query('campaignId') campaignId?: string,
    @Query('days') days?: string,
  ) {
    return this.service.getDailyCollections(orgId, campaignId, parseInt(days || '30'));
  }

  @Get('collectors')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'Collector-wise collection stats' })
  getCollectors(@CurrentUser('orgId') orgId: string, @Query('campaignId') campaignId?: string) {
    return this.service.getCollectorStats(orgId, campaignId);
  }

  @Get('areas')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'Area-wise collection stats' })
  getAreas(@CurrentUser('orgId') orgId: string, @Query('campaignId') campaignId?: string) {
    return this.service.getAreaStats(orgId, campaignId);
  }

  @Get('categories')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'Category-wise collection stats' })
  getCategories(@CurrentUser('orgId') orgId: string, @Query('campaignId') campaignId?: string) {
    return this.service.getCategoryStats(orgId, campaignId);
  }

  @Get('collection-type')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'Donation vs Internal collection breakdown' })
  getCollectionType(@CurrentUser('orgId') orgId: string, @Query('campaignId') campaignId?: string) {
    return this.service.getCollectionTypeStats(orgId, campaignId);
  }

  @Get('income-expense-trend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'Daily income vs expense trend' })
  getIncomeExpenseTrend(
    @CurrentUser('orgId') orgId: string,
    @Query('campaignId') campaignId?: string,
    @Query('days') days?: string,
  ) {
    return this.service.getIncomeVsExpenseTrend(orgId, campaignId, parseInt(days || '30'));
  }

  @Get('top-donors')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER)
  @ApiOperation({ summary: 'Top donors list' })
  getTopDonors(
    @CurrentUser('orgId') orgId: string,
    @Query('campaignId') campaignId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getTopDonors(orgId, campaignId, parseInt(limit || '10'));
  }
}
