import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { formatShareMessage, resolveReceiptSettings } from '@pavti/shared';

export interface ReceiptNotificationData {
  donorName: string;
  amount: number;
  receiptNumber: string;
  organizationName: string;
  receiptUrl: string;
  date?: string;
  category?: string;
  receiptTemplateSettings?: any;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private config: ConfigService) {}

  async sendReceiptNotification(phone: string, data: ReceiptNotificationData): Promise<void> {
    const waToken = this.config.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.config.get('WHATSAPP_PHONE_NUMBER_ID');

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    if (!waToken || !phoneNumberId) {
      // Log and skip in development
      this.logger.log(
        `[DEV] WhatsApp would send to ${formattedPhone}: Receipt ${data.receiptNumber} for ₹${data.amount}`,
      );
      return;
    }

    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: this.buildReceiptMessage(data),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${waToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`WhatsApp sent to ${formattedPhone}`);
    } catch (error) {
      this.logger.error(`WhatsApp send failed: ${error.message}`);
      // Don't throw — delivery failure shouldn't block receipt creation
    }
  }

  public buildReceiptMessage(data: ReceiptNotificationData): string {
    const settings = resolveReceiptSettings(data.receiptTemplateSettings);
    return formatShareMessage(
      settings.shareMessage,
      {
        donorName: data.donorName,
        amount: data.amount,
        receiptNumber: data.receiptNumber,
        organizationName: data.organizationName,
        receiptUrl: data.receiptUrl,
        date: data.date,
        category: data.category,
      },
      settings.language,
    );
  }

  buildWhatsappDeepLink(phone: string, data: ReceiptNotificationData): string {
    const message = encodeURIComponent(this.buildReceiptMessage(data));
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/91${cleanPhone}?text=${message}`;
  }
}
