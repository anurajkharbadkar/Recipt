import { Module } from '@nestjs/common';
import { CashfreeService } from './cashfree.service';
import { CashfreeController } from './cashfree.controller';
import { CashfreeWebhookController } from './cashfree-webhook.controller';
import { CashfreeWebhookService } from './cashfree-webhook.service';
import { DonationsController } from '../donations.controller';
import { PaymentsModule } from '../payments.module';

// DonationsController lives here (not in PaymentsModule) purely to avoid a
// circular import: it needs both CashfreeService and PaymentsService, and
// PaymentsModule already gets imported *by* this module. If a second
// payment provider (Razorpay) ever needs the same donations endpoint,
// DonationsController should move to its own module both providers import.
@Module({
  imports: [PaymentsModule],
  controllers: [CashfreeController, CashfreeWebhookController, DonationsController],
  providers: [CashfreeService, CashfreeWebhookService],
  exports: [CashfreeService],
})
export class CashfreeModule {}
