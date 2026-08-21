import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import { amountToWords, resolveReceiptTheme, resolveReceiptSettings, formatReceiptDateTime, SOCIAL_PLATFORMS, RECEIPT_GOLD_ACCENT, RECEIPT_FIELD_LABELS, BRAND_NAME } from '@pavti/shared';

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
          // --disable-dev-shm-usage: containers typically cap /dev/shm well
          // below what Chromium wants by default, and it crashes rather than
          // falling back on its own — this makes it use disk/regular memory
          // instead. A very common "works locally, dies in prod" gotcha.
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
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

  // receipt/expense/statement params below stay `any` deliberately, not by
  // omission — traced their actual callers (ReceiptsService,
  // ExpensesService, ReportsService) and each passes a differently-shaped
  // Prisma query result (different `include`s per call site, no single
  // consistent shape to name). A single Prisma.XGetPayload<{...}> type here
  // would have to be wrong for at least one caller; that's worse than an
  // honest `any` on a private rendering helper that never receives
  // unvalidated external input (everything reaching these comes from our
  // own Prisma queries, not a request body).
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

  /**
   * The formal, committee/audit-facing report: category-wise income vs.
   * expense with a net surplus/deficit and signature lines — A4, not the A5
   * receipt/voucher card format, since this is meant to be printed and filed,
   * not carried around.
   */
  async generateIncomeExpenditureStatementPdf(statement: any): Promise<Buffer> {
    let page: puppeteer.Page | undefined;
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      const html = this.buildIncomeExpenditureHtml(statement);
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: RENDER_TIMEOUT_MS });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Income & Expenditure statement PDF generation error:', error);
      throw error;
    } finally {
      if (page) await page.close().catch(() => undefined);
    }
  }

  private buildIncomeExpenditureHtml(statement: any): string {
    const org = statement.organization;
    const campaign = statement.campaign;
    const primaryColor = org?.brandColor || '#592E09';
    const fontFamily = "'Noto Sans Devanagari', 'Inter', sans-serif";
    const fmtAmount = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
    const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const categoryLabel = (c: string) => this.esc(String(c).replace(/_/g, ' '));

    const incomeRows = (statement.income || []).map((c: any) => `
      <tr>
        <td>${categoryLabel(c.category)}</td>
        <td class="num">${c.count}</td>
        <td class="num">${fmtAmount(c.amount)}</td>
      </tr>`).join('');

    const expenseRows = (statement.expense || []).map((c: any) => `
      <tr>
        <td>${categoryLabel(c.category)}</td>
        <td class="num">${c.count}</td>
        <td class="num">${fmtAmount(c.amount)}</td>
      </tr>`).join('');

    const isSurplus = statement.netBalance >= 0;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: ${fontFamily}; color: #1a1a1a; font-size: 12px; }
  .sheet { max-width: 720px; margin: 0 auto; }
  .letterhead { display: flex; align-items: center; gap: 14px; padding-bottom: 14px; border-bottom: 3px solid ${primaryColor}; margin-bottom: 18px; }
  .letterhead img { width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #eee; }
  .org-name { font-size: 20px; font-weight: 800; color: ${primaryColor}; }
  .org-name-local { font-size: 13px; color: #555; margin-top: 1px; }
  .org-meta { font-size: 10.5px; color: #777; margin-top: 3px; }
  .title-block { text-align: center; margin-bottom: 18px; }
  .title-block h1 { font-size: 16px; font-weight: 700; letter-spacing: 0.3px; }
  .title-block .subtitle { font-size: 11px; color: #666; margin-top: 4px; }
  .period-row { display: flex; justify-content: space-between; font-size: 10.5px; color: #666; margin-bottom: 16px; padding: 8px 12px; background: #fafafa; border-radius: 6px; border: 1px solid #eee; }
  .columns { display: flex; gap: 18px; margin-bottom: 16px; }
  .col { flex: 1; }
  .col h2 { font-size: 12px; font-weight: 700; padding: 8px 10px; color: #fff; border-radius: 6px 6px 0 0; }
  .col.income h2 { background: #2e7d32; }
  .col.expense h2 { background: #c62828; }
  table { width: 100%; border-collapse: collapse; border: 1px solid #eee; border-top: none; }
  th { text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.4px; color: #888; padding: 6px 10px; border-bottom: 1px solid #eee; }
  td { padding: 6px 10px; font-size: 11px; border-bottom: 1px solid #f3f3f3; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  tfoot td { font-weight: 700; border-top: 2px solid #ddd; border-bottom: none; }
  .balance-box { margin: 20px 0; padding: 16px 20px; border-radius: 8px; text-align: center; background: ${isSurplus ? '#e8f5e9' : '#ffebee'}; border: 2px solid ${isSurplus ? '#2e7d32' : '#c62828'}; }
  .balance-label { font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
  .balance-amount { font-size: 26px; font-weight: 800; color: ${isSurplus ? '#2e7d32' : '#c62828'}; margin-top: 4px; }
  .signatures { display: flex; justify-content: space-between; margin-top: 48px; }
  .sig { text-align: center; width: 180px; }
  .sig-line { border-bottom: 1px solid #333; margin-bottom: 6px; height: 32px; }
  .sig-label { font-size: 10.5px; color: #666; }
  .footer-note { margin-top: 28px; font-size: 9.5px; color: #999; text-align: center; }
</style>
</head>
<body>
<div class="sheet">
  <div class="letterhead">
    ${org?.logoUrl ? `<img src="${this.esc(org.logoUrl)}" />` : ''}
    <div>
      <div class="org-name">${this.esc(org?.name) || 'Organization'}</div>
      ${org?.nameMarathi ? `<div class="org-name-local">${this.esc(org.nameMarathi)}</div>` : ''}
      <div class="org-meta">${[org?.address, org?.city, org?.state].filter(Boolean).map((v) => this.esc(v)).join(', ')}${org?.regNumber ? ` &nbsp;•&nbsp; Reg. No. ${this.esc(org.regNumber)}` : ''}</div>
    </div>
  </div>

  <div class="title-block">
    <h1>Income &amp; Expenditure Statement</h1>
    <div class="subtitle">${campaign ? this.esc(campaign.name) : 'All Campaigns'}${campaign?.year ? ` (${campaign.year})` : ''}</div>
  </div>

  <div class="period-row">
    <span>Period: ${fmtDate(statement.periodFrom)} — ${fmtDate(statement.periodTo)}</span>
    <span>Generated: ${fmtDate(statement.generatedAt)}</span>
  </div>

  <div class="columns">
    <div class="col income">
      <h2>Income (जमा)</h2>
      <table>
        <thead><tr><th>Category</th><th class="num">Receipts</th><th class="num">Amount</th></tr></thead>
        <tbody>${incomeRows || '<tr><td colspan="3" style="color:#999;text-align:center;padding:14px;">No income recorded</td></tr>'}</tbody>
        <tfoot><tr><td>Total Income</td><td></td><td class="num">${fmtAmount(statement.totalIncome)}</td></tr></tfoot>
      </table>
    </div>
    <div class="col expense">
      <h2>Expenditure (खर्च)</h2>
      <table>
        <thead><tr><th>Category</th><th class="num">Entries</th><th class="num">Amount</th></tr></thead>
        <tbody>${expenseRows || '<tr><td colspan="3" style="color:#999;text-align:center;padding:14px;">No expenses recorded</td></tr>'}</tbody>
        <tfoot><tr><td>Total Expenditure</td><td></td><td class="num">${fmtAmount(statement.totalExpense)}</td></tr></tfoot>
      </table>
    </div>
  </div>

  <div class="balance-box">
    <div class="balance-label">${isSurplus ? 'Net Surplus' : 'Net Deficit'}</div>
    <div class="balance-amount">${fmtAmount(Math.abs(statement.netBalance))}</div>
  </div>

  <div class="signatures">
    <div class="sig"><div class="sig-line"></div><div class="sig-label">Treasurer / कोषाध्यक्ष</div></div>
    <div class="sig"><div class="sig-line"></div><div class="sig-label">President / अध्यक्ष</div></div>
  </div>

  <div class="footer-note">Generated by ${BRAND_NAME} — figures reflect paid receipts and logged expenses as of the generation date.</div>
</div>
</body>
</html>`;
  }

  /**
   * Monoline corner ornament — mirrors ReceiptPreview.tsx's CornerMotif
   * exactly (same path data) so the on-screen preview and the printed
   * pavti never disagree. Used both large/white in the header and small/
   * tinted as the amount seal's four corner flourishes.
   */
  private cornerMotifSvg(motif: 'lotus' | 'diya' | 'chakra', color = 'white', size = 40): string {
    const attrs = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"`;
    if (motif === 'diya') {
      return `<svg ${attrs}>
        <path d="M3.5 14.5c0 3.6 3.8 6 8.5 6s8.5-2.4 8.5-6" />
        <path d="M3.5 14.5c0-1.6 3.8-2.7 8.5-2.7s8.5 1.1 8.5 2.7" />
        <path d="M12 11.5c-1.6-2.2-1.6-4.4 0-7 1.6 2.6 1.6 4.8 0 7Z" />
      </svg>`;
    }
    if (motif === 'lotus') {
      return `<svg ${attrs}>
        <path d="M12 20c-4.2-2.1-6.3-5.2-6.3-8.3 2.1 1 4.2 3.1 6.3 6.2 2.1-3.1 4.2-5.2 6.3-6.2 0 3.1-2.1 6.2-6.3 8.3Z" />
        <path d="M12 20c-2.6-3.1-3.1-6.8-1.6-10.4C11.6 12.9 12 16.4 12 20Z" />
        <path d="M12 20c2.6-3.1 3.1-6.8 1.6-10.4C12.4 12.9 12 16.4 12 20Z" />
      </svg>`;
    }
    const spokes = [0, 45, 90, 135, 180, 225, 270, 315]
      .map((deg) => {
        const r = (deg * Math.PI) / 180;
        return `<line x1="12" y1="12" x2="${(12 + 7.5 * Math.cos(r)).toFixed(2)}" y2="${(12 + 7.5 * Math.sin(r)).toFixed(2)}" />`;
      })
      .join('');
    return `<svg ${attrs}><circle cx="12" cy="12" r="7.5" />${spokes}</svg>`;
  }

  /**
   * Large, near-invisible mandala/rosette watermark stamped in the paper's
   * corner — mirrors ReceiptPreview.tsx's MotifRosette exactly (same path
   * data, same radii). Paisley petals for the warm themes, plain radiating
   * rings for the modern one — the ornamentation itself tracks each theme's
   * mood rather than decorating all three identically.
   */
  private motifRosetteSvg(motif: 'lotus' | 'diya' | 'chakra', color: string, size: number, opacity: number): string {
    const rings = `<circle cx="50" cy="50" r="46" fill="none" stroke="${color}" stroke-width="0.6" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="${color}" stroke-width="0.6" />`;
    const body = motif === 'chakra'
      ? `<circle cx="50" cy="50" r="14" fill="none" stroke="${color}" stroke-width="0.6" />` +
        [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
          const r = (deg * Math.PI) / 180;
          return `<line x1="${(50 + 14 * Math.cos(r)).toFixed(2)}" y1="${(50 + 14 * Math.sin(r)).toFixed(2)}" x2="${(50 + 46 * Math.cos(r)).toFixed(2)}" y2="${(50 + 46 * Math.sin(r)).toFixed(2)}" stroke="${color}" stroke-width="0.6" />`;
        }).join('')
      : [0, 45, 90, 135, 180, 225, 270, 315].map((deg) =>
          `<path d="M50,50 C58,38 58,16 50,4 C42,16 42,38 50,50 Z" fill="none" stroke="${color}" stroke-width="0.6" transform="rotate(${deg} 50 50)" />`,
        ).join('');
    return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="opacity:${opacity}">${rings}${body}</svg>`;
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

  /**
   * A PNG snapshot of the same pavti card the PDF renders — this is what
   * actually goes out over WhatsApp (image + caption), since wa.me links
   * can only pre-fill text, never attach a file. Screenshots just the
   * `.receipt` element (not the full page) for a tight, borderless crop,
   * at 2x scale so it stays crisp when viewed full-screen in a chat.
   */
  async generateReceiptImage(receipt: any): Promise<Buffer> {
    let page: puppeteer.Page | undefined;
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      await page.setViewport({ width: 540, height: 800, deviceScaleFactor: 2 });
      const html = this.buildReceiptHtml(receipt);
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: RENDER_TIMEOUT_MS });

      const card = await page.$('.receipt-frame');
      if (!card) throw new Error('Receipt card element not found for screenshot');
      const imgBuffer = await card.screenshot({ type: 'png' });

      return Buffer.from(imgBuffer);
    } catch (error) {
      this.logger.error('Receipt image generation error:', error);
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

    const l = RECEIPT_FIELD_LABELS[language] || RECEIPT_FIELD_LABELS.mr;

    const isInternal = receipt.collectionType === 'INTERNAL';
    const isUnpaid = receipt.status === 'PENDING';
    const motifSvg = this.cornerMotifSvg(theme.motif, theme.primaryColor);
    const cornerFlourishSvg = this.cornerMotifSvg(theme.motif, theme.primaryColor, 20);
    const rosetteSvg = this.motifRosetteSvg(theme.motif, theme.primaryColor, 150, 0.07);
    const paperGrainBg = 'radial-gradient(circle, rgba(0,0,0,0.05) 0.6px, transparent 0.6px) 0 0/7px 7px';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: ${fontFamily}; background: #fff; position: relative; }
  .receipt-frame {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    padding: 3px;
    background: ${RECEIPT_GOLD_ACCENT};
    border-radius: 18px;
    box-shadow: 0 10px 30px -8px rgba(0,0,0,0.18);
  }
  .receipt {
    background: ${paperGrainBg}, ${theme.paperBg};
    border: 2px solid ${theme.primaryColor};
    border-radius: 15px;
    overflow: hidden;
    position: relative;
  }
  .watermark-rosette { position: absolute; bottom: -12px; right: -12px; pointer-events: none; }
  /* Header shares the card's one paper background — no separate color band — for a calm, consistent canvas top to bottom. */
  .receipt-header {
    padding: 16px 20px;
    position: relative;
  }
  .header-motif { position: absolute; top: 10px; right: 10px; opacity: 0.2; }
  .campaign-ribbon {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    margin-top: 6px;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, ${RECEIPT_GOLD_ACCENT} 0%, #8f6a15 100%);
    padding: 3px 12px 3px 8px;
    clip-path: polygon(0 0, 100% 0, 91% 50%, 100% 100%, 0 100%);
    text-shadow: 0 1px 1px rgba(0,0,0,0.25);
  }
  .amount-corner { position: absolute; opacity: 0.25; }
  .amount-corner.tl { top: 4px; left: 4px; }
  .amount-corner.tr { top: 4px; right: 4px; transform: scaleX(-1); }
  .amount-corner.bl { bottom: 4px; left: 4px; transform: scaleY(-1); }
  .amount-corner.br { bottom: 4px; right: 4px; transform: scale(-1); }
  .header-tagline {
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid ${theme.primaryColor}22;
    color: ${theme.primaryColor};
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
    background: rgba(0,0,0,0.05);
    padding: 2px;
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 6px;
    flex-shrink: 0;
  }
  .header-content {
    flex-grow: 1;
    min-width: 0;
    text-align: left;
  }
  .org-name { font-family: 'Playfair Display', Georgia, serif; font-size: 19px; font-weight: 700; letter-spacing: 0.2px; line-height: 1.2; color: ${theme.primaryColor}; }
  .org-name-local { font-size: 13px; margin-top: 2px; line-height: 1.2; color: ${theme.primaryColor}cc; }
  .receipt-badge {
    background: ${theme.amountBg};
    border-bottom: 1px solid ${RECEIPT_GOLD_ACCENT}55;
    padding: 8px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .receipt-no { font-family: 'Playfair Display', Georgia, serif; font-size: 15px; font-weight: 700; color: ${theme.primaryColor}; }
  .receipt-date { font-size: 12px; font-weight: 600; color: ${theme.primaryColor}; }
  .label-eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: ${theme.primaryColor}99; font-weight: 600; }
  .receipt-body { padding: 16px 20px; }
  .field { margin-bottom: 10px; }
  .field-label { font-size: 10px; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .field-value { font-size: 14px; color: #1c1917; font-weight: 600; }
  .amount-box {
    background: ${theme.amountBg};
    border: 1.5px solid ${RECEIPT_GOLD_ACCENT};
    box-shadow: inset 0 0 0 1px ${theme.primaryColor}22;
    border-radius: 16px;
    padding: 14px 16px;
    margin: 12px 0;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .amount-number { font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 700; color: ${theme.primaryColor}; font-variant-numeric: tabular-nums; }
  .amount-words { font-size: 11px; color: #57534e; margin-top: 4px; font-style: italic; }
  .upi-line { font-size: 11px; color: #44403c; margin-top: 6px; padding-top: 6px; border-top: 1px dashed ${theme.primaryColor}33; }
  .divider { border: none; border-top: 1px solid rgba(0,0,0,0.07); margin: 10px 0; }
  .footer-note-bar {
    padding: 8px 20px;
    text-align: center;
    font-size: 11px;
    color: #44403c;
    font-weight: 600;
    background: ${theme.amountBg};
    border-top: 1px solid ${RECEIPT_GOLD_ACCENT}44;
  }
  .receipt-footer {
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1.5px solid ${theme.primaryColor};
  }
  .signature-area { text-align: center; }
  .signature-line { border-bottom: 1px solid rgba(0,0,0,0.3); width: 120px; margin-bottom: 4px; }
  .signature-label { font-size: 10px; color: #a8a29e; }
  .qr-area { text-align: center; }
  .qr-label { font-size: 9px; color: #a8a29e; margin-top: 4px; }
  .social-row { padding: 6px 20px; text-align: center; font-size: 10px; color: #78716c; border-top: 1px solid rgba(0,0,0,0.06); }
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
<div class="receipt-frame">
<div class="receipt">
  <div class="watermark-rosette">${rosetteSvg}</div>
  <div class="receipt-header">
    <div class="header-motif">${motifSvg}</div>
    ${settings.headerTagline ? `<div class="header-tagline">${this.esc(settings.headerTagline)}</div>` : ''}
    <div class="header-main">
      ${org?.logoUrl ? `<img src="${this.esc(org.logoUrl)}" class="header-logo" />` : ''}
      <div class="header-content">
        <div class="org-name">${this.esc(org?.name) || 'Organization'}</div>
        ${org?.nameMarathi ? `<div class="org-name-local">${this.esc(org.nameMarathi)}</div>` : ''}
        ${campaign?.name ? `<div class="campaign-ribbon">🎉 ${this.esc(campaign.name)}</div>` : ''}
      </div>
    </div>
  </div>

  <div class="receipt-badge">
    <div>
      <div class="label-eyebrow">${isInternal ? l.internalReceipt : (settings.receiptTitle || l.receipt)} ${l.no}</div>
      <div class="receipt-no">${this.esc(receipt.receiptNumber)}</div>
    </div>
    <div style="text-align:right;">
      <div class="label-eyebrow">Date</div>
      <div class="receipt-date">${formatReceiptDateTime(receipt.createdAt)}</div>
    </div>
  </div>

  <div class="receipt-body">
    <div class="field">
      <div class="field-label">${l.donor}</div>
      <div class="field-value">${settings.donorPrefix ? `<span style="font-weight:400;color:#78716c;margin-right:4px;">${this.esc(settings.donorPrefix)}</span>` : ''}${this.esc(receipt.donorName)}</div>
    </div>
    ${receipt.donorAddress ? `
    <div class="field">
      <div class="field-label">${l.address}</div>
      <div class="field-value">${this.esc(receipt.donorAddress)}</div>
    </div>` : ''}

    <div class="amount-box">
      <div class="amount-corner tl">${cornerFlourishSvg}</div>
      <div class="amount-corner tr">${cornerFlourishSvg}</div>
      <div class="amount-corner bl">${cornerFlourishSvg}</div>
      <div class="amount-corner br">${cornerFlourishSvg}</div>
      <div class="amount-number">₹${Number(receipt.amount).toLocaleString('en-IN')}</div>
      <div class="amount-words">${this.esc(receipt.amountInWords)}</div>
      ${org?.upiId ? `<div class="upi-line">📲 Pay via UPI: <strong>${this.esc(org.upiId)}</strong></div>` : ''}
    </div>

    <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;">
      <span class="badge">📂 ${this.esc(receipt.category)}</span>
      <span class="payment-mode">💳 ${this.esc(receipt.paymentMode)}</span>
      ${isUnpaid ? (
        `<span class="status-badge status-unpaid">${l.unpaid}</span>`
      ) : (
        `<span class="status-badge status-paid">${l.paid}</span>`
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
</div>
</body>
</html>`;
  }
}
