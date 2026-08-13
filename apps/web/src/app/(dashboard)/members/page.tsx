'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectorsApi, orgsApi, membersApi, campaignsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useModuleAccessResolver } from '@/hooks/useModuleAccess';
import {
  Plus, Phone, MapPin, ToggleLeft, ToggleRight,
  Users2, ListPlus, Trash2, UserCog, Wallet,
} from 'lucide-react';
import { formatCurrency } from '@pavti/shared';
import toast from 'react-hot-toast';
import InternalCollectionManager from '@/components/internal-collection/InternalCollectionManager';

const ACCESS_MODULES = ['Receipts', 'Expenses', 'Campaigns', 'Collectors', 'Members', 'Reports', 'Settings'];

// ─── Tab: Staff & Collectors ──────────────────────────────────────────────
// The people with logins who go out and collect DONATION-type receipts.
// Distinct from "Registered Members" below: staff need accounts, roles and
// permissions; members are just who owes the mandal a subscription fee.

function StaffTab() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', role: 'COLLECTOR', areaId: '' });
  const { language } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: collectors, isLoading } = useQuery({ queryKey: ['collectors'], queryFn: collectorsApi.list });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: orgsApi.getAreas });

  const createMutation = useMutation({
    mutationFn: collectorsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectors'] });
      setShowForm(false);
      setFormData({ name: '', phone: '', email: '', role: 'COLLECTOR', areaId: '' });
      toast.success('Collector added!');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add collector'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: any) => collectorsApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collectors'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-theme-fg/40 max-w-md">
          {language === 'mr' ? 'लॉगिन असलेले संग्राहक व कर्मचारी.' : 'People with logins who collect donations and issue receipts.'}
        </p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus size={15} /> {language === 'mr' ? 'संग्राहक जोडा' : 'Add Collector'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-theme-fg mb-4">New Collector</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="form-input" placeholder="Amit Sharma" />
            </div>
            <div>
              <label className="form-label">Phone *</label>
              <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="form-input" placeholder="9876543210" type="tel" />
            </div>
            <div>
              <label className="form-label">Email (Optional)</label>
              <input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="form-input" placeholder="amit@email.com" type="email" />
            </div>
            <div>
              <label className="form-label">Role</label>
              <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} className="form-select">
                <option value="COLLECTOR">Collector</option>
                <option value="TREASURER">Treasurer</option>
              </select>
            </div>
            <div>
              <label className="form-label">Assigned Area</label>
              <select value={formData.areaId} onChange={e => setFormData(p => ({ ...p, areaId: e.target.value }))} className="form-select">
                <option value="">No specific area</option>
                {(areas || []).map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-theme-fg/30 mt-3">Default password will be their phone number</p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || !formData.phone || createMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? 'Adding...' : 'Add Collector'}
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
              onToggle={(id: string, active: boolean) => toggleMutation.mutate({ id, isActive: active })}
            />
          ))}
          {!collectors?.length && (
            <div className="col-span-3 glass-card p-12 text-center text-theme-fg/30">
              No collectors yet. Add your first collector!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CollectorCard({ collector: c, onToggle }: any) {
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
            <span className={`badge text-[10px] ${c.role === 'TREASURER' ? 'badge-warning' : 'badge-neutral'}`}>{c.role}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onToggle(c.id, !c.isActive)} className="text-theme-fg/30 hover:text-saffron-400 transition-colors">
            {c.isActive ? <ToggleRight size={22} className="text-saffron-400" /> : <ToggleLeft size={22} />}
          </button>
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
          <p className="text-[10px] text-theme-fg/40 uppercase tracking-wide">🤝 Donations</p>
          <p className="text-sm font-bold text-emerald-400">{formatCurrency(stats?.donationAmount || 0)}</p>
        </div>
        <div>
          <p className="text-[10px] text-theme-fg/40 uppercase tracking-wide">🏢 Internal</p>
          <p className="text-sm font-bold text-saffron-400">{formatCurrency(stats?.internalAmount || 0)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Registered Members ──────────────────────────────────────────────

function RegisteredMembersTab() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [bulkNames, setBulkNames] = useState('');
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
    mutationFn: ({ id, isActive }: any) => membersApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => membersApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); toast.success('Member removed'); },
    onError: () => toast.error('Failed to remove member'),
  });

  const handleBulkImport = () => {
    const names = bulkNames.split('\n').map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) { toast.error('Enter at least one name'); return; }
    bulkCreateMutation.mutate(names);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-theme-fg/40 max-w-md">Registered mandal members — no login, used for subscriptions & Internal Collection.</p>
        <div className="flex gap-2">
          <button onClick={() => { setShowBulkForm(!showBulkForm); setShowForm(false); }} className="btn-secondary text-sm">
            <ListPlus size={15} /> Bulk Import
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowBulkForm(false); }} className="btn-primary text-sm">
            <Plus size={15} /> Add Member
          </button>
        </div>
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-theme-fg mb-4">Register Member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="form-input" placeholder="Suresh Ramchandra Patil" />
            </div>
            <div>
              <label className="form-label"><Phone size={11} className="inline mr-1" /> Phone</label>
              <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="form-input" placeholder="9876543210" type="tel" />
            </div>
            <div>
              <label className="form-label"><MapPin size={11} className="inline mr-1" /> Address</label>
              <input value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} className="form-input" placeholder="Ward A, Pune" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => createMutation.mutate(formData)} disabled={!formData.name || createMutation.isPending} className="btn-primary flex-1">
              {createMutation.isPending ? 'Registering...' : 'Register Member'}
            </button>
          </div>
        </div>
      )}

      {showBulkForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-theme-fg mb-2">Bulk Import Members</h3>
          <p className="text-xs text-theme-fg/40 mb-3">One name per line — useful when onboarding an existing register of members.</p>
          <textarea value={bulkNames} onChange={e => setBulkNames(e.target.value)} className="form-input resize-none" rows={6} placeholder={'Suresh Patil\nGanesh Joshi\nRamesh Kulkarni'} />
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowBulkForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleBulkImport} disabled={!bulkNames.trim() || bulkCreateMutation.isPending} className="btn-primary flex-1">
              {bulkCreateMutation.isPending ? 'Importing...' : 'Import Members'}
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
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleMutation.mutate({ id: m.id, isActive: !m.isActive })} className="p-1 text-theme-fg/30 hover:text-saffron-400 transition-colors" title={m.isActive ? 'Deactivate' : 'Activate'}>
                    {m.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => deleteMutation.mutate(m.id)} className="p-1 text-theme-fg/30 hover:text-red-400 transition-colors" title="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {m.address && <p className="text-xs text-theme-fg/40 truncate">{m.address}</p>}
              {m._count && <p className="text-[10px] text-theme-fg/30 mt-1.5">{m._count.contributions} contribution{m._count.contributions === 1 ? '' : 's'}</p>}
            </div>
          ))}
          {!members?.length && (
            <div className="col-span-full glass-card p-12 text-center text-theme-fg/30">
              <Users2 size={28} className="mx-auto mb-2 opacity-50" />
              No members registered yet. Add one or bulk-import your existing register.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Internal Collection ─────────────────────────────────────────────

function InternalCollectionTab({ initialCampaignId }: { initialCampaignId?: string }) {
  const { activeCampaignId } = useAuthStore();
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
        <label className="text-xs text-theme-fg/40 shrink-0">Campaign:</label>
        <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="form-select text-sm max-w-xs">
          <option value="">Select an active campaign…</option>
          {activeCampaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!activeCampaigns.length ? (
        <div className="glass-card p-12 text-center text-theme-fg/30">
          No active campaign — Internal Collection needs a running campaign to declare fees against. Activate one from the Campaigns page first.
        </div>
      ) : campaignId ? (
        <InternalCollectionManager campaignId={campaignId} />
      ) : (
        <div className="glass-card p-12 text-center text-theme-fg/30">Pick a campaign above to manage its Internal Collection roster.</div>
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

  const tabs: { key: TabKey; label: string; icon: any; visible: boolean }[] = [
    { key: 'staff', label: 'Staff & Collectors', icon: UserCog, visible: canSeeStaff },
    { key: 'members', label: 'Registered Members', icon: Users2, visible: canSeeMembers },
    { key: 'internal', label: 'Internal Collection', icon: Wallet, visible: canSeeMembers },
  ];
  const visibleTabs = tabs.filter((t) => t.visible);

  const requestedTab = searchParams.get('tab') as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    (requestedTab && visibleTabs.some((t) => t.key === requestedTab)) ? requestedTab : (visibleTabs[0]?.key || 'staff'),
  );

  if (!visibleTabs.length) {
    return <div className="glass-card p-12 text-center text-theme-fg/30">You don't have access to this section.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-fg">
          {language === 'mr' ? 'सभासद' : language === 'hi' ? 'सदस्य' : 'Members'}
        </h1>
        <p className="text-xs text-theme-fg/40 mt-0.5">Staff who collect, members who contribute, and Internal Collection — all in one place.</p>
      </div>

      <div className="flex gap-2 border-b border-theme overflow-x-auto">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t.key ? 'border-saffron-500 text-saffron-400' : 'border-transparent text-theme-fg/50 hover:text-theme-fg'}`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'staff' && canSeeStaff && <StaffTab />}
      {activeTab === 'members' && canSeeMembers && <RegisteredMembersTab />}
      {activeTab === 'internal' && canSeeMembers && <InternalCollectionTab initialCampaignId={searchParams.get('campaignId') || undefined} />}
    </div>
  );
}
