import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { CreateMemberDto, UpdateMemberDto, BulkCreateMembersDto } from './dto/member.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@pavti/shared';

@ApiTags('members')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('members')
export class MembersController {
  constructor(private service: MembersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'List registered members (सभासद नोंदणी)' })
  findAll(@CurrentUser('orgId') orgId: string) {
    return this.service.findAll(orgId);
  }

  @Post()
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER)
  @ApiOperation({ summary: 'Register a new member' })
  create(@CurrentUser('orgId') orgId: string, @Body() dto: CreateMemberDto) {
    return this.service.create(orgId, dto);
  }

  @Post('bulk')
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER)
  @ApiOperation({ summary: 'Bulk-register members from a list of names' })
  bulkCreate(@CurrentUser('orgId') orgId: string, @Body() dto: BulkCreateMembersDto) {
    return this.service.bulkCreate(orgId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER)
  @ApiOperation({ summary: 'Update a member' })
  update(@Param('id') id: string, @CurrentUser('orgId') orgId: string, @Body() dto: UpdateMemberDto) {
    return this.service.update(id, orgId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER)
  @ApiOperation({ summary: 'Remove (or deactivate, if they have contribution history) a member' })
  delete(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.service.delete(id, orgId);
  }
}
