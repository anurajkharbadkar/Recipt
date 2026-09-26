'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { mandalPagesApi } from '@/lib/api';
import { mapDbToMandal } from '@/lib/mandal-adapter';
import { LanguageProvider } from '@/context/LanguageContext';
import SponsorProfile from '@/components/mandalpage/SponsorProfile';

export default function SponsorProfilePage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const sponsorId = (params?.sponsorId as string) || '';

  const { data: dbConfig, isLoading } = useQuery({
    queryKey: ['public-mandal-page', slug],
    queryFn: () => mandalPagesApi.getPublicPage(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF9F5' }}>
        <p style={{ fontFamily: 'sans-serif', fontWeight: 600, color: '#993333' }}>Loading Partner Profile...</p>
      </div>
    );
  }

  const mandal = dbConfig ? mapDbToMandal(dbConfig) : null;
  const sponsor = mandal?.sponsors.find((s) => s.id === sponsorId || s.slug === sponsorId) || null;

  return (
    <LanguageProvider>
      <SponsorProfile
        mandal={mandal}
        sponsor={sponsor}
        mandalSlug={slug}
        sponsorSlug={sponsorId}
      />
    </LanguageProvider>
  );
}
