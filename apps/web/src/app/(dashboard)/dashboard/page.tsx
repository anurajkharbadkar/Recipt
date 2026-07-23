'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi, receiptsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import {
  TrendingUp, Receipt, Users, Wallet, ArrowUpRight, Plus, FileText, IndianRupee
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area
} from 'recharts';
import { formatCurrency } from '@pavti/shared';
import { format } from 'date-fns';

function StatCard({ title, value, icon: Icon, change, color }: any) {
  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-white/45 font-medium uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight size={12} className="text-emerald-400" />
              <span className="text-xs text-emerald-400">{change}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 text-sm">
        <p className="text-white/60 text-xs mb-1">{label}</p>
        <p className="text-saffron-400 font-bold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { activeCampaignId, user, language } = useAuthStore();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['reports', 'summary', activeCampaignId],
    queryFn: () => reportsApi.summary(activeCampaignId || undefined),
  });

  const { data: dailyData } = useQuery({
    queryKey: ['reports', 'daily', activeCampaignId],
    queryFn: () => reportsApi.daily(activeCampaignId || undefined, 14),
  });

  const { data: recentReceipts } = useQuery({
    queryKey: ['receipts', 'recent'],
    queryFn: () => receiptsApi.list({ limit: 5 }),
  });

  const { data: collectorStats } = useQuery({
    queryKey: ['reports', 'collectors', activeCampaignId],
    queryFn: () => reportsApi.collectors(activeCampaignId || undefined),
  });

  const labels = {
    en: { total: 'Total Collections', today: "Today's Collections", receipts: 'Total Receipts', todayR: "Today's Receipts", expenses: 'Total Expenses', balance: 'Net Balance', collectors: 'Active Collectors', pending: 'Pending Approvals' },
    hi: { total: 'कुल संग्रह', today: 'आज का संग्रह', receipts: 'कुल रसीदें', todayR: 'आज की रसीदें', expenses: 'कुल व्यय', balance: 'शुद्ध शेष', collectors: 'सक्रिय संग्राहक', pending: 'लंबित अनुमोदन' },
    mr: { total: 'एकूण संग्रह', today: 'आजचा संग्रह', receipts: 'एकूण पावत्या', todayR: 'आजच्या पावत्या', expenses: 'एकूण खर्च', balance: 'निव्वळ शिल्लक', collectors: 'सक्रिय संग्राहक', pending: 'प्रलंबित मंजुरी' },
  };
  const l = labels[language] || labels.en;

  if (summaryLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
    );
  }

  const stats = summary || {};
  const chartData = (dailyData || []).map((d: any) => ({
    date: format(new Date(d.date), 'dd MMM'),
    amount: d.amount,
    count: d.count,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {language === 'mr' ? 'डॅशबोर्ड' : language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
          </h1>
          <p className="text-sm text-white/40 mt-0.5">
            {language === 'mr' ? `नमस्कार, ${user?.name}!` : `Welcome back, ${user?.name}!`}
          </p>
        </div>
        <Link href="/receipts/new" className="btn-primary text-sm">
          <Plus size={16} />
          {language === 'mr' ? 'नवीन पावती' : language === 'hi' ? 'नई रसीद' : 'New Receipt'}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={l.total} value={formatCurrency(stats.totalCollections || 0)} icon={TrendingUp} color="bg-saffron-600/15 text-saffron-400" />
        <StatCard title={l.today} value={formatCurrency(stats.todayCollections || 0)} icon={Wallet} color="bg-emerald-500/15 text-emerald-400" />
        <StatCard title={l.receipts} value={(stats.totalReceipts || 0).toLocaleString('en-IN')} icon={Receipt} color="bg-blue-500/15 text-blue-400" />
        <StatCard title={l.todayR} value={(stats.todayReceipts || 0).toLocaleString('en-IN')} icon={FileText} color="bg-purple-500/15 text-purple-400" />
        <StatCard title={l.expenses} value={formatCurrency(stats.totalExpenses || 0)} icon={IndianRupee} color="bg-red-500/15 text-red-400" />
        <StatCard title={l.balance} value={formatCurrency(stats.netBalance || 0)} icon={Wallet} color={`${(stats.netBalance || 0) >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`} />
        <StatCard title={l.collectors} value={stats.activeCollectors || 0} icon={Users} color="bg-amber-500/15 text-amber-400" />
        <StatCard title={l.pending} value={stats.pendingExpenses || 0} icon={FileText} color="bg-orange-500/15 text-orange-400" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Collection Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            {language === 'mr' ? 'दैनिक संग्रह (14 दिवस)' : 'Daily Collection Trend (14 days)'}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6600" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff6600" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="#ff6600" strokeWidth={2} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Collectors */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            {language === 'mr' ? 'संग्राहक क्रमवारी' : 'Collector Rankings'}
          </h3>
          <div className="space-y-3">
            {(collectorStats || []).slice(0, 5).map((c: any, i: number) => (
              <div key={c.collectorId} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-gold-500 text-navy-900' : i === 1 ? 'bg-white/20' : i === 2 ? 'bg-amber-800/40 text-amber-300' : 'bg-white/8 text-white/40'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/90 truncate">{c.collectorName}</p>
                  <p className="text-[10px] text-white/40">{c.receiptCount} receipts</p>
                </div>
                <span className="text-xs font-semibold text-saffron-400">{formatCurrency(c.totalAmount)}</span>
              </div>
            ))}
            {(!collectorStats || collectorStats.length === 0) && (
              <p className="text-xs text-white/30 text-center py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Receipts */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">
            {language === 'mr' ? 'अलीकडील पावत्या' : 'Recent Receipts'}
          </h3>
          <Link href="/receipts" className="text-xs text-saffron-400 hover:text-saffron-300 flex items-center gap-1">
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Donor</th>
                <th>Collector</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(recentReceipts?.data || []).map((r: any) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/receipts/${r.id}`} className="text-saffron-400 hover:text-saffron-300 font-medium">
                      {r.receiptNumber}
                    </Link>
                  </td>
                  <td>
                    <div className="font-medium text-white/90">{r.donorName}</div>
                    {r.donorPhone && <div className="text-xs text-white/40">{r.donorPhone}</div>}
                  </td>
                  <td className="text-white/70">{r.collector?.name}</td>
                  <td className="font-semibold text-emerald-400">{formatCurrency(r.amount)}</td>
                  <td className="text-white/50 text-xs">{format(new Date(r.createdAt), 'dd MMM, h:mm a')}</td>
                  <td>
                    {r.isVoided ? (
                      <span className="badge badge-danger">Voided</span>
                    ) : r.whatsappSent ? (
                      <span className="badge badge-success">Sent ✓</span>
                    ) : (
                      <span className="badge badge-neutral">Created</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!recentReceipts?.data?.length) && (
                <tr><td colSpan={6} className="text-center text-white/30 py-8">No receipts yet. Create your first receipt!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
