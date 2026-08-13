'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectorsApi, orgsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Plus, Phone, MapPin, TrendingUp, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatCurrency } from '@pavti/shared';
import toast from 'react-hot-toast';

export default function CollectorsPage() {
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-theme-fg">
          {language === 'mr' ? 'संग्राहक' : language === 'hi' ? 'संग्रहकर्ता' : 'Collectors'}
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus size={15} />
          {language === 'mr' ? 'संग्राहक जोडा' : 'Add Collector'}
        </button>
      </div>

      {/* Add Form */}
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

      {/* Collectors Grid */}
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
              onToggle={(id, active) => toggleMutation.mutate({ id, isActive: active })}
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
  const { data: stats } = useQuery({
    queryKey: ['collector-stats', c.id],
    queryFn: () => collectorsApi.getStats(c.id),
  });

  return (
    <div className={`glass-card-hover p-5 ${!c.isActive ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-saffron-600/20 flex items-center justify-center text-saffron-400 font-bold">
            {c.name[0]}
          </div>
          <div>
            <p className="font-semibold text-theme-fg">{c.name}</p>
            <span className={`badge text-[10px] ${c.role === 'TREASURER' ? 'badge-warning' : 'badge-neutral'}`}>
              {c.role}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onToggle(c.id, !c.isActive)} className="text-theme-fg/30 hover:text-saffron-400 transition-colors">
            {c.isActive ? <ToggleRight size={22} className="text-saffron-400" /> : <ToggleLeft size={22} />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-theme-fg/50">
          <Phone size={11} /> {c.phone}
        </div>
        {c.area && (
          <div className="flex items-center gap-2 text-xs text-theme-fg/50">
            <MapPin size={11} /> {c.area.name}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-theme-fg/8">
        <div className="text-center">
          <p className="text-xs text-theme-fg/40">Today</p>
          <p className="text-sm font-bold text-saffron-400">{formatCurrency(stats?.todayAmount || 0)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-theme-fg/40">Total</p>
          <p className="text-sm font-bold text-emerald-400">{formatCurrency(stats?.totalAmount || 0)}</p>
        </div>
      </div>
    </div>
  );
}
