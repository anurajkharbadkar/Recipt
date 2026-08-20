import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Sandbox test only (see cashfree.controller.ts) — takes a raw vendorId +
// percentage/amount instead of resolving it from Organization.cashfreeVendorId,
// since there's no real donation flow wired to a Mandal yet.
export class SplitEntryDto {
  @ApiProperty({ example: 'esRunA011' })
  @IsString()
  vendorId: string;

  @ApiPropertyOptional({ example: 90, description: 'Use percentage OR amount, not both' })
  @IsOptional()
  @IsNumber()
  percentage?: number;

  @ApiPropertyOptional({ example: 90, description: 'Rupees, not paise' })
  @IsOptional()
  @IsNumber()
  amount?: number;
}

export class CreateCashfreeSplitDto {
  @ApiProperty({ type: [SplitEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitEntryDto)
  splits: SplitEntryDto[];
}
