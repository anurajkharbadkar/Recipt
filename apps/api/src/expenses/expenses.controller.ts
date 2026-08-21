import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/expense.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@pavti/shared';

@ApiTags('expenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private service: ExpensesService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  findAll(@CurrentUser('orgId') orgId: string, @Query('campaignId') campaignId?: string) {
    return this.service.findAll(orgId, campaignId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER)
  create(@CurrentUser() user: AuthenticatedUser, @Body() data: CreateExpenseDto) {
    return this.service.create(user.orgId, user.id, data);
  }

  @Get(':id/voucher')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'Download expense payment voucher PDF' })
  async getVoucher(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Res() res: Response,
  ) {
    const pdf = await this.service.getVoucherPdf(id, orgId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=voucher-${id}.pdf`);
    return res.send(pdf);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER)
  delete(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.service.delete(id, orgId);
  }
}
