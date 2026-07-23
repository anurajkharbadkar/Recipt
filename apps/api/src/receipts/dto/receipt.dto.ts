import {
  IsString, IsNumber, IsOptional, IsEnum, Min, IsBoolean, IsLatitude, IsLongitude
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DonationCategory, PaymentMode, CollectionType, ReceiptStatus } from '@pavti/shared';

export class CreateReceiptDto {
  @ApiProperty({ example: 'campaign-uuid-here' })
  @IsString()
  campaignId: string;

  @ApiProperty({ example: 'Suresh Ramchandra Patil' })
  @IsString()
  donorName: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  donorPhone?: string;

  @ApiPropertyOptional({ example: 'Near Ganesh Temple, Ward A, Pune' })
  @IsOptional()
  @IsString()
  donorAddress?: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ enum: DonationCategory, default: DonationCategory.GENERAL })
  @IsOptional()
  @IsEnum(DonationCategory)
  category?: DonationCategory;

  @ApiPropertyOptional({ enum: PaymentMode, default: PaymentMode.CASH })
  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  chequeNumber?: string;

  @ApiPropertyOptional({ example: 'In memory of late Ramchandra Patil' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'area-uuid-here' })
  @IsOptional()
  @IsString()
  areaId?: string;

  @ApiPropertyOptional({ example: 18.5204 })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ example: 73.8567 })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Send WhatsApp to donor', default: true })
  @IsOptional()
  @IsBoolean()
  sendWhatsapp?: boolean;

  @ApiPropertyOptional({ description: 'Send SMS to donor', default: false })
  @IsOptional()
  @IsBoolean()
  sendSms?: boolean;

  @ApiPropertyOptional({ enum: CollectionType, default: CollectionType.DONATION })
  @IsOptional()
  @IsEnum(CollectionType)
  collectionType?: CollectionType;

  @ApiPropertyOptional({ enum: ReceiptStatus, default: ReceiptStatus.PAID })
  @IsOptional()
  @IsEnum(ReceiptStatus)
  status?: ReceiptStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contributorType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supportingDocUrl?: string;
}

export class ReceiptQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collectorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  areaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({ enum: CollectionType })
  @IsOptional()
  @IsEnum(CollectionType)
  collectionType?: CollectionType;

  @ApiPropertyOptional({ enum: ReceiptStatus })
  @IsOptional()
  @IsEnum(ReceiptStatus)
  status?: ReceiptStatus;
}

export class VoidReceiptDto {
  @ApiProperty({ example: 'Duplicate entry' })
  @IsString()
  reason: string;
}
