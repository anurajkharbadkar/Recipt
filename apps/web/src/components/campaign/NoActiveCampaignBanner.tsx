'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { CalendarPlus, Sparkles, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NoActiveCampaignBanner() {
  const { language, setActiveCampaign, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const currentYear = new Date().getFullYear();

  const [form, setForm] = useState({
    name: `Ganesh Utsav ${currentYear}`,
    nameMarathi: `श्री गणेशोत्सव ${currentYear}`,
    year: currentYear,
    startDate: new Date().toISOString().split('T')[0],
    targetAmount: '',
  });

  const isAdmin = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN';

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignsApi.list,
  });

  const activeCampaigns = campaigns?.filter((c: any) => c.status === 'ACTIVE') || [];

  const createMutation = useMutation({
    mutationFn: campaignsApi.create,
    onSuccess: (newCampaign) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setActiveCampaign(newCampaign.id);
      setShowModal(false);
      toast.success('Active campaign created!');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create campaign');
    },
  });

  if (isLoading || activeCampaigns.length > 0) {
    return null;
  }

  const text = {
    mr: {
      title: 'कोणताही सक्रिय उत्सव / इवेंट उपलब्ध नाही',
      subtitle: 'पावती पुस्तक सुरू करण्यासाठी आणि देणग्या जमा करण्यासाठी नवीन उत्सव किंवा उपक्रम तयार करा.',
      btn: '+ नवीन उत्सव तयार करा',
      modalTitle: 'नवीन उत्सव / उपक्रम (Event) तयार करा',
      nameLabel: 'उत्सवाचे नाव (इंग्रजीत) *',
      nameMarathiLabel: 'उत्सवाचे नाव (मराठीत)',
      targetLabel: 'लक्ष्य रक्कम (₹)',
      submitBtn: 'उत्सव सुरू करा',
    },
    hi: {
      title: 'कोई सक्रिय उत्सव / इवेंट उपलब्ध नहीं है',
      subtitle: 'रसीद बुक शुरू करने और दान एकत्र करने के लिए एक नया उत्सव या इवेंट बनाएं।',
      btn: '+ नया इवेंट बनाएं',
      modalTitle: 'नया उत्सव / इवेंट बनाएं',
      nameLabel: 'इवेंट का नाम *',
      nameMarathiLabel: 'मराठी / स्थानीय नाम',
      targetLabel: 'लक्ष्य राशि (₹)',
      submitBtn: 'इवेंट शुरू करें',
    },
    en: {
      title: 'No Active Festival or Event Campaign',
      subtitle: 'Create a campaign (e.g., Ganesh Utsav 2026, Navratri 2026) to start issuing receipts and tracking collections.',
      btn: '+ Create Active Event',
      modalTitle: 'Create New Active Event Campaign',
      nameLabel: 'Event Name (English) *',
      nameMarathiLabel: 'Event Name (Marathi / Local)',
      targetLabel: 'Target Amount (₹)',
      submitBtn: 'Create Event Campaign',
    },
  };

  const t = text[language] || text.mr;

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Please enter an event name');
    createMutation.mutate({
      name: form.name.trim(),
      nameMarathi: form.nameMarathi.trim() || undefined,
      year: Number(form.year),
      startDate: form.startDate,
      targetAmount: form.targetAmount ? Number(form.targetAmount) : undefined,
      status: 'ACTIVE',
    });
  };

  return (
    <>
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 md:px-6 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <CalendarPlus size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-theme-fg">{t.title}</p>
              <p className="text-xs text-theme-fg/60 mt-0.5">{t.subtitle}</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary text-xs font-semibold px-4 min-h-[38px] shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Sparkles size={14} />
              {t.btn}
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 animate-scale-in space-y-5 bg-white dark:bg-[#1C1611]">
            <div className="flex items-center justify-between pb-3 border-b border-theme/30">
              <h3 className="text-base font-bold text-theme-fg flex items-center gap-2">
                <CalendarPlus size={18} className="text-saffron-500" />
                {t.modalTitle}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-theme-fg/40 hover:text-theme-fg text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickCreate} className="space-y-4">
              <div>
                <label className="form-label">{t.nameLabel}</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="form-input text-sm"
                  placeholder="Ganesh Utsav 2026"
                />
              </div>

              <div>
                <label className="form-label">{t.nameMarathiLabel}</label>
                <input
                  type="text"
                  value={form.nameMarathi}
                  onChange={(e) => setForm((p) => ({ ...p, nameMarathi: e.target.value }))}
                  className="form-input text-sm font-devanagari"
                  placeholder="श्री गणेशोत्सव 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Year / वर्ष</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))}
                    className="form-input text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="form-label">{t.targetLabel}</label>
                  <input
                    type="number"
                    value={form.targetAmount}
                    onChange={(e) => setForm((p) => ({ ...p, targetAmount: e.target.value }))}
                    className="form-input text-sm font-mono"
                    placeholder="100000"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-theme/30">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  {createMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  {t.submitBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
