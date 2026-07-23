import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private config: ConfigService) {}

  async sendOtp(phone: string, otp: string): Promise<void> {
    const apiKey = this.config.get('MSG91_API_KEY');
    const senderId = this.config.get('MSG91_SENDER_ID', 'PAVTIB');

    if (!apiKey) {
      this.logger.log(`[DEV] OTP for ${phone}: ${otp}`);
      return;
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
    } catch (error) {
      this.logger.error(`OTP send failed: ${error.message}`);
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
  ): Promise<void> {
    const apiKey = this.config.get('MSG91_API_KEY');

    if (!apiKey) {
      this.logger.log(`[DEV] SMS to ${phone}: Receipt ${data.receiptNumber}`);
      return;
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
    } catch (error) {
      this.logger.error(`SMS send failed: ${error.message}`);
    }
  }
}
