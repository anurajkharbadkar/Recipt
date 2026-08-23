import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan } from '@pavti/shared';

// Every plan except FREE is a real purchase target — FREE has nothing to
// pay (PaymentsService.resolveSubscriptionPaymentContext refuses it either
// way, this just keeps an obviously-wrong value from reaching that far).
const PAYABLE_PLANS = Object.values(SubscriptionPlan).filter((p) => p !== SubscriptionPlan.FREE);

export class CreateSubscriptionOrderDto {
  // Omitted entirely for a plain renewal (prices the org's current plan,
  // the only thing this endpoint did before the subscription page's
  // Change Plan action existed). Set to price a *different* plan instead.
  @ApiPropertyOptional({ enum: PAYABLE_PLANS, example: SubscriptionPlan.PREMIUM })
  @IsOptional()
  @IsEnum(PAYABLE_PLANS)
  targetPlan?: SubscriptionPlan;
}
