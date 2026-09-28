'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function MandalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Mandal Page Error caught an exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 p-4 sm:p-6 text-white">
      <div className="max-w-md w-full bg-stone-900 border border-amber-500/20 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-400">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
        </div>

        <h1 className="text-lg sm:text-xl font-bold text-amber-300 mb-1">
          मंङल पानावर त्रुटी आली
        </h1>
        <h2 className="text-xs sm:text-sm font-semibold text-stone-300 mb-4">
          Unable to Load Mandal Page
        </h2>

        <p className="text-xs sm:text-sm text-stone-400 mb-6 leading-relaxed">
          We encountered a temporary problem displaying this Mandal page. Please refresh or try again shortly.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition-all shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>पुन्हा प्रयत्न करा (Retry)</span>
          </button>
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-stone-800 hover:bg-stone-700 text-stone-200 transition-all border border-stone-700"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
