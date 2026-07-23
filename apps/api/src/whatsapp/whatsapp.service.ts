import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface ReceiptNotificationData {
  donorName: string;
  amount: number;
  receiptNumber: string;
  organizationName: string;
  receiptUrl: string;
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

  private buildReceiptMessage(data: ReceiptNotificationData): string {
    return `🙏 नमस्कार ${data.donorName} जी!

आपले ${data.organizationName} ला ₹${data.amount.toLocaleString('en-IN')} चे योगदान प्राप्त झाले.

📋 पावती क्र. / Receipt No: ${data.receiptNumber}

🔗 डिजिटल पावती पाहण्यासाठी / View Digital Receipt:
${data.receiptUrl}

आपल्या सहकार्याबद्दल खूप आभारी आहोत! 🙏
धन्यवाद | Thank You`;
  }

  buildWhatsappDeepLink(phone: string, data: ReceiptNotificationData): string {
    const message = encodeURIComponent(this.buildReceiptMessage(data));
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/91${cleanPhone}?text=${message}`;
  }
}
