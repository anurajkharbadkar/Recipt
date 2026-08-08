import { IsString, IsNumber, IsOptional, IsArray, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeclareInternalCollectionDto {
  @ApiProperty({ example: 'campaign-uuid-here' })
  @IsString()
  campaignId: string;

  @ApiProperty({ example: 501, description: 'Default per-member amount — editable per member afterwards' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ description: 'Payment due date — shown as an urgency banner on the roster' })
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @ApiPropertyOptional({ example: 'Annual Mandal membership fee' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [String], description: 'Member IDs to declare a contribution for' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  memberIds: string[];
}
