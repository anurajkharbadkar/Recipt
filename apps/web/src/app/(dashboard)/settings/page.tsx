'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orgsApi, permissionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Building2, Phone, Mail, MapPin, Landmark, Save, Plus, Trash2, Shield, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import PermissionsMatrix from '@/components/PermissionsMatrix';
import ReceiptPreview from '@/components/receipt/ReceiptPreview';
import { RECEIPT_THEMES } from '@pavti/shared';

const ACCESS_MODULES = ['Receipts', 'Expenses', 'Campaigns', 'Collectors', 'Members', 'Reports', 'Settings'];
const CONFIGURABLE_ROLES = ['TREASURER', 'COLLECTOR', 'VIEWER'];

function AccessManagementSection() {
  const [activeRole, setActiveRole] = useState('TREASURER');
  const [matrix, setMatrix] = useState<Record<string, any>>({});
  const queryClient = useQueryClient();

  const { data: roleDefaults } = useQuery({ queryKey: ['role-defaults'], queryFn: permissionsApi.getRoleDefaults });

  useEffect(() => {
    if (!roleDefaults) return;
    const grouped: Record<string, any> = {};
    roleDefaults.forEach((row: any) => {
      grouped[row.role] = grouped[row.role] || {};
      grouped[row.role][row.module] = row;
    });
    setMatrix(grouped);
  }, [roleDefaults]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const flat: any[] = [];
      Object.entries(matrix).forEach(([role, modules]: any) => {
        Object.entries(modules).forEach(([module, perms]: any) => {
          flat.push({ role, module, ...perms });
        });
      });
      return permissionsApi.updateRoleDefaults(flat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-defaults'] });
      toast.success('Access defaults saved!');
    },
    onError: () => toast.error('Failed to save access defaults'),
  });

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={16} className="text-saffron-400" />
        <h3 className="text-sm font-semibold text-theme-fg">Access Management — Role Defaults</h3>
      </div>
      <p className="text-xs opacity-60 mb-4">
        Set default module access per role. Per-person overrides (Collectors page → Shield icon) take precedence over these defaults. Admins always have full access.
      </p>

      <div className="flex gap-2 mb-4">
        {CONFIGURABLE_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setActiveRole(role)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeRole === role ? 'bg-saffron-600 text-white' : 'bg-theme-fg/5 text-theme-fg/50 border border-theme-fg/8 hover:text-theme-fg'}`}
          >
            {role}
          </button>
        ))}
      </div>

      <PermissionsMatrix
        modules={ACCESS_MODULES}
        value={matrix[activeRole] || {}}
        onChange={(v) => setMatrix((p) => ({ ...p, [activeRole]: v }))}
      />

      <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary mt-4">
        <Save size={16} />
        {saveMutation.isPending ? 'Saving...' : 'Save Access Defaults'}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { language, organization, setOrganization, user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: org } = useQuery({ queryKey: ['org'], queryFn: orgsApi.getMe });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: orgsApi.getAreas });

  const [form, setForm] = useState<any>({});
  const [newArea, setNewArea] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name || '',
        nameMarathi: org.nameMarathi || '',
        nameHindi: org.nameHindi || '',
        address: org.address || '',
        city: org.city || '',
        state: org.state || '',
        pincode: org.pincode || '',
        phone: org.phone || '',
        email: org.email || '',
        regNumber: org.regNumber || '',
        bankName: org.bankName || '',
        bankAccountNumber: org.bankAccountNumber || '',
        bankIfsc: org.bankIfsc || '',
        bankBranch: org.bankBranch || '',
        upiId: org.upiId || '',
        brandColor: org.brandColor || '#C85000',
        receiptTemplateSettings: org.receiptTemplateSettings || { theme: 'DEFAULT' },
      });
    }
  }, [org]);

  const previewReceipt = {
    receiptNumber: 'SGM-2026-0001',
    donorName: 'Saurabh Deshpande',
    donorAddress: 'Sadashiv Peth, Pune',
    amount: 501,
    amountInWords: 'Five Hundred One Rupees Only',
    category: 'GENERAL',
    paymentMode: 'CASH',
    status: 'PAID',
    collectionType: 'EXTERNAL',
    createdAt: new Date().toISOString(),
    collector: { name: 'Demo Collector' },
    campaign: {
      name: 'Sample Campaign',
      organization: {
        ...org,
        name: form.name || org?.name,
        nameMarathi: form.nameMarathi || org?.nameMarathi,
        logoUrl: logoPreview || org?.logoUrl,
        receiptTemplateSettings: form.receiptTemplateSettings,
      },
    },
  };

  const updateMutation = useMutation({
    mutationFn: () => orgsApi.update(form),
    onSuccess: (updated) => {
      setOrganization(updated);
      queryClient.invalidateQueries({ queryKey: ['org'] });
      toast.success('Settings saved!');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload logo to server
    setUploadingLogo(true);
    const loadingToast = toast.loading('Uploading logo...');
    try {
      const res = await orgsApi.uploadLogo(file);
      setOrganization(res); // Update Zustand store (updates sidebar in real-time)
      queryClient.invalidateQueries({ queryKey: ['org'] });
      toast.success('Logo uploaded successfully!', { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload logo', { id: loadingToast });
    } finally {
      setUploadingLogo(false);
    }
  };

  const createAreaMutation = useMutation({
    mutationFn: (name: string) => orgsApi.createArea({ name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['areas'] }); setNewArea(''); toast.success('Area added!'); },
  });

  const deleteAreaMutation = useMutation({
    mutationFn: orgsApi.deleteArea,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['areas'] }); toast.success('Area deleted'); },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-theme-fg">
        {language === 'mr' ? 'सेटिंग्स' : language === 'hi' ? 'सेटिंग्स' : 'Settings'}
      </h1>

      {/* Organization Info */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 size={16} className="text-saffron-400" />
          <h3 className="text-sm font-semibold text-theme-fg">Organization Information</h3>
        </div>

        {/* Logo Upload Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 pb-6 border-b border-theme">
          {logoPreview || org?.logoUrl ? (
            <img
              src={logoPreview || org?.logoUrl}
              alt="Logo Preview"
              className="w-20 h-20 rounded-xl object-cover border border-theme bg-theme-fg/5"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-saffron-600/20 flex items-center justify-center text-saffron-400 font-bold text-2xl border border-theme">
              {form.name ? form.name[0] : 'O'}
            </div>
          )}
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <p className="text-sm font-semibold text-theme-fg">Organization Logo</p>
            <p className="text-xs opacity-60">Upload a PNG or JPG logo. Ideal size is square (e.g. 512x512px).</p>
            <div className="flex justify-center sm:justify-start gap-2">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              <label
                htmlFor="logo-upload"
                className="btn-secondary py-1.5 px-4 rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
              >
                {uploadingLogo ? 'Uploading...' : 'Choose File'}
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Organization Name *</label>
            <input value={form.name || ''} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} className="form-input" />
          </div>
          <div>
            <label className="form-label">मराठी नाव</label>
            <input value={form.nameMarathi || ''} onChange={e => setForm((p: any) => ({ ...p, nameMarathi: e.target.value }))} className="form-input font-devanagari" placeholder="श्री गणेश मंडळ" />
          </div>
          <div>
            <label className="form-label">हिंदी नाम</label>
            <input value={form.nameHindi || ''} onChange={e => setForm((p: any) => ({ ...p, nameHindi: e.target.value }))} className="form-input font-devanagari" placeholder="श्री गणेश मंडल" />
          </div>
          <div>
            <label className="form-label">Registration Number</label>
            <input value={form.regNumber || ''} onChange={e => setForm((p: any) => ({ ...p, regNumber: e.target.value }))} className="form-input" placeholder="MH/2024/001" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label"><MapPin size={11} className="inline mr-1" /> Address *</label>
            <input value={form.address || ''} onChange={e => setForm((p: any) => ({ ...p, address: e.target.value }))} className="form-input" />
          </div>
          <div>
            <label className="form-label">City *</label>
            <input value={form.city || ''} onChange={e => setForm((p: any) => ({ ...p, city: e.target.value }))} className="form-input" />
          </div>
          <div>
            <label className="form-label">State</label>
            <input value={form.state || ''} onChange={e => setForm((p: any) => ({ ...p, state: e.target.value }))} className="form-input" />
          </div>
          <div>
            <label className="form-label"><Phone size={11} className="inline mr-1" /> Phone</label>
            <input value={form.phone || ''} className="form-input opacity-60 cursor-not-allowed" disabled />
          </div>
          <div>
            <label className="form-label"><Mail size={11} className="inline mr-1" /> Email</label>
            <input value={form.email || ''} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} className="form-input" type="email" />
          </div>
        </div>
      </div>

      {/* Brand & Appearance */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Palette size={16} className="text-saffron-400" />
          <h3 className="text-sm font-semibold text-theme-fg">Brand & Appearance</h3>
        </div>
        <p className="text-xs opacity-60 mb-4">
          This color drives buttons, the active nav highlight and focus rings across the whole portal — pick once, it updates everywhere. Preview it live below; click Save Settings to keep it.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={form.brandColor || '#C85000'}
            onChange={(e) => {
              const color = e.target.value;
              setForm((p: any) => ({ ...p, brandColor: color }));
              document.documentElement.style.setProperty('--primary-brand-color', color);
            }}
            className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border border-theme p-0"
          />
          <div>
            <p className="text-sm font-medium text-theme-fg">{form.brandColor || '#C85000'}</p>
            <button
              type="button"
              onClick={() => {
                setForm((p: any) => ({ ...p, brandColor: '#C85000' }));
                document.documentElement.style.setProperty('--primary-brand-color', '#C85000');
              }}
              className="text-xs text-theme-fg/40 hover:text-theme-fg mt-0.5"
            >
              Reset to default saffron
            </button>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Landmark size={16} className="text-saffron-400" />
          <h3 className="text-sm font-semibold text-theme-fg">Bank Details</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Bank Name</label>
            <input value={form.bankName || ''} onChange={e => setForm((p: any) => ({ ...p, bankName: e.target.value }))} className="form-input" placeholder="State Bank of India" />
          </div>
          <div>
            <label className="form-label">Account Number</label>
            <input value={form.bankAccountNumber || ''} onChange={e => setForm((p: any) => ({ ...p, bankAccountNumber: e.target.value }))} className="form-input" placeholder="XXXXXXXXXXXX" />
          </div>
          <div>
            <label className="form-label">IFSC Code</label>
            <input value={form.bankIfsc || ''} onChange={e => setForm((p: any) => ({ ...p, bankIfsc: e.target.value.toUpperCase() }))} className="form-input" placeholder="SBIN0001234" />
          </div>
          <div>
            <label className="form-label">Branch</label>
            <input value={form.bankBranch || ''} onChange={e => setForm((p: any) => ({ ...p, bankBranch: e.target.value }))} className="form-input" placeholder="Pune Main Branch" />
          </div>
          <div>
            <label className="form-label">UPI ID</label>
            <input value={form.upiId || ''} onChange={e => setForm((p: any) => ({ ...p, upiId: e.target.value }))} className="form-input" placeholder="mandal@upi" />
          </div>
        </div>
      </div>

      {/* Receipt Design Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 size={16} className="text-saffron-400" />
          <h3 className="text-sm font-semibold text-theme-fg">Receipt Design Settings</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
          <div>
            <label className="form-label">Pick a Receipt Design</label>
            <p className="text-xs text-theme-fg/40 mb-3">Tap a design to use it — no setup needed.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {RECEIPT_THEMES.map(t => {
                const selected = (form.receiptTemplateSettings?.theme || 'DEFAULT') === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm((p: any) => ({
                      ...p,
                      receiptTemplateSettings: { ...p.receiptTemplateSettings, theme: t.id }
                    }))}
                    className={`rounded-xl overflow-hidden border-2 transition-all text-left ${selected ? 'border-saffron-400 ring-2 ring-saffron-400/40' : 'border-theme-fg/10 hover:border-theme-fg/30'}`}
                  >
                    <div className="h-14 flex items-center justify-center text-2xl" style={{ background: t.gradient }}>
                      {t.emoji}
                    </div>
                    <div className="px-2 py-1.5 bg-theme-fg/5">
                      <p className="text-[11px] font-medium text-theme-fg truncate">{t.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:sticky lg:top-4 lg:self-start">
            <p className="text-xs text-theme-fg/40 mb-2 text-center">Live Preview</p>
            <div className="w-[220px] scale-[0.85] origin-top mx-auto">
              <ReceiptPreview receipt={previewReceipt} />
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="btn-primary">
        <Save size={16} />
        {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
      </button>

      {/* Access Management (ORG_ADMIN only) */}
      {user?.role === 'ORG_ADMIN' && <AccessManagementSection />}

      {/* Collection Areas */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-theme-fg flex items-center gap-2">
            <MapPin size={16} className="text-saffron-400" /> Collection Areas
          </h3>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={newArea}
            onChange={e => setNewArea(e.target.value)}
            className="form-input flex-1"
            placeholder="Ward A, Market Area, etc."
          />
          <button
            onClick={() => newArea && createAreaMutation.mutate(newArea)}
            disabled={!newArea || createAreaMutation.isPending}
            className="btn-primary px-4"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {(areas || []).map((a: any) => (
            <div key={a.id} className="flex items-center justify-between p-3 bg-theme-fg/5 rounded-xl">
              <div>
                <p className="text-sm text-theme-fg">{a.name}</p>
                {a._count && <p className="text-xs text-theme-fg/40">{a._count.collectors} collectors · {a._count.receipts} receipts</p>}
              </div>
              <button
                onClick={() => deleteAreaMutation.mutate(a.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-theme-fg/30 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!areas?.length && <p className="text-xs text-theme-fg/30 text-center py-4">No collection areas defined</p>}
        </div>
      </div>
    </div>
  );
}
