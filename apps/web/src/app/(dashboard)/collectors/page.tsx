'use client';

// Collectors now lives inside the merged Members screen (Staff & Collectors
// tab) — this route is kept only so old bookmarks/links don't 404.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CollectorsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/members?tab=staff');
  }, [router]);
  return null;
}
