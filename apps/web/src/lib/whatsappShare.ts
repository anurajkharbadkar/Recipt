import { formatShareMessage, formatSocialLinksText, resolveReceiptSettings } from '@pavti/shared';
import { receiptsApi } from './api';
import { buildUpiPaymentLink } from './upi';
import toast from 'react-hot-toast';

export interface WhatsAppShareParams {
  donorPhone: string;
  donorName: string;
  amount: number;
  receiptNumber: string;
  receiptId: string;
  category?: string;
  createdAt?: string | Date;
  /** A PENDING receipt gets the UPI payment link appended to the message — see buildCaption. */
  status?: string;
  organization?: { name?: string; receiptTemplateSettings?: unknown; socialLinks?: unknown; upiId?: string } | null;
  language?: 'en' | 'hi' | 'mr';
}

function buildCaption(params: WhatsAppShareParams): { message: string; waUrl: string } {
  const settings = resolveReceiptSettings(params.organization?.receiptTemplateSettings, params.language);
  const receiptUrl = `${window.location.origin}/receipt/${params.receiptId}`;
  let message = formatShareMessage(
    settings.shareMessage,
    {
      donorName: params.donorName,
      amount: params.amount,
      receiptNumber: params.receiptNumber,
      organizationName: params.organization?.name || 'संस्था',
      receiptUrl,
      date: params.createdAt ? new Date(params.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
      category: params.category,
      socialLinksText: formatSocialLinksText(params.organization?.socialLinks),
    },
    settings.language,
  );

  // Appended after the templated message rather than woven into it as a
  // placeholder — a shareMessage template is free text an org can fully
  // customize (see DEFAULT_SHARE_MESSAGE_TEMPLATES), so this is the only
  // way to guarantee the payment link actually shows up regardless of
  // which template/preset the org is using. Applies to any still-unpaid
  // receipt with a UPI ID on file, not just ones originally logged as
  // UPI-mode — the point is giving a remote donor a way to pay whatever's
  // still owed (2026-08-21 payments architecture decision).
  if (params.status === 'PENDING' && params.organization?.upiId) {
    const upiLink = buildUpiPaymentLink({
      upiId: params.organization.upiId,
      payeeName: params.organization?.name || 'Mandal',
      amount: params.amount,
      note: params.receiptNumber,
    });
    const payLine = settings.language === 'mr'
      ? `\n\n💳 पैसे भरण्यासाठी: ${upiLink}`
      : settings.language === 'hi'
      ? `\n\n💳 भुगतान करने के लिए: ${upiLink}`
      : `\n\n💳 Pay now: ${upiLink}`;
    message += payLine;
  }

  const cleanPhone = params.donorPhone ? params.donorPhone.replace(/\D/g, '') : '';
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const waUrl = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  return { message, waUrl };
}

/** Plain wa.me link only — no image. Kept for contexts that don't have (or don't need) the pavti image, e.g. a text-only reminder. */
export function buildWhatsAppShareUrl(params: WhatsAppShareParams): string {
  return buildCaption(params).waUrl;
}

/**
 * Web Share API's `navigator.share()` only works while the browser still
 * considers the click a "live" user gesture — that window is short (a few
 * seconds at most) and any `await` before calling share() eats into it. The
 * pavti image is server-rendered (Puppeteer), which can easily take a couple
 * of seconds — long enough, especially on a cold container or slow mobile
 * network, to lose that window entirely. When that happens `share()` throws
 * and the code falls back to "download the image + open a text-only WhatsApp
 * chat", which looks exactly like "the image never got attached".
 *
 * The fix is to fetch the image well *before* the click, not during it.
 * Call this as soon as a receipt is on screen (page load, or right after
 * creating one) — by the time the user actually taps Share, the promise is
 * usually already resolved, so awaiting it inside the click handler costs a
 * microtask, not a network round trip, and doesn't consume the gesture.
 * Safe to call more than once for the same receipt — later calls reuse the
 * in-flight/resolved request instead of re-fetching.
 */
const imagePrefetchCache = new Map<string, Promise<Blob>>();

export function prefetchReceiptImage(receiptId: string): void {
  if (imagePrefetchCache.has(receiptId)) return;
  imagePrefetchCache.set(receiptId, receiptsApi.getImage(receiptId));
}

async function getReceiptImageBlob(receiptId: string): Promise<Blob> {
  if (!imagePrefetchCache.has(receiptId)) {
    imagePrefetchCache.set(receiptId, receiptsApi.getImage(receiptId));
  }
  try {
    return await imagePrefetchCache.get(receiptId)!;
  } catch (err) {
    // Don't cache a failure — let a later share attempt retry the fetch.
    imagePrefetchCache.delete(receiptId);
    throw err;
  }
}

/**
 * Direct WhatsApp opening: Launches WhatsApp directly targeting the donor's
 * phone number with the pre-filled receipt message.
 * Does NOT open the OS-level multi-app share menu.
 */
export async function shareReceiptViaWhatsApp(params: WhatsAppShareParams): Promise<void> {
  const { waUrl } = buildCaption(params);
  if (typeof window !== 'undefined') {
    window.open(waUrl, '_blank');
  }
}

/**
 * Generic OS Sharing (Web Share API): Opens the native system share sheet
 * with all installed apps (Telegram, Mail, Messages, Bluetooth, etc.) and
 * attaches the pavti image when available.
 */
export async function shareReceiptGeneric(params: WhatsAppShareParams): Promise<void> {
  const { message, waUrl } = buildCaption(params);

  let imageFile: File | null = null;
  try {
    const blob = await getReceiptImageBlob(params.receiptId);
    imageFile = new File([blob], `pavti-${params.receiptNumber}.png`, { type: 'image/png' });
  } catch (err) {
    console.error('Pavti image fetch failed — sharing text + link only:', err);
    imageFile = null;
  }

  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { canShare?: (data?: ShareData) => boolean }) : null;
  const canShareFile = !!imageFile && !!nav?.share && (nav.canShare ? nav.canShare({ files: [imageFile] }) : true);

  if (canShareFile && imageFile) {
    try {
      await nav!.share({ files: [imageFile], text: message, title: `Pavti #${params.receiptNumber}` });
      return;
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === 'AbortError') return;
      console.error('navigator.share() failed, falling back to manual attach:', err);
    }
  } else if (nav?.share) {
    try {
      await nav.share({ text: message, title: `Pavti #${params.receiptNumber}` });
      return;
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === 'AbortError') return;
    }
  }

  if (imageFile) {
    const url = URL.createObjectURL(imageFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = imageFile.name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Pavti image downloaded — choose an app to share.', { duration: 5000 });
  } else {
    toast.error('Could not generate the pavti image — opening web share.', { duration: 5000 });
  }
  window.open(waUrl, '_blank');
}
