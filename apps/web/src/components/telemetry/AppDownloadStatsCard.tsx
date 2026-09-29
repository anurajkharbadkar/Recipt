'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone, RefreshCw, Activity, ArrowDownCircle, CheckCircle } from 'lucide-react';

interface StatsData {
  apkDownloads: number;
  pwaInstalls: number;
  lastUpdated: string;
  logs: Array<{
    type: 'apk_download' | 'pwa_install' | 'pwa_prompt_accepted';
    timestamp: string;
    userAgent?: string;
  }>;
}

export default function AppDownloadStatsCard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telemetry/download?stats=true');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch download stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalInstalls = (stats?.apkDownloads || 0) + (stats?.pwaInstalls || 0);

  return (
    <div className="card border border-amber-500/20 bg-gradient-to-br from-[#120500] via-[#1c0800] to-[#0d0300] text-white p-5 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-saffron-500/10 blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-saffron-500/20 border border-saffron-500/40 text-saffron-400">
            <Smartphone size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-200">App Downloads & Installations</h3>
            <p className="text-[11px] text-amber-200/60">Live metrics for mobile APK & web app installs</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="p-1.5 rounded-lg bg-black/40 hover:bg-black/70 border border-amber-500/30 text-amber-300 transition-all cursor-pointer active:scale-95"
          title="Refresh Statistics"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 my-2 relative z-10">
        <div className="bg-black/40 border border-amber-500/20 rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase font-bold tracking-wider text-amber-200/60">Total Downloads</p>
          <p className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">{totalInstalls}</p>
        </div>

        <div className="bg-black/40 border border-amber-500/20 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold tracking-wider text-amber-200/60">
            <Download size={11} className="text-amber-400" />
            <span>Android APK</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">{stats?.apkDownloads || 0}</p>
        </div>

        <div className="bg-black/40 border border-amber-500/20 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold tracking-wider text-amber-200/60">
            <Smartphone size={11} className="text-amber-400" />
            <span>PWA Installs</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-sky-400 mt-0.5">{stats?.pwaInstalls || 0}</p>
        </div>
      </div>

      {/* Recent Logs Preview */}
      {stats?.logs && stats.logs.length > 0 && (
        <div className="mt-4 pt-3 border-t border-amber-500/20 relative z-10">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">
            <Activity size={12} className="text-amber-400" />
            <span>Recent Activity ({stats.logs.length})</span>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {stats.logs.slice().reverse().slice(0, 4).map((log, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] bg-black/40 p-2 rounded-lg border border-amber-500/10">
                <div className="flex items-center gap-2">
                  {log.type === 'apk_download' ? (
                    <ArrowDownCircle size={13} className="text-emerald-400 shrink-0" />
                  ) : (
                    <CheckCircle size={13} className="text-sky-400 shrink-0" />
                  )}
                  <span className="font-semibold text-white">
                    {log.type === 'apk_download' ? 'Android APK Download' : 'Web App Home Screen Install'}
                  </span>
                </div>
                <span className="text-[10px] text-amber-200/50">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
