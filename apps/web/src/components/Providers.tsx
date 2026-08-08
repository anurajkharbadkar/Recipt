'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';

/**
 * Applies the signed-in org's custom brand color as the --primary-brand-color
 * CSS var on :root (globals.css derives every button/accent/focus-ring tint
 * from it via color-mix()) — so picking a color in Settings really does
 * "update the entire UI" live, with no rebuild or per-component wiring.
 * Falls back to the default saffron already baked into globals.css when the
 * org hasn't set one.
 */
function BrandColorSync() {
  const brandColor = useAuthStore((s) => s.organization?.brandColor);

  useEffect(() => {
    const root = document.documentElement;
    if (brandColor) {
      root.style.setProperty('--primary-brand-color', brandColor);
    } else {
      root.style.removeProperty('--primary-brand-color');
    }
  }, [brandColor]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BrandColorSync />
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
