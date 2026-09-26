import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * UpiSupport — UPI payment block with direct deep-link and clipboard copy
 */
export default function UpiSupport({ upiId, upiName, amount, onCopy }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!upiId) return null;

  // Construct standard mobile UPI intent
  const upiIntentUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName || 'Mandal Trust')}&cu=INR${amount ? `&am=${amount}` : ''}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      if (onCopy) onCopy(t('upiIdCopied'));
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="upi-support">
      {/* UPI ID Box */}
      <div className="upi-support__box">
        <div className="upi-support__info">
          <span className="upi-support__label">{t('upiIdLabel')}</span>
          <code className="upi-support__id">{upiId}</code>
          {upiName && <span className="upi-support__name">{upiName}</span>}
        </div>

        <button
          type="button"
          className="upi-support__btn-copy"
          onClick={handleCopy}
          aria-label={`${t('copyUpiId')}: ${upiId}`}
          title={t('copyUpiId')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>{copied ? t('upiIdCopied') : t('copyUpiId')}</span>
        </button>
      </div>

      {/* Primary Pay Action */}
      <div className="upi-support__action-wrap">
        <a
          href={upiIntentUrl}
          className="upi-support__btn-pay"
          aria-label={`${t('payViaUpi')}${amount ? ` ₹${amount}` : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <span>
            {t('payViaUpi')} {amount ? `(₹${amount})` : ''}
          </span>
          <span className="upi-support__arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
