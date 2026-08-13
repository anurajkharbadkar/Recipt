'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { campaignsApi, internalCollectionsApi } from '@/lib/api';
import { formatCurrency } from '@pavti/shared';
import { ArrowLeft, Users2, ArrowUpRight } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'badge-neutral',
  ACTIVE: 'badge-success',
  PAUSED: 'badge-warning',
  COMPLETED: 'badge-info',
};

function StatTile({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' | 'neutral' }) {
  const color = tone === 'good' ? 'text-emerald-400' : tone === 'bad' ? 'text-red-400' : 'text-theme-fg';
  return (
    <div className="glass-card p-4 text-center">
      <p className="text-xs text-theme-fg/40 mb-1">{label}</p>
      <p className={`font-bold text-lg ${color}`}>{value}</p>
    </div>
  );
}

/**
 * Compact read-only summary — the roster is actually managed on the Members
 * page (Internal Collection tab) so there's exactly one place edits happen;
 * this just gives campaign-page context plus a direct link over there,
 * preselecting this campaign.
 */
function InternalCollectionSummary({ campaignId }: { campaignId: string }) {
  const { data: roster } = useQuery({
    queryKey: ['internal-collection-roster', campaignId],
    queryFn: () => internalCollectionsApi.roster(campaignId),
  });

  const memberCount = roster?.members?.length || 0;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users2 size={16} className="text-saffron-400" />
          <h3 className="text-sm font-semibold text-theme-fg">Internal Collection <span className="text-theme-fg/40 font-normal">(Mandal Contribution)</span></h3>
        </div>
        <Link
          href={`/members?tab=internal&campaignId=${campaignId}`}
          className="text-xs text-saffron-400 hover:text-saffron-300 flex items-center gap-1"
        >
          Manage in Members <ArrowUpRight size={12} />
        </Link>
      </div>

      {memberCount > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Declared" value={formatCurrency(roster.totalDeclared)} />
          <StatTile label="Collected" value={formatCurrency(roster.totalPaid)} tone="good" />
          <StatTile label="Pending" value={formatCurrency(roster.totalPending)} tone={roster.totalPending > 0 ? 'bad' : 'neutral'} />
        </div>
      ) : (
        <p className="text-xs text-theme-fg/30 text-center py-4">No member contributions declared yet — head to Members → Internal Collection to declare one.</p>
      )}
    </div>
  );
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const { data: campaign, isLoading } = useQuery({ queryKey: ['campaign', params.id], queryFn: () => campaignsApi.get(params.id) });
  const { data: stats } = useQuery({ queryKey: ['campaign-stats', params.id], queryFn: () => campaignsApi.getStats(params.id) });

  if (isLoading || !campaign) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="skeleton h-10 w-64 rounded-xl" />
        <div className="skeleton h-32 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-theme-fg">{campaign.name}</h1>
            <span className={`badge text-xs ${STATUS_COLORS[campaign.status]}`}>{campaign.status}</span>
          </div>
          {campaign.nameMarathi && <p className="text-sm text-theme-fg/40 font-devanagari">{campaign.nameMarathi}</p>}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Collected" value={formatCurrency(stats.totalCollected || 0)} tone="good" />
          <StatTile label="Expenses" value={formatCurrency(stats.totalExpenses || 0)} tone="bad" />
          <StatTile label="Balance" value={formatCurrency(stats.netBalance || 0)} />
          <StatTile label="Pending Dues" value={formatCurrency(stats.pendingCollections || 0)} tone={stats.pendingCollections > 0 ? 'bad' : 'neutral'} />
        </div>
      )}

      <InternalCollectionSummary campaignId={params.id} />
    </div>
  );
}
