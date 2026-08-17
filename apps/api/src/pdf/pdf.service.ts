import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import { amountToWords, resolveReceiptTheme, resolveReceiptSettings, formatReceiptDateTime, SOCIAL_PLATFORMS } from '@pavti/shared';

/** How long to wait for the receipt/voucher page (incl. Google Fonts) before giving up. */
const RENDER_TIMEOUT_MS = 15000;

@Injectable()
export class PdfService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);
  private browser: puppeteer.Browser | null = null;
  private browserLaunchPromise: Promise<puppeteer.Browser> | null = null;

  constructor(private config: ConfigService) {}

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close().catch(() => undefined);
      this.browser = null;
    }
  }

  /**
   * Puppeteer/Chromium cold-starts are expensive (100s of ms). A single browser
   * instance is launched lazily on first use and reused for every subsequent PDF —
   * only a lightweight Page is opened/closed per request. If the browser process
   * dies (crash, OOM), the next call transparently relaunches it.
   */
  private async getBrowser(): Promise<puppeteer.Browser> {
    if (this.browser?.connected) return this.browser;

    if (!this.browserLaunchPromise) {
      const executablePath = this.config.get<string>('PUPPETEER_EXECUTABLE_PATH');
      this.browserLaunchPromise = puppeteer
        .launch({
          headless: true,
          executablePath: executablePath || undefined,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
        .then((browser) => {
          this.browser = browser;
          browser.once('disconnected', () => {
            this.logger.warn('Puppeteer browser disconnected — will relaunch on next PDF request');
            this.browser = null;
          });
          return browser;
        })
        .finally(() => {
          this.browserLaunchPromise = null;
        });
    }
    return this.browserLaunchPromise;
  }

  /**
   * Escapes user-controlled text before it is interpolated into the HTML strings
   * below. Receipt/expense fields (donor name, notes, paid-to, description, ...)
   * are plain strings entered by collectors/treasurers with no sanitization at the
   * DTO layer — without this, a crafted value could inject markup/script into the
   * page Puppeteer renders (which runs with --no-sandbox).
   */
  private esc(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async generateExpenseVoucherPdf(expense: any): Promise<Buffer> {
    let page: puppeteer.Page | undefined;
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      const html = this.buildVoucherHtml(expense);
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: RENDER_TIMEOUT_MS });

      const pdfBuffer = await page.pdf({
        format: 'A5',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Voucher PDF generation error:', error);
      throw error;
    } finally {
      if (page) await page.close().catch(() => undefined);
    }
  }

  private buildVoucherHtml(expense: any): string {
    const org = expense.campaign?.organization;
    const campaign = expense.campaign;
    const fontFamily = "'Noto Sans Devanagari', 'Inter', sans-serif";
    const voucherNumber = `VCH-${this.esc(campaign?.receiptPrefix || 'EXP')}-${String(expense.id).slice(0, 8).toUpperCase()}`;
    const primaryColor = org?.brandColor || '#592E09';
    const gradient = 'linear-gradient(135deg, #592E09 0%, #71471D 50%, #D2A46D 100%)';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: ${fontFamily}; background: #fff; }
  .voucher {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    border: 3px solid ${primaryColor};
    border-radius: 8px;
    overflow: hidden;
  }
  .voucher-header {
    background: ${gradient};
    color: white;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .header-logo {
    width: 48px;
    height: 48px;
    object-fit: cover;
    background: rgba(255,255,255,0.1);
    padding: 2px;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    flex-shrink: 0;
  }
  .header-content { flex-grow: 1; min-width: 0; text-align: left; }
  .org-name { font-size: 18px; font-weight: 700; letter-spacing: 0.5px; line-height: 1.2; }
  .voucher-title { font-size: 12px; margin-top: 4px; opacity: 0.9; }
  .campaign-name { font-size: 10px; margin-top: 4px; opacity: 0.85; background: rgba(0,0,0,0.15); padding: 2px 10px; border-radius: 20px; display: inline-block; }
  .voucher-badge {
    background: #fffbf5;
    border-bottom: 2px dashed ${primaryColor};
    padding: 8px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .voucher-no { font-size: 15px; font-weight: 700; color: ${primaryColor}; }
  .voucher-date { font-size: 12px; color: #666; }
  .voucher-body { padding: 16px 20px; }
  .field { margin-bottom: 10px; }
  .field-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .field-value { font-size: 14px; color: #1a1a1a; font-weight: 600; }
  .amount-box {
    background: #fff8f0;
    border: 2px solid #ffccaa;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 12px 0;
    text-align: center;
  }
  .amount-number { font-size: 28px; font-weight: 700; color: ${primaryColor}; }
  .amount-words { font-size: 11px; color: #666; margin-top: 4px; font-style: italic; }
  .divider { border: none; border-top: 1px dashed #ddd; margin: 10px 0; }
  .voucher-footer {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-top: 2px dashed ${primaryColor};
    background: #fffbf7;
  }
  .signature-area { text-align: center; }
  .signature-line { border-bottom: 1px solid #333; width: 120px; margin-bottom: 4px; }
  .signature-label { font-size: 10px; color: #666; }
  .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
  .payment-mode { display: inline-block; background: #e3f2fd; color: #1565c0; font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
  .approval-badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 700; }
  .approved { background: #e8f5e9; color: #2e7d32; }
  .unapproved { background: #fffde7; color: #f57f17; border: 1px solid #fbc02d; }
</style>
</head>
<body>
<div class="voucher">
  <div class="voucher-header">
    ${org?.logoUrl ? `<img src="${this.esc(org.logoUrl)}" class="header-logo" />` : ''}
    <div class="header-content">
      <div class="org-name">${this.esc(org?.name) || 'Organization'}</div>
      <div class="voucher-title">Payment Voucher / देय पावती</div>
      ${campaign?.name ? `<div class="campaign-name">🎉 ${this.esc(campaign.name)}</div>` : ''}
    </div>
  </div>

  <div class="voucher-badge">
    <div class="voucher-no">${voucherNumber}</div>
    <div class="voucher-date">📅 ${new Date(expense.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
  </div>

  <div class="voucher-body">
    <div class="field">
      <div class="field-label">Paid To</div>
      <div class="field-value">${this.esc(expense.paidTo) || '—'}</div>
    </div>
    ${expense.beneficiaryPhone ? `
    <div class="field">
      <div class="field-label">Phone</div>
      <div class="field-value">${this.esc(expense.beneficiaryPhone)}</div>
    </div>` : ''}
    ${expense.gstNumber ? `
    <div class="field">
      <div class="field-label">GST Number</div>
      <div class="field-value">${this.esc(expense.gstNumber)}</div>
    </div>` : ''}

    <div class="amount-box">
      <div class="amount-number">₹${Number(expense.amount).toLocaleString('en-IN')}</div>
      <div class="amount-words">${this.esc(amountToWords(expense.amount))}</div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;">
      <span class="badge">📂 ${this.esc(String(expense.category).replace(/_/g, ' '))}</span>
      <span class="payment-mode">💳 ${this.esc(expense.paymentMode)}</span>
      ${expense.isApproved ? (
        `<span class="approval-badge approved">✓ APPROVED</span>`
      ) : (
        `<span class="approval-badge unapproved">PENDING APPROVAL</span>`
      )}
    </div>

    <hr class="divider" />

    <div class="field">
      <div class="field-label">Description</div>
      <div class="field-value">${this.esc(expense.description)}</div>
    </div>
    <div class="field">
      <div class="field-label">Added By</div>
      <div class="field-value">${this.esc(expense.addedBy?.name)}</div>
    </div>
    ${expense.approvedBy ? `
    <div class="field">
      <div class="field-label">Approved By</div>
      <div class="field-value">${this.esc(expense.approvedBy.name)}</div>
    </div>` : ''}
  </div>

  <div class="voucher-footer">
    <div class="signature-area">
      <div class="signature-line"></div>
      <div class="signature-label">Recipient Signature</div>
    </div>
    <div class="signature-area">
      <div class="signature-line"></div>
      <div class="signature-label">Authorized Signature</div>
    </div>
  </div>
</div>
</body>
</html>`;
  }

  async generateReceiptPdf(receipt: any): Promise<Buffer> {
    let page: puppeteer.Page | undefined;
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      const html = this.buildReceiptHtml(receipt);
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: RENDER_TIMEOUT_MS });

      const pdfBuffer = await page.pdf({
        format: 'A5',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('PDF generation error:', error);
      throw error;
    } finally {
      if (page) await page.close().catch(() => undefined);
    }
  }

  private buildReceiptHtml(receipt: any): string {
    const org = receipt.campaign?.organization;
    const campaign = receipt.campaign;
    const fontFamily = "'Noto Sans Devanagari', 'Inter', sans-serif";

    const settings = resolveReceiptSettings(org?.receiptTemplateSettings);
    const theme = resolveReceiptTheme(settings.theme);
    const language = settings.language || 'mr';

    const labels = {
      en: { receipt: 'RECEIPT', no: 'No.', donor: 'Donor Name', address: 'Address', amount: 'Amount', words: 'Amount in Words', category: 'Category', mode: 'Payment Mode', collector: 'Collector', area: 'Area', notes: 'Notes', sign: 'Authorized Signature', scan: 'Scan to verify' },
      hi: { receipt: 'रसीद', no: 'क्र.', donor: 'दानकर्ता', address: 'पता', amount: 'राशि', words: 'शब्दों में', category: 'श्रेणी', mode: 'भुगतान विधि', collector: 'संग्रहकर्ता', area: 'क्षेत्र', notes: 'टिप्पणी', sign: 'अधिकृत हस्ताक्षर', scan: 'सत्यापन हेतु स्कैन करें' },
      mr: { receipt: 'पावती', no: 'क्र.', donor: 'देणगीदार', address: 'पत्ता', amount: 'रक्कम', words: 'अक्षरी', category: 'प्रकार', mode: 'देय पद्धत', collector: 'संग्राहक', area: 'क्षेत्र', notes: 'टीप', sign: 'अधिकृत स्वाक्षरी', scan: 'सत्यापनासाठी स्कॅन करा' },
    };
    const l = labels[language] || labels.mr;

    const border = `${theme.borderWidth}px ${theme.borderStyle} ${theme.primaryColor}`;
    const amountBorder = `${theme.amountBorderWidth}px ${theme.amountBorderStyle} ${theme.amountBorderColor}`;
    const bannerHtml = theme.tricolorBanner
      ? '<div style="height: 4px; background: linear-gradient(90deg, #FF9933, #FFFFFF, #128807);"></div>'
      : theme.bannerEmoji
        ? `<div style="position: absolute; top: 0; right: 0; font-size: 24px; opacity: 0.15; padding: 4px;">${theme.bannerEmoji}</div>`
        : '';

    const isInternal = receipt.collectionType === 'INTERNAL';
    const isUnpaid = receipt.status === 'PENDING';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: ${fontFamily}; background: #fff; position: relative; }
  .receipt {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    border: ${border};
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }
  .receipt-header {
    background: ${theme.gradient};
    color: white;
    padding: 16px 20px;
    position: relative;
  }
  .header-tagline {
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255,255,255,0.2);
    opacity: 0.95;
  }
  .header-main {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .header-logo {
    width: 48px;
    height: 48px;
    object-fit: cover;
    background: rgba(255,255,255,0.1);
    padding: 2px;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    flex-shrink: 0;
  }
  .header-content {
    flex-grow: 1;
    min-width: 0;
    text-align: left;
  }
  .org-name { font-size: 18px; font-weight: 700; letter-spacing: 0.5px; line-height: 1.2; }
  .org-name-local { font-size: 13px; opacity: 0.9; margin-top: 2px; line-height: 1.2; }
  .campaign-name { font-size: 10px; margin-top: 4px; opacity: 0.85; background: rgba(0,0,0,0.15); padding: 2px 10px; border-radius: 20px; display: inline-block; }
  .receipt-badge {
    background: #fffbf5;
    border-bottom: 2px dashed ${theme.primaryColor};
    padding: 8px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .receipt-no { font-size: 15px; font-weight: 700; color: ${theme.primaryColor}; }
  .receipt-date { font-size: 12px; color: #666; }
  .receipt-body { padding: 16px 20px; }
  .field { margin-bottom: 10px; }
  .field-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .field-value { font-size: 14px; color: #1a1a1a; font-weight: 600; }
  .amount-box {
    background: ${theme.amountBg};
    border: ${amountBorder};
    border-radius: 8px;
    padding: 12px 16px;
    margin: 12px 0;
    text-align: center;
  }
  .amount-number { font-size: 28px; font-weight: 700; color: ${theme.primaryColor}; }
  .amount-words { font-size: 11px; color: #666; margin-top: 4px; font-style: italic; }
  .upi-line { font-size: 11px; color: #444; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #ddd; }
  .divider { border: none; border-top: 1px dashed #ddd; margin: 10px 0; }
  .footer-note-bar {
    padding: 8px 20px;
    text-align: center;
    font-size: 11px;
    color: #444;
    font-weight: 600;
    background: #fffbf5;
    border-top: 1px dashed #ddd;
  }
  .receipt-footer {
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2px dashed ${theme.primaryColor};
    background: #fffbf7;
  }
  .signature-area { text-align: center; }
  .signature-line { border-bottom: 1px solid #333; width: 120px; margin-bottom: 4px; }
  .signature-label { font-size: 10px; color: #666; }
  .qr-area { text-align: center; }
  .qr-label { font-size: 9px; color: #888; margin-top: 4px; }
  .social-row { padding: 6px 20px; text-align: center; font-size: 10px; color: #666; border-top: 1px dashed #ddd; background: #fffdfa; }
  .social-row span { margin: 0 6px; }
  .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
  .payment-mode { display: inline-block; background: #e3f2fd; color: #1565c0; font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
  .status-badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 700; }
  .status-paid { background: #e8f5e9; color: #2e7d32; }
  .status-unpaid { background: #fffde7; color: #f57f17; border: 1px solid #fbc02d; }
  .stamp-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-15deg);
    border: 4px solid #d32f2f;
    color: #d32f2f;
    font-size: 38px;
    font-weight: 900;
    padding: 8px 16px;
    border-radius: 8px;
    opacity: 0.15;
    pointer-events: none;
    text-transform: uppercase;
    z-index: 100;
  }
</style>
</head>
<body>
<div class="receipt">
  ${bannerHtml}
  <div class="receipt-header">
    ${settings.headerTagline ? `<div class="header-tagline">${this.esc(settings.headerTagline)}</div>` : ''}
    <div class="header-main">
      ${org?.logoUrl ? `<img src="${this.esc(org.logoUrl)}" class="header-logo" />` : ''}
      <div class="header-content">
        <div class="org-name">${this.esc(org?.name) || 'Organization'}</div>
        ${org?.nameMarathi ? `<div class="org-name-local">${this.esc(org.nameMarathi)}</div>` : ''}
        ${campaign?.name ? `<div class="campaign-name">🎉 ${this.esc(campaign.name)}</div>` : ''}
      </div>
    </div>
  </div>

  <div class="receipt-badge">
    <div>
      <div class="receipt-no">${isInternal ? (language === 'mr' ? 'अंतर्गत पावती' : language === 'hi' ? 'आंतरिक रसीद' : 'Internal Receipt') : (settings.receiptTitle || l.receipt)} #${this.esc(receipt.receiptNumber)}</div>
    </div>
    <div class="receipt-date">📅 ${formatReceiptDateTime(receipt.createdAt)}</div>
  </div>

  <div class="receipt-body">
    <div class="field">
      <div class="field-label">${l.donor}</div>
      <div class="field-value">${settings.donorPrefix ? `<span style="font-weight:400;color:#666;margin-right:4px;">${this.esc(settings.donorPrefix)}</span>` : ''}${this.esc(receipt.donorName)}</div>
    </div>
    ${receipt.donorAddress ? `
    <div class="field">
      <div class="field-label">${l.address}</div>
      <div class="field-value">${this.esc(receipt.donorAddress)}</div>
    </div>` : ''}

    <div class="amount-box">
      <div class="amount-number">₹${Number(receipt.amount).toLocaleString('en-IN')}</div>
      <div class="amount-words">${this.esc(receipt.amountInWords)}</div>
      ${org?.upiId ? `<div class="upi-line">📲 Pay via UPI: <strong>${this.esc(org.upiId)}</strong></div>` : ''}
    </div>

    <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;">
      <span class="badge">📂 ${this.esc(receipt.category)}</span>
      <span class="payment-mode">💳 ${this.esc(receipt.paymentMode)}</span>
      ${isUnpaid ? (
        `<span class="status-badge status-unpaid">${language === 'mr' ? 'थकबाकी' : language === 'hi' ? 'बकाया' : 'UNPAID'}</span>`
      ) : (
        `<span class="status-badge status-paid">${language === 'mr' ? 'प्राप्त' : language === 'hi' ? 'प्राप्त' : 'PAID'}</span>`
      )}
    </div>

    <hr class="divider" />

    <div class="field">
      <div class="field-label">${l.collector}</div>
      <div class="field-value">${this.esc(receipt.collector?.name)}</div>
    </div>
    ${receipt.area ? `
    <div class="field">
      <div class="field-label">${l.area}</div>
      <div class="field-value">${this.esc(receipt.area.name)}</div>
    </div>` : ''}
    ${receipt.notes ? `
    <div class="field">
      <div class="field-label">${l.notes}</div>
      <div class="field-value">${this.esc(receipt.notes)}</div>
    </div>` : ''}
  </div>

  ${settings.footerNote ? `
  <div class="footer-note-bar">
    ${this.esc(settings.footerNote)}
  </div>` : ''}

  <div class="receipt-footer">
    <div class="signature-area">
      <div class="signature-line"></div>
      <div class="signature-label">${l.sign}</div>
    </div>
    <div class="qr-area">
      ${receipt.qrCodeData ? `<img src="${receipt.qrCodeData}" width="70" height="70" />` : ''}
      <div class="qr-label">${l.scan}</div>
    </div>
  </div>

  ${org?.socialLinks && SOCIAL_PLATFORMS.some((p) => org.socialLinks[p.key]) ? `
  <div class="social-row">
    ${SOCIAL_PLATFORMS.filter((p) => org.socialLinks[p.key]).map((p) => `<span>${p.emoji} ${this.esc(org.socialLinks[p.key])}</span>`).join('')}
  </div>` : ''}

  ${receipt.isVoided ? (
    `<div class="stamp-overlay" style="border-color: #d32f2f; color: #d32f2f; opacity: 0.65;">VOID</div>`
  ) : isUnpaid ? (
    `<div class="stamp-overlay" style="border-color: #f57f17; color: #f57f17; opacity: 0.25;">UNPAID</div>`
  ) : ''}
</div>
</body>
</html>`;
  }
}
