'use client';

import Link from 'next/link';
import { FileQuestion, LayoutDashboard, ArrowLeft } from 'lucide-react';

export default function DashboardNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-theme-bg rounded-2xl border border-theme-fg/10 p-6 sm:p-8 shadow-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5 text-amber-500">
          <FileQuestion className="w-8 h-8" />
        </div>

        <h1 className="text-lg sm:text-xl font-bold text-theme-fg mb-1">
          माहिती सापडली नाही
        </h1>
        <h2 className="text-xs sm:text-sm font-semibold text-theme-fg/70 mb-4">
          Record or Page Not Found
        </h2>

        <p className="text-xs sm:text-sm text-theme-fg/60 mb-6 leading-relaxed">
          The requested receipt, member, report, or page could not be found. It may have been removed or deleted.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/receipts"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold btn-primary"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
