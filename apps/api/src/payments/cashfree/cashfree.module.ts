import { Module } from '@nestjs/common';
import { CashfreeService } from './cashfree.service';
import { CashfreeController } from './cashfree.controller';
import { CashfreeWebhookController } from './cashfree-webhook.controller';
import { CashfreeWebhookService } from './cashfree-webhook.service';
import { DonationsController } from '../donations.controller';
import { SubscriptionPaymentController } from '../subscription-payment.controller';
import { PaymentsModule } from '../payments.module';

// DonationsController and SubscriptionPaymentController live here (not in
// PaymentsModule) purely to avoid a circular import: both need CashfreeService
// and PaymentsService, and PaymentsModule already gets imported *by* this
// module. If a second payment provider (Razorpay) ever needs either
// endpoint, they should move to their own module both providers import.
@Module({
  imports: [PaymentsModule],
  controllers: [CashfreeController, CashfreeWebhookController, DonationsController, SubscriptionPaymentController],
  providers: [CashfreeService, CashfreeWebhookService],
  exports: [CashfreeService],
})
export class CashfreeModule {}
