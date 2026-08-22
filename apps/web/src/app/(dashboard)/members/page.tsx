'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectorsApi, orgsApi, membersApi, campaignsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useModuleAccessResolver } from '@/hooks/useModuleAccess';
import {
  Plus, Phone, MapPin,
  Users2, ListPlus, Trash2, UserCog, Wallet, Pencil, X, KeyRound, Eye, EyeOff,
} from 'lucide-react';
import { formatCurrency, USER_ROLE_LABELS, UserRole, COLLECTION_TYPE_LABELS, CollectionType } from '@pavti/shared';
import toast from 'react-hot-toast';
import InternalCollectionManager from '@/components/internal-collection/InternalCollectionManager';
import { useCommonLabels } from '@/lib/i18n';

// ─── Polished pill toggle switch ────────────────────────────────────────────
function ToggleSwitch({ active, onChange, title }: { active: boolean; onChange: () => void; title?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      title={title}
      onClick={onChange}
      className="relative inline-flex items-center shrink-0 w-10 h-[22px] rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-500/50"
      style={{
        background: active
          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
          : 'rgba(var(--theme-fg-rgb, 60,40,20), 0.15)',
        boxShadow: active ? '0 0 0 1px rgba(34,197,94,0.3)' : '0 0 0 1px rgba(0,0,0,0.08) inset',
      }}
    >
      <span
        className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm"
        style={{
          transform: active ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.20)',
        }}
      />
    </button>
  );
}

const ACCESS_MODULES = ['Receipts', 'Expenses', 'Campaigns', 'Collectors', 'Members', 'Reports', 'Settings'];

const staffLabels = {
  en: {
    desc: 'People with logins who collect donations and issue receipts.', add: 'Add Collector', newTitle: 'New Collector',
    fullName: 'Full Name', phone: 'Phone', email: 'Email (Optional)', role: 'Role', area: 'Assigned Area', noArea: 'No specific area',
    defaultPassword: 'Leave password blank to default it to their phone number', adding: 'Adding...',
    empty: 'No collectors yet. Add your first collector!',
    setPassword: 'Set Password (Optional)', edit: 'Edit', editTitle: 'Edit Collector', save: 'Save Changes', saving: 'Saving...',
    resetPassword: 'Reset Password (leave blank to keep it unchanged)', activeLabel: 'Active — can log in and collect',
    phoneLocked: "Phone can't be changed here — contact support if it's wrong.",
    mandalReminder: (code: string) =>
      `Collectors log in with the Mandal Code ${code ? `“${code}”` : ''}, their phone number, and their password.`,
    mandalReminderLink: 'Find it in Settings →',
  },
  hi: {
    desc: 'लॉगिन वाले लोग जो दान एकत्र करते हैं और रसीदें जारी करते हैं।', add: 'संग्रहकर्ता जोड़ें', newTitle: 'नया संग्रहकर्ता',
    fullName: 'पूरा नाम', phone: 'फोन', email: 'ईमेल (वैकल्पिक)', role: 'भूमिका', area: 'नियुक्त क्षेत्र', noArea: 'कोई विशेष क्षेत्र नहीं',
    defaultPassword: 'पासवर्ड खाली छोड़ें तो डिफ़ॉल्ट उनका फोन नंबर होगा', adding: 'जोड़ा जा रहा है...',
    empty: 'अभी तक कोई संग्रहकर्ता नहीं। अपना पहला संग्रहकर्ता जोड़ें!',
    setPassword: 'पासवर्ड सेट करें (वैकल्पिक)', edit: 'संपादित करें', editTitle: 'संग्रहकर्ता संपादित करें', save: 'बदलाव सहेजें', saving: 'सहेजा जा रहा है...',
    resetPassword: 'पासवर्ड रीसेट करें (अपरिवर्तित रखने हेतु खाली छोड़ें)', activeLabel: 'सक्रिय — लॉगिन व संग्रह कर सकते हैं',
    phoneLocked: 'फोन यहां बदला नहीं जा सकता — गलत होने पर सहायता से संपर्क करें।',
    mandalReminder: (code: string) =>
      `संग्रहकर्ता मंडल कोड ${code ? `“${code}”` : ''}, उनके फोन नंबर व पासवर्ड से लॉगिन करते हैं।`,
    mandalReminderLink: 'सेटिंग्स में देखें →',
  },
  mr: {
    desc: 'लॉगिन असलेले संग्राहक व कर्मचारी.', add: 'संग्राहक जोडा', newTitle: 'नवीन संग्राहक',
    fullName: 'पूर्ण नाव', phone: 'फोन', email: 'ईमेल (पर्यायी)', role: 'भूमिका', area: 'नियुक्त क्षेत्र', noArea: 'विशिष्ट क्षेत्र नाही',
    defaultPassword: 'पासवर्ड रिकामा ठेवल्यास डीफॉल्ट त्यांचा फोन नंबर असेल', adding: 'जोडत आहे...',
    empty: 'अद्याप कोणताही संग्राहक नाही. पहिला संग्राहक जोडा!',
    setPassword: 'पासवर्ड सेट करा (पर्यायी)', edit: 'संपादित करा', editTitle: 'संग्राहक संपादित करा', save: 'बदल जतन करा', saving: 'जतन होत आहे...',
    resetPassword: 'पासवर्ड रीसेट करा (न बदलण्यासाठी रिकामे ठेवा)', activeLabel: 'सक्रिय — लॉगिन व संकलन करू शकतात',
    phoneLocked: 'फोन इथे बदलता येणार नाही — चुकीचा असल्यास सपोर्टशी संपर्क करा.',
    mandalReminder: (code: string) =>
      `संग्राहक मंडल कोड ${code ? `“${code}”` : ''}, त्यांचा फोन नंबर व पासवर्ड वापरून लॉगिन करतात.`,
    mandalReminderLink: 'सेटिंग्जमध्ये पहा →',
  },
};

