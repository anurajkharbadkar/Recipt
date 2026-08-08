import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory, PaymentMode } from '@pavti/shared';

export class CreateExpenseDto {
  @ApiProperty({ example: 'campaign-uuid-here' })
  @IsString()
  campaignId: string;

  @ApiProperty({ enum: ExpenseCategory })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

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
