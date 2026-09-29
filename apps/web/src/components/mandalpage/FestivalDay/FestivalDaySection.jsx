import { useState, useEffect, useCallback } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useInView } from '@/hooks/useInView';
import { toDevanagariNumerals, getFestivalDurationDays } from '@/utils/dateUtils';
import {
  getFestivalDays,
  getTodayFestivalDay,
  parseDayFromHash,
} from '@/utils/festivalSelectors';

import FestivalDayNav from './FestivalDayNav';
import FestivalDayView from './FestivalDayView';
import FullScheduleBannerModal from '@/components/mandal-page/FullScheduleBannerModal';
import { Share2 } from 'lucide-react';
import './FestivalDaySection.css';

/**
 * FestivalDaySection (Step 16)
 *
 * Core Day-by-Day Festival Information Architecture.
 * Reorganizes all festival elements (Dress Code, Events, Aarti, Activities,
 * Bhandara, Visarjan, Announcements, Sponsors) into a cohesive day-first experience.
 *
 * Replaces the long collection of standalone sections with a single,
 * expandable day-centric interface.
 */
export default function FestivalDaySection() {
  const mandal = useMandal();
  const { t, language, getLocalized } = useLanguage();
  const [ref, isVisible] = useInView({ threshold: 0.05 });
  const [fullScheduleModalOpen, setFullScheduleModalOpen] = useState(false);

  const festivalDays = getFestivalDays(mandal);

  // Compute initial active day:
  // 1. URL hash (#day-X, #bhandara, #visarjan, #activities)
  // 2. Today's active festival day
  // 3. First day
  const getInitialDay = useCallback(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const hashDay = parseDayFromHash(hash, festivalDays, mandal);
    if (hashDay != null) return hashDay;

    const todayDay = getTodayFestivalDay(festivalDays);
    if (todayDay != null) return todayDay.dayNumber;

    return festivalDays[0]?.dayNumber || 1;
  }, [festivalDays, mandal]);

  const [activeDayNumber, setActiveDayNumber] = useState(getInitialDay);

  // Synchronize hash on browser forward/back or external anchor link
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const targetDay = parseDayFromHash(hash, festivalDays, mandal);
      if (targetDay != null) {
        setActiveDayNumber(targetDay);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [festivalDays, mandal]);

  // Handle day selection
  const handleSelectDay = useCallback((dayNum) => {
    setActiveDayNumber(dayNum);

    // Update URL hash smoothly without triggering a window scroll jump
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', `#day-${dayNum}`);
    }
  }, []);

  if (festivalDays.length === 0) {
    return null;
  }

  const selectedDay = festivalDays.find(d => d.dayNumber === activeDayNumber) || festivalDays[0];
  const totalDays = getFestivalDurationDays(mandal.festival, festivalDays);
  const localizedDays = (language === 'mr' || language === 'hi')
    ? toDevanagariNumerals(totalDays)
    : totalDays;

  const mandalName = getLocalized(mandal?.identity?.name) || 'मंडल';
  const mandalNameMarathi = mandal?.identity?.nameMarathi || (typeof mandal?.identity?.name === 'object' ? mandal?.identity?.name?.mr : null);
  const mandalLogo = mandal?.identity?.logoUrl;
  const mandalCode = mandal?.identity?.mandalCode;
  const mandalSlug = mandal?.identity?.slug || '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const mandalUrl = `${origin}/mandal/${mandalSlug}`;

  return (
    <section
      id="schedule"
      className="festival-day-section section"
      aria-labelledby="festival-day-heading"
    >
      <div className="container">
        {/* Section Header */}
        <div
          ref={ref}
          className={`festival-day-section__header reveal ${isVisible ? 'reveal--visible' : ''}`}
        >
          <p className="eyebrow festival-day-section__eyebrow">
            {t('exploreFestivalDays')}
          </p>
          <h2 id="festival-day-heading" className="heading-display heading-display--lg festival-day-section__title">
            {localizedDays} {t('daysOfCelebration')}
          </h2>
          <p className="festival-day-section__subtitle">
            {t('scheduleSubtitle')}
          </p>

          {/* Option to Share Complete 9-Day Schedule Banner */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setFullScheduleModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-semibold text-xs border border-amber-500/30 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Share2 size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t('shareFullSchedule')}</span>
            </button>
          </div>
        </div>

        {/* Day Navigation Tabs */}
        <FestivalDayNav
          festivalDays={festivalDays}
          activeDayNumber={activeDayNumber}
          onSelectDay={handleSelectDay}
        />

        {/* Active Day Content Panel */}
        <FestivalDayView day={selectedDay} />

        {/* Complete 9-Day Festival Banner Modal */}
        <FullScheduleBannerModal
          isOpen={fullScheduleModalOpen}
          onClose={() => setFullScheduleModalOpen(false)}
          mandalName={mandalName}
          mandalNameMarathi={mandalNameMarathi}
          mandalLogo={mandalLogo}
          mandalCode={mandalCode}
          mandalUrl={mandalUrl}
          festivalDays={festivalDays}
        />
      </div>
    </section>
  );
}
