import { useState, useCallback } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useInView } from '@/hooks/useInView';
import './ShareMandal.css';

export default function ShareMandal() {
  const { identity } = useMandal();
  const { t, getLocalized } = useLanguage();
  const [ref, isVisible] = useInView();
  const [copied, setCopied] = useState(false);

  const mandalName = getLocalized(identity.name);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `${mandalName} — ${getLocalized(identity.tagline)}.`;

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: mandalName,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled share — that's fine
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyLink();
    }
  }, [mandalName, shareText, shareUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // Silent fail
      }
      document.body.removeChild(textArea);
    }
  }, [shareUrl]);

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;

  return (
    <section id="share" className="share section" aria-label={t('share')}>
      <div ref={ref} className={`container reveal ${isVisible ? 'reveal--visible' : ''}`}>
        <div className="share__inner">
          <p className="eyebrow share__eyebrow">{t('share')}</p>

          <h2 className="share__title">
            {mandalName}
          </h2>

          <p className="share__subtitle">
            {t('shareSubtitle')}
          </p>

          <div className="share__actions">
            <button
              className="share__btn-primary"
              onClick={handleShare}
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              {t('shareTitle')}
            </button>

            <button
              className="share__btn-secondary"
              onClick={handleCopyLink}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copied ? t('linkCopied') : t('copyLink')}
            </button>
          </div>

          <p className={`share__copied ${copied ? 'share__copied--visible' : ''}`} aria-live="polite">
            ✓ {t('linkCopied')}
          </p>

          <div className="share__whatsapp">
            <a
              href={whatsappUrl}
              className="share__whatsapp-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('shareOnWhatsApp')} →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
