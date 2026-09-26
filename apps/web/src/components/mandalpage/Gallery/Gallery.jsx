import { useState, useCallback, useRef, useMemo } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useInView } from '@/hooks/useInView';
import { toDevanagariNumerals } from '@/utils/dateUtils';
import Lightbox from './Lightbox';
import './Gallery.css';

export default function Gallery() {
  const { gallery, sponsors } = useMandal();
  const { t, getLocalized, language } = useLanguage();
  const [ref, isVisible] = useInView();
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [activeCategory, setActiveCategory] = useState('all');
  const triggerItemRef = useRef(null);

  // Category translation helper
  const getCategoryLabel = useCallback((category) => {
    if (!category) return null;
    const catLower = String(category).toLowerCase();
    const map = {
      all: t('galleryCategoryAll'),
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
  }, [t]);

  // Extract only categories present in the gallery
  const availableCategories = useMemo(() => {
    if (!gallery || !gallery.length) return [];
    const categoriesSet = new Set();
    gallery.forEach(img => {
      if (img.category) categoriesSet.add(img.category.toLowerCase());
    });
    return Array.from(categoriesSet);
  }, [gallery]);

  // Filter gallery items
  const filteredGallery = useMemo(() => {
    if (!gallery || !gallery.length) return [];
    if (activeCategory === 'all') return gallery;
    return gallery.filter(img => img.category && img.category.toLowerCase() === activeCategory);
  }, [gallery, activeCategory]);

  const openLightbox = useCallback((index, e) => {
    triggerItemRef.current = e?.currentTarget || null;
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(-1);
  }, []);

  // Empty state: Gracefully hide section
  if (!gallery || gallery.length === 0) return null;

  // Identify primary featured image (if any)
  const featuredItem = filteredGallery.find(img => img.featured) || (filteredGallery.length >= 3 ? filteredGallery[0] : null);
  const supportingItems = featuredItem
    ? filteredGallery.filter(img => img.id !== featuredItem.id)
    : filteredGallery;

  // Format year for MR/HI vs EN
  const formatYear = (yr) => {
    if (!yr) return null;
    return (language === 'mr' || language === 'hi') ? toDevanagariNumerals(yr) : String(yr);
  };

  // Helper to find sponsor
  const getSponsorName = (sponsorId) => {
    if (!sponsorId || !sponsors) return null;
    const sp = sponsors.find(s => s.id === sponsorId);
    return sp ? getLocalized(sp.name) : null;
  };

  return (
    <section id="gallery" className="gallery section" aria-label={t('gallery')}>
      <div ref={ref} className={`container reveal ${isVisible ? 'reveal--visible' : ''}`}>
        
        {/* Section Header */}
        <div className="gallery__header">
          <p className="eyebrow gallery__eyebrow">{t('mandalMemories')}</p>
          <h2 className="heading-display heading-display--lg gallery__title">
            {t('momentsOfCelebration')}
          </h2>
          <p className="gallery__subtitle">
            {t('gallerySubtitle')}
          </p>
        </div>

        {/* Category Filters: Only rendered if multiple categories exist */}
        {availableCategories.length > 1 && (
          <nav className="gallery__filter-nav" aria-label="Gallery category filters">
            <div className="gallery__filter-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'all'}
                className={`gallery__filter-tab ${activeCategory === 'all' ? 'gallery__filter-tab--active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                {t('galleryCategoryAll')}
              </button>
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat}
                  className={`gallery__filter-tab ${activeCategory === cat ? 'gallery__filter-tab--active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* Editorial Layout */}
        <div className="gallery__editorial-layout">
          
          {/* Primary Featured Image (if available) */}
          {featuredItem && (
            <article className="gallery__featured-wrapper">
              <button
                type="button"
                className="gallery__item gallery__item--featured"
                onClick={(e) => {
                  const idx = filteredGallery.findIndex(img => img.id === featuredItem.id);
                  openLightbox(idx, e);
                }}
                aria-label={`${t('viewImage')}: ${getLocalized(featuredItem.caption) || getLocalized(featuredItem.alt)}`}
              >
                <div className="gallery__img-container">
                  <img
                    className="gallery__img"
                    src={featuredItem.src || featuredItem.image}
                    alt={getLocalized(featuredItem.alt) || getLocalized(featuredItem.altText) || ''}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.add('gallery__img-fallback--visible');
                    }}
                  />
                  <div className="gallery__img-fallback" aria-hidden="true">
                    <span>{getLocalized(featuredItem.alt) || t('mandalMemories')}</span>
                  </div>
                </div>

                {/* Badges on Featured Item */}
                <div className="gallery__badges-top">
                  <span className="gallery__featured-pill">
                    ★ {t('featuredBadge')}
                  </span>
                  {featuredItem.category && (
                    <span className="gallery__category-pill">
                      {getCategoryLabel(featuredItem.category)}
                    </span>
                  )}
                  {featuredItem.year && (
                    <span className="gallery__year-pill">
                      {formatYear(featuredItem.year)}
                    </span>
                  )}
                </div>

                {/* Overlay Caption & Sponsor */}
                <div className="gallery__item-overlay">
                  {featuredItem.caption && (
                    <p className="gallery__caption-primary">
                      {getLocalized(featuredItem.caption)}
                    </p>
                  )}
                  {featuredItem.sponsorId && getSponsorName(featuredItem.sponsorId) && (
                    <span className="gallery__sponsor-badge">
                      {t('presentedWithSupportOf')} {getSponsorName(featuredItem.sponsorId)}
                    </span>
                  )}
                </div>
              </button>
            </article>
          )}

          {/* Supporting Images Grid */}
          <div className="gallery__supporting-grid">
            {supportingItems.map((image) => {
              const caption = image.caption ? getLocalized(image.caption) : null;
              const alt = getLocalized(image.alt) || getLocalized(image.altText) || '';
              const sponsorName = getSponsorName(image.sponsorId);
              const idxInFiltered = filteredGallery.findIndex(img => img.id === image.id);

              return (
                <button
                  key={image.id}
                  className="gallery__item gallery__item--supporting"
                  onClick={(e) => openLightbox(idxInFiltered, e)}
                  aria-label={`${t('viewImage')}: ${caption || alt}`}
                  type="button"
                >
                  <div className="gallery__img-container">
                    <img
                      className="gallery__img"
                      src={image.src || image.image}
                      alt={alt}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.add('gallery__img-fallback--visible');
                      }}
                    />
                    <div className="gallery__img-fallback" aria-hidden="true">
                      <span>{alt || t('mandalMemories')}</span>
                    </div>
                  </div>

                  {/* Corner Badges */}
                  <div className="gallery__badges-top">
                    {image.category && (
                      <span className="gallery__category-pill">
                        {getCategoryLabel(image.category)}
                      </span>
                    )}
                    {image.year && (
                      <span className="gallery__year-pill">
                        {formatYear(image.year)}
                      </span>
                    )}
                  </div>

                  {/* Caption & Sponsor Overlay */}
                  <div className="gallery__item-overlay">
                    {caption && (
                      <span className="gallery__caption">{caption}</span>
                    )}
                    {sponsorName && (
                      <span className="gallery__sponsor-badge">
                        {t('presentedWithSupportOf')} {sponsorName}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

        </div>

      </div>

      {/* Accessible Lightbox Modal */}
      <Lightbox
        images={filteredGallery}
        currentIndex={lightboxIndex}
        onClose={closeLightbox}
        onNavigate={setLightboxIndex}
        triggerRef={triggerItemRef}
      />
    </section>
  );
}
