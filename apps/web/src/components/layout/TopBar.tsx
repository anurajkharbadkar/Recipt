'use client';

import { useAuthStore } from '@/store/auth.store';
import { Globe, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { campaignsApi } from '@/lib/api';

const languageLabels = {
  en: '🇬🇧 EN',
  hi: '🇮🇳 HI',
  mr: '🏳️ MR',
};

export default function TopBar() {
  const { language, setLanguage, activeCampaignId, setActiveCampaign } = useAuthStore();

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignsApi.list,
  });

  const activeCampaigns = campaigns?.filter((c: any) => c.status === 'ACTIVE') || [];

  return (
    <header className="h-16 border-b border-theme px-4 md:px-6 flex items-center justify-between bg-navy-800/50 backdrop-blur-sm">
      {/* Campaign Switcher */}
      <div className="flex items-center gap-3 ml-10 md:ml-0">
        {activeCampaigns.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 hidden sm:block">Campaign:</span>
            <select
              value={activeCampaignId || ''}
              onChange={(e) => setActiveCampaign(e.target.value)}
              className="form-select text-xs py-1.5 pl-3 pr-8 max-w-[180px] sm:max-w-xs"
            >
              {activeCampaigns.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <span className="text-xs text-white/30">No active campaign</span>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="relative group">
          <button className="btn-ghost text-xs gap-1.5 py-1.5 px-3">
            <Globe size={14} />
            <span>{languageLabels[language]}</span>
          </button>
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50">
            <div className="glass-card p-1.5 flex flex-col min-w-[100px]">
              {(Object.entries(languageLabels) as [string, string][]).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code as any)}
                  className={`px-3 py-1.5 text-xs rounded-lg text-left transition-colors ${language === code ? 'bg-saffron-600/20 text-saffron-400' : 'text-white/70 hover:bg-white/5'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <button className="btn-ghost p-2 relative">
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}
