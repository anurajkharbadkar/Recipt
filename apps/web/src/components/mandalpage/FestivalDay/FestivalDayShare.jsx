import { useState } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { getFestivalDays } from '@/utils/festivalSelectors';
import DailyBannerModal from '@/components/mandal-page/DailyBannerModal';
import FullScheduleBannerModal from '@/components/mandal-page/FullScheduleBannerModal';

/**
 * FestivalDayShare
 *
 * Action buttons to create and share an image banner of either:
 * 1. The selected single festival day banner
 * 2. The complete 9-day festival schedule banner
 */
export default function FestivalDayShare({ day, mandalName }) {
  const mandal = useMandal();
  const { t, getLocalized } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [fullScheduleModalOpen, setFullScheduleModalOpen] = useState(false);

  const festivalDays = getFestivalDays(mandal);

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

  const resolvedMandalName = mandalName || getLocalized(mandal?.identity?.name) || 'मंडल';

  return (
    <>
      <div className="festival-day-share flex flex-wrap gap-2">
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

        <button
          type="button"
          onClick={() => setFullScheduleModalOpen(true)}
          className="festival-day-share__btn festival-day-share__btn--full border border-amber-500/40 text-amber-950 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
          aria-label="Share Complete 9-Day Schedule Banner"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{t('shareFullSchedule')}</span>
        </button>
      </div>

      <DailyBannerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mandalName={resolvedMandalName}
        mandalLogo={mandalLogo}
        mandalCode={mandalCode}
        mandalUrl={mandalUrl}
        day={dayForModal}
      />

      <FullScheduleBannerModal
        isOpen={fullScheduleModalOpen}
        onClose={() => setFullScheduleModalOpen(false)}
        mandalName={resolvedMandalName}
        mandalLogo={mandalLogo}
        mandalCode={mandalCode}
        mandalUrl={mandalUrl}
        festivalDays={festivalDays}
      />
    </>
  );
}
