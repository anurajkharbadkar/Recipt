import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/** `skipped` = MSG91_API_KEY isn't configured — distinct from an actual
 *  delivery failure, same reasoning as WhatsappService.SendResult. */
export interface SendResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private config: ConfigService) {}

  isConfigured(): boolean {
    return !!this.config.get('MSG91_API_KEY');
  }

  async sendOtp(phone: string, otp: string): Promise<SendResult> {
    const apiKey = this.config.get('MSG91_API_KEY');
    const senderId = this.config.get('MSG91_SENDER_ID', 'PAVTIB');

    if (!apiKey) {
      this.logger.log(`[DEV] OTP for ${phone}: ${otp}`);
      return { success: false, skipped: true };
    }

    try {
      await axios.post(
        'https://api.msg91.com/api/v5/otp',
        {
          template_id: this.config.get('MSG91_OTP_TEMPLATE_ID'),
          mobile: `91${phone.replace(/\D/g, '')}`,
          otp,
        },
        {
          headers: {
            authkey: apiKey,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`OTP sent to ${phone}`);
      return { success: true };
    } catch (error) {
      const message = this.describeError(error);
      this.logger.error(`OTP send failed: ${message}`);
      return { success: false, error: message };
    }
  }

  async sendReceiptSms(
    phone: string,
    data: {
      donorName: string;
      amount: number;
      receiptNumber: string;
      organizationName: string;
    },
  ): Promise<SendResult> {
    const apiKey = this.config.get('MSG91_API_KEY');

    if (!apiKey) {
      this.logger.log(`[DEV] SMS to ${phone}: Receipt ${data.receiptNumber}`);
      return { success: false, skipped: true };
    }

    const message = `Donation of Rs.${data.amount} to ${data.organizationName} received. Receipt: ${data.receiptNumber}. Thank you, ${data.donorName}!`;

    try {
      await axios.post(
        'https://api.msg91.com/api/sendhttp.php',
        null,
        {
          params: {
            authkey: apiKey,
            mobiles: `91${phone.replace(/\D/g, '')}`,
            message,
            sender: this.config.get('MSG91_SENDER_ID', 'PAVTIB'),
            route: '4',
          },
        },
      );
      return { success: true };
    } catch (error) {
      const message2 = this.describeError(error);
      this.logger.error(`SMS send failed: ${message2}`);
      return { success: false, error: message2 };
    }
  }

  private describeError(error: any): string {
    return error?.response?.data?.message || error?.message || 'Unknown error';
  }
}
