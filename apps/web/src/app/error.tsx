'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console or error reporting service
    console.error('Root Error Boundary caught an exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-900 p-4 sm:p-6">
      <div className="max-w-md w-full bg-slate-900/90 border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center">
        {/* Animated Icon Header */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 shadow-inner text-amber-400">
          <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
        </div>

        {/* Marathi & English Dual Headings */}
        <span className="inline-block text-[11px] font-extrabold tracking-widest px-3 py-1 rounded-full uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
          Error 500
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide mb-1">
          काहीतरी चुकीचे घडले
        </h1>
        <h2 className="text-sm font-semibold text-amber-200/80 mb-4">
          Something Went Wrong
        </h2>

        <p className="text-xs sm:text-sm text-slate-300/80 mb-6 leading-relaxed">
          The application encountered an unexpected issue while loading this page. Please try refreshing or return to the main homepage.
        </p>

        {error.digest && (
          <p className="text-[10px] font-mono text-slate-500 bg-slate-950 p-2 rounded-lg mb-6 truncate">
            Ref: {error.digest}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-saffron-600 text-slate-950 hover:from-amber-400 hover:to-saffron-500 transition-all shadow-lg active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>पुन्हा प्रयत्न करा (Try Again)</span>
          </button>
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>मुख्य पान (Home)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
