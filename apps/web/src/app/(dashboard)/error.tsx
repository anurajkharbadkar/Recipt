'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, LayoutDashboard } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error Boundary caught an exception:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-theme-bg rounded-2xl border border-theme-fg/10 p-6 sm:p-8 shadow-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5 text-amber-500">
          <AlertCircle className="w-8 h-8 animate-pulse" />
        </div>

        <h1 className="text-lg sm:text-xl font-bold text-theme-fg mb-1">
          डॅशबोर्ड मधील त्रुटी (Dashboard Error)
        </h1>
        <p className="text-xs sm:text-sm text-theme-fg/70 mb-6 leading-relaxed">
          An error occurred while loading this section of your dashboard. Please try reloading or visit your main dashboard.
        </p>

        {error.digest && (
          <p className="text-[10px] font-mono text-theme-fg/50 bg-theme-fg/5 p-2 rounded-lg mb-6 truncate">
            Ref: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold btn-primary"
          >
            <RefreshCw className="w-4 h-4" />
            <span>रीलोड करा (Try Again)</span>
          </button>
          <Link
            href="/receipts"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold btn-secondary"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
