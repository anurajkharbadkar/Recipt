import { IsString, IsEmail, IsOptional, IsObject, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Explicit allowlist for PATCH /organizations/me. Deliberately excludes
 * server/billing-owned fields (id, slug, phone, logoUrl, subscriptionPlan,
 * subscriptionExpiry, isActive) so a tenant can never self-grant a plan
 * upgrade or reactivate a suspended account through this endpoint — those
 * are the global ValidationPipe's `forbidNonWhitelisted` guarantee, which
 * only applies when the body is validated against a real DTO class.
 */
export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Shree Ganesh Mandal' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'श्री गणेश मंडळ' })
  @IsOptional()
  @IsString()
  nameMarathi?: string;

  @ApiPropertyOptional({ example: 'श्री गणेश मंडल' })
  @IsOptional()
  @IsString()
  nameHindi?: string;

  @ApiPropertyOptional({ example: '123, MG Road, Pune' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Pune' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '411001' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: 'admin@mandal.org' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'MH/2024/001' })
  @IsOptional()
  @IsString()
  regNumber?: string;

  @ApiPropertyOptional({ example: 'State Bank of India' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'SBIN0001234' })
  @IsOptional()
  @IsString()
  bankIfsc?: string;

  @ApiPropertyOptional({ example: 'Pune Main Branch' })
  @IsOptional()
  @IsString()
  bankBranch?: string;

  @ApiPropertyOptional({ example: 'mandal@upi' })
  @IsOptional()
  @IsString()
  upiId?: string;

  @ApiPropertyOptional({ description: 'Receipt theme + styling settings, e.g. { theme: "GANESHOTSAV" }' })
  @IsOptional()
  @IsObject()
  receiptTemplateSettings?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Social links shown on the pavti, e.g. { instagram: "https://instagram.com/mandal" }' })
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '#C85000', description: 'Org-wide UI accent color, applied as a CSS custom property' })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'brandColor must be a 6-digit hex color, e.g. #C85000' })
  brandColor?: string;
}
