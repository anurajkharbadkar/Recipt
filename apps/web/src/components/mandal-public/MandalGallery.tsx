'use client';

import { useState, useMemo } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, Share2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Language, mandalTranslations } from './MandalI18n';

interface GalleryItem {
  id: string;
  url: string;
  caption?: string;
  category?: string;
  year?: number;
  featured?: boolean;
  sponsorName?: string;
}

interface MandalGalleryProps {
  items?: GalleryItem[];
  lang: Language;
}

export default function MandalGallery({ items = [], lang = 'mr' }: MandalGalleryProps) {
  const t = (key: string) => mandalTranslations[lang]?.[key] || mandalTranslations.en[key] || key;
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  // Categories list
  const categoryLabels: Record<string, string> = {
    all: t('galleryCategoryAll'),
    darshan: t('galleryCategoryDarshan'),
    aarti: t('galleryCategoryAarti'),
    garba: t('galleryCategoryGarba'),
    cultural: t('galleryCategoryCultural'),
    community: t('galleryCategoryCommunity'),
    decoration: t('galleryCategoryDecoration'),
    bhandara: t('galleryCategoryBhandara'),
    visarjan: t('galleryCategoryVisarjan'),
    previous: t('galleryCategoryPreviousYears'),
  };

  // Demo fallback photos if no custom uploaded photos exist
  const galleryImages: GalleryItem[] = useMemo(() => {
    if (items && items.length > 0) return items;

    // High quality demo devotional photo gallery
    return [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=1200&q=80',
        caption: 'भव्य आई जगदंबेची मूर्ती व महापूजा (Maa Durga Idol & Pooja)',
        category: 'darshan',
        featured: true,
        year: 2026,
      },
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1599587425170-4f51954df664?auto=format&fit=crop&w=800&q=80',
        caption: 'सायंकाळची महाआरती व मंगल दीप प्रज्वलन (Maha Aarti)',
        category: 'aarti',
        year: 2026,
      },
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
        caption: 'पारंपारिक गरबा रास व दांडिया सोहळा (Traditional Garba Night)',
        category: 'garba',
        year: 2026,
      },
      {
        id: '4',
        url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
        caption: 'लहान मुलांचे सांस्कृतिक कार्यक्रम व स्पर्धा (Cultural Programs)',
        category: 'cultural',
        year: 2026,
      },
      {
        id: '5',
        url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
        caption: 'भव्य महाप्रसाद भंडारा (Mahaprasad Bhandara)',
        category: 'bhandara',
        year: 2025,
      },
      {
        id: '6',
        url: 'https://images.unsplash.com/photo-1561484930-998b6a7b22e8?auto=format&fit=crop&w=800&q=80',
        caption: 'मंडप रोषणाई व भव्य सजावट (Mandap Lighting & Decoration)',
        category: 'decoration',
        year: 2026,
      },
    ];
  }, [items]);

  // Extract available unique categories
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    galleryImages.forEach((img) => {
      if (img.category) set.add(img.category.toLowerCase());
    });
    return Array.from(set);
  }, [galleryImages]);

  // Filter images by selected category tab
  const filteredImages = useMemo(() => {
    if (activeCategory === 'all') return galleryImages;
    return galleryImages.filter((img) => img.category?.toLowerCase() === activeCategory);
  }, [galleryImages, activeCategory]);

  const activeLightboxImage = lightboxIndex >= 0 ? filteredImages[lightboxIndex] : null;

  const handleSharePhoto = (url: string, caption?: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Mandal Gallery Photo',
        text: caption || 'Mandal Devotional Photo',
        url: url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Photo link copied!');
    }
  };

  return (
    <section id="gallery" className="space-y-6">
      {/* Section Header */}
      <div className="bg-[#FFFDF8] border border-[#E6DED2] rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7A1830]/10 border border-[#7A1830]/20 text-[#7A1830] text-[11px] font-bold uppercase tracking-wider">
          <Camera size={13} /> {t('mandalMemories')}
        </div>
        <h2 className="text-xl sm:text-3xl font-extrabold text-[#241F1D] tracking-tight">
          {t('galleryHeading')}
        </h2>
        <p className="text-xs sm:text-sm text-[#766E68] max-w-xl">
          {t('gallerySubtitle')}
        </p>

        {/* Category Filter Tabs */}
        {availableCategories.length > 0 && (
          <div className="pt-4 border-t border-[#E6DED2] flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-[#7A1830] text-white shadow-xs'
                  : 'bg-[#F4EDE0] text-[#241F1D] border border-[#D9CEBC] hover:bg-[#E6DED2]'
              }`}
            >
              {t('galleryCategoryAll')}
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-[#7A1830] text-white shadow-xs'
                    : 'bg-[#F4EDE0] text-[#241F1D] border border-[#D9CEBC] hover:bg-[#E6DED2]'
                }`}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredImages.map((img, idx) => (
          <div
            key={img.id || idx}
            onClick={() => setLightboxIndex(idx)}
            className="group relative rounded-2xl overflow-hidden border border-[#E6DED2] bg-[#FFFDF8] cursor-pointer shadow-xs hover:border-[#A97832]/60 transition-all aspect-4/3"
          >
            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.caption || 'Mandal Photo'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              {img.featured && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#A97832] text-white text-[10px] font-bold shadow-xs">
                  ★ {t('featuredBadge')}
                </span>
              )}
              {img.year && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-black/50 text-white/90 text-[10px] font-semibold border border-white/20 backdrop-blur-xs">
                  {img.year}
                </span>
              )}
            </div>

            {/* Bottom Caption Overlay */}
            <div className="absolute bottom-3 left-3 right-3 space-y-1">
              {img.caption && (
                <p className="text-xs font-bold text-white line-clamp-2 drop-shadow-sm">
                  {img.caption}
                </p>
              )}
              {img.sponsorName && (
                <span className="inline-block text-[10px] text-amber-200 font-semibold bg-black/40 px-2 py-0.5 rounded-md border border-amber-300/30">
                  {t('presentedWithSupportOf')}: {img.sponsorName}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {activeLightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-fade-in">
          
          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-[#A97832]" size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Photo {lightboxIndex + 1} of {filteredImages.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSharePhoto(activeLightboxImage.url, activeLightboxImage.caption)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Share Photo"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={() => setLightboxIndex(-1)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title={t('closeLightbox')}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Main Image Container */}
          <div className="relative flex-1 w-full max-w-4xl flex items-center justify-center my-4 overflow-hidden">
            {/* Left Nav Arrow */}
            {lightboxIndex > 0 && (
              <button
                onClick={() => setLightboxIndex((prev) => prev - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-lg transition-transform active:scale-90"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeLightboxImage.url}
              alt={activeLightboxImage.caption || 'Mandal Gallery'}
              className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            {/* Right Nav Arrow */}
            {lightboxIndex < filteredImages.length - 1 && (
              <button
                onClick={() => setLightboxIndex((prev) => prev + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-lg transition-transform active:scale-90"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Caption Footer */}
          {activeLightboxImage.caption && (
            <div className="w-full max-w-3xl text-center bg-white/10 border border-white/15 backdrop-blur-md p-3.5 rounded-2xl text-white space-y-1">
              <p className="text-xs sm:text-sm font-semibold">{activeLightboxImage.caption}</p>
              {activeLightboxImage.sponsorName && (
                <p className="text-[11px] text-[#A97832] font-bold">
                  {t('presentedWithSupportOf')}: {activeLightboxImage.sponsorName}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
