import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Sends a password-reset OTP over WhatsApp via Meta's Cloud API — a real
 * business-messaging channel, not the wa.me click-to-chat links used
 * elsewhere in this app (lib/whatsappShare.ts), which only open WhatsApp
 * for a person to send a message themselves and can't deliver anything to
 * someone automatically.
 *
 * Requires a WhatsApp Business Platform setup this app doesn't do for
 * you: a Meta Business Account (business verification), a phone number
 * registered on the Cloud API, and one pre-approved "Authentication"
 * category template (Meta requires OTP-style messages to use a specific
 * approved template, not free-form text). None of that can be automated
 * from here — see MOBILE_APPS.md-style setup notes; this class just calls
 * the API once those exist.
 *
 * Deliberately never throws when unconfigured or when the send itself
 * fails — a "forgot password" flow failing loudly because a third-party
 * messaging API had a bad moment is worse than the user just not getting
 * a WhatsApp message and falling back to contacting support. The OTP is
 * still generated and stored either way (see AuthService.requestPasswordReset);
 * this only controls whether WhatsApp successfully delivered it.
 */
@Injectable()
export class WhatsAppOtpService {
  private readonly logger = new Logger(WhatsAppOtpService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return !!(this.config.get('WHATSAPP_ACCESS_TOKEN') && this.config.get('WHATSAPP_PHONE_NUMBER_ID'));
  }

  /** @returns whether the message was actually sent — never throws. */
  async sendOtp(phone: string, otp: string): Promise<boolean> {
    if (!this.isConfigured()) {
      this.logger.warn(
        `Password-reset OTP requested for a user but WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID aren't configured — nothing sent. Set those (see env.validation.ts) once WhatsApp Business Platform is set up.`,
      );
      return false;
    }

    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    // Meta requires a pre-approved template name for any business-initiated
    // message — this can't be a free-form "Your code is 123456" text. The
    // default here assumes a template literally named this with one body
    // variable; adjust WHATSAPP_OTP_TEMPLATE_NAME (and the `components`
    // shape below, if the approved template's layout differs — e.g. it
    // includes a copy-code button) to match whatever gets approved.
    const templateName = this.config.get<string>('WHATSAPP_OTP_TEMPLATE_NAME', 'otp_verification');

    // WhatsApp Cloud API numbers are addressed E.164 without a leading
    // '+' (country code + number, digits only) — this app's phone numbers
    // are stored as plain 10-digit Indian numbers, so prefix 91 same as
    // lib/whatsappShare.ts already does for its own wa.me links.
    const digits = phone.replace(/\D/g, '');
    const toE164 = digits.length === 10 ? `91${digits}` : digits;

    try {
      await axios.post(
        `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: toE164,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: [{ type: 'body', parameters: [{ type: 'text', text: otp }] }],
          },
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      return true;
    } catch (error: unknown) {
      const message = axios.isAxiosError(error) ? JSON.stringify(error.response?.data) : String(error);
      this.logger.error(`WhatsApp OTP send failed: ${message}`);
      return false;
    }
  }
}
