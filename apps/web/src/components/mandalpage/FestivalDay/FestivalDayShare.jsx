import { useState } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import DailyBannerModal from '@/components/mandal-page/DailyBannerModal';

/**
 * FestivalDayShare
 *
 * Action button to create and share an image banner of the selected festival day.
 * Opens DailyBannerModal which renders a 9:16 aspect ratio poster with schedule, dress code, and QR code.
 */
export default function FestivalDayShare({ day, mandalName }) {
  const mandal = useMandal();
  const { t, getLocalized } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);

  const mandalLogo = mandal?.identity?.logoUrl;
  const mandalCode = mandal?.identity?.mandalCode;
  const mandalSlug = mandal?.identity?.slug || '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const mandalUrl = `${origin}/mandal/${mandalSlug}`;

  const resolvedTitle = getLocalized(day?.title) || getLocalized(day?.goddess) || `Day ${day?.dayNumber || 1}`;
  const resolvedDressCode = getLocalized(day?.dressCode?.theme) || day?.color || day?.dressCodeColor || '';
  const resolvedAvatar = getLocalized(day?.goddess) || day?.deityAvatar || '';

  const dayForModal = {
    dayNumber: day?.dayNumber || 1,
    title: resolvedTitle,
    dressCodeColor: resolvedDressCode,
    colorHex: day?.colorHex || day?.dressCode?.colorHex || '#d97706',
    deityAvatar: resolvedAvatar,
    events: day?.events || [],
  };

  return (
    <>
      <div className="festival-day-share">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="festival-day-share__btn"
          aria-label={`${t('shareDay')} ${day?.dayNumber || 1}`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>{t('shareDay')}</span>
        </button>
      </div>

      <DailyBannerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mandalName={mandalName || getLocalized(mandal?.identity?.name) || 'मंडल'}
        mandalLogo={mandalLogo}
        mandalCode={mandalCode}
        mandalUrl={mandalUrl}
        day={dayForModal}
      />
    </>
  );
}
