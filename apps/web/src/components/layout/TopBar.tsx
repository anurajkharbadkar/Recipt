'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { campaignsApi } from '@/lib/api';
import LogoMark from '@/components/brand/LogoMark';
import { BRAND_NAME } from '@pavti/shared';
import { Sparkles } from 'lucide-react';

const campaignLabel = { en: 'Event:', hi: 'इवेंट / उत्सव:', mr: 'इवेंट / उत्सव:' };
const noCampaignLabel = { en: 'No active event', hi: 'कोई सक्रिय इवेंट नहीं', mr: 'सक्रिय इवेंट / उपक्रम नाही' };

export default function TopBar() {
  const { language, activeCampaignId, setActiveCampaign, organization, user } = useAuthStore();
  const l = { campaign: campaignLabel[language] || campaignLabel.en, noCampaign: noCampaignLabel[language] || noCampaignLabel.en };

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignsApi.list,
  });

  const activeCampaigns = campaigns?.filter((c: any) => c.status === 'ACTIVE') || [];

  useEffect(() => {
    if (activeCampaigns.length > 0) {
      const exists = activeCampaigns.some((c: any) => c.id === activeCampaignId);
      if (!exists) {
        setActiveCampaign(activeCampaigns[0].id);
      }
    }
  }, [activeCampaigns, activeCampaignId, setActiveCampaign]);

  return (
    <header className="h-16 border-b border-theme/40 px-3.5 sm:px-6 flex items-center justify-between bg-white dark:bg-[#1A120B] sticky top-0 z-30 transition-all shadow-xs">
      {/* Mobile Branding */}
      <div className="flex items-center gap-2 md:hidden min-w-0 flex-1 pr-2">
        {organization?.logoUrl ? (
          <img src={organization.logoUrl} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 shadow-sm border border-black/5" />
        ) : (
          <LogoMark size={26} className="rounded-lg shadow-sm shrink-0" />
        )}
        <div className="min-w-0 max-w-[140px] xs:max-w-[200px]">
          <h1 className="font-bold text-xs text-theme-fg truncate leading-tight">
            {organization ? (language === 'mr' && organization.nameMarathi ? organization.nameMarathi : organization.name) : BRAND_NAME}
          </h1>
          <p className="text-[10px] text-saffron-700 dark:text-saffron-300 font-devanagari leading-none mt-0.5 truncate font-medium">
            {organization?.nameMarathi || 'ई पावती बुक'}
          </p>
        </div>
      </div>

      {/* Desktop Left: Campaign Switcher */}
      <div className="hidden md:flex items-center gap-3">
        {activeCampaigns.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-theme-fg/50">{l.campaign}</span>
            <select
              value={activeCampaignId || ''}
              onChange={(e) => setActiveCampaign(e.target.value)}
              className="form-select text-xs py-1.5 pl-3 pr-8 max-w-xs font-medium shadow-sm"
            >
              {activeCampaigns.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{l.noCampaign}</span>
            <Link
              href="/campaigns"
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-saffron-500/10 text-saffron-700 dark:text-saffron-300 hover:bg-saffron-500/20 transition-all flex items-center gap-1"
            >
              + {language === 'mr' ? 'नवीन उत्सव तयार करा' : language === 'hi' ? 'इवेंट बनाएं' : 'Create Event'}
            </Link>
          </div>
        )}
      </div>

      {/* Right Side: Mobile Campaign Selector & User Pill (pr-12 leaves space for right hamburger) */}
      <div className="flex items-center gap-1.5 shrink-0 pr-12 md:pr-0">
        {/* Mobile Campaign Selector */}
        {activeCampaigns.length > 0 && (
          <div className="md:hidden">
            <select
              value={activeCampaignId || ''}
              onChange={(e) => setActiveCampaign(e.target.value)}
              className="form-select text-[11px] py-1 px-2.5 pr-7 max-w-[115px] xs:max-w-[150px] font-semibold rounded-lg truncate shadow-xs"
            >
              {activeCampaigns.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tour Guidance Trigger */}
        <button
          onClick={() => useAuthStore.setState({ completedTours: {} })}
          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-saffron-500/10 text-saffron-700 dark:text-saffron-300 hover:bg-saffron-500/20 transition-all border border-saffron-500/20 shrink-0"
          title="Re-open guided tour"
        >
          <Sparkles size={12} />
          <span>{language === 'mr' ? 'मार्गदर्शन' : language === 'hi' ? 'गाइड' : 'Tour'}</span>
        </button>

        {/* User Pill (Tablet/Desktop) */}
        {user && (
          <Link href="/profile" className="hidden sm:flex items-center gap-2 pl-3 border-l border-theme-fg/10 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-saffron-100 dark:bg-saffron-900/40 text-saffron-700 dark:text-saffron-300 flex items-center justify-center font-bold text-xs">
              {user.name[0]}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-theme-fg leading-none">{user.name}</p>
              <p className="text-[10px] text-theme-fg/50 leading-none mt-0.5">{user.role}</p>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
