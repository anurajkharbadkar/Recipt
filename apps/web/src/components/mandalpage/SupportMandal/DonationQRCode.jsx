import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * DonationQRCode — Generates or displays high-contrast QR code for voluntary UPI contributions
 */
export default function DonationQRCode({ upiId, upiName, amount, qrImage }) {
  const { t } = useLanguage();
  const [qrSvg, setQrSvg] = useState('');

  // Construct standard UPI URI
  const upiUri = upiId
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName || 'Mandal Trust')}&cu=INR${amount ? `&am=${amount}` : ''}`
    : '';

  useEffect(() => {
    if (qrImage || !upiUri) return;
    QRCode.toString(upiUri, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#241F1D',
        light: '#FFFFFF',
      },
      width: 220,
    })
      .then(svg => setQrSvg(svg))
      .catch(err => console.error('Failed to generate donation QR code:', err));
  }, [upiUri, qrImage]);

  return (
    <div className="donation-qr">
      <div className="donation-qr__frame">
        {qrImage ? (
          <img
            src={qrImage}
            alt={t('scanToContribute')}
            className="donation-qr__image"
            loading="lazy"
          />
        ) : qrSvg ? (
          <div
            className="donation-qr__svg"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
            role="img"
            aria-label={`${t('scanToContribute')} - ${upiId}`}
          />
        ) : (
          <div className="donation-qr__placeholder">
            <span>QR</span>
          </div>
        )}

        {amount && (
          <div className="donation-qr__amount-badge">
            ₹{amount}
          </div>
        )}
      </div>

      <p className="donation-qr__caption">
        <strong>{t('scanToContribute')}</strong>
      </p>
      <p className="donation-qr__hint">
        {t('scanUpiAppHint')}
      </p>
    </div>
  );
}
