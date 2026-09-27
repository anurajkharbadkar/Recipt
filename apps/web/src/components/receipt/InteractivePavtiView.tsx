'use client';

import React from 'react';
import { Receipt } from '@pavti/shared';
import ReceiptPreview from '@/components/receipt/ReceiptPreview';
import { Sparkles, FileCheck } from 'lucide-react';

interface InteractivePavtiViewProps {
  receipt?: Receipt;
  language?: 'mr' | 'hi' | 'en';
  onSwitchToStandard?: () => void;
  defaultMuted?: boolean;
  embedded?: boolean;
}

/**
 * Lightweight Placeholder Component for Interactive Pavti
 */
export default function InteractivePavtiView({
  receipt,
  language = 'mr',
  onSwitchToStandard,
  embedded = false,
}: InteractivePavtiViewProps) {
  if (receipt) {
    return (
      <div className="w-full max-w-xl mx-auto p-4 space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center flex items-center justify-center gap-2">
          <FileCheck size={16} className="text-amber-400" />
          <p className="text-xs text-amber-300 font-semibold">
            Standard Verified Digital Receipt
          </p>
        </div>
        <ReceiptPreview receipt={receipt} language={language} />
      </div>
    );
  }

  return (
    <div className={`p-8 text-center bg-theme-fg/5 border border-theme-fg/10 rounded-2xl ${embedded ? 'w-full h-full flex flex-col items-center justify-center' : 'max-w-md mx-auto my-8'}`}>
      <Sparkles size={36} className="mx-auto mb-3 text-saffron-500/60" />
      <h3 className="text-sm font-bold text-theme-fg">Interactive Pavti View (Placeholder)</h3>
      <p className="text-xs text-theme-fg/50 mt-1 max-w-xs mx-auto leading-relaxed">
        Interactive animated view has been removed. All receipts render using the official verified receipt format.
      </p>
    </div>
  );
}
