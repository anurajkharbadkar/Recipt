import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { CampaignStatus } from '@pavti/shared';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Ganeshotsav 2026' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameMarathi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameHindi?: string;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year?: number;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  targetAmount?: number;

  @ApiPropertyOptional({ description: 'Prefix used for generated receipt numbers, e.g. "SGM-2026". Immutable after creation.' })
  @IsOptional()
  @IsString()
  receiptPrefix?: string;

  @ApiPropertyOptional({ enum: CampaignStatus })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Deliberately excludes receiptPrefix (would desync already-issued receipt
 * numbers) and status (has dedicated /activate, /complete endpoints) — and,
 * by only allowlisting these fields at all, orgId/receiptSeq/id can never be
 * overwritten by a client the way a raw `data: any` passthrough would allow.
 */
export class UpdateCampaignDto extends PartialType(
  OmitType(CreateCampaignDto, ['receiptPrefix', 'status'] as const),
) {}
