import { IsString, IsOptional, IsNumber, IsEnum, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory, PaymentMode } from '@pavti/shared';

export class CreateExpenseDto {
  @ApiProperty({ example: 'campaign-uuid-here' })
  @IsString()
  campaignId: string;

  // Not a strict @IsEnum anymore — org.category can be one of the curated
  // ExpenseCategory presets OR a CustomCategory label the org added inline.
  // Same trust level as `description`/`paidTo` below: validated as non-empty
  // text, not checked against a fixed set.
  @ApiProperty({ example: ExpenseCategory.DECORATION, description: 'A preset ExpenseCategory value or a custom category label' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'Flower decoration for the mandap' })
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({ example: 'Sharma Decorators' })
  @IsOptional()
  @IsString()
  paidTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  beneficiaryPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @ApiPropertyOptional({ enum: PaymentMode, default: PaymentMode.CASH })
  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  expenseDate?: Date;
}
