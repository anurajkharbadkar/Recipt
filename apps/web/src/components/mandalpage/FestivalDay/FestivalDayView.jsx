import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import {
  getDressCodeForDay,
  getActivitiesForDay,
  getBhandaraForDay,
  getVisarjanForDay,
  getAnnouncementsForDay,
  getSponsorsForDay,
} from '@/utils/festivalSelectors';

import FestivalDayHeader from './FestivalDayHeader';
import FestivalDayDressCode from './FestivalDayDressCode';
import FestivalDayEvents from './FestivalDayEvents';
import FestivalDayActivities from './FestivalDayActivities';
import FestivalDayBhandara from './FestivalDayBhandara';
import FestivalDayVisarjan from './FestivalDayVisarjan';
import FestivalDayAnnouncements from './FestivalDayAnnouncements';
import FestivalDaySponsor from './FestivalDaySponsor';
import FestivalDayShare from './FestivalDayShare';

/**
 * FestivalDayView
 *
 * Renders ALL information relevant to the currently selected festival day.
 * Composes Dress Code, Events, Aarti, Activities, Bhandara, Visarjan,
 * Announcements, and Sponsors into an editorial presentation.
 */
export default function FestivalDayView({ day }) {
  const mandal = useMandal();
  const { getLocalized } = useLanguage();

  if (!day) return null;

  const dressCode = getDressCodeForDay(mandal, day);
  const activities = getActivitiesForDay(mandal, day);
  const bhandara = getBhandaraForDay(mandal, day);
  const visarjan = getVisarjanForDay(mandal, day);
  const announcements = getAnnouncementsForDay(mandal, day);
  const sponsors = getSponsorsForDay(mandal, day);
  const mandalName = getLocalized(mandal.identity?.name);
  const mandalSlug = mandal.identity?.slug;

  return (
    <div
      id={`festival-day-panel-${day.dayNumber}`}
      role="tabpanel"
      aria-labelledby={`festival-day-tab-${day.dayNumber}`}
      className="festival-day-view"
    >
      {/* 1. Day Header & Summary */}
      <FestivalDayHeader day={day} />

      {/* 2. Main Content Grid */}
      <div className="festival-day-view__grid">
        {/* Left Column: Dress Code & Context */}
        <div className="festival-day-view__side-col">
          {dressCode && (
            <FestivalDayDressCode dressCode={dressCode} day={day} />
          )}

          {sponsors.length > 0 && (
            <FestivalDaySponsor sponsors={sponsors} mandalSlug={mandalSlug} />
          )}

          <FestivalDayShare day={day} mandalName={mandalName} />
        </div>

        {/* Right Column: Events, Activities, Bhandara, Visarjan, Notices */}
        <div className="festival-day-view__main-col">
          {/* Day-specific announcements */}
          {announcements.length > 0 && (
            <FestivalDayAnnouncements announcements={announcements} />
          )}

          {/* Schedule of Events & Aarti */}
          <FestivalDayEvents events={day.events} />

          {/* Special Bhandara if on this day */}
          {bhandara && (
            <FestivalDayBhandara bhandara={bhandara} />
          )}

          {/* Special Competitions / Activities if on this day */}
          {activities.length > 0 && (
            <FestivalDayActivities activities={activities} />
          )}

          {/* Special Visarjan procession if on this day */}
          {visarjan && (
            <FestivalDayVisarjan visarjan={visarjan} />
          )}
        </div>
      </div>
    </div>
  );
}
