import { IsArray, IsEmail, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SplitEntryDto } from './create-split.dto';

// Sandbox test endpoint only for now (handover doc section 42, first
// milestone) — takes a raw amount/customer instead of a receiptId/
// mandalId, since Payment isn't wired to Organization/Receipt from a real
// donation flow yet. That linkage is the next step, not this one.
export class CreateCashfreeOrderDto {
  @ApiProperty({ example: 100, description: 'Rupees, not paise' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'TEST_DONOR_001' })
  @IsString()
  customerId: string;

  @ApiProperty({ example: '9999999999' })
  @IsString()
  customerPhone: string;

  @ApiPropertyOptional({ example: 'test@example.com' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  // Optional — testing "Split During Order Creation" (order_splits) as an
  // alternative to the separate post-payment split call that turned out to
  // need Cashfree account activation we don't have yet. Omit entirely for
  // the normal no-split order creation path.
  @ApiPropertyOptional({ type: [SplitEntryDto], example: [{ vendorId: 'esRunA011', percentage: 100 }] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitEntryDto)
  splits?: SplitEntryDto[];
}
