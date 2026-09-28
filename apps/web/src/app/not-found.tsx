'use client';

import Link from 'next/link';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export default function RootNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-900 p-4 sm:p-6">
      <div className="max-w-md w-full bg-slate-900/90 border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center">
        {/* Animated Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 text-amber-400">
          <Compass className="w-8 h-8 sm:w-10 sm:h-10 animate-spin-slow" />
        </div>

        {/* 404 Header */}
        <span className="inline-block text-4xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-saffron-500 mb-2">
          404
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide mb-1">
          पृष्ठ सापडले नाही
        </h1>
        <h2 className="text-xs sm:text-sm font-semibold text-amber-200/80 mb-4">
          Page Not Found
        </h2>

        <p className="text-xs sm:text-sm text-slate-300/80 mb-6 leading-relaxed">
          The page or route you are looking for does not exist, has been moved, or is temporarily unavailable.
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-saffron-600 text-slate-950 hover:from-amber-400 hover:to-saffron-500 transition-all shadow-lg active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>मुख्य पानावर जा (Back to Home)</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>मागे जा (Go Back)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
