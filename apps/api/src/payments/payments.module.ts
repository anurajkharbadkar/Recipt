import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ReceiptsModule } from '../receipts/receipts.module';

// Just the business-rule layer (PaymentsService) — no controllers here
// (DonationsController lives in CashfreeModule, see that file's comment
// for why). CashfreeModule imports this to use PaymentsService from
// CashfreeController (order creation) and CashfreeWebhookService
// (webhook-driven state updates). Deliberately one-directional: this
// module knows nothing about Cashfree specifically, so a future
// RazorpayModule (platform subscription billing) could depend on it the
// same way without any change here.
@Module({
  imports: [ReceiptsModule],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
