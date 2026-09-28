'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function MandalSlugNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 p-4 sm:p-6 text-white">
      <div className="max-w-md w-full bg-stone-900 border border-amber-500/20 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-400">
          <Search className="w-8 h-8" />
        </div>

        <span className="inline-block text-3xl font-black text-amber-400 tracking-wider mb-2">404</span>
        <h1 className="text-lg sm:text-xl font-bold text-amber-200 mb-1">
          मंडल सापडले नाही
        </h1>
        <h2 className="text-xs sm:text-sm font-semibold text-stone-300 mb-4">
          Mandal Not Found
        </h2>

        <p className="text-xs sm:text-sm text-stone-400 mb-6 leading-relaxed">
          The requested Mandal digital portal does not exist or may have been unlinked. Please double check the URL link.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>मुख्य पान (Home)</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-stone-800 hover:bg-stone-700 text-stone-200 transition-all border border-stone-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
