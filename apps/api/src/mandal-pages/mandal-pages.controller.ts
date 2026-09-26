import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@pavti/shared';
import { MandalPagesService } from './mandal-pages.service';
import { UpdateMandalPageConfigDto } from './dto/mandal-page.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('mandal-pages')
@Controller('mandal-pages')
export class MandalPagesController {
  constructor(private readonly mandalPagesService: MandalPagesService) {}

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get public Mandal webpage configuration, 9/10-day schedules, and sponsors by slug' })
  getPublicPage(@Param('slug') slug: string) {
    return this.mandalPagesService.findBySlug(slug);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current Mandal public webpage configuration for admin editing' })
  getMyConfig(@CurrentUser('orgId') orgId: string) {
    return this.mandalPagesService.getMyConfig(orgId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current Mandal public webpage configuration, daily schedules, and sponsors' })
  updateConfig(@CurrentUser('orgId') orgId: string, @Body() dto: UpdateMandalPageConfigDto) {
    return this.mandalPagesService.updateConfig(orgId, dto);
  }

  @Post('me/preset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply preset 9-day Navratri or 10-day Ganeshotsav template to current Mandal page' })
  applyPreset(@CurrentUser('orgId') orgId: string, @Body('presetType') presetType: 'NAVRATRI' | 'GANESHOTSAV') {
    return this.mandalPagesService.applyPresetTemplate(orgId, presetType || 'NAVRATRI');
  }
}
