'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orgsApi, permissionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Building2, Phone, Mail, MapPin, Landmark, Save, Plus, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import PermissionsMatrix from '@/components/PermissionsMatrix';

const ACCESS_MODULES = ['Receipts', 'Expenses', 'Campaigns', 'Collectors', 'Reports', 'Settings'];
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
        <h3 className="text-sm font-semibold text-white">Access Management — Role Defaults</h3>
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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeRole === role ? 'bg-saffron-600 text-white' : 'bg-white/5 text-white/50 border border-white/8 hover:text-white'}`}
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

const TEMPLATE_FIELD_LABELS: Record<string, string> = {
  donorName: 'Donor Name',
  donorAddress: 'Address',
  amount: 'Amount',
  amountInWords: 'Amount in Words',
  receiptNumber: 'Receipt No.',
  date: 'Date',
  collectorName: 'Collector',
  areaName: 'Area',
  category: 'Category',
  paymentMode: 'Payment Mode',
  qrCode: 'QR Code',
};

// Sensible starting positions for a typical Indian receipt-book layout — auto-applied on
// upload so the admin only has to drag-adjust the ones that don't fit their design,
// instead of placing all 11 fields from scratch.
const DEFAULT_FIELD_POSITIONS: Record<string, any> = {
  receiptNumber: { xPct: 22, yPct: 8, fontSizePx: 13, bold: true },
  date: { xPct: 78, yPct: 8, fontSizePx: 12 },
  donorName: { xPct: 32, yPct: 25, fontSizePx: 15, bold: true },
  donorAddress: { xPct: 32, yPct: 33, fontSizePx: 12 },
  amount: { xPct: 50, yPct: 46, fontSizePx: 22, bold: true, align: 'center' },
  amountInWords: { xPct: 50, yPct: 53, fontSizePx: 11, align: 'center' },
  category: { xPct: 25, yPct: 61, fontSizePx: 11 },
  paymentMode: { xPct: 65, yPct: 61, fontSizePx: 11 },
  collectorName: { xPct: 20, yPct: 86, fontSizePx: 11 },
  areaName: { xPct: 20, yPct: 91, fontSizePx: 11 },
  qrCode: { xPct: 84, yPct: 84 },
};

// Realistic placeholder values so the drag editor shows what real data will actually
// look like (size/wrapping/fit) instead of a generic field-name chip.
const SAMPLE_VALUES: Record<string, string> = {
  donorName: 'Saurabh Deshpande',
  donorAddress: 'Near Ganesh Mandir, Pune',
  amount: '₹501',
  amountInWords: 'Five Hundred One Rupees Only',
  receiptNumber: 'SGM-2027-0001',
  date: '21 Jul 2026',
  collectorName: 'Rajesh Patil',
  areaName: 'Ward A',
  category: 'GENERAL',
  paymentMode: 'CASH',
  qrCode: '▦ QR',
};

function DraggableField({ fieldKey, label, pos, containerRef, selected, onSelect, onChange, onRemove }: any) {
  const dragging = useRef(false);
  const moved = useRef(false);
  const start = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    moved.current = false;
    start.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return;
    if (Math.abs(e.clientX - start.current.x) > 3 || Math.abs(e.clientY - start.current.y) > 3) {
      moved.current = true;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    onChange({ ...pos, xPct, yPct });
  };
  const handlePointerUp = () => {
    dragging.current = false;
    if (!moved.current) onSelect(fieldKey);
  };

  const alignTranslateX = pos.align === 'left' ? '0%' : pos.align === 'right' ? '-100%' : '-50%';

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        left: `${pos.xPct}%`,
        top: `${pos.yPct}%`,
        transform: `translate(${alignTranslateX}, -50%)`,
        color: pos.color || '#000000',
        fontSize: `${pos.fontSizePx || 14}px`,
        fontWeight: pos.bold ? 700 : 400,
        textAlign: pos.align || 'center',
      }}
      className={`select-none flex items-center gap-1.5 cursor-grab active:cursor-grabbing touch-none whitespace-nowrap px-1.5 py-0.5 rounded ${selected ? 'ring-2 ring-saffron-400 bg-black/10' : 'hover:bg-black/5'}`}
    >
      <span style={{ textShadow: '0 0 4px rgba(255,255,255,0.85), 0 0 4px rgba(255,255,255,0.85)' }}>
        {SAMPLE_VALUES[fieldKey] || label}
      </span>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="text-white bg-red-500 hover:bg-red-400 rounded-full w-3.5 h-3.5 flex items-center justify-center flex-shrink-0 text-[9px] leading-none"
      >✕</button>
    </div>
  );
}

function ReceiptImageEditor({ settings, onSettingsChange }: { settings: any; onSettingsChange: (s: any) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const fieldPositions = settings.fieldPositions || {};

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        try {
          const updatedOrg = await orgsApi.uploadReceiptTemplateImage(file, img.naturalWidth, img.naturalHeight);
          const uploadedSettings = updatedOrg.receiptTemplateSettings || {};
          const hasExistingPositions = uploadedSettings.fieldPositions && Object.keys(uploadedSettings.fieldPositions).length > 0;
          onSettingsChange(
            hasExistingPositions
              ? uploadedSettings
              : { ...uploadedSettings, fieldPositions: DEFAULT_FIELD_POSITIONS },
          );
          toast.success(hasExistingPositions ? 'Receipt design uploaded!' : 'Receipt design uploaded — fields auto-placed, drag to fine-tune!');
        } catch {
          toast.error('Failed to upload receipt design');
        } finally {
          setUploading(false);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const addField = (key: string) => {
    onSettingsChange({
      ...settings,
      fieldPositions: { ...fieldPositions, [key]: { xPct: 50, yPct: 50, fontSizePx: 14, color: '#000000' } },
    });
  };
  const updateField = (key: string, pos: any) => {
    onSettingsChange({ ...settings, fieldPositions: { ...fieldPositions, [key]: pos } });
  };
  const removeField = (key: string) => {
    const next = { ...fieldPositions };
    delete next[key];
    onSettingsChange({ ...settings, fieldPositions: next });
    if (selectedField === key) setSelectedField(null);
  };

  const availableFields = Object.keys(TEMPLATE_FIELD_LABELS).filter((k) => !fieldPositions[k]);

  return (
    <div className="space-y-4">
      <div>
        <input
          type="file"
          id="receipt-template-upload"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />
        <label htmlFor="receipt-template-upload" className="btn-secondary py-1.5 px-4 rounded-lg text-xs cursor-pointer inline-flex items-center gap-1.5">
          {uploading ? 'Uploading...' : settings.customImageUrl ? 'Replace Image' : 'Upload Receipt Design (JPG/PNG)'}
        </label>
      </div>

      {settings.customImageUrl && (
        <>
          <p className="text-xs text-white/50">
            Fields show sample data so you can see how real text will fit. Drag a chip to reposition it, or click it once to style it (font size, color, bold, alignment) so it matches your design. Remember to click <strong>Save Settings</strong> to persist changes.
          </p>
          <div
            ref={containerRef}
            className="relative mx-auto border border-white/10 rounded-lg overflow-hidden"
            style={{ maxWidth: 500 }}
            onClick={(e) => {
              const tag = (e.target as HTMLElement).tagName;
              if (tag === 'IMG' || e.target === containerRef.current) setSelectedField(null);
            }}
          >
            <img src={settings.customImageUrl} className="w-full block" draggable={false} alt="Receipt design" />
            {Object.entries(fieldPositions).map(([key, pos]: [string, any]) => (
              <DraggableField
                key={key}
                fieldKey={key}
                label={TEMPLATE_FIELD_LABELS[key] || key}
                pos={pos}
                containerRef={containerRef}
                selected={selectedField === key}
                onSelect={setSelectedField}
                onChange={(p: any) => updateField(key, p)}
                onRemove={() => removeField(key)}
              />
            ))}
          </div>

          {selectedField && fieldPositions[selectedField] && (
            <div className="glass-card p-3 flex flex-wrap items-center gap-4 border border-saffron-500/30 animate-slide-up">
              <span className="text-xs font-semibold text-white">{TEMPLATE_FIELD_LABELS[selectedField] || selectedField}</span>
              {selectedField === 'qrCode' ? (
                <span className="text-xs text-white/40">QR renders as an image — position only, no text styling.</span>
              ) : (
                <>
                  <label className="flex items-center gap-1.5 text-xs text-white/50">
                    Size
                    <input
                      type="range" min={8} max={40}
                      value={fieldPositions[selectedField].fontSizePx || 14}
                      onChange={(e) => updateField(selectedField, { ...fieldPositions[selectedField], fontSizePx: Number(e.target.value) })}
                      className="w-20"
                    />
                    <span className="text-white/70 w-6 text-right">{fieldPositions[selectedField].fontSizePx || 14}</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-white/50">
                    Color
                    <input
                      type="color"
                      value={fieldPositions[selectedField].color || '#000000'}
                      onChange={(e) => updateField(selectedField, { ...fieldPositions[selectedField], color: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border border-white/10 p-0"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => updateField(selectedField, { ...fieldPositions[selectedField], bold: !fieldPositions[selectedField].bold })}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${fieldPositions[selectedField].bold ? 'bg-saffron-600 text-white' : 'bg-white/5 text-white/50 border border-white/10'}`}
                  >
                    B
                  </button>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => updateField(selectedField, { ...fieldPositions[selectedField], align: a })}
                        className={`px-2 py-1 rounded text-xs transition-colors ${(fieldPositions[selectedField].align || 'center') === a ? 'bg-saffron-600 text-white' : 'bg-white/5 text-white/50 border border-white/10'}`}
                      >
                        {a === 'left' ? '⟵' : a === 'center' ? '⟷' : '⟶'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {availableFields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableFields.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => addField(key)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-saffron-600/10 text-saffron-400 border border-saffron-600/20 hover:bg-saffron-600/20 transition-colors"
                >
                  + {TEMPLATE_FIELD_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </>
      )}
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
        receiptTemplateSettings: org.receiptTemplateSettings || { theme: 'DEFAULT' },
      });
    }
  }, [org]);

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
      <h1 className="text-2xl font-bold text-white">
        {language === 'mr' ? 'सेटिंग्स' : language === 'hi' ? 'सेटिंग्स' : 'Settings'}
      </h1>

      {/* Organization Info */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 size={16} className="text-saffron-400" />
          <h3 className="text-sm font-semibold text-white">Organization Information</h3>
        </div>

        {/* Logo Upload Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 pb-6 border-b border-theme">
          {logoPreview || org?.logoUrl ? (
            <img
              src={logoPreview || org?.logoUrl}
              alt="Logo Preview"
              className="w-20 h-20 rounded-xl object-cover border border-theme bg-white/5"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-saffron-600/20 flex items-center justify-center text-saffron-400 font-bold text-2xl border border-theme">
              {form.name ? form.name[0] : 'O'}
            </div>
          )}
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <p className="text-sm font-semibold text-white">Organization Logo</p>
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

      {/* Bank Details */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Landmark size={16} className="text-saffron-400" />
          <h3 className="text-sm font-semibold text-white">Bank Details</h3>
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
          <h3 className="text-sm font-semibold text-white">Receipt Design Settings</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Receipt Template Theme</label>
            <select
              value={form.receiptTemplateSettings?.theme || 'DEFAULT'}
              onChange={e => setForm((p: any) => ({
                ...p,
                receiptTemplateSettings: { ...p.receiptTemplateSettings, theme: e.target.value }
              }))}
              className="form-select"
            >
              <option value="DEFAULT">🟠 Default Saffron Theme</option>
              <option value="GANESHOTSAV">🪔 Ganeshotsav Special Theme</option>
              <option value="EID">🌙 Eid Special Theme</option>
              <option value="BHAGAT_SINGH">🇮🇳 Bhagat Singh Mandal Theme</option>
              <option value="CUSTOM_IMAGE">📤 Custom Uploaded Design</option>
            </select>
          </div>
        </div>

        {form.receiptTemplateSettings?.theme === 'CUSTOM_IMAGE' && (
          <div className="mt-5 pt-5 border-t border-theme">
            <ReceiptImageEditor
              settings={form.receiptTemplateSettings || {}}
              onSettingsChange={(s) => setForm((p: any) => ({ ...p, receiptTemplateSettings: s }))}
            />
          </div>
        )}
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
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
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
            <div key={a.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div>
                <p className="text-sm text-white">{a.name}</p>
                {a._count && <p className="text-xs text-white/40">{a._count.collectors} collectors · {a._count.receipts} receipts</p>}
              </div>
              <button
                onClick={() => deleteAreaMutation.mutate(a.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!areas?.length && <p className="text-xs text-white/30 text-center py-4">No collection areas defined</p>}
        </div>
      </div>
    </div>
  );
}
