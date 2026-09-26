import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * BankTransfer — Collapsible, accessible bank details block for direct NEFT/RTGS/IMPS contributions
 */
export default function BankTransfer({ bankDetails, onCopy }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  if (!bankDetails) return null;

  const {
    accountName,
    accountNumber,
    bankName,
    ifsc,
    branch,
    accountType,
  } = bankDetails;

  const handleCopy = async (field, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      if (onCopy) onCopy(t('accountDetailsCopied'));
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="bank-transfer">
      <button
        type="button"
        className="bank-transfer__toggle"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-controls="bank-details-content"
      >
        <div className="bank-transfer__toggle-left">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <div className="bank-transfer__toggle-text">
            <span className="bank-transfer__toggle-title">{t('bankTransfer')}</span>
            <span className="bank-transfer__toggle-sub">{t('bankTransferSubtitle')}</span>
          </div>
        </div>

        <span className="bank-transfer__toggle-icon" aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </button>

      {isOpen && (
        <div id="bank-details-content" className="bank-transfer__content">
          <dl className="bank-transfer__list">
            {accountName && (
              <div className="bank-transfer__item">
                <dt className="bank-transfer__dt">{t('accountName')}</dt>
                <dd className="bank-transfer__dd">
                  <span>{accountName}</span>
                </dd>
              </div>
            )}

            {accountNumber && (
              <div className="bank-transfer__item">
                <dt className="bank-transfer__dt">{t('accountNumber')}</dt>
                <dd className="bank-transfer__dd bank-transfer__dd--copy">
                  <code>{accountNumber}</code>
                  <button
                    type="button"
                    className="bank-transfer__btn-copy"
                    onClick={() => handleCopy('account', accountNumber)}
                    aria-label={`Copy account number ${accountNumber}`}
                    title="Copy"
                  >
                    {copiedField === 'account' ? '✓' : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </dd>
              </div>
            )}

            {bankName && (
              <div className="bank-transfer__item">
                <dt className="bank-transfer__dt">{t('bankName')}</dt>
                <dd className="bank-transfer__dd">
                  <span>{bankName}</span>
                </dd>
              </div>
            )}

            {ifsc && (
              <div className="bank-transfer__item">
                <dt className="bank-transfer__dt">{t('ifscCode')}</dt>
                <dd className="bank-transfer__dd bank-transfer__dd--copy">
                  <code>{ifsc}</code>
                  <button
                    type="button"
                    className="bank-transfer__btn-copy"
                    onClick={() => handleCopy('ifsc', ifsc)}
                    aria-label={`Copy IFSC code ${ifsc}`}
                    title="Copy"
                  >
                    {copiedField === 'ifsc' ? '✓' : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </dd>
              </div>
            )}

            {branch && (
              <div className="bank-transfer__item">
                <dt className="bank-transfer__dt">{t('branchName')}</dt>
                <dd className="bank-transfer__dd">
                  <span>{branch}</span>
                </dd>
              </div>
            )}

            {accountType && (
              <div className="bank-transfer__item">
                <dt className="bank-transfer__dt">Account Type</dt>
                <dd className="bank-transfer__dd">
                  <span>{accountType}</span>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
