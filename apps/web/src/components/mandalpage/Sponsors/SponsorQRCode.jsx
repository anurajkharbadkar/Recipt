import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * SponsorQRCode — Generates accessible vector QR code encoding the exact sponsor profile URL
 */
export default function SponsorQRCode({ url, sponsorName, onShare, onCopy }) {
  const { t } = useLanguage();
  const [qrSvg, setQrSvg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!url) return;
    QRCode.toString(url, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#241F1D',
        light: '#FFFFFF',
      },
      width: 220,
    })
      .then(svg => setQrSvg(svg))
      .catch(err => console.error('Failed to generate QR code:', err));
  }, [url]);

  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore
    }
  };

  return (
    <section className="sponsor-qr" aria-labelledby="qr-section-heading">
      <div className="sponsor-qr__header">
        <h3 id="qr-section-heading" className="sponsor-qr__title">
          {t('scanQRTitle')}
        </h3>
        <p className="sponsor-qr__subtitle">
          {t('scanQRSubtitle')}
        </p>
      </div>

      <div className="sponsor-qr__frame">
        <div
          className="sponsor-qr__code"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
          role="img"
          aria-label={`${t('scanToView')} ${sponsorName}`}
        />
        <p className="sponsor-qr__caption">
          {t('scanToView')}
        </p>
      </div>

      <div className="sponsor-qr__actions">
        <button
          type="button"
          className="sponsor-qr__btn sponsor-qr__btn--copy"
          onClick={handleCopy}
          aria-label={t('copyLink')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>{copied ? t('linkCopied') : t('copyLink')}</span>
        </button>

        {onShare && (
          <button
            type="button"
            className="sponsor-qr__btn sponsor-qr__btn--share"
            onClick={onShare}
            aria-label={t('shareSponsor')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>{t('shareSponsor')}</span>
          </button>
        )}
      </div>

      {copied && (
        <div className="sponsor-qr__toast" role="status" aria-live="polite">
          ✓ {t('linkCopied')}
        </div>
      )}
    </section>
  );
}
