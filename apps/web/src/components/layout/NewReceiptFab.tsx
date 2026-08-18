'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useModuleAccessResolver } from '@/hooks/useModuleAccess';

/**
 * Persistent "New Receipt" shortcut for mobile — collectors spend most of
 * their time on Receipts/Expenses/Members, not the Dashboard, so the
 * Dashboard's Quick Actions row alone doesn't help once they've navigated
 * away. This floats above every dashboard route so starting a receipt never
 * needs a trip back to Dashboard first.
 *
 * Hidden: on desktop (sidebar nav is already one click away), on the
 * New Receipt form itself (nothing to shortcut to), and for anyone without
 * Receipts access.
 */
export default function NewReceiptFab() {
  const pathname = usePathname();
  const { language } = useAuthStore();
  const canView = useModuleAccessResolver();

  if (pathname?.startsWith('/receipts/new')) return null;
  if (!canView('Receipts')) return null;

  const label = language === 'mr' ? 'नवीन पावती' : language === 'hi' ? 'नई रसीद' : 'New Receipt';

  return (
    <Link
      href="/receipts/new"
      aria-label={label}
      className="md:hidden fixed bottom-5 right-5 z-40 flex items-center gap-2 pl-4 pr-5 py-3.5 rounded-full bg-saffron-600 text-white shadow-lg shadow-saffron-900/30 active:scale-95 transition-transform"
    >
      <Plus size={20} strokeWidth={2.5} />
      <span className="text-sm font-bold">{label}</span>
    </Link>
  );
}
