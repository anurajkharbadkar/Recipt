'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { mandalPagesApi } from '@/lib/api';
import { mapDbToMandal } from '@/lib/mandal-adapter';
import { LanguageProvider } from '@/context/LanguageContext';
import MandalWebsite from '@/components/mandalpage/MandalWebsite';

import MandalNotFound from '@/components/mandalpage/MandalNotFound';

export default function PublicMandalPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const { data: dbConfig, isLoading, isError } = useQuery({
    queryKey: ['public-mandal-page', slug],
    queryFn: () => mandalPagesApi.getPublicPage(slug),
    enabled: !!slug,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF9F5' }}>
        <p style={{ fontFamily: 'sans-serif', fontWeight: 600, color: '#993333' }}>Loading Mandal Website...</p>
      </div>
    );
  }

  if (isError) {
    return <MandalNotFound slug={slug} />;
  }

  const mandal = mapDbToMandal(dbConfig);

  return (
    <LanguageProvider>
      <MandalWebsite mandal={mandal} slug={slug} />
    </LanguageProvider>
  );
}
