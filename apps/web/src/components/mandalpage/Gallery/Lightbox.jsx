import { useEffect, useCallback, useRef, useState } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useLanguage } from '@/hooks/useLanguage';
import { useMandal } from '@/context/MandalContext';
import { toDevanagariNumerals } from '@/utils/dateUtils';

export default function Lightbox({ images, currentIndex, onClose, onNavigate, triggerRef }) {
  const { lockScroll, unlockScroll } = useScrollLock();
  const { sponsors, identity } = useMandal();
  const { t, getLocalized, language } = useLanguage();
  const closeBtnRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isOpen = currentIndex >= 0 && Boolean(images && images[currentIndex]);
  const currentImage = isOpen ? images[currentIndex] : null;

  // Reset error state on image navigation
  useEffect(() => {
    setImageError(false);
  }, [currentIndex]);

  // Lock scroll & focus management
  useEffect(() => {
    if (isOpen) {
      lockScroll();
      // Small timeout to ensure DOM mounted before focus
      const timer = setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, lockScroll]);

  // Return focus on close
  const handleClose = useCallback(() => {
    unlockScroll();
    onClose();
    if (triggerRef?.current) {
      triggerRef.current.focus();
    }
  }, [unlockScroll, onClose, triggerRef]);

  // Keyboard navigation (Escape, ArrowLeft, ArrowRight)
  const handleKeyDown = useCallback((e) => {
    if (!isOpen || !images.length) return;
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onNavigate((currentIndex - 1 + images.length) % images.length);
        break;
      case 'ArrowRight':
        e.preventDefault();
        onNavigate((currentIndex + 1) % images.length);
        break;
    }
  }, [isOpen, images.length, currentIndex, handleClose, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !currentImage) return null;

  const caption = currentImage.caption ? getLocalized(currentImage.caption) : null;
  const altText = currentImage.alt ? getLocalized(currentImage.alt) : (currentImage.altText ? getLocalized(currentImage.altText) : '');
  const mandalName = getLocalized(identity.name);

  // Category translation
  const getCategoryLabel = (category) => {
    if (!category) return null;
    const catLower = String(category).toLowerCase();
    const map = {
      darshan: t('galleryCategoryDarshan'),
      aarti: t('galleryCategoryAarti'),
      garba: t('galleryCategoryGarba'),
      cultural: t('galleryCategoryCultural'),
      community: t('galleryCategoryCommunity'),
      decoration: t('galleryCategoryDecoration'),
      bhandara: t('galleryCategoryBhandara'),
      visarjan: t('galleryCategoryVisarjan'),
      'previous-years': t('galleryCategoryPreviousYears'),
      previousyears: t('galleryCategoryPreviousYears'),
    };
    return map[catLower] || category;
  };

  const categoryLabel = getCategoryLabel(currentImage.category);

  // Year formatting
  const formattedYear = currentImage.year
    ? ((language === 'mr' || language === 'hi') ? toDevanagariNumerals(currentImage.year) : String(currentImage.year))
    : null;

  // Counter formatting
  const counterText = (language === 'mr' || language === 'hi')
    ? `${toDevanagariNumerals(currentIndex + 1)} / ${toDevanagariNumerals(images.length)}`
    : `${currentIndex + 1} / ${images.length}`;

  // Sponsor attribution
  const sponsor = currentImage.sponsorId && sponsors
    ? sponsors.find(s => s.id === currentImage.sponsorId)
    : null;
  const sponsorName = sponsor ? getLocalized(sponsor.name) : null;

  // Share photo
  const handleShare = async () => {
    const shareTitle = `${mandalName} — ${caption || altText || t('mandalMemories')}`;
    const shareText = `${shareTitle}\n${window.location.href}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: caption || altText || mandalName,
          url: window.location.href,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Share skipped');
        }
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: WhatsApp share
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="lightbox lightbox--open"
      role="dialog"
      aria-modal="true"
      aria-label={caption || altText || t('gallery')}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Top Bar: Counter & Actions */}
      <div className="lightbox__topbar">
        <div className="lightbox__counter-wrap">
          <span className="lightbox__counter" aria-live="polite">
            {counterText}
          </span>
          {categoryLabel && (
            <span className="lightbox__category-badge">
              {categoryLabel}
            </span>
          )}
          {formattedYear && (
            <span className="lightbox__year-badge">
              {formattedYear}
            </span>
          )}
        </div>

        <div className="lightbox__top-actions">
          {/* Share Button */}
          <button
            className="lightbox__action-btn"
            onClick={handleShare}
            aria-label={t('sharePhoto')}
            title={t('sharePhoto')}
            type="button"
          >
            {copied ? (
              <span className="lightbox__copied-toast">{t('linkCopied')}</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            )}
          </button>

          {/* Close Button */}
          <button
            ref={closeBtnRef}
            className="lightbox__close"
            onClick={handleClose}
            aria-label={t('closeLightbox')}
            title={t('closeLightbox')}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation: Previous Button */}
      {images.length > 1 && (
        <button
          className="lightbox__nav lightbox__nav--prev"
          onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
          aria-label={t('previousPhoto')}
          title={t('previousPhoto')}
          type="button"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Main Image Frame */}
      <div className="lightbox__image-wrapper">
        {imageError ? (
          <div className="lightbox__fallback">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p>{altText || t('mandalMemories')}</p>
          </div>
        ) : (
          <img
            className="lightbox__image"
            src={currentImage.src || currentImage.image}
            alt={altText}
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* Navigation: Next Button */}
      {images.length > 1 && (
        <button
          className="lightbox__nav lightbox__nav--next"
          onClick={() => onNavigate((currentIndex + 1) % images.length)}
          aria-label={t('nextPhoto')}
          title={t('nextPhoto')}
          type="button"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Footer: Caption & Sponsor Attribution */}
      <div className="lightbox__footer">
        {caption && (
          <p className="lightbox__caption-text">{caption}</p>
        )}

        {sponsorName && (
          <div className="lightbox__sponsor-attribution">
            <span className="lightbox__sponsor-label">
              {t('presentedWithSupportOf')}
            </span>
            <span className="lightbox__sponsor-name">
              {sponsorName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
