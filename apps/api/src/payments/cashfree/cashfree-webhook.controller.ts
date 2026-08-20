import { BadRequestException, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { CashfreeWebhookService } from './cashfree-webhook.service';

/**
 * Public — Cashfree calls this, not a logged-in staff member. There is no
 * JwtAuthGuard here on purpose; signature verification (inside
 * CashfreeWebhookService) is what proves a request genuinely came from
 * Cashfree, exactly as the handover doc's Core Security Rule requires.
 * This is CASHFREE_NOTIFY_URL in apps/api/.env.
 */
@ApiTags('payments')
@Controller('payments/cashfree')
export class CashfreeWebhookController {
  constructor(private readonly webhookService: CashfreeWebhookService) {}

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cashfree payment webhook — signature-verified, not for manual/browser use' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-webhook-signature') signature: string,
    @Headers('x-webhook-timestamp') timestamp: string,
    @Headers('x-idempotency-key') idempotencyKey: string,
    @Headers('x-webhook-attempt') attempt: string,
  ) {
    if (!req.rawBody) {
      // Only happens if main.ts's rawBody:true option regresses — signature
      // verification is impossible without the exact raw bytes.
      throw new BadRequestException('Raw body unavailable');
    }
    await this.webhookService.processWebhook(req.rawBody, signature, timestamp, idempotencyKey, attempt);
    return { status: 'ok' };
  }
}
