'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Loader2 } from 'lucide-react';

export default function MandalRootPage() {
  const router = useRouter();
  const { organization } = useAuthStore();

  useEffect(() => {
    if (organization?.slug) {
      router.replace(`/mandal/${organization.slug}`);
    } else {
      router.replace('/mandal-page');
    }
  }, [organization, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-theme-bg text-theme-fg text-center">
      <Loader2 className="w-8 h-8 animate-spin text-saffron-500 mb-3" />
      <p className="text-xs font-semibold text-theme-fg/70">Opening Mandal Webpage...</p>
    </div>
  );
}