// ─── Tab: Staff & Collectors ──────────────────────────────────────────────
// The people with logins who go out and collect DONATION-type receipts.
// Distinct from "Registered Members" below: staff need accounts, roles and
// permissions; members are just who owes the mandal a subscription fee.

function StaffTab() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '', role: 'COLLECTOR', areaId: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [editingCollector, setEditingCollector] = useState<any>(null);
  const { language } = useAuthStore();
  const sl = staffLabels[language] || staffLabels.en;
  const common = useCommonLabels();
  const queryClient = useQueryClient();

  const { data: collectors, isLoading } = useQuery({ queryKey: ['collectors'], queryFn: collectorsApi.list });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: orgsApi.getAreas });
  const { data: org } = useQuery({ queryKey: ['org'], queryFn: orgsApi.getMe });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => collectorsApi.create({ ...data, password: data.password || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectors'] });
      setShowForm(false);
      setFormData({ name: '', phone: '', email: '', password: '', role: 'COLLECTOR', areaId: '' });
      toast.success('Collector added!');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add collector'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      collectorsApi.update(id, { isActive }),
    onMutate: async ({ id, isActive }) => {
      // Cancel in-flight fetches so they don't overwrite our optimistic update.
      await queryClient.cancelQueries({ queryKey: ['collectors'] });
      const previous = queryClient.getQueryData(['collectors']);
      // Immediately flip the flag in the cache — UI responds instantly.
      queryClient.setQueryData(['collectors'], (old: any[]) =>
        old?.map((c) => (c.id === id ? { ...c, isActive } : c)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      // Roll back on server error so the UI stays truthful.
      queryClient.setQueryData(['collectors'], ctx?.previous);
      toast.error('Failed to update status — please try again');
    },
    onSettled: () => {
      // Background re-sync to catch any server-side side-effects.
      queryClient.invalidateQueries({ queryKey: ['collectors'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => collectorsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectors'] });
      setEditingCollector(null);
      toast.success('Collector updated!');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update collector'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-theme-fg/40 max-w-md">{sl.desc}</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus size={15} /> {sl.add}
        </button>
      </div>

      {/* Reminder: how staff actually log in — directly answers "how will
          they login for same mandal" by pointing at the Mandal Code. */}
      <div className="flex items-start sm:items-center gap-2.5 p-3.5 rounded-xl bg-saffron-500/[0.06] border border-saffron-500/20 flex-wrap">
        <KeyRound size={15} className="text-saffron-500 shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-xs text-theme-fg/65 flex-1 min-w-[200px]">{sl.mandalReminder(org?.mandalCode)}</p>
        <Link href="/settings" className="text-xs font-semibold text-saffron-600 hover:underline shrink-0">
          {sl.mandalReminderLink}
        </Link>
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-theme-fg mb-4">{sl.newTitle}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{sl.fullName} *</label>
              <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="form-input" placeholder="Amit Sharma" />
            </div>
            <div>
              <label className="form-label">{sl.phone} *</label>
              <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="form-input" placeholder="98XXXXXXXX" type="tel" inputMode="tel" />
            </div>
            <div>
              <label className="form-label">{sl.email}</label>
              <input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="form-input" placeholder="amit@email.com" type="email" />
            </div>
            <div>
              <label className="form-label">{sl.role}</label>
              <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} className="form-select">
                <option value="COLLECTOR">{USER_ROLE_LABELS[UserRole.COLLECTOR][language]}</option>
                <option value="TREASURER">{USER_ROLE_LABELS[UserRole.TREASURER][language]}</option>
              </select>
            </div>
            <div>
              <label className="form-label">{sl.area}</label>
              <select value={formData.areaId} onChange={e => setFormData(p => ({ ...p, areaId: e.target.value }))} className="form-select">
                <option value="">{sl.noArea}</option>
                {(areas || []).map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">{sl.setPassword}</label>
              <div className="relative">
                <input
                  value={formData.password}
                  onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                  className="form-input pr-10"
                  placeholder="••••••••"
                  type={showNewPassword ? 'text' : 'password'}
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-fg/30 hover:text-theme-fg/60">
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-theme-fg/30 mt-3">{sl.defaultPassword}</p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">{common.cancel}</button>
            <button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || !formData.phone || createMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? sl.adding : sl.add}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(collectors || []).map((c: any) => (
            <CollectorCard
              key={c.id}
              collector={c}
              language={language}
              onToggle={(id: string, active: boolean) => toggleMutation.mutate({ id, isActive: active })}
              onEdit={() => setEditingCollector(c)}
            />
          ))}
          {!collectors?.length && (
            <div className="col-span-3 glass-card p-12 text-center text-theme-fg/30">
              {sl.empty}
            </div>
          )}
        </div>
      )}

      {editingCollector && (
        <EditCollectorModal
          collector={editingCollector}
          areas={areas}
          language={language}
          sl={sl}
          common={common}
          isSaving={updateMutation.isPending}
          onClose={() => setEditingCollector(null)}
          onSave={(data) => updateMutation.mutate({ id: editingCollector.id, data })}
        />
      )}
    </div>
  );
}

function EditCollectorModal({ collector, areas, language, sl, common, isSaving, onClose, onSave }: any) {
  const [form, setForm] = useState({
    name: collector.name || '',
    email: collector.email || '',
    role: collector.role || 'COLLECTOR',
    areaId: collector.areaId || '',
    isActive: collector.isActive,
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = () => {
    const { password, ...rest } = form;
    onSave(password ? { ...rest, password } : rest);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-theme-fg">{sl.editTitle}</h3>
          <button onClick={onClose} className="min-w-[36px] min-h-[36px] flex items-center justify-center text-theme-fg/40 hover:text-theme-fg rounded-lg hover:bg-theme-fg/5">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="form-label">{sl.fullName} *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="form-input" />
          </div>
          <div>
            <label className="form-label"><Phone size={11} className="inline mr-1" /> {sl.phone}</label>
            <input value={collector.phone} className="form-input opacity-60 cursor-not-allowed" disabled />
            <p className="text-[11px] text-theme-fg/35 mt-1">{sl.phoneLocked}</p>
          </div>
          <div>
            <label className="form-label">{sl.email}</label>
            <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="form-input" type="email" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">{sl.role}</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="form-select">
                <option value="COLLECTOR">{USER_ROLE_LABELS[UserRole.COLLECTOR][language]}</option>
                <option value="TREASURER">{USER_ROLE_LABELS[UserRole.TREASURER][language]}</option>
              </select>
            </div>
            <div>
              <label className="form-label">{sl.area}</label>
              <select value={form.areaId} onChange={e => setForm(p => ({ ...p, areaId: e.target.value }))} className="form-select">
                <option value="">{sl.noArea}</option>
                {(areas || []).map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ToggleSwitch
              active={form.isActive}
              onChange={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
            />
            <span className="text-xs text-theme-fg/60">{sl.activeLabel}</span>
          </div>

          <div className="pt-3 border-t border-theme-fg/10">
            <label className="form-label"><KeyRound size={11} className="inline mr-1" /> {sl.resetPassword}</label>
            <div className="relative">
              <input
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="form-input pr-10"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-fg/30 hover:text-theme-fg/60">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">{common.cancel}</button>
          <button onClick={handleSave} disabled={!form.name || isSaving} className="btn-primary flex-1">
            {isSaving ? sl.saving : sl.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function CollectorCard({ collector: c, language, onToggle, onEdit }: any) {
  const { data: stats } = useQuery({ queryKey: ['collector-stats', c.id], queryFn: () => collectorsApi.getStats(c.id) });

  return (
    <div className={`glass-card-hover p-5 ${!c.isActive ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-saffron-600/20 flex items-center justify-center text-saffron-400 font-bold">
            {c.name[0]}
          </div>
          <div>
            <p className="font-semibold text-theme-fg">{c.name}</p>
            <span className={`badge text-[10px] ${c.role === 'TREASURER' ? 'badge-warning' : 'badge-neutral'}`}>{USER_ROLE_LABELS[c.role as UserRole]?.[language] || c.role}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 -mr-2 -mt-1">
          <button onClick={onEdit} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-theme-fg/30 hover:text-saffron-400 transition-colors">
            <Pencil size={16} />
          </button>
          <ToggleSwitch
              active={c.isActive}
              onChange={() => onToggle(c.id, !c.isActive)}
              title={c.isActive ? 'Deactivate' : 'Activate'}
            />
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-theme-fg/50"><Phone size={11} /> {c.phone}</div>
        {c.area && <div className="flex items-center gap-2 text-xs text-theme-fg/50"><MapPin size={11} /> {c.area.name}</div>}
      </div>

      {/* Normal donations vs Internal Collection are kept visually separate —
          folding both into one "total" misrepresents what was actually
          collected door-to-door vs. member fees the treasurer bulk-declared
          with this person only as the nominal record-holder. */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-theme-fg/8 text-center">
        <div>
          <p className="text-[10px] text-theme-fg/40 uppercase tracking-wide">🤝 {COLLECTION_TYPE_LABELS[CollectionType.DONATION][language]}</p>
          <p className="text-sm font-bold text-emerald-400">{formatCurrency(stats?.donationAmount || 0)}</p>
        </div>
        <div>
          <p className="text-[10px] text-theme-fg/40 uppercase tracking-wide">🏢 {COLLECTION_TYPE_LABELS[CollectionType.INTERNAL][language]}</p>
          <p className="text-sm font-bold text-saffron-400">{formatCurrency(stats?.internalAmount || 0)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Registered Members ──────────────────────────────────────────────

const membersLabels = {
  en: {
    desc: 'Registered mandal members — no login, used for subscriptions & member contributions.',
    bulkImport: 'Bulk Import', addMember: 'Add Member', registerTitle: 'Register Member', fullName: 'Full Name', phone: 'Phone', address: 'Address',
    registering: 'Registering...', register: 'Register Member', bulkTitle: 'Bulk Import Members',
    bulkDesc: 'One name per line — useful when onboarding an existing register of members.', importing: 'Importing...', import: 'Import Members',
    empty: 'No members registered yet. Add one or bulk-import your existing register.', deactivate: 'Deactivate', activate: 'Activate', remove: 'Remove',
    contribution: 'contribution', contributions: 'contributions', enterName: 'Enter at least one name',
  },
  hi: {
    desc: 'पंजीकृत मंडल सदस्य — कोई लॉगिन नहीं, सदस्यता व सदस्य योगदान हेतु उपयोग।',
    bulkImport: 'बल्क आयात', addMember: 'सदस्य जोड़ें', registerTitle: 'सदस्य पंजीकृत करें', fullName: 'पूरा नाम', phone: 'फोन', address: 'पता',
    registering: 'पंजीकरण हो रहा है...', register: 'सदस्य पंजीकृत करें', bulkTitle: 'सदस्य बल्क आयात करें',
    bulkDesc: 'प्रति पंक्ति एक नाम — मौजूदा सदस्य सूची जोड़ते समय उपयोगी।', importing: 'आयात हो रहा है...', import: 'सदस्य आयात करें',
    empty: 'अभी तक कोई सदस्य पंजीकृत नहीं। एक जोड़ें या मौजूदा सूची बल्क-आयात करें।', deactivate: 'निष्क्रिय करें', activate: 'सक्रिय करें', remove: 'हटाएं',
    contribution: 'योगदान', contributions: 'योगदान', enterName: 'कम से कम एक नाम दर्ज करें',
  },
  mr: {
    desc: 'नोंदणीकृत मंडळ सभासद — लॉगिन नाही, वर्गणी व सभासद वर्गणीसाठी वापर.',
    bulkImport: 'बल्क इंपोर्ट', addMember: 'सभासद जोडा', registerTitle: 'सभासद नोंदवा', fullName: 'पूर्ण नाव', phone: 'फोन', address: 'पत्ता',
    registering: 'नोंदणी होत आहे...', register: 'सभासद नोंदवा', bulkTitle: 'सभासद बल्क इंपोर्ट करा',
    bulkDesc: 'प्रत्येक ओळीत एक नाव — विद्यमान सभासद यादी जोडताना उपयुक्त.', importing: 'इंपोर्ट होत आहे...', import: 'सभासद इंपोर्ट करा',
    empty: 'अद्याप कोणताही सभासद नोंदवलेला नाही. एक जोडा किंवा विद्यमान यादी बल्क-इंपोर्ट करा.', deactivate: 'निष्क्रिय करा', activate: 'सक्रिय करा', remove: 'काढा',
    contribution: 'वर्गणी', contributions: 'वर्गण्या', enterName: 'किमान एक नाव प्रविष्ट करा',
  },
};

function RegisteredMembersTab() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [bulkNames, setBulkNames] = useState('');
  const { language } = useAuthStore();
  const ml = membersLabels[language] || membersLabels.en;
  const common = useCommonLabels();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({ queryKey: ['members'], queryFn: membersApi.list });

  const createMutation = useMutation({
    mutationFn: membersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setShowForm(false);
      setFormData({ name: '', phone: '', address: '' });
      toast.success('Member registered!');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to register member'),
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (names: string[]) => membersApi.bulkCreate(names),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setShowBulkForm(false);
      setBulkNames('');
      toast.success('Members imported!');
    },
    onError: () => toast.error('Failed to import members'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      membersApi.update(id, { isActive }),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['members'] });
      const previous = queryClient.getQueryData(['members']);
      queryClient.setQueryData(['members'], (old: any[]) =>
        old?.map((m) => (m.id === id ? { ...m, isActive } : m)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['members'], ctx?.previous);
      toast.error('Failed to update status — please try again');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => membersApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); toast.success('Member removed'); },
    onError: () => toast.error('Failed to remove member'),
  });

  const handleBulkImport = () => {
    const names = bulkNames.split('\n').map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) { toast.error(ml.enterName); return; }
    bulkCreateMutation.mutate(names);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-theme-fg/40 max-w-md">{ml.desc}</p>
        <div className="flex gap-2">
          <button onClick={() => { setShowBulkForm(!showBulkForm); setShowForm(false); }} className="btn-secondary text-sm">
            <ListPlus size={15} /> {ml.bulkImport}
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowBulkForm(false); }} className="btn-primary text-sm">
            <Plus size={15} /> {ml.addMember}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-theme-fg mb-4">{ml.registerTitle}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">{ml.fullName} *</label>
              <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="form-input" placeholder="Suresh Ramchandra Patil" />
            </div>
            <div>
              <label className="form-label"><Phone size={11} className="inline mr-1" /> {ml.phone}</label>
              <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="form-input" placeholder="98XXXXXXXX" type="tel" inputMode="tel" />
            </div>
            <div>
              <label className="form-label"><MapPin size={11} className="inline mr-1" /> {ml.address}</label>
              <input value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} className="form-input" placeholder="Ward A, Pune" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">{common.cancel}</button>
            <button onClick={() => createMutation.mutate(formData)} disabled={!formData.name || createMutation.isPending} className="btn-primary flex-1">
              {createMutation.isPending ? ml.registering : ml.register}
            </button>
          </div>
        </div>
      )}

      {showBulkForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-theme-fg mb-2">{ml.bulkTitle}</h3>
          <p className="text-xs text-theme-fg/40 mb-3">{ml.bulkDesc}</p>
          <textarea value={bulkNames} onChange={e => setBulkNames(e.target.value)} className="form-input resize-none" rows={6} placeholder={'Suresh Patil\nGanesh Joshi\nRamesh Kulkarni'} />
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowBulkForm(false)} className="btn-secondary flex-1">{common.cancel}</button>
            <button onClick={handleBulkImport} disabled={!bulkNames.trim() || bulkCreateMutation.isPending} className="btn-primary flex-1">
              {bulkCreateMutation.isPending ? ml.importing : ml.import}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(members || []).map((m: any) => (
            <div key={m.id} className={`glass-card p-4 ${!m.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-saffron-600/20 flex items-center justify-center text-saffron-400 font-semibold text-sm shrink-0">{m.name[0]}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-theme-fg text-sm truncate">{m.name}</p>
                    {m.phone && <p className="text-xs text-theme-fg/40">{m.phone}</p>}
                  </div>
                </div>
                <div className="flex items-center shrink-0 -mr-2 -mt-1">
                  <ToggleSwitch
                    active={m.isActive}
                    onChange={() => toggleMutation.mutate({ id: m.id, isActive: !m.isActive })}
                    title={m.isActive ? ml.deactivate : ml.activate}
                  />
                  <button onClick={() => deleteMutation.mutate(m.id)} className="min-w-[40px] min-h-[40px] flex items-center justify-center text-theme-fg/30 hover:text-red-400 transition-colors" title={ml.remove}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {m.address && <p className="text-xs text-theme-fg/40 truncate">{m.address}</p>}
              {m._count && <p className="text-[10px] text-theme-fg/30 mt-1.5">{m._count.contributions} {m._count.contributions === 1 ? ml.contribution : ml.contributions}</p>}
            </div>
          ))}
          {!members?.length && (
            <div className="col-span-full glass-card p-12 text-center text-theme-fg/30">
              <Users2 size={28} className="mx-auto mb-2 opacity-50" />
              {ml.empty}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Member Contributions ─────────────────────────────────────────────

const internalLabels = {
  en: {
    campaign: 'Event:', selectCampaign: 'Select an active event…',
    noCampaign: 'No active event — Member Contributions needs a running event to declare fees against. Activate one from the Events page first.',
    pickCampaign: 'Pick an active event above to manage its member-contribution roster.',
  },
  hi: {
    campaign: 'इवेंट / उत्सव:', selectCampaign: 'एक सक्रिय इवेंट चुनें…',
    noCampaign: 'कोई सक्रिय इवेंट नहीं — सदस्य योगदान के लिए एक सक्रिय इवेंट आवश्यक है। पहले इवेंट्स पेज से एक सक्रिय करें।',
    pickCampaign: 'सदस्य योगदान सूची प्रबंधित करने हेतु ऊपर एक इवेंट चुनें।',
  },
  mr: {
    campaign: 'इवेंट / उत्सव:', selectCampaign: 'सक्रिय इवेंट निवडा…',
    noCampaign: 'सक्रिय इवेंट / उपक्रम नाही — सभासद वर्गणीसाठी सुरू असलेला इवेंट आवश्यक आहे. आधी इवेंट्स पानावरून एक सक्रिय करा.',
    pickCampaign: 'सभासद वर्गणी यादी व्यवस्थापित करण्यासाठी वरून इवेंट निवडा.',
  },
};

function InternalCollectionTab({ initialCampaignId }: { initialCampaignId?: string }) {
  const { activeCampaignId, language } = useAuthStore();
  const il = internalLabels[language] || internalLabels.en;
  const { data: campaigns } = useQuery({ queryKey: ['campaigns'], queryFn: campaignsApi.list });
  const activeCampaigns = (campaigns || []).filter((c: any) => c.status === 'ACTIVE');
  const [campaignId, setCampaignId] = useState(initialCampaignId || activeCampaignId || '');

  useEffect(() => {
    if (!campaignId && activeCampaigns.length) setCampaignId(activeCampaigns[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCampaigns.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs text-theme-fg/40 shrink-0">{il.campaign}</label>
        <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="form-select text-sm max-w-xs">
          <option value="">{il.selectCampaign}</option>
          {activeCampaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!activeCampaigns.length ? (
        <div className="glass-card p-12 text-center text-theme-fg/30">{il.noCampaign}</div>
      ) : campaignId ? (
        <InternalCollectionManager campaignId={campaignId} />
      ) : (
        <div className="glass-card p-12 text-center text-theme-fg/30">{il.pickCampaign}</div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

type TabKey = 'staff' | 'members' | 'internal';

export default function MembersPage() {
  const { language } = useAuthStore();
  const canView = useModuleAccessResolver();
  const searchParams = useSearchParams();

  const canSeeStaff = canView('Collectors');
  const canSeeMembers = canView('Members');

  const tabLabels = {
    en: {
      staff: 'Staff & Collectors',
      staffShort: 'Staff',
      members: 'Registered Members',
      membersShort: 'Members',
      internal: 'Member Contributions',
      internalShort: 'Contributions',
      subtitle: 'Staff who collect, members who contribute, and member contributions — all in one place.',
      noAccess: "You don't have access to this section.",
    },
    hi: {
      staff: 'स्टाफ व संग्रहकर्ता',
      staffShort: 'स्टाफ',
      members: 'पंजीकृत सदस्य',
      membersShort: 'सदस्य',
      internal: 'सदस्य योगदान',
      internalShort: 'योगदान',
      subtitle: 'संग्रह करने वाला स्टाफ, योगदान देने वाले सदस्य, और सदस्य योगदान — सब एक जगह।',
      noAccess: 'आपको इस अनुभाग तक पहुंच नहीं है।',
    },
    mr: {
      staff: 'स्टाफ व संग्राहक',
      staffShort: 'स्टाफ',
      members: 'नोंदणीकृत सभासद',
      membersShort: 'सभासद',
      internal: 'सभासद वर्गणी',
      internalShort: 'वर्गणी',
      subtitle: 'संकलन करणारे स्टाफ, वर्गणी देणारे सभासद, आणि सभासद वर्गणी — सर्व एका ठिकाणी.',
      noAccess: 'तुम्हाला या विभागात प्रवेश नाही.',
    },
  };
  const tl = tabLabels[language] || tabLabels.en;

  const tabs: { key: TabKey; label: string; shortLabel: string; icon: any; visible: boolean }[] = [
    { key: 'staff', label: tl.staff, shortLabel: tl.staffShort, icon: UserCog, visible: canSeeStaff },
    { key: 'members', label: tl.members, shortLabel: tl.membersShort, icon: Users2, visible: canSeeMembers },
    { key: 'internal', label: tl.internal, shortLabel: tl.internalShort, icon: Wallet, visible: canSeeMembers },
  ];
  const visibleTabs = tabs.filter((t) => t.visible);

  const requestedTab = searchParams.get('tab') as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    (requestedTab && visibleTabs.some((t) => t.key === requestedTab)) ? requestedTab : (visibleTabs[0]?.key || 'staff'),
  );

  if (!visibleTabs.length) {
    return <div className="glass-card p-12 text-center text-theme-fg/30">{tl.noAccess}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-fg">
          {language === 'mr' ? 'सभासद' : language === 'hi' ? 'सदस्य' : 'Members'}
        </h1>
        <p className="text-xs text-theme-fg/40 mt-0.5">{tl.subtitle}</p>
      </div>

      {/* Zero-Overflow Mobile Grid Segmented Control */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-saffron-100/60 dark:bg-navy-800 rounded-2xl border border-theme/20 shadow-xs">
        {visibleTabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl text-center transition-all duration-200 ${
                isActive
                  ? 'bg-saffron-700 text-white shadow-sm font-bold'
                  : 'text-theme-fg/70 hover:text-theme-fg hover:bg-white/50 dark:hover:bg-white/5 font-medium'
              }`}
            >
              <t.icon size={16} className={isActive ? 'text-white' : 'text-saffron-700 dark:text-saffron-300 shrink-0'} />
              <span className="text-[11px] sm:text-xs md:text-sm leading-tight truncate sm:whitespace-nowrap">
                <span className="sm:hidden">{t.shortLabel}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === 'staff' && canSeeStaff && <StaffTab />}
      {activeTab === 'members' && canSeeMembers && <RegisteredMembersTab />}
      {activeTab === 'internal' && canSeeMembers && <InternalCollectionTab initialCampaignId={searchParams.get('campaignId') || undefined} />}
    </div>
  );
}
