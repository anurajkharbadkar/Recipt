import { useState, useCallback } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useInView } from '@/hooks/useInView';

import SuggestedAmounts from './SuggestedAmounts';
import UpiSupport from './UpiSupport';
import DonationQRCode from './DonationQRCode';
import BankTransfer from './BankTransfer';
import SupportContact from './SupportContact';
import './SupportMandal.css';

/**
 * SupportMandal — Public, respectful, and culturally appropriate support / donation experience
 */
export default function SupportMandal() {
  const mandal = useMandal();
  const { donation, identity } = mandal;
  const { t, getLocalized } = useLanguage();
  const [ref, isVisible] = useInView();

  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Empty state: if donation is disabled or missing, hide section completely
  if (!donation || donation.enabled === false) {
    return null;
  }

  const mandalName = getLocalized(identity.name);
  const title = donation.title ? getLocalized(donation.title) : t('supportTheMandal');
  const description = donation.description ? getLocalized(donation.description) : t('supportSubtitle');
  const transparencyNote = donation.transparencyNote ? getLocalized(donation.transparencyNote) : null;

  const effectiveAmount = customAmount ? parseInt(customAmount, 10) : selectedAmount;

  const handleSelectAmount = (amt) => {
    setCustomAmount('');
    setSelectedAmount(prev => (prev === amt ? null : amt));
  };

  const handleCustomAmountChange = (val) => {
    setCustomAmount(val);
    setSelectedAmount(null);
  };

  // Share Support Page Action
  const handleShareSupport = async () => {
    const url = `${window.location.origin}/m/${identity.slug}#support`;
    const shareTitle = `${t('supportTheMandal')} • ${mandalName}`;
    const shareText = `${mandalName} — ${title}.\n${url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Share dismissed');
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast(t('linkCopied'));
    } catch {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section id="support" className="support-mandal section" aria-labelledby="support-section-heading">
      <div ref={ref} className={`container reveal ${isVisible ? 'reveal--visible' : ''}`}>
        
        {/* Section Header */}
        <header className="support-mandal__header">
          <p className="eyebrow support-mandal__eyebrow">
            {t('support')}
          </p>
          <h2 id="support-section-heading" className="heading-display heading-display--lg support-mandal__title">
            {title}
          </h2>
          <p className="support-mandal__subtitle">
            {description}
          </p>
        </header>

        {/* Trust & Transparency Note Bar */}
        <aside className="support-mandal__trust-bar" aria-label={t('transparencyAndTrust')}>
          <div className="support-mandal__trust-left">
            <span className="support-mandal__trust-icon" aria-hidden="true">
              ✦
            </span>
            <p className="support-mandal__trust-text">
              <strong>{mandalName}</strong>
              {identity.established && ` (${t('establishedIn')} ${identity.established})`}
              {' — '}
              {transparencyNote || t('everyContributionMatters')}
            </p>
          </div>

          <button
            type="button"
            className="support-mandal__btn-share-page"
            onClick={handleShareSupport}
            aria-label={t('shareSupportPage')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>{t('shareSupportPage')}</span>
          </button>
        </aside>

        {/* 2-Column Responsive Layout */}
        <div className="support-mandal__grid">
          
          {/* Left Column: Amounts, UPI, Payment Link, Bank Details, Contact */}
          <div className="support-mandal__col">
            <div className="support-mandal__card">
              
              {/* Optional Quick Suggested Amounts */}
              {donation.suggestedAmounts && (
                <SuggestedAmounts
                  amounts={donation.suggestedAmounts}
                  selectedAmount={selectedAmount}
                  onSelectAmount={handleSelectAmount}
                  customAmount={customAmount}
                  onCustomAmountChange={handleCustomAmountChange}
                />
              )}

              {/* UPI Support (Deep Link & Copy) */}
              {donation.upiId && (
                <UpiSupport
                  upiId={donation.upiId}
                  upiName={donation.upiName || mandalName}
                  amount={effectiveAmount}
                  onCopy={showToast}
                />
              )}

              {/* External Payment URL if configured */}
              {donation.paymentUrl && (
                <div style={{ marginTop: 'var(--space-xs)' }}>
                  <a
                    href={donation.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--outline"
                    style={{ width: '100%', minHeight: '48px', justifyContent: 'center' }}
                  >
                    <span>{t('donateOnline')}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Optional Collapsible Bank Details */}
              {donation.bankDetails && (
                <BankTransfer
                  bankDetails={donation.bankDetails}
                  onCopy={showToast}
                />
              )}

              {/* Help Desk Contact */}
              {donation.contact && (
                <SupportContact
                  contact={donation.contact}
                />
              )}

            </div>
          </div>

          {/* Right Column: QR Code */}
          <div className="support-mandal__col">
            <DonationQRCode
              upiId={donation.upiId}
              upiName={donation.upiName || mandalName}
              amount={effectiveAmount}
              qrImage={donation.qrImage}
            />
          </div>

        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="support-mandal__toast" role="status" aria-live="polite">
            <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </section>
  );
}
