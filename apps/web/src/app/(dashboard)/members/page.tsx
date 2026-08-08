'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Plus, Phone, MapPin, Users2, Trash2, ToggleLeft, ToggleRight, ListPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MembersPage() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [bulkNames, setBulkNames] = useState('');
  const { language } = useAuthStore();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member removed');
    },
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
        <div>
          <h1 className="text-2xl font-bold text-theme-fg">
            {language === 'mr' ? 'सभासद नोंदणी' : language === 'hi' ? 'सदस्य पंजीकरण' : 'Members'}
          </h1>
          <p className="text-xs text-theme-fg/40 mt-0.5">
            {language === 'mr' ? 'सभासद व वर्गणी नोंदणी' : 'Registered members for subscriptions & Internal Collection'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowBulkForm(!showBulkForm); setShowForm(false); }} className="btn-secondary text-sm">
            <ListPlus size={15} /> Bulk Import
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowBulkForm(false); }} className="btn-primary text-sm">
            <Plus size={15} /> Add Member
          </button>
        </div>
      </div>

      {/* Add Form */}
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
            <button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || createMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? 'Registering...' : 'Register Member'}
            </button>
          </div>
        </div>
      )}

      {/* Bulk Import Form */}
      {showBulkForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-theme-fg mb-2">Bulk Import Members</h3>
          <p className="text-xs text-theme-fg/40 mb-3">One name per line — useful when onboarding an existing register of members.</p>
          <textarea
            value={bulkNames}
            onChange={e => setBulkNames(e.target.value)}
            className="form-input resize-none"
            rows={6}
            placeholder={'Suresh Patil\nGanesh Joshi\nRamesh Kulkarni'}
          />
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowBulkForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleBulkImport}
              disabled={!bulkNames.trim() || bulkCreateMutation.isPending}
              className="btn-primary flex-1"
            >
              {bulkCreateMutation.isPending ? 'Importing...' : 'Import Members'}
            </button>
          </div>
        </div>
      )}

      {/* Members List */}
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
                  <div className="w-9 h-9 rounded-full bg-saffron-600/20 flex items-center justify-center text-saffron-400 font-semibold text-sm shrink-0">
                    {m.name[0]}
                  </div>
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
              {m._count && (
                <p className="text-[10px] text-theme-fg/30 mt-1.5">{m._count.contributions} contribution{m._count.contributions === 1 ? '' : 's'}</p>
              )}
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
