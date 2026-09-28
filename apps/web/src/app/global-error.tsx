'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error Boundary caught an exception:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-amber-500/20 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 text-amber-400">
            <AlertTriangle className="w-8 h-8 animate-bounce" />
          </div>

          <h1 className="text-xl font-bold mb-1">काहीतरी चुकीचे घडले</h1>
          <h2 className="text-sm text-amber-200/80 mb-4">Critical Application Error</h2>

          <p className="text-xs text-slate-400 mb-6">
            A critical system error occurred. Please click below to refresh and try again.
          </p>

          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-xs bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Application (रीलोड करा)</span>
          </button>
        </div>
      </body>
    </html>
  );
}
