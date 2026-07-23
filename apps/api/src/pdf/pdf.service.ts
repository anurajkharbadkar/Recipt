import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import { amountToWords } from '@pavti/shared';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(private config: ConfigService) {}

  async generateExpenseVoucherPdf(expense: any): Promise<Buffer> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      const html = this.buildVoucherHtml(expense);
      await page.setContent(html, { waitUntil: 'networkidle0' });

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
      if (browser) await browser.close();
    }
  }

  private buildVoucherHtml(expense: any): string {
    const org = expense.campaign?.organization;
    const campaign = expense.campaign;
    const fontFamily = "'Noto Sans Devanagari', 'Inter', sans-serif";
    const voucherNumber = `VCH-${campaign?.receiptPrefix || 'EXP'}-${String(expense.id).slice(0, 8).toUpperCase()}`;
    const primaryColor = '#C85000';
    const gradient = 'linear-gradient(135deg, #C85000 0%, #FF8C00 100%)';

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
    ${org?.logoUrl ? `<img src="${org.logoUrl}" class="header-logo" />` : ''}
    <div class="header-content">
      <div class="org-name">${org?.name || 'Organization'}</div>
      <div class="voucher-title">Payment Voucher / देय पावती</div>
      ${campaign?.name ? `<div class="campaign-name">🎉 ${campaign.name}</div>` : ''}
    </div>
  </div>

  <div class="voucher-badge">
    <div class="voucher-no">${voucherNumber}</div>
    <div class="voucher-date">📅 ${new Date(expense.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
  </div>

  <div class="voucher-body">
    <div class="field">
      <div class="field-label">Paid To</div>
      <div class="field-value">${expense.paidTo || '—'}</div>
    </div>
    ${expense.beneficiaryPhone ? `
    <div class="field">
      <div class="field-label">Phone</div>
      <div class="field-value">${expense.beneficiaryPhone}</div>
    </div>` : ''}
    ${expense.gstNumber ? `
    <div class="field">
      <div class="field-label">GST Number</div>
      <div class="field-value">${expense.gstNumber}</div>
    </div>` : ''}

    <div class="amount-box">
      <div class="amount-number">₹${expense.amount.toLocaleString('en-IN')}</div>
      <div class="amount-words">${amountToWords(expense.amount)}</div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;">
      <span class="badge">📂 ${expense.category.replace(/_/g, ' ')}</span>
      <span class="payment-mode">💳 ${expense.paymentMode}</span>
      ${expense.isApproved ? (
        `<span class="approval-badge approved">✓ APPROVED</span>`
      ) : (
        `<span class="approval-badge unapproved">PENDING APPROVAL</span>`
      )}
    </div>

    <hr class="divider" />

    <div class="field">
      <div class="field-label">Description</div>
      <div class="field-value">${expense.description}</div>
    </div>
    <div class="field">
      <div class="field-label">Added By</div>
      <div class="field-value">${expense.addedBy?.name || ''}</div>
    </div>
    ${expense.approvedBy ? `
    <div class="field">
      <div class="field-label">Approved By</div>
      <div class="field-value">${expense.approvedBy.name}</div>
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
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      const html = this.buildReceiptHtml(receipt);
      await page.setContent(html, { waitUntil: 'networkidle0' });

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
      if (browser) await browser.close();
    }
  }

  private buildReceiptHtml(receipt: any): string {
    const org = receipt.campaign?.organization;
    const campaign = receipt.campaign;
    const fontFamily = "'Noto Sans Devanagari', 'Inter', sans-serif";

    const templateSettings = org?.receiptTemplateSettings as any;
    const theme = templateSettings?.theme || 'DEFAULT';

    if (theme === 'CUSTOM_IMAGE' && templateSettings?.customImageUrl) {
      return this.buildCustomImageReceiptHtml(receipt, templateSettings);
    }

    let primaryColor = '#C85000';
    let gradient = 'linear-gradient(135deg, #C85000 0%, #FF8C00 100%)';
    let border = '3px solid #C85000';
    let amountBg = '#fff8f0';
    let amountBorder = '2px solid #ffccaa';
    let bannerHtml = '';

    if (theme === 'GANESHOTSAV') {
      primaryColor = '#E65100';
      gradient = 'linear-gradient(135deg, #E65100 0%, #F57C00 50%, #FFB300 100%)';
      border = '4px double #E65100';
      amountBg = '#FFF8E1';
      amountBorder = '2px dashed #FFE082';
      bannerHtml = '<div style="position: absolute; top: 0; right: 0; font-size: 24px; opacity: 0.15; padding: 4px;">🪔</div>';
    } else if (theme === 'EID') {
      primaryColor = '#004D20';
      gradient = 'linear-gradient(135deg, #004D20 0%, #00873C 100%)';
      border = '3px solid #004D20';
      amountBg = '#E8F5E9';
      amountBorder = '2px solid #A5D6A7';
      bannerHtml = '<div style="position: absolute; top: 0; right: 0; font-size: 24px; opacity: 0.15; padding: 4px;">🌙</div>';
    } else if (theme === 'BHAGAT_SINGH') {
      primaryColor = '#1A2530';
      gradient = 'linear-gradient(135deg, #1A2530 0%, #2c3e50 100%)';
      border = '3px solid #1A2530';
      amountBg = '#ECEFF1';
      amountBorder = '2px solid #B0BEC5';
      bannerHtml = '<div style="height: 4px; background: linear-gradient(90deg, #FF9933, #FFFFFF, #128807);"></div>';
    }

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
    background: ${gradient};
    color: white;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
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
    border-bottom: 2px dashed ${primaryColor};
    padding: 8px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .receipt-no { font-size: 15px; font-weight: 700; color: ${primaryColor}; }
  .receipt-date { font-size: 12px; color: #666; }
  .receipt-body { padding: 16px 20px; }
  .field { margin-bottom: 10px; }
  .field-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .field-value { font-size: 14px; color: #1a1a1a; font-weight: 600; }
  .amount-box {
    background: ${amountBg};
    border: ${amountBorder};
    border-radius: 8px;
    padding: 12px 16px;
    margin: 12px 0;
    text-align: center;
  }
  .amount-number { font-size: 28px; font-weight: 700; color: ${primaryColor}; }
  .amount-words { font-size: 11px; color: #666; margin-top: 4px; font-style: italic; }
  .divider { border: none; border-top: 1px dashed #ddd; margin: 10px 0; }
  .receipt-footer {
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2px dashed ${primaryColor};
    background: #fffbf7;
  }
  .signature-area { text-align: center; }
  .signature-line { border-bottom: 1px solid #333; width: 120px; margin-bottom: 4px; }
  .signature-label { font-size: 10px; color: #666; }
  .qr-area { text-align: center; }
  .qr-label { font-size: 9px; color: #888; margin-top: 4px; }
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
    ${org?.logoUrl ? `<img src="${org.logoUrl}" class="header-logo" />` : ''}
    <div class="header-content">
      <div class="org-name">${org?.name || 'Organization'}</div>
      ${org?.nameMarathi ? `<div class="org-name-local">${org.nameMarathi}</div>` : ''}
      ${campaign?.name ? `<div class="campaign-name">🎉 ${campaign.name}</div>` : ''}
    </div>
  </div>

  <div class="receipt-badge">
    <div>
      <div class="receipt-no">${isInternal ? 'अंतर्गत पावती / Internal Receipt' : 'पावती / Receipt'} #${receipt.receiptNumber}</div>
    </div>
    <div class="receipt-date">📅 ${new Date(receipt.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
  </div>

  <div class="receipt-body">
    <div class="field">
      <div class="field-label">नाव / Name</div>
      <div class="field-value">${receipt.donorName}</div>
    </div>
    ${receipt.donorAddress ? `
    <div class="field">
      <div class="field-label">पत्ता / Address</div>
      <div class="field-value">${receipt.donorAddress}</div>
    </div>` : ''}

    <div class="amount-box">
      <div class="amount-number">₹${receipt.amount.toLocaleString('en-IN')}</div>
      <div class="amount-words">${receipt.amountInWords}</div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;">
      <span class="badge">📂 ${receipt.category}</span>
      <span class="payment-mode">💳 ${receipt.paymentMode}</span>
      ${isUnpaid ? (
        `<span class="status-badge status-unpaid">थकबाकी / UNPAID</span>`
      ) : (
        `<span class="status-badge status-paid">प्राप्त / PAID</span>`
      )}
    </div>

    <hr class="divider" />

    <div class="field">
      <div class="field-label">संग्राहक / Collector</div>
      <div class="field-value">${receipt.collector?.name || ''}</div>
    </div>
    ${receipt.area ? `
    <div class="field">
      <div class="field-label">क्षेत्र / Area</div>
      <div class="field-value">${receipt.area.name}</div>
    </div>` : ''}
    ${receipt.notes ? `
    <div class="field">
      <div class="field-label">टीप / Notes</div>
      <div class="field-value">${receipt.notes}</div>
    </div>` : ''}
  </div>

  <div class="receipt-footer">
    <div class="signature-area">
      <div class="signature-line"></div>
      <div class="signature-label">अधिकृत स्वाक्षरी / Authorized Signature</div>
    </div>
    <div class="qr-area">
      ${receipt.qrCodeData ? `<img src="${receipt.qrCodeData}" width="70" height="70" />` : ''}
      <div class="qr-label">Scan to verify</div>
    </div>
  </div>

  ${receipt.isVoided ? (
    `<div class="stamp-overlay" style="border-color: #d32f2f; color: #d32f2f; opacity: 0.65;">VOID</div>`
  ) : isUnpaid ? (
    `<div class="stamp-overlay" style="border-color: #f57f17; color: #f57f17; opacity: 0.25;">UNPAID</div>`
  ) : ''}
</div>
</body>
</html>`;
  }

  private buildCustomImageReceiptHtml(receipt: any, templateSettings: any): string {
    const fontFamily = "'Noto Sans Devanagari', 'Inter', sans-serif";
    const positions = templateSettings.fieldPositions || {};

    const fieldValues: Record<string, string> = {
      donorName: receipt.donorName || '',
      donorAddress: receipt.donorAddress || '',
      amount: `₹${receipt.amount.toLocaleString('en-IN')}`,
      amountInWords: receipt.amountInWords || '',
      receiptNumber: receipt.receiptNumber || '',
      date: new Date(receipt.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      collectorName: receipt.collector?.name || '',
      areaName: receipt.area?.name || '',
      category: receipt.category || '',
      paymentMode: receipt.paymentMode || '',
    };

    const overlayHtml = Object.entries(positions)
      .map(([key, pos]: [string, any]) => {
        if (!pos) return '';
        const textAlign = pos.align || 'left';
        const baseStyle = `position:absolute; left:${pos.xPct}%; top:${pos.yPct}%; font-family:${fontFamily}; font-size:${pos.fontSizePx || 14}px; color:${pos.color || '#000000'}; font-weight:${pos.bold ? 700 : 400}; text-align:${textAlign}; white-space:nowrap;`;

        if (key === 'qrCode') {
          if (!receipt.qrCodeData) return '';
          return `<img src="${receipt.qrCodeData}" style="position:absolute; left:${pos.xPct}%; top:${pos.yPct}%; width:70px; height:70px;" />`;
        }

        const value = fieldValues[key];
        if (!value) return '';
        return `<div style="${baseStyle}">${value}</div>`;
      })
      .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: ${fontFamily}; background: #fff; }
  .custom-receipt { position: relative; width: 500px; margin: 0 auto; }
  .custom-receipt img.bg { width: 100%; display: block; }
  .stamp-overlay {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-15deg);
    border: 4px solid #d32f2f; color: #d32f2f;
    font-size: 38px; font-weight: 900; padding: 8px 16px; border-radius: 8px;
    opacity: 0.2; pointer-events: none; text-transform: uppercase;
  }
</style>
</head>
<body>
<div class="custom-receipt">
  <img class="bg" src="${templateSettings.customImageUrl}" />
  ${overlayHtml}
  ${receipt.isVoided ? '<div class="stamp-overlay">VOID</div>' : receipt.status === 'PENDING' ? '<div class="stamp-overlay" style="border-color:#f57f17;color:#f57f17;">UNPAID</div>' : ''}
</div>
</body>
</html>`;
  }
}
