'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi, receiptsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import {
  TrendingUp, Receipt, Users, Users2, Wallet, ArrowUpRight, Plus, FileText, IndianRupee
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area
} from 'recharts';
import { formatCurrency } from '@pavti/shared';
import { format } from 'date-fns';

function StatCard({ title, value, icon: Icon, change, hero, variant }: any) {
  return (
    <div className={`glass-card p-5 animate-slide-up ${hero ? 'sm:p-6' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-theme-fg/50 font-semibold uppercase tracking-wider mb-1 ${hero ? 'text-xs' : 'text-[11px]'}`}>{title}</p>
          <p className={`font-bold text-theme-fg ${hero ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight size={12} className="text-success-500" />
              <span className="text-xs text-success-500 font-semibold">{change}</span>
            </div>
          )}
        </div>
        <div
          className={`rounded-xl flex items-center justify-center shrink-0 ${
            variant === 'danger'
              ? 'w-10 h-10 text-red-700 bg-red-100/60 dark:bg-red-950/30'
              : variant === 'success'
              ? 'w-10 h-10 text-success-500 bg-emerald-100/60 dark:bg-emerald-950/30'
              : hero
              ? 'w-12 h-12 text-saffron-700 bg-saffron-100/70 dark:bg-saffron-900/30'
              : 'w-9 h-9 text-saffron-700 bg-saffron-100/50 dark:bg-saffron-900/20'
          }`}
        >
          <Icon size={hero ? 22 : 17} />
        </div>
      </div>
    </div>
  );
}

// Large, thumb-friendly tap targets
function QuickAction({ href, icon: Icon, label }: any) {
  return (
    <Link href={href} className="glass-card-hover p-4 flex flex-col items-center gap-2 text-center active:scale-95 transition-transform group">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-saffron-100/80 text-saffron-700 dark:bg-saffron-900/40 dark:text-saffron-300 group-hover:scale-105 transition-transform">
        <Icon size={20} />
      </div>
      <span className="text-xs font-bold text-theme-fg">{label}</span>
    </Link>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 text-sm">
        <p className="text-theme-fg/60 text-xs mb-1">{label}</p>
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
    en: { total: 'Total Collections', today: "Today's Collections", receipts: 'Total Receipts', todayR: "Today's Receipts", expenses: 'Total Expenses', balance: 'Net Balance', collectors: 'Active Collectors', pending: 'Expenses Awaiting Approval', newReceipt: 'New Receipt', addExpense: 'Add Expense', memberContribution: 'Member Contribution' },
    hi: { total: 'कुल संग्रह', today: 'आज का संग्रह', receipts: 'कुल रसीदें', todayR: 'आज की रसीदें', expenses: 'कुल व्यय', balance: 'शुद्ध शेष', collectors: 'सक्रिय संग्राहक', pending: 'स्वीकृति हेतु लंबित व्यय', newReceipt: 'नई रसीद', addExpense: 'व्यय जोड़ें', memberContribution: 'सदस्य योगदान' },
    mr: { total: 'एकूण संग्रह', today: 'आजचा संग्रह', receipts: 'एकूण पावत्या', todayR: 'आजच्या पावत्या', expenses: 'एकूण खर्च', balance: 'निव्वळ शिल्लक', collectors: 'सक्रिय संग्राहक', pending: 'मंजुरीच्या प्रतीक्षेतील खर्च', newReceipt: 'नवीन पावती', addExpense: 'खर्च जोडा', memberContribution: 'सभासद वर्गणी' },
  };
  const l = labels[language] || labels.en;

  if (summaryLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
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
      <div>
        <h1 className="text-2xl font-bold text-theme-fg">
          {language === 'mr' ? 'डॅशबोर्ड' : language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
        </h1>
        <p className="text-sm text-theme-fg/40 mt-0.5">
          {language === 'mr' ? `नमस्कार, ${user?.name}!` : `Welcome back, ${user?.name}!`}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <QuickAction href="/receipts/new" icon={Plus} label={l.newReceipt} />
        <QuickAction href="/expenses?new=1" icon={IndianRupee} label={l.addExpense} />
        <QuickAction href="/members?tab=internal" icon={Users2} label={l.memberContribution} />
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard hero title={l.total} value={formatCurrency(stats.totalCollections || 0)} icon={TrendingUp} />
        <StatCard hero title={l.expenses} value={formatCurrency(stats.totalExpenses || 0)} icon={IndianRupee} variant="danger" />
        <StatCard hero title={l.balance} value={formatCurrency(stats.netBalance || 0)} icon={Wallet} variant={(stats.netBalance || 0) >= 0 ? 'success' : 'danger'} />
      </div>

      {/* Supporting counts */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title={l.today} value={formatCurrency(stats.todayCollections || 0)} icon={Wallet} />
        <StatCard title={l.receipts} value={(stats.totalReceipts || 0).toLocaleString('en-IN')} icon={Receipt} />
        <StatCard title={l.todayR} value={(stats.todayReceipts || 0).toLocaleString('en-IN')} icon={FileText} />
        <StatCard title={l.collectors} value={stats.activeCollectors || 0} icon={Users} />
        <StatCard title={l.pending} value={stats.pendingExpenses || 0} icon={FileText} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Collection Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-theme-fg mb-4">
            {language === 'mr' ? 'दैनिक संग्रह (14 दिवस)' : 'Daily Collection Trend (14 days)'}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D2A46D" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#D2A46D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="#D2A46D" strokeWidth={2} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Collectors */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-theme-fg mb-4">
            {language === 'mr' ? 'संग्राहक क्रमवारी' : 'Collector Rankings'}
          </h3>
          <div className="space-y-3">
            {(collectorStats || []).slice(0, 5).map((c: any, i: number) => (
              <div key={c.collectorId} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-gold-500 text-navy-900' : i === 1 ? 'bg-theme-fg/20' : i === 2 ? 'bg-amber-800/40 text-amber-300' : 'bg-theme-fg/8 text-theme-fg/40'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-theme-fg/90 truncate">{c.collectorName}</p>
                  <p className="text-[10px] text-theme-fg/40">{c.receiptCount} receipts</p>
                </div>
                <span className="text-xs font-semibold text-saffron-400">{formatCurrency(c.totalAmount)}</span>
              </div>
            ))}
            {(!collectorStats || collectorStats.length === 0) && (
              <p className="text-xs text-theme-fg/30 text-center py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Receipts */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-theme-fg">
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
                    <div className="font-medium text-theme-fg/90">{r.donorName}</div>
                    {r.donorPhone && <div className="text-xs text-theme-fg/40">{r.donorPhone}</div>}
                  </td>
                  <td className="text-theme-fg/70">{r.collector?.name}</td>
                  <td className="font-semibold text-emerald-400">{formatCurrency(r.amount)}</td>
                  <td className="text-theme-fg/50 text-xs">{format(new Date(r.createdAt), 'dd MMM, h:mm a')}</td>
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
                <tr><td colSpan={6} className="text-center text-theme-fg/30 py-8">No receipts yet. Create your first receipt!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
