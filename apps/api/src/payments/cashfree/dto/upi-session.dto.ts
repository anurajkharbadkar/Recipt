import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// The frontend already has this from createOrder()'s response — these
// endpoints are a second call against that same session, not a new order.
export class UpiSessionDto {
  @ApiProperty({ example: 'session_...' })
  @IsString()
  paymentSessionId: string;
}
