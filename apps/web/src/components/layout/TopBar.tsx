'use client';

import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { campaignsApi } from '@/lib/api';

const campaignLabel = { en: 'Festival / Drive:', hi: 'अभियान:', mr: 'मोहीम:' };
const noCampaignLabel = { en: 'No active festival/drive', hi: 'कोई सक्रिय अभियान नहीं', mr: 'सक्रिय मोहीम नाही' };

export default function TopBar() {
  const { language, activeCampaignId, setActiveCampaign } = useAuthStore();
  const l = { campaign: campaignLabel[language] || campaignLabel.en, noCampaign: noCampaignLabel[language] || noCampaignLabel.en };

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
            <span className="text-xs text-theme-fg/40 hidden sm:block">{l.campaign}</span>
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
          <span className="text-xs text-theme-fg/30">{l.noCampaign}</span>
        )}
      </div>

    </header>
  );
}
