'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { reportsApi, receiptsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@pavti/shared';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FileText, FileSpreadsheet, Download, TrendingUp, TrendingDown, Wallet, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, Legend, AreaChart, Area, Line, ComposedChart
} from 'recharts';

const COLORS = ['#D2A46D', '#71471D', '#147214', '#3498db', '#9b59b6', '#e74c3c', '#AF8C62', '#995C21'];

const labels = {
  en: {
    title: 'Reports & Analytics', subtitle: 'Practical, exportable reports for your committee and audit records.',
    downloadsTitle: 'Generate Reports', downloadsDesc: 'Formal documents built from the same figures shown below.',
    incomeExpStatement: 'Income & Expenditure Statement', incomeExpDesc: 'Category-wise summary with net surplus/deficit — ready to print & sign.',
    donorRegister: 'Donor / Receipt Register', donorRegisterDesc: 'Every receipt with donor, amount & collector — opens in Excel.',
    expenseRegister: 'Expense Register', expenseRegisterDesc: 'Every logged expense with category, vendor & payment mode.',
    downloadPdf: 'Download PDF', downloadExcel: 'Download Excel',
    income: 'Total Income', expense: 'Total Expense', balance: 'Net Balance',
    trendsHeading: 'Trends', breakdownHeading: 'Collection Breakdown', donorsHeading: 'Top Donors',
    dailyTrend: 'Daily Collection Trend (30 days)', incomeExpTrend: 'Income vs Expense Trend (30 days)',
    donationVsInternal: 'Donation vs Internal Collection', donations: 'Donations', internalCollections: 'Internal Collections',
    byCollector: 'Collector-wise Collections', byArea: 'Area-wise Collections', byCategory: 'Category-wise Collections',
    topDonorsTitle: 'Top Donors', noDonorData: 'No donor data yet', receipts: 'receipts', donations2: 'donations',
    permissionNote: 'Downloadable reports are available to Org Admins & Treasurers.',
  },
  hi: {
    title: 'रिपोर्ट व विश्लेषण', subtitle: 'आपकी समिति व ऑडिट रिकॉर्ड के लिए व्यावहारिक, डाउनलोड योग्य रिपोर्ट।',
    downloadsTitle: 'रिपोर्ट तैयार करें', downloadsDesc: 'नीचे दिखाए गए आँकड़ों से बने औपचारिक दस्तावेज़।',
    incomeExpStatement: 'आय व व्यय विवरण', incomeExpDesc: 'श्रेणीवार सारांश शुद्ध बचत/घाटे सहित — प्रिंट व हस्ताक्षर के लिए तैयार।',
    donorRegister: 'दानदाता / रसीद रजिस्टर', donorRegisterDesc: 'हर रसीद दानदाता, राशि व संग्रहकर्ता सहित — Excel में खुलती है।',
    expenseRegister: 'व्यय रजिस्टर', expenseRegisterDesc: 'हर दर्ज व्यय श्रेणी, विक्रेता व भुगतान विधि सहित।',
    downloadPdf: 'PDF डाउनलोड करें', downloadExcel: 'Excel डाउनलोड करें',
    income: 'कुल आय', expense: 'कुल व्यय', balance: 'शुद्ध शेष',
    trendsHeading: 'रुझान', breakdownHeading: 'संग्रह विवरण', donorsHeading: 'शीर्ष दानदाता',
    dailyTrend: 'दैनिक संग्रह रुझान (30 दिन)', incomeExpTrend: 'आय बनाम व्यय रुझान (30 दिन)',
    donationVsInternal: 'दान बनाम आंतरिक संग्रह', donations: 'दान', internalCollections: 'आंतरिक संग्रह',
    byCollector: 'संग्रहकर्तानुसार संग्रह', byArea: 'क्षेत्रनुसार संग्रह', byCategory: 'श्रेणीनुसार संग्रह',
    topDonorsTitle: 'शीर्ष दानदाता', noDonorData: 'अभी कोई दानदाता डेटा नहीं', receipts: 'रसीदें', donations2: 'दान',
    permissionNote: 'डाउनलोड योग्य रिपोर्ट संस्था प्रशासक व कोषाध्यक्ष के लिए उपलब्ध हैं।',
  },
  mr: {
    title: 'अहवाल व विश्लेषण', subtitle: 'तुमच्या समितीसाठी व ऑडिटसाठी व्यावहारिक, डाउनलोड करता येणारे अहवाल.',
    downloadsTitle: 'अहवाल तयार करा', downloadsDesc: 'खाली दाखवलेल्या आकड्यांवरून बनवलेली अधिकृत कागदपत्रे.',
    incomeExpStatement: 'जमा-खर्च विवरणपत्र', incomeExpDesc: 'प्रकारनिहाय सारांश निव्वळ शिल्लक/तुटीसह — प्रिंट व स्वाक्षरीसाठी तयार.',
    donorRegister: 'देणगीदार / पावती नोंदवही', donorRegisterDesc: 'प्रत्येक पावती देणगीदार, रक्कम व संग्राहकासह — Excel मध्ये उघडते.',
    expenseRegister: 'खर्च नोंदवही', expenseRegisterDesc: 'प्रत्येक नोंदवलेला खर्च प्रकार, विक्रेता व देय पद्धतीसह.',
    downloadPdf: 'PDF डाउनलोड करा', downloadExcel: 'Excel डाउनलोड करा',
    income: 'एकूण जमा', expense: 'एकूण खर्च', balance: 'निव्वळ शिल्लक',
    trendsHeading: 'कल', breakdownHeading: 'संग्रह विश्लेषण', donorsHeading: 'शीर्ष देणगीदार',
    dailyTrend: 'दैनिक संग्रह कल (30 दिवस)', incomeExpTrend: 'जमा वि. खर्च कल (30 दिवस)',
    donationVsInternal: 'देणगी वि. अंतर्गत संग्रह', donations: 'देणग्या', internalCollections: 'अंतर्गत संग्रह',
    byCollector: 'संग्राहकनिहाय संग्रह', byArea: 'क्षेत्रनिहाय संग्रह', byCategory: 'प्रकारनिहाय संग्रह',
    topDonorsTitle: 'शीर्ष देणगीदार', noDonorData: 'अद्याप देणगीदार माहिती नाही', receipts: 'पावत्या', donations2: 'देणग्या',
    permissionNote: 'डाउनलोड करता येणारे अहवाल संस्था प्रशासक व कोषाध्यक्ष यांच्यासाठी उपलब्ध आहेत.',
  },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 text-sm border border-theme-fg/10">
        <p className="text-theme-fg/60 text-xs mb-1">{label}</p>
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

function downloadBlob(data: BlobPart, filename: string) {
  const blob = data instanceof Blob ? data : new Blob([data]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { activeCampaignId, language, user } = useAuthStore();
  const l = labels[language as 'en' | 'hi' | 'mr'] || labels.en;
  const canDownload = user?.role === 'ORG_ADMIN' || user?.role === 'TREASURER';
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const { data: summary } = useQuery({
    queryKey: ['reports', 'summary', activeCampaignId],
    queryFn: () => reportsApi.summary(activeCampaignId || undefined),
  });
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
    enabled: canDownload,
  });
  const { data: collectionType } = useQuery({
    queryKey: ['reports', 'collection-type', activeCampaignId],
    queryFn: () => reportsApi.collectionType(activeCampaignId || undefined),
  });
  const { data: incomeExpense } = useQuery({
    queryKey: ['reports', 'income-expense-trend', activeCampaignId],
    queryFn: () => reportsApi.incomeExpenseTrend(activeCampaignId || undefined, 30),
  });

  const incomeExpStatementMutation = useMutation({
    mutationFn: () => reportsApi.downloadIncomeExpenditurePdf(activeCampaignId || undefined),
    onMutate: () => setDownloadingKey('statement'),
    onSuccess: (data) => {
      downloadBlob(data, `income-expenditure-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success(l.incomeExpStatement + ' ✓');
    },
    onError: () => toast.error('Could not generate PDF'),
    onSettled: () => setDownloadingKey(null),
  });

  const donorRegisterMutation = useMutation({
    mutationFn: () => receiptsApi.exportCsv(activeCampaignId || undefined),
    onMutate: () => setDownloadingKey('donors'),
    onSuccess: (data) => {
      downloadBlob(data, `receipts-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      toast.success(l.donorRegister + ' ✓');
    },
    onError: () => toast.error('Could not export CSV'),
    onSettled: () => setDownloadingKey(null),
  });

  const expenseRegisterMutation = useMutation({
    mutationFn: () => reportsApi.downloadExpensesCsv(activeCampaignId || undefined),
    onMutate: () => setDownloadingKey('expenses'),
    onSuccess: (data) => {
      downloadBlob(data, `expense-register-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      toast.success(l.expenseRegister + ' ✓');
    },
    onError: () => toast.error('Could not export CSV'),
    onSettled: () => setDownloadingKey(null),
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

  const netBalance = summary?.netBalance ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-theme-fg">{l.title}</h1>
        <p className="text-xs sm:text-sm text-theme-fg/50 mt-1">{l.subtitle}</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="glass-card p-4 sm:p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-theme-fg/50">{l.income}</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-400 truncate">{formatCurrency(summary?.totalCollections || 0)}</p>
          </div>
        </div>
        <div className="glass-card p-4 sm:p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
            <TrendingDown size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-theme-fg/50">{l.expense}</p>
            <p className="text-lg sm:text-xl font-bold text-red-400 truncate">{formatCurrency(summary?.totalExpenses || 0)}</p>
          </div>
        </div>
        <div className="glass-card p-4 sm:p-5 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${netBalance >= 0 ? 'bg-saffron-500/10 text-saffron-400' : 'bg-red-500/10 text-red-400'}`}>
            <Wallet size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-theme-fg/50">{l.balance}</p>
            <p className={`text-lg sm:text-xl font-bold truncate ${netBalance >= 0 ? 'text-saffron-400' : 'text-red-400'}`}>{formatCurrency(netBalance)}</p>
          </div>
        </div>
      </div>

      {/* Downloadable reports */}
      <div className="glass-card p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-theme-fg">{l.downloadsTitle}</h2>
          <p className="text-xs text-theme-fg/50 mt-0.5">{l.downloadsDesc}</p>
        </div>
        {!canDownload ? (
          <p className="text-xs text-theme-fg/40 text-center py-4">{l.permissionNote}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-theme-fg/10 bg-theme-fg/[0.02] flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold text-theme-fg flex items-center gap-1.5"><FileText size={15} className="text-saffron-400" /> {l.incomeExpStatement}</p>
                <p className="text-xs text-theme-fg/50 mt-1 leading-relaxed">{l.incomeExpDesc}</p>
              </div>
              <button
                onClick={() => incomeExpStatementMutation.mutate()}
                disabled={downloadingKey === 'statement'}
                className="btn-secondary text-xs py-2.5 mt-auto justify-center"
              >
                {downloadingKey === 'statement' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {l.downloadPdf}
              </button>
            </div>
            <div className="p-4 rounded-xl border border-theme-fg/10 bg-theme-fg/[0.02] flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold text-theme-fg flex items-center gap-1.5"><FileSpreadsheet size={15} className="text-emerald-400" /> {l.donorRegister}</p>
                <p className="text-xs text-theme-fg/50 mt-1 leading-relaxed">{l.donorRegisterDesc}</p>
              </div>
              <button
                onClick={() => donorRegisterMutation.mutate()}
                disabled={downloadingKey === 'donors'}
                className="btn-secondary text-xs py-2.5 mt-auto justify-center"
              >
                {downloadingKey === 'donors' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {l.downloadExcel}
              </button>
            </div>
            <div className="p-4 rounded-xl border border-theme-fg/10 bg-theme-fg/[0.02] flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold text-theme-fg flex items-center gap-1.5"><FileSpreadsheet size={15} className="text-emerald-400" /> {l.expenseRegister}</p>
                <p className="text-xs text-theme-fg/50 mt-1 leading-relaxed">{l.expenseRegisterDesc}</p>
              </div>
              <button
                onClick={() => expenseRegisterMutation.mutate()}
                disabled={downloadingKey === 'expenses'}
                className="btn-secondary text-xs py-2.5 mt-auto justify-center"
              >
                {downloadingKey === 'expenses' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {l.downloadExcel}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trends */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-theme-fg/50 px-1">{l.trendsHeading}</h2>

        <div className="glass-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-theme-fg mb-4">{l.dailyTrend}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyChartData}>
              <defs>
                <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D2A46D" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#D2A46D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="#D2A46D" strokeWidth={2} fill="url(#dailyGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-theme-fg mb-4">{l.incomeExpTrend}</h3>
          <ResponsiveContainer width="100%" height={200}>
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
      </div>

      {/* Breakdown */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-theme-fg/50 px-1">{l.breakdownHeading}</h2>

        <div className="glass-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-theme-fg mb-4">{l.donationVsInternal}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <p className="form-label">🤝 {l.donations}</p>
              <p className="text-lg sm:text-xl font-bold text-success-500">{formatCurrency(donationAmount)}</p>
              <p className="text-xs text-theme-fg/50 mt-1">{donationCount} {l.receipts}</p>
            </div>
            <div className="glass-card p-4">
              <p className="form-label">🏢 {l.internalCollections}</p>
              <p className="text-lg sm:text-xl font-bold text-saffron-700 dark:text-saffron-300">{formatCurrency(internalAmount)}</p>
              <p className="text-xs text-theme-fg/50 mt-1">{internalCount} {l.receipts}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <div className="glass-card p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-theme-fg mb-4">{l.byCollector}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(collectors || []).slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="collectorName" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalAmount" fill="#D2A46D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-theme-fg mb-4">{l.byArea}</h3>
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

        <div className="glass-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-theme-fg mb-4">{l.byCategory}</h3>
          <div className="space-y-3">
            {(categories || []).map((c: any, i: number) => {
              const total = (categories || []).reduce((s: number, x: any) => s + (x._sum?.amount || 0), 0);
              const pct = total > 0 ? ((c._sum?.amount || 0) / total * 100).toFixed(1) : '0';
              return (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-theme-fg/70">{c.category}</span>
                    <span className="text-saffron-400 font-semibold">{formatCurrency(c._sum?.amount || 0)} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-theme-fg/8 rounded-full">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
            {!(categories || []).length && <p className="text-theme-fg/30 text-sm text-center py-6">—</p>}
          </div>
        </div>
      </div>

      {/* Top Donors */}
      {canDownload && (
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-theme-fg/50 px-1">{l.donorsHeading}</h2>
          <div className="glass-card p-4 sm:p-5">
            <div className="space-y-3">
              {(topDonors || []).map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-theme-fg/10 text-theme-fg/50'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-theme-fg/90 truncate">{d.donorName}</p>
                    <p className="text-xs text-theme-fg/40">{d.donationCount} {l.donations2}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 shrink-0">{formatCurrency(d.totalAmount)}</span>
                </div>
              ))}
              {(!topDonors?.length) && (
                <p className="text-theme-fg/30 text-sm text-center py-6">{l.noDonorData}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
