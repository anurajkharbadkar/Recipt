import {
  Controller, Get, Post, Body, Param, Delete, Query,
  UseGuards, Req, Res, HttpCode, HttpStatus, Patch, Headers
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ReceiptsService } from './receipts.service';
import { CreateReceiptDto, ReceiptQueryDto, VoidReceiptDto } from './dto/receipt.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ReceiptStatus } from '@pavti/shared';

@ApiTags('receipts')
@Controller('receipts')
export class ReceiptsController {
  constructor(private receiptsService: ReceiptsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new receipt (Pavti)' })
  create(
    @Body() dto: CreateReceiptDto,
    @CurrentUser() user: any,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.receiptsService.create(dto, user.id, user.orgId, userAgent);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all receipts with filters' })
  findAll(@Query() query: ReceiptQueryDto, @CurrentUser() user: any) {
    return this.receiptsService.findAll(user.orgId, query, user.role, user.id);
  }

  @Get('export/csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export receipts as CSV' })
  async exportCsv(
    @CurrentUser() user: any,
    @Query('campaignId') campaignId: string,
    @Res() res: Response,
  ) {
    const csv = await this.receiptsService.exportCsv(user.orgId, campaignId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=receipts.csv');
    return res.send(csv);
  }

  @Get('verify/:id')
  @ApiOperation({ summary: 'Publicly verify a receipt (no auth required)' })
  findPublic(@Param('id') id: string) {
    return this.receiptsService.findPublic(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single receipt by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.receiptsService.findOne(id, user.orgId);
  }

  @Patch(':id/void')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Void a receipt' })
  void(
    @Param('id') id: string,
    @Body() dto: VoidReceiptDto,
    @CurrentUser() user: any,
  ) {
    return this.receiptsService.void(id, dto, user.id, user.orgId);
  }

  @Post(':id/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend WhatsApp/SMS for a receipt' })
  resend(@Param('id') id: string, @CurrentUser() user: any) {
    return this.receiptsService.resend(id, user.orgId);
  }

  @Get('donors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR, UserRole.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unique list of existing donors' })
  getUniqueDonors(@CurrentUser() user: any) {
    return this.receiptsService.findUniqueDonors(user.orgId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update receipt payment status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ReceiptStatus,
    @CurrentUser() user: any,
  ) {
    return this.receiptsService.updateStatus(id, status, user.id, user.orgId);
  }
}
