'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { PAGE_TOURS, TourStep } from './onboardingGuides.config';
import { HelpCircle, ChevronRight, ChevronLeft, Check, X, Sparkles } from 'lucide-react';

export default function PageGuideSpotlight() {
  const pathname = usePathname();
  const { language, completedTours, markTourCompleted } = useAuthStore();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);

  // Map route pathname to tour key
  const tourKeyMap: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/receipts/new': 'receipts_new',
    '/campaigns': 'campaigns',
    '/members': 'members',
    '/settings': 'settings',
    '/reports': 'reports',
  };

  const pageKey = tourKeyMap[pathname];
  const tour = pageKey ? PAGE_TOURS[pageKey] : null;

  useEffect(() => {
    setCurrentStepIndex(0);
    setMinimized(false);
  }, [pathname]);

  if (!tour) return null;

  const isCompleted = !!completedTours[tour.pageKey];
  if (isCompleted && !minimized) return null;

  const steps = tour.steps;
  const currentStep: TourStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((p) => p + 1);
    } else {
      markTourCompleted(tour.pageKey);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((p) => p - 1);
    }
  };

  const handleDismiss = () => {
    markTourCompleted(tour.pageKey);
  };

  const pageTitle = tour.title[language] || tour.title.mr;
  const stepTitle = currentStep.title[language] || currentStep.title.mr;
  const stepDesc = currentStep.description[language] || currentStep.description.mr;
  const badgeText = currentStep.badge ? currentStep.badge[language] || currentStep.badge.mr : null;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-5 right-5 z-40 bg-saffron-500 text-white font-semibold text-xs px-3.5 py-2.5 rounded-full shadow-lg flex items-center gap-2 hover:bg-saffron-600 transition-all animate-bounce"
      >
        <HelpCircle size={15} />
        <span>{language === 'mr' ? 'मार्गदर्शन पुन्हा पहा' : 'Page Guide'}</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-sm w-full p-4 glass-card bg-white/95 dark:bg-[#1C1510]/95 border-2 border-saffron-500/40 shadow-2xl rounded-2xl animate-slide-up">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-theme/20">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-saffron-500 shrink-0" />
          <p className="text-xs font-bold text-theme-fg truncate">{pageTitle}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="text-[11px] text-theme-fg/50 hover:text-theme-fg px-1.5 py-0.5 rounded hover:bg-theme-fg/5"
            title="Minimize"
          >
            _
          </button>
          <button
            onClick={handleDismiss}
            className="text-theme-fg/40 hover:text-theme-fg p-1 rounded hover:bg-theme-fg/5"
            title="Close Guide"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-600 dark:text-saffron-400 bg-saffron-500/10 px-2 py-0.5 rounded-md">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          {badgeText && (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {badgeText}
            </span>
          )}
        </div>

        <h4 className="text-xs font-bold text-theme-fg leading-tight">
          {stepTitle}
        </h4>
        <p className="text-xs text-theme-fg/70 leading-relaxed">
          {stepDesc}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 mt-3 border-t border-theme/20">
        <button
          onClick={handleDismiss}
          className="text-[11px] text-theme-fg/40 hover:text-theme-fg font-medium"
        >
          {language === 'mr' ? 'रद्द करा (Skip)' : 'Skip Tour'}
        </button>

        <div className="flex items-center gap-1.5">
          {currentStepIndex > 0 && (
            <button
              onClick={handlePrev}
              className="btn-secondary text-[11px] py-1 px-2.5 h-7 min-h-0"
            >
              <ChevronLeft size={13} />
            </button>
          )}

          <button
            onClick={handleNext}
            className="btn-primary text-[11px] py-1 px-3 h-7 min-h-0 flex items-center gap-1"
          >
            {currentStepIndex < steps.length - 1 ? (
              <>
                {language === 'mr' ? 'पुढील' : 'Next'} <ChevronRight size={13} />
              </>
            ) : (
              <>
                {language === 'mr' ? 'पूर्ण झाले' : 'Got it!'} <Check size={13} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
