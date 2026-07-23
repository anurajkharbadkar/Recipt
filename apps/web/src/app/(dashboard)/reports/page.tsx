'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@pavti/shared';
import { format } from 'date-fns';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, Legend, AreaChart, Area, Line, ComposedChart
} from 'recharts';

const COLORS = ['#ff6600', '#ffb300', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#1abc9c', '#f39c12'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 text-sm border border-white/10">
        <p className="text-white/60 text-xs mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {typeof p.value === 'number' && p.value > 100 ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { activeCampaignId, language } = useAuthStore();

  const { data: daily } = useQuery({
    queryKey: ['reports', 'daily', activeCampaignId],
    queryFn: () => reportsApi.daily(activeCampaignId || undefined, 30),
  });
  const { data: collectors } = useQuery({
    queryKey: ['reports', 'collectors', activeCampaignId],
    queryFn: () => reportsApi.collectors(activeCampaignId || undefined),
  });
  const { data: areas } = useQuery({
    queryKey: ['reports', 'areas', activeCampaignId],
    queryFn: () => reportsApi.areas(activeCampaignId || undefined),
  });
  const { data: categories } = useQuery({
    queryKey: ['reports', 'categories', activeCampaignId],
    queryFn: () => reportsApi.categories(activeCampaignId || undefined),
  });
  const { data: topDonors } = useQuery({
    queryKey: ['reports', 'top-donors', activeCampaignId],
    queryFn: () => reportsApi.topDonors(activeCampaignId || undefined),
  });
  const { data: collectionType } = useQuery({
    queryKey: ['reports', 'collection-type', activeCampaignId],
    queryFn: () => reportsApi.collectionType(activeCampaignId || undefined),
  });
  const { data: incomeExpense } = useQuery({
    queryKey: ['reports', 'income-expense-trend', activeCampaignId],
    queryFn: () => reportsApi.incomeExpenseTrend(activeCampaignId || undefined, 30),
  });

  const dailyChartData = (daily || []).map((d: any) => ({
    date: format(new Date(d.date), 'dd MMM'),
    amount: d.amount,
    count: d.count,
  }));

  const incomeExpenseChartData = (incomeExpense || []).map((d: any) => ({
    date: format(new Date(d.date), 'dd MMM'),
    income: d.income,
    expense: d.expense,
  }));

  const donationAmount = (collectionType || []).find((c: any) => c.collectionType === 'DONATION')?._sum?.amount || 0;
  const internalAmount = (collectionType || []).find((c: any) => c.collectionType === 'INTERNAL')?._sum?.amount || 0;
  const donationCount = (collectionType || []).find((c: any) => c.collectionType === 'DONATION')?._count || 0;
  const internalCount = (collectionType || []).find((c: any) => c.collectionType === 'INTERNAL')?._count || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">
        {language === 'mr' ? 'अहवाल' : language === 'hi' ? 'रिपोर्ट' : 'Reports & Analytics'}
      </h1>

      {/* Daily Trend */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">
          {language === 'mr' ? 'दैनिक संग्रह (30 दिवस)' : 'Daily Collection Trend (30 days)'}
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={dailyChartData}>
            <defs>
              <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff6600" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ff6600" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="amount" stroke="#ff6600" strokeWidth={2} fill="url(#dailyGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Income vs Expense Trend */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">
          {language === 'mr' ? 'उत्पन्न वि. खर्च (30 दिवस)' : 'Income vs Expense Trend (30 days)'}
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={incomeExpenseChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{v}</span>} />
            <Line type="monotone" dataKey="income" name="Income" stroke="#2ecc71" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expense" name="Expense" stroke="#e74c3c" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Donation vs Internal Collection */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">
          {language === 'mr' ? 'देणगी वि. अंतर्गत संग्रह' : 'Donation vs Internal Collection'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card">
            <p className="form-label">🤝 Donations</p>
            <p className="text-xl font-bold text-emerald-400">{formatCurrency(donationAmount)}</p>
            <p className="text-xs text-white/40 mt-1">{donationCount} receipts</p>
          </div>
          <div className="stat-card">
            <p className="form-label">🏢 Internal Collections</p>
            <p className="text-xl font-bold text-saffron-400">{formatCurrency(internalAmount)}</p>
            <p className="text-xs text-white/40 mt-1">{internalCount} receipts</p>
          </div>
        </div>
      </div>

      {/* Collector & Area charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Collector Bar Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            {language === 'mr' ? 'संग्राहकनिहाय संग्रह' : 'Collector-wise Collections'}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={(collectors || []).slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="collectorName" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalAmount" fill="#ff6600" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Area Pie Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            {language === 'mr' ? 'क्षेत्रनिहाय संग्रह' : 'Area-wise Collections'}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={areas || []}
                dataKey="totalAmount"
                nameKey="areaName"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {(areas || []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category & Top Donors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            {language === 'mr' ? 'प्रकारनिहाय संग्रह' : 'Category-wise Collections'}
          </h3>
          <div className="space-y-3">
            {(categories || []).map((c: any, i: number) => {
              const total = (categories || []).reduce((s: number, x: any) => s + (x._sum?.amount || 0), 0);
              const pct = total > 0 ? ((c._sum?.amount || 0) / total * 100).toFixed(1) : '0';
              return (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/70">{c.category}</span>
                    <span className="text-saffron-400 font-semibold">{formatCurrency(c._sum?.amount || 0)} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Donors */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            {language === 'mr' ? 'शीर्ष देणगीदार' : 'Top Donors'}
          </h3>
          <div className="space-y-3">
            {(topDonors || []).map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/50'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/90 truncate">{d.donorName}</p>
                  <p className="text-xs text-white/40">{d.donationCount} donations</p>
                </div>
                <span className="text-sm font-bold text-emerald-400">{formatCurrency(d.totalAmount)}</span>
              </div>
            ))}
            {(!topDonors?.length) && (
              <p className="text-white/30 text-sm text-center py-6">No donor data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
