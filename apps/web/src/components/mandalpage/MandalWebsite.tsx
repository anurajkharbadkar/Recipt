'use client';

import React, { useEffect } from 'react';
import type { Mandal } from '@/types/mandal';
import { MandalProvider } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDateRange } from '@/utils/dateUtils';
import MandalNotFound from './MandalNotFound';

import Navbar from './Navbar/Navbar';
import Hero from './Hero/Hero';
import FestivalOverview from './FestivalOverview/FestivalOverview';
import FestivalDaySection from './FestivalDay/FestivalDaySection';
import AboutMandal from './AboutMandal/AboutMandal';
import Sponsors from './Sponsors/Sponsors';
import Gallery from './Gallery/Gallery';
import SupportMandal from './SupportMandal/SupportMandal';
import Location from './Location/Location';
import ShareMandal from './ShareMandal/ShareMandal';
import Footer from './Footer/Footer';

import './mandalpage.css';

interface MandalWebsiteProps {
  mandal: Mandal | null;
  slug?: string;
}

export default function MandalWebsite({ mandal, slug }: MandalWebsiteProps) {
  const { getLocalized, language } = useLanguage();

  useEffect(() => {
    if (mandal) {
      const { identity, festival, location } = mandal;
      const mandalName = getLocalized(identity.name);
      const festivalName = getLocalized(festival.name);
      const venue = getLocalized(location.venue);
      const address = getLocalized(location.address);
      const tagline = getLocalized(identity.tagline);
      const dateRange = formatDateRange(festival.startDate, festival.endDate);

      document.title = `${mandalName} | ${festivalName}`;

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `${mandalName} — ${festivalName} celebration at ${venue}, ${address}. ${dateRange}. ${tagline}`
        );
      }
    }

    return () => {
      document.title = "E-PavtiBook — Your Mandal's Digital Home";
    };
  }, [mandal, language, getLocalized]);

  if (!mandal) {
    return <MandalNotFound slug={slug || ''} />;
  }

  return (
    <MandalProvider mandal={mandal}>
      <div className="mandalpage-root-wrapper">
        <Navbar />
        <main>
          <Hero />
          <FestivalOverview />
          <FestivalDaySection />
          <AboutMandal />
          <Gallery />
          <Sponsors />
          <SupportMandal />
          <Location />
          <ShareMandal />
        </main>
        <Footer />
      </div>
    </MandalProvider>
  );
}
