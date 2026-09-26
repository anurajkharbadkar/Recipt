'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useModuleAccessResolver } from '@/hooks/useModuleAccess';
import {
  Receipt, IndianRupee, Users2, Settings, Plus, X,
  FileText, Megaphone, Globe, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/cn';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useAuthStore();
  const canView = useModuleAccessResolver();
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  // Close action sheet when pathname changes
  useEffect(() => {
    setActionSheetOpen(false);
  }, [pathname]);

  // Handle hardware / browser back button to close action sheet first
  const handlePopState = useCallback(() => {
    if (actionSheetOpen) {
      setActionSheetOpen(false);
    }
  }, [actionSheetOpen]);

  useEffect(() => {
    if (actionSheetOpen) {
      window.history.pushState({ modalOpen: true }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [actionSheetOpen, handlePopState]);

  const toggleActionSheet = () => {
    setActionSheetOpen((prev) => !prev);
  };

  // Smart back navigation helper
  const handleSmartBack = (fallbackPath: string = '/dashboard') => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push(fallbackPath);
    }
  };

  const navItems = [
    {
      href: '/receipts',
      label: language === 'mr' ? 'पावत्या' : language === 'hi' ? 'रसीदें' : 'Receipts',
      icon: Receipt,
      module: 'Receipts',
      activeMatch: (p: string) => p.startsWith('/receipts') && !p.startsWith('/receipts/new'),
    },
    {
      href: '/expenses',
      label: language === 'mr' ? 'खर्च' : language === 'hi' ? 'व्यय' : 'Expenses',
      icon: IndianRupee,
      module: 'Expenses',
      activeMatch: (p: string) => p.startsWith('/expenses'),
    },
    {
      href: '/members',
      label: language === 'mr' ? 'सभासद' : language === 'hi' ? 'सदस्य' : 'Members',
      icon: Users2,
      module: 'Members',
      altModule: 'Collectors',
      activeMatch: (p: string) => p.startsWith('/members'),
    },
    {
      href: '/settings',
      label: language === 'mr' ? 'सेटिंग्स' : language === 'hi' ? 'सेटिंग्स' : 'Settings',
      icon: Settings,
      module: 'Settings',
      activeMatch: (p: string) => p.startsWith('/settings'),
    },
  ];

  const quickActions = [
    {
      href: '/receipts/new',
      label: language === 'mr' ? 'नवीन पावती' : language === 'hi' ? 'नई रसीद' : 'New Receipt',
      desc: language === 'mr' ? 'पावती तयार करा' : 'Issue digital receipt',
      icon: FileText,
      module: 'Receipts',
      color: 'bg-[#7A1830] text-white',
    },
    {
      href: '/expenses?new=1',
      label: language === 'mr' ? 'खर्च जोडा' : language === 'hi' ? 'व्यय जोड़ें' : 'Add Expense',
      desc: language === 'mr' ? 'नवीन खर्च नोंदवा' : 'Record new expense',
      icon: IndianRupee,
      module: 'Expenses',
      color: 'bg-amber-600 text-white',
    },
    {
      href: '/members?tab=internal',
      label: language === 'mr' ? 'सभासद वर्गणी' : language === 'hi' ? 'सदस्य योगदान' : 'Member Contribution',
      desc: language === 'mr' ? 'अंतर्गत जमा नोंदी' : 'Internal collection',
      icon: Users2,
      module: 'Members',
      altModule: 'Collectors',
      color: 'bg-blue-600 text-white',
    },
    {
      href: '/campaigns',
      label: language === 'mr' ? 'इव्हेंट / उपक्रम' : language === 'hi' ? 'कार्यक्रम' : 'New Event',
      desc: language === 'mr' ? 'नवीन उत्सव / मोहीम' : 'Festival & campaign',
      icon: Megaphone,
      module: 'Campaigns',
      color: 'bg-purple-600 text-white',
    },
  ];

  return (
    <>
      {/* Action Sheet Backdrop */}
      {actionSheetOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={() => setActionSheetOpen(false)}
        />
      )}

      {/* Action Sheet Popover Modal */}
      <div
        className={cn(
          'fixed left-3 right-3 bottom-20 z-50 md:hidden bg-navy-800 border border-theme/80 rounded-3xl p-5 shadow-2xl transition-all duration-300 transform',
          actionSheetOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 pointer-events-none scale-95'
        )}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-saffron-500/20 text-saffron-400 flex items-center justify-center font-bold">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-fg">
                {language === 'mr' ? 'त्वरित कृती' : language === 'hi' ? 'त्वरित कार्य' : 'Quick Actions'}
              </h3>
              <p className="text-[10px] text-theme-fg/50">Select an action to continue</p>
            </div>
          </div>
          <button
            onClick={() => setActionSheetOpen(false)}
            className="p-1.5 rounded-full bg-theme-fg/10 text-theme-fg/70 hover:text-theme-fg"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((act) => {
            const isAllowed = canView(act.module) || (act.altModule ? canView(act.altModule) : false);
            if (!isAllowed) return null;
            return (
              <Link
                key={act.href}
                href={act.href}
                onClick={() => setActionSheetOpen(false)}
                className="p-3.5 rounded-2xl bg-theme-fg/5 hover:bg-theme-fg/10 border border-theme/40 active:scale-95 transition-all flex flex-col items-start space-y-2 group"
              >
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shadow-xs', act.color)}>
                  <act.icon size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-fg group-hover:text-saffron-400 transition-colors">
                    {act.label}
                  </p>
                  <p className="text-[10px] text-theme-fg/50 line-clamp-1">{act.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Persistent Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-navy-800/95 backdrop-blur-md border-t border-theme/60 shadow-2xl px-2 py-1.5">
        <div className="flex items-center justify-around relative max-w-md mx-auto">
          
          {/* Item 1: Receipts */}
          {canView(navItems[0].module) && (
            <Link
              href={navItems[0].href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all',
                navItems[0].activeMatch(pathname)
                  ? 'text-saffron-400 font-bold scale-105'
                  : 'text-theme-fg/60 hover:text-theme-fg'
              )}
            >
              <Receipt size={20} />
              <span className="text-[10px] mt-0.5">{navItems[0].label}</span>
            </Link>
          )}

          {/* Item 2: Expenses */}
          {canView(navItems[1].module) && (
            <Link
              href={navItems[1].href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all',
                navItems[1].activeMatch(pathname)
                  ? 'text-saffron-400 font-bold scale-105'
                  : 'text-theme-fg/60 hover:text-theme-fg'
              )}
            >
              <IndianRupee size={20} />
              <span className="text-[10px] mt-0.5">{navItems[1].label}</span>
            </Link>
          )}

          {/* Center (+) Floating Action Button */}
          <div className="relative -top-4 flex items-center justify-center">
            <button
              onClick={toggleActionSheet}
              aria-label="Quick Actions"
              className={cn(
                'w-13 h-13 rounded-full bg-gradient-to-tr from-[#7A1830] via-saffron-600 to-[#A97832] text-white flex items-center justify-center shadow-lg shadow-saffron-900/40 ring-4 ring-navy-800 active:scale-90 transition-all duration-300',
                actionSheetOpen && 'rotate-45 scale-105'
              )}
            >
              <Plus size={24} strokeWidth={2.8} />
            </button>
          </div>

          {/* Item 3: Members */}
          {(canView(navItems[2].module) || canView(navItems[2].altModule!)) && (
            <Link
              href={navItems[2].href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all',
                navItems[2].activeMatch(pathname)
                  ? 'text-saffron-400 font-bold scale-105'
                  : 'text-theme-fg/60 hover:text-theme-fg'
              )}
            >
              <Users2 size={20} />
              <span className="text-[10px] mt-0.5">{navItems[2].label}</span>
            </Link>
          )}

          {/* Item 4: Settings */}
          {canView(navItems[3].module) && (
            <Link
              href={navItems[3].href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all',
                navItems[3].activeMatch(pathname)
                  ? 'text-saffron-400 font-bold scale-105'
                  : 'text-theme-fg/60 hover:text-theme-fg'
              )}
            >
              <Settings size={20} />
              <span className="text-[10px] mt-0.5">{navItems[3].label}</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
