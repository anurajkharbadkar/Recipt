'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orgsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Building2, Phone, Mail, MapPin, Landmark, Save, Plus, Trash2, Palette, Plug, CheckCircle2, AlertTriangle, Tag, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import ReceiptPreview from '@/components/receipt/ReceiptPreview';
import {
  RECEIPT_THEMES,
  PAVTI_HEADER_TAGLINE_PRESETS,
  PAVTI_TITLE_PRESETS,
  PAVTI_DONOR_PREFIX_PRESETS,
  PAVTI_FOOTER_NOTE_PRESETS,
  DEFAULT_SHARE_MESSAGE_TEMPLATES,
  SHARE_MESSAGE_PRESETS,
  LANGUAGE_DEFAULT_LINES,
  SOCIAL_PLATFORMS,
  formatShareMessage,
  formatSocialLinksText,
  resolveReceiptSettings,
} from '@pavti/shared';

// `missingLabel` is the jargon-free copy every org admin sees. `envHint` (the
// raw Railway variable names) only renders for SUPER_ADMIN — an org admin has
// no way to act on "WHATSAPP_ACCESS_TOKEN"; that's operator-facing info.
const settingsLabels = {
  en: {
    integrationsTitle: 'Integrations', integrationsDesc: 'Status of delivery & storage services connected to your account.',
    whatsappDelivery: 'WhatsApp Delivery', whatsappOk: 'Receipts are delivered to donors via WhatsApp.',
    whatsappMissing: "WhatsApp delivery isn't set up yet — contact support to enable it.",
    smsOtp: 'SMS / OTP', smsOk: 'SMS receipts and OTP login are active.',
    smsMissing: "SMS/OTP isn't set up yet — contact support to enable it.",
    fileStorage: 'File Storage', storageOk: 'Logos and receipt PDFs are stored permanently.',
    storageMissing: "File uploads (logo, receipt PDFs) aren't saved permanently yet — contact support to fix this.",
    orgInfoTitle: 'Organization Information', orgInfoDesc: 'Details displayed on receipt headers, WhatsApp messages, and official reports.',
    logoTitle: 'Organization Logo / Emblem', logoDesc: 'Upload a PNG or JPG logo. Ideal size is square (e.g. 512x512px).',
    chooseFile: 'Choose File', uploading: 'Uploading...',
    brandTitle: 'Brand & Appearance', brandDesc: 'This color drives buttons, the active nav highlight and focus rings across the whole portal — pick once, it updates everywhere.',
    resetColor: 'Reset to default color',
    bankTitle: 'Bank Details', bankDesc: 'Bank account and UPI details for organization collections.',
    saveSettings: 'Save Settings', saving: 'Saving Settings...',
    areasTitle: 'Collection Areas', areasPlaceholder: 'Ward A, Market Area, etc.', addArea: 'Add Area', noAreas: 'No collection areas defined',
    areaCount: (c: number, r: number) => `${c} collectors · ${r} receipts`,
    portalLangTitle: 'Portal Language', portalLangDesc: "The language you see the app's menus, buttons, and pages in — this device only. (Separate from the printed receipt's language, set below under Receipt Design.)",
    categoriesTitle: 'Categories', categoriesDesc: 'Custom categories your team added from the Expense/Receipt forms. The built-in preset categories always stay available and aren’t listed here.',
    expenseCategoriesLabel: 'Expense Categories', donationCategoriesLabel: 'Donation Categories', addCategory: 'Add', noCategories: 'No custom categories yet',
    socialTitle: 'Social Media Links', socialDesc: 'Shown on the printed pavti and available as a tag in the WhatsApp message below.',
    instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube', website: 'Website',
  },
  hi: {
    integrationsTitle: 'एकीकरण', integrationsDesc: 'आपके खाते से जुड़ी डिलीवरी व स्टोरेज सेवाओं की स्थिति।',
    whatsappDelivery: 'व्हाट्सएप डिलीवरी', whatsappOk: 'रसीदें व्हाट्सएप के माध्यम से दानकर्ताओं को भेजी जाती हैं।',
    whatsappMissing: 'व्हाट्सएप डिलीवरी अभी सेट नहीं है — सक्रिय करने के लिए सहायता से संपर्क करें।',
    smsOtp: 'SMS / OTP', smsOk: 'SMS रसीदें और OTP लॉगिन सक्रिय हैं।',
    smsMissing: 'SMS/OTP अभी सेट नहीं है — सक्रिय करने के लिए सहायता से संपर्क करें।',
    fileStorage: 'फ़ाइल संग्रहण', storageOk: 'लोगो और रसीद PDF स्थायी रूप से सहेजे जाते हैं।',
    storageMissing: 'फ़ाइल अपलोड (लोगो, रसीद PDF) अभी स्थायी रूप से सहेजे नहीं जाते — ठीक करने के लिए सहायता से संपर्क करें।',
    orgInfoTitle: 'संस्था की जानकारी', orgInfoDesc: 'रसीद हेडर, व्हाट्सएप संदेश और आधिकारिक रिपोर्ट पर दिखाई जाने वाली जानकारी।',
    logoTitle: 'संस्था लोगो / प्रतीक', logoDesc: 'PNG या JPG लोगो अपलोड करें। आदर्श आकार वर्गाकार है (जैसे 512x512px)।',
    chooseFile: 'फ़ाइल चुनें', uploading: 'अपलोड हो रहा है...',
    brandTitle: 'ब्रांड व स्वरूप', brandDesc: 'यह रंग पूरे पोर्टल में बटन, सक्रिय नेव हाइलाइट और फोकस रिंग तय करता है — एक बार चुनें, हर जगह लागू होगा।',
    resetColor: 'डिफ़ॉल्ट रंग पर वापस जाएं',
    bankTitle: 'बैंक विवरण', bankDesc: 'संस्था के संग्रह हेतु बैंक खाता व UPI विवरण।',
    saveSettings: 'सेटिंग्स सहेजें', saving: 'सहेजा जा रहा है...',
    areasTitle: 'संग्रह क्षेत्र', areasPlaceholder: 'वार्ड A, बाजार क्षेत्र, आदि।', addArea: 'क्षेत्र जोड़ें', noAreas: 'कोई संग्रह क्षेत्र परिभाषित नहीं',
    areaCount: (c: number, r: number) => `${c} संग्रहकर्ता · ${r} रसीदें`,
    portalLangTitle: 'पोर्टल भाषा', portalLangDesc: 'ऐप के मेनू, बटन और पेज जिस भाषा में दिखेंगे — केवल इस डिवाइस पर। (नीचे रसीद डिज़ाइन में सेट होने वाली रसीद की भाषा से अलग।)',
    categoriesTitle: 'श्रेणियां', categoriesDesc: 'आपकी टीम ने खर्च/रसीद फॉर्म से जोड़ी गई कस्टम श्रेणियां। बिल्ट-इन श्रेणियां हमेशा उपलब्ध रहती हैं, यहां सूचीबद्ध नहीं हैं।',
    expenseCategoriesLabel: 'व्यय श्रेणियां', donationCategoriesLabel: 'दान श्रेणियां', addCategory: 'जोड़ें', noCategories: 'अभी तक कोई कस्टम श्रेणी नहीं',
    socialTitle: 'सोशल मीडिया लिंक', socialDesc: 'प्रिंटेड पावती पर दिखेंगे और नीचे व्हाट्सएप संदेश में टैग के रूप में उपलब्ध हैं।',
    instagram: 'इंस्टाग्राम', facebook: 'फेसबुक', youtube: 'यूट्यूब', website: 'वेबसाइट',
  },
  mr: {
    integrationsTitle: 'इंटिग्रेशन्स', integrationsDesc: 'आपल्या खात्याशी जोडलेल्या डिलिव्हरी व स्टोरेज सेवांची स्थिती.',
    whatsappDelivery: 'व्हॉट्सअॅप डिलिव्हरी', whatsappOk: 'पावत्या व्हॉट्सअॅपद्वारे देणगीदारांना पाठवल्या जातात.',
    whatsappMissing: 'व्हॉट्सअॅप डिलिव्हरी अद्याप सेट केलेली नाही — सुरू करण्यासाठी सपोर्टशी संपर्क साधा.',
    smsOtp: 'SMS / OTP', smsOk: 'SMS पावत्या व OTP लॉगिन सक्रिय आहे.',
    smsMissing: 'SMS/OTP अद्याप सेट केलेले नाही — सुरू करण्यासाठी सपोर्टशी संपर्क साधा.',
    fileStorage: 'फाइल स्टोरेज', storageOk: 'लोगो व पावती PDF कायमस्वरूपी साठवले जातात.',
    storageMissing: 'फाइल अपलोड (लोगो, पावती PDF) अद्याप कायमस्वरूपी साठवले जात नाहीत — दुरुस्तीसाठी सपोर्टशी संपर्क साधा.',
    orgInfoTitle: 'संस्थेची माहिती', orgInfoDesc: 'पावती हेडर, व्हॉट्सअॅप मेसेज व अधिकृत अहवालांवर दिसणारी माहिती.',
    logoTitle: 'संस्थेचा लोगो / चिन्ह', logoDesc: 'PNG किंवा JPG लोगो अपलोड करा. योग्य आकार चौकोनी आहे (उदा. 512x512px).',
    chooseFile: 'फाइल निवडा', uploading: 'अपलोड होत आहे...',
    brandTitle: 'ब्रँड व स्वरूप', brandDesc: 'हा रंग संपूर्ण पोर्टलमधील बटणे, सक्रिय नेव्ह हायलाइट व फोकस रिंग ठरवतो — एकदा निवडा, सर्वत्र लागू होईल.',
    resetColor: 'मूळ रंगावर परत जा',
    bankTitle: 'बँक तपशील', bankDesc: 'संस्थेच्या संकलनासाठी बँक खाते व UPI तपशील.',
    saveSettings: 'सेटिंग्स जतन करा', saving: 'जतन होत आहे...',
    areasTitle: 'संकलन क्षेत्रे', areasPlaceholder: 'वॉर्ड A, मार्केट परिसर, इ.', addArea: 'क्षेत्र जोडा', noAreas: 'कोणतेही संकलन क्षेत्र नाही',
    areaCount: (c: number, r: number) => `${c} संग्राहक · ${r} पावत्या`,
    portalLangTitle: 'पोर्टल भाषा', portalLangDesc: 'अ‍ॅपचे मेनू, बटणे व पाने कोणत्या भाषेत दिसतील — फक्त या डिव्हाइसवर. (खाली पावती डिझाइनमध्ये सेट होणाऱ्या पावतीच्या भाषेपेक्षा वेगळी.)',
    categoriesTitle: 'श्रेणी', categoriesDesc: 'तुमच्या टीमने खर्च/पावती फॉर्ममधून जोडलेल्या कस्टम श्रेणी. मूळ (प्रीसेट) श्रेणी नेहमी उपलब्ध असतात, त्या इथे दाखवलेल्या नाहीत.',
    expenseCategoriesLabel: 'खर्च श्रेणी', donationCategoriesLabel: 'देणगी श्रेणी', addCategory: 'जोडा', noCategories: 'अद्याप कोणतीही कस्टम श्रेणी नाही',
    socialTitle: 'सोशल मीडिया लिंक्स', socialDesc: 'छापील पावतीवर दिसतील आणि खालील व्हॉट्सअॅप मेसेजमध्ये टॅग म्हणून उपलब्ध असतील.',
    instagram: 'इंस्टाग्राम', facebook: 'फेसबुक', youtube: 'यूट्यूब', website: 'वेबसाइट',
  },
};

const PORTAL_LANGUAGES: { code: 'en' | 'hi' | 'mr'; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🏳️' },
];

function IntegrationRow({ label, ok, okLabel, missingLabel, envHint, showTechnical }: { label: string; ok: boolean; okLabel: string; missingLabel: string; envHint: string; showTechnical: boolean }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
      {ok ? (
        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-theme-fg">{label}</p>
        <p className="text-xs text-theme-fg/50 mt-0.5">{ok ? okLabel : missingLabel}</p>
        {!ok && showTechnical && <p className="text-[11px] text-theme-fg/35 mt-1 font-mono">{envHint}</p>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { language, setLanguage, organization, setOrganization, user } = useAuthStore();
  const queryClient = useQueryClient();
  const sl = settingsLabels[language] || settingsLabels.en;

  const { data: org } = useQuery({ queryKey: ['org'], queryFn: orgsApi.getMe });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: orgsApi.getAreas });
  const { data: expenseCategories } = useQuery({ queryKey: ['categories', 'EXPENSE'], queryFn: () => orgsApi.getCategories('EXPENSE') });
  const { data: donationCategories } = useQuery({ queryKey: ['categories', 'DONATION'], queryFn: () => orgsApi.getCategories('DONATION') });
  const { data: integrations } = useQuery({
    queryKey: ['integrations-status'],
    queryFn: orgsApi.getIntegrationsStatus,
    enabled: user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN',
  });

  const [form, setForm] = useState<any>({});
  const [newArea, setNewArea] = useState('');
  const [newCategory, setNewCategory] = useState({ EXPENSE: '', DONATION: '' });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [previewMode, setPreviewMode] = useState<'PAVTI' | 'WHATSAPP'>('PAVTI');

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
        brandColor: org.brandColor || '#592E09',
        receiptTemplateSettings: resolveReceiptSettings(org.receiptTemplateSettings),
        socialLinks: org.socialLinks || {},
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
        socialLinks: form.socialLinks,
      },
    },
  };

  const updateMutation = useMutation({
    // `form` includes `phone` (bound to the disabled/read-only phone input
    // below, for display only) but UpdateOrganizationDto deliberately forbids
    // it — and the global ValidationPipe's forbidNonWhitelisted rejects the
    // *entire* request over that one extra field. Strip it before sending;
    // `undefined` keys are dropped by JSON.stringify so this isn't sent at all.
    mutationFn: () => orgsApi.update({ ...form, phone: undefined }),
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

  const createCategoryMutation = useMutation({
    mutationFn: ({ kind, label }: { kind: 'EXPENSE' | 'DONATION'; label: string }) => orgsApi.createCategory(kind, label),
    onSuccess: (_data, { kind }) => {
      queryClient.invalidateQueries({ queryKey: ['categories', kind] });
      setNewCategory((p) => ({ ...p, [kind]: '' }));
      toast.success('Category added!');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => orgsApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', 'EXPENSE'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'DONATION'] });
      toast.success('Category deleted');
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-theme-fg">
            {language === 'mr' ? 'सेटिंग्स' : language === 'hi' ? 'सेटिंग्स' : 'Settings'}
          </h1>
          <p className="text-xs sm:text-sm text-theme-fg/50 mt-1">
            {language === 'mr' ? 'संस्थेची माहिती, ब्रँड रंग, बँक तपशील व पावती डिझाइन व्यवस्थापित करा.' : 'Manage your organization profile, brand color, bank details, and receipt design.'}
          </p>
        </div>
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="btn-primary self-start sm:self-auto px-5 py-2.5 shadow-glow-saffron"
        >
          <Save size={16} />
          {updateMutation.isPending ? sl.saving : sl.saveSettings}
        </button>
      </div>

      {/* Portal Language — a personal, this-device preference (stored locally),
          not part of the organization profile saved by the button above. Kept
          separate from the Receipt Design language picker further down, which
          controls what donors see printed on the pavti, not what staff see in
          the app. */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-theme-fg">{sl.portalLangTitle}</h3>
            <p className="text-xs text-theme-fg/50 mt-0.5 max-w-lg">{sl.portalLangDesc}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5 max-w-md">
          {PORTAL_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className={`p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1 ${
                language === l.code
                  ? 'border-saffron-400 bg-saffron-500/10 shadow-md ring-2 ring-saffron-400/20'
                  : 'border-theme-fg/10 hover:border-theme-fg/30 bg-theme-fg/[0.02]'
              }`}
            >
              <span className="text-lg">{l.flag}</span>
              <span className="text-sm font-semibold text-theme-fg">{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. Organization Info */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-theme">
          <div className="w-8 h-8 rounded-lg bg-saffron-500/10 flex items-center justify-center text-saffron-400">
            <Building2 size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-theme-fg">{sl.orgInfoTitle}</h3>
            <p className="text-xs text-theme-fg/50">{sl.orgInfoDesc}</p>
          </div>
        </div>

        {/* Logo Upload Section */}
        <div className="flex flex-col sm:flex-row items-center gap-5 mb-6 pb-6 border-b border-theme">
          {logoPreview || org?.logoUrl ? (
            <img
              src={logoPreview || org?.logoUrl}
              alt="Logo Preview"
              className="w-20 h-20 rounded-2xl object-cover border border-theme bg-theme-fg/5 shadow-md shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-saffron-600/20 flex items-center justify-center text-saffron-400 font-bold text-3xl border border-theme shadow-md shrink-0">
              {form.name ? form.name[0] : 'O'}
            </div>
          )}
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <p className="text-sm font-semibold text-theme-fg">{sl.logoTitle}</p>
            <p className="text-xs text-theme-fg/50">{sl.logoDesc}</p>
            <div className="flex justify-center sm:justify-start gap-2 pt-1">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              <label
                htmlFor="logo-upload"
                className="btn-secondary py-1.5 px-4 rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {uploadingLogo ? sl.uploading : sl.chooseFile}
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Organization Name *</label>
            <input value={form.name || ''} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} className="form-input" placeholder="Shree Ganesh Mandal, Pune" />
          </div>
          <div>
            <label className="form-label">मराठी नाव</label>
            <input value={form.nameMarathi || ''} onChange={e => setForm((p: any) => ({ ...p, nameMarathi: e.target.value }))} className="form-input font-devanagari" placeholder="श्री गणेश मंडळ, पुणे" />
          </div>
          <div>
            <label className="form-label">हिंदी नाम</label>
            <input value={form.nameHindi || ''} onChange={e => setForm((p: any) => ({ ...p, nameHindi: e.target.value }))} className="form-input font-devanagari" placeholder="श्री गणेश मंडल, पुणे" />
          </div>
          <div>
            <label className="form-label">Registration Number</label>
            <input value={form.regNumber || ''} onChange={e => setForm((p: any) => ({ ...p, regNumber: e.target.value }))} className="form-input" placeholder="MH/2024/001" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label"><MapPin size={11} className="inline mr-1" /> Address *</label>
            <input value={form.address || ''} onChange={e => setForm((p: any) => ({ ...p, address: e.target.value }))} className="form-input" placeholder="123, Tilak Road, Sadashiv Peth" />
          </div>
          <div>
            <label className="form-label">City *</label>
            <input value={form.city || ''} onChange={e => setForm((p: any) => ({ ...p, city: e.target.value }))} className="form-input" placeholder="Pune" />
          </div>
          <div>
            <label className="form-label">State</label>
            <input value={form.state || ''} onChange={e => setForm((p: any) => ({ ...p, state: e.target.value }))} className="form-input" placeholder="Maharashtra" />
          </div>
          <div>
            <label className="form-label"><Phone size={11} className="inline mr-1" /> Phone</label>
            <input value={form.phone || ''} className="form-input opacity-60 cursor-not-allowed" disabled />
          </div>
          <div>
            <label className="form-label"><Mail size={11} className="inline mr-1" /> Email</label>
            <input value={form.email || ''} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} className="form-input" type="email" placeholder="contact@mandal.com" />
          </div>
        </div>
      </div>

      {/* 2. Brand & Appearance */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-saffron-500/10 flex items-center justify-center text-saffron-400">
            <Palette size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-theme-fg">{sl.brandTitle}</h3>
            <p className="text-xs text-theme-fg/50">{sl.brandDesc}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 p-4 rounded-2xl bg-theme-fg/[0.02] border border-theme-fg/10">
          <input
            type="color"
            value={form.brandColor || '#592E09'}
            onChange={(e) => {
              const color = e.target.value;
              setForm((p: any) => ({ ...p, brandColor: color }));
              document.documentElement.style.setProperty('--primary-brand-color', color);
            }}
            className="w-14 h-14 rounded-2xl cursor-pointer bg-transparent border-2 border-theme-fg/20 p-1"
          />
          <div>
            <p className="text-sm font-semibold text-theme-fg font-mono">{form.brandColor || '#592E09'}</p>
            <button
              type="button"
              onClick={() => {
                setForm((p: any) => ({ ...p, brandColor: '#592E09' }));
                document.documentElement.style.setProperty('--primary-brand-color', '#592E09');
              }}
              className="text-xs text-saffron-400 hover:underline mt-1 font-medium"
            >
              {sl.resetColor}
            </button>
          </div>
        </div>
      </div>

      {/* Integrations status — ORG_ADMIN only */}
      {integrations && (
        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-theme">
            <div className="w-8 h-8 rounded-lg bg-saffron-500/10 flex items-center justify-center text-saffron-400">
              <Plug size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-theme-fg">{sl.integrationsTitle}</h3>
              <p className="text-xs text-theme-fg/50">{sl.integrationsDesc}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <IntegrationRow
              label={sl.whatsappDelivery}
              ok={integrations.whatsapp}
              okLabel={sl.whatsappOk}
              missingLabel={sl.whatsappMissing}
              envHint="WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID"
              showTechnical={user?.role === 'SUPER_ADMIN'}
            />
            <IntegrationRow
              label={sl.smsOtp}
              ok={integrations.sms}
              okLabel={sl.smsOk}
              missingLabel={sl.smsMissing}
              envHint="MSG91_API_KEY"
              showTechnical={user?.role === 'SUPER_ADMIN'}
            />
            <IntegrationRow
              label={sl.fileStorage}
              ok={integrations.storage === 'r2'}
              okLabel={sl.storageOk}
              missingLabel={sl.storageMissing}
              envHint="R2_BUCKET_NAME, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
              showTechnical={user?.role === 'SUPER_ADMIN'}
            />
          </div>
        </div>
      )}

      {/* 3. Bank Details */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-theme">
          <div className="w-8 h-8 rounded-lg bg-saffron-500/10 flex items-center justify-center text-saffron-400">
            <Landmark size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-theme-fg">{sl.bankTitle}</h3>
            <p className="text-xs text-theme-fg/50">{sl.bankDesc}</p>
          </div>
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
          <div className="sm:col-span-2">
            <label className="form-label">UPI ID</label>
            <input value={form.upiId || ''} onChange={e => setForm((p: any) => ({ ...p, upiId: e.target.value }))} className="form-input font-mono" placeholder="mandal@upi" />
          </div>
        </div>
      </div>

      {/* 4. Receipt Design Settings */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-theme">
          <div className="w-8 h-8 rounded-lg bg-saffron-500/10 flex items-center justify-center text-saffron-400">
            <Building2 size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-theme-fg">Receipt Design & Customization (पावती डिझाइन व मजकूर)</h3>
            <p className="text-xs text-theme-fg/50">
              Customize language, theme, header tagline, titles, salutation, and footer message for printed & WhatsApp receipts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Pavti Language Option */}
            <div className="space-y-2">
              <label className="form-label text-xs uppercase tracking-wider font-semibold text-theme-fg/70">
                1. Pavti Language (पावतीची भाषा)
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'mr', label: 'मराठी', sub: 'Marathi', flag: '🚩' },
                  { id: 'hi', label: 'हिंदी', sub: 'Hindi', flag: '🇮🇳' },
                  { id: 'en', label: 'English', sub: 'English', flag: '🌐' },
                ].map((lang) => {
                  const currentLang = form.receiptTemplateSettings?.language || 'mr';
                  const isSelected = currentLang === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        const targetLang = lang.id as 'mr' | 'hi' | 'en';
                        setForm((p: any) => {
                          const rts = p.receiptTemplateSettings || {};
                          const savedLines = rts.languages?.[targetLang];
                          const targetLines = savedLines || LANGUAGE_DEFAULT_LINES[targetLang];
                          return {
                            ...p,
                            receiptTemplateSettings: {
                              ...rts,
                              language: targetLang,
                              headerTagline: targetLines.headerTagline,
                              receiptTitle: targetLines.receiptTitle,
                              donorPrefix: targetLines.donorPrefix,
                              footerNote: targetLines.footerNote,
                            },
                          };
                        });
                      }}
                      className={`p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'border-saffron-400 bg-saffron-500/10 shadow-md ring-2 ring-saffron-400/20'
                          : 'border-theme-fg/10 hover:border-theme-fg/30 bg-theme-fg/[0.02]'
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-sm font-bold text-theme-fg">{lang.label}</span>
                      <span className="text-[10px] text-theme-fg/50">{lang.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Theme Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="form-label text-xs uppercase tracking-wider font-semibold text-theme-fg/70">
                  2. Choose Theme ({RECEIPT_THEMES.length} Available)
                </label>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                      className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-200 text-left flex flex-col ${
                        selected
                          ? 'border-saffron-400 ring-2 ring-saffron-400/30 shadow-lg shadow-saffron-500/10 scale-[1.02]'
                          : 'border-theme-fg/10 hover:border-theme-fg/30 bg-theme-fg/[0.02] hover:bg-theme-fg/[0.04]'
                      }`}
                    >
                      <div
                        className="h-14 flex items-center justify-center text-2xl relative transition-transform duration-300 group-hover:scale-105"
                        style={{ background: t.gradient }}
                      >
                        <span className="drop-shadow-sm">{t.emoji}</span>
                        {selected && (
                          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-saffron-600 flex items-center justify-center text-[9px] font-bold shadow-md">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="p-2 bg-theme-fg/5 flex-1 flex flex-col justify-center">
                        <p className="text-[11px] font-semibold text-theme-fg truncate">{t.label}</p>
                        <p className="text-[9px] text-theme-fg/40 mt-0.5 capitalize">{t.borderStyle} border</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Customizable Lines & WhatsApp Message */}
            {(() => {
              const currentPavtiLang = (form.receiptTemplateSettings?.language || 'mr') as 'mr' | 'hi' | 'en';
              const currentDefaults = LANGUAGE_DEFAULT_LINES[currentPavtiLang] || LANGUAGE_DEFAULT_LINES.mr;
              const currentLines = form.receiptTemplateSettings?.languages?.[currentPavtiLang] || {
                headerTagline: form.receiptTemplateSettings?.headerTagline ?? currentDefaults.headerTagline,
                receiptTitle: form.receiptTemplateSettings?.receiptTitle ?? currentDefaults.receiptTitle,
                donorPrefix: form.receiptTemplateSettings?.donorPrefix ?? currentDefaults.donorPrefix,
                footerNote: form.receiptTemplateSettings?.footerNote ?? currentDefaults.footerNote,
                shareMessage: form.receiptTemplateSettings?.shareMessage ?? currentDefaults.shareMessage,
              };

              const updateLine = (field: 'headerTagline' | 'receiptTitle' | 'donorPrefix' | 'footerNote' | 'shareMessage', value: string) => {
                setForm((p: any) => {
                  const rts = p.receiptTemplateSettings || {};
                  const curLang = (rts.language || 'mr') as 'mr' | 'hi' | 'en';
                  const langObj = rts.languages?.[curLang] || {};
                  return {
                    ...p,
                    receiptTemplateSettings: {
                      ...rts,
                      [field]: value,
                      languages: {
                        ...rts.languages,
                        [curLang]: {
                          ...langObj,
                          [field]: value,
                        },
                      },
                    },
                  };
                });
              };

              return (
                <div className="space-y-6 pt-2 border-t border-theme">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-theme-fg/70">
                      3. Customize Lines on Pavti ({currentPavtiLang === 'mr' ? 'मराठी मजकूर' : currentPavtiLang === 'hi' ? 'हिंदी पाठ' : 'English Text'})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        updateLine('headerTagline', currentDefaults.headerTagline);
                        updateLine('receiptTitle', currentDefaults.receiptTitle);
                        updateLine('donorPrefix', currentDefaults.donorPrefix);
                        updateLine('footerNote', currentDefaults.footerNote);
                        updateLine('shareMessage', currentDefaults.shareMessage);
                      }}
                      className="text-[11px] text-saffron-400 hover:underline font-medium"
                    >
                      Reset All {currentPavtiLang === 'mr' ? 'Marathi' : currentPavtiLang === 'hi' ? 'Hindi' : 'English'} Defaults
                    </button>
                  </div>

                  {/* Area A: Header Mantra / Shloka */}
                  <div className="space-y-1.5">
                    <label className="form-label text-xs">
                      Header Mantra / Tagline (मंत्र / ब्रीदवाक्य)
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(PAVTI_HEADER_TAGLINE_PRESETS[currentPavtiLang] || PAVTI_HEADER_TAGLINE_PRESETS.mr).map((preset) => {
                        const active = (currentLines.headerTagline ?? currentDefaults.headerTagline) === preset.value;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => updateLine('headerTagline', preset.value)}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                              active
                                ? 'bg-saffron-500 text-white border-saffron-500 font-semibold shadow-sm'
                                : 'bg-theme-fg/5 hover:bg-theme-fg/10 border-theme-fg/10 text-theme-fg/70'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      value={currentLines.headerTagline ?? currentDefaults.headerTagline}
                      onChange={e => updateLine('headerTagline', e.target.value)}
                      className="form-input font-devanagari text-xs"
                      placeholder={`Default: ${currentDefaults.headerTagline}`}
                    />
                  </div>

                  {/* Area B: Receipt Title Line */}
                  <div className="space-y-1.5">
                    <label className="form-label text-xs">
                      Receipt Title (पावतीचे नाव / शीर्षक)
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(PAVTI_TITLE_PRESETS[currentPavtiLang] || PAVTI_TITLE_PRESETS.mr).map((preset) => {
                        const active = (currentLines.receiptTitle ?? currentDefaults.receiptTitle) === preset.value;
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => updateLine('receiptTitle', preset.value)}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                              active
                                ? 'bg-saffron-500 text-white border-saffron-500 font-semibold shadow-sm'
                                : 'bg-theme-fg/5 hover:bg-theme-fg/10 border-theme-fg/10 text-theme-fg/70'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      value={currentLines.receiptTitle ?? currentDefaults.receiptTitle}
                      onChange={e => updateLine('receiptTitle', e.target.value)}
                      className="form-input font-devanagari text-xs"
                      placeholder={`Default: ${currentDefaults.receiptTitle}`}
                    />
                  </div>

                  {/* Area C: Donor Salutation Prefix */}
                  <div className="space-y-1.5">
                    <label className="form-label text-xs">
                      Donor Salutation Prefix (देणगीदार आदरातिथ्य)
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(PAVTI_DONOR_PREFIX_PRESETS[currentPavtiLang] || PAVTI_DONOR_PREFIX_PRESETS.mr).map((preset) => {
                        const active = (currentLines.donorPrefix ?? currentDefaults.donorPrefix) === preset.value;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => updateLine('donorPrefix', preset.value)}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                              active
                                ? 'bg-saffron-500 text-white border-saffron-500 font-semibold shadow-sm'
                                : 'bg-theme-fg/5 hover:bg-theme-fg/10 border-theme-fg/10 text-theme-fg/70'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      value={currentLines.donorPrefix ?? currentDefaults.donorPrefix}
                      onChange={e => updateLine('donorPrefix', e.target.value)}
                      className="form-input font-devanagari text-xs"
                      placeholder={`Default: ${currentDefaults.donorPrefix}`}
                    />
                  </div>

                  {/* Area D: Footer Note / Thank You Blessing */}
                  <div className="space-y-1.5">
                    <label className="form-label text-xs">
                      Footer Note / Message (तळटीप / आभार संदेश)
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(PAVTI_FOOTER_NOTE_PRESETS[currentPavtiLang] || PAVTI_FOOTER_NOTE_PRESETS.mr).map((preset) => {
                        const active = (currentLines.footerNote ?? currentDefaults.footerNote) === preset.value;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => updateLine('footerNote', preset.value)}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                              active
                                ? 'bg-saffron-500 text-white border-saffron-500 font-semibold shadow-sm'
                                : 'bg-theme-fg/5 hover:bg-theme-fg/10 border-theme-fg/10 text-theme-fg/70'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      value={currentLines.footerNote ?? currentDefaults.footerNote}
                      onChange={e => updateLine('footerNote', e.target.value)}
                      className="form-input font-devanagari text-xs"
                      placeholder={`Default: ${currentDefaults.footerNote}`}
                    />
                  </div>

                  {/* 4. WhatsApp & Sharing Caption Message */}
                  <div className="space-y-3 pt-4 border-t border-theme">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="form-label text-xs font-bold text-theme-fg flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          4. WhatsApp & Sharing Caption Message (व्हॉट्सअॅप मेसेज व शेअर मजकूर)
                        </label>
                        <p className="text-[11px] text-theme-fg/50">
                          The caption text sent along with digital receipt links on WhatsApp & SMS.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateLine('shareMessage', currentDefaults.shareMessage)}
                        className="text-[10px] text-saffron-400 hover:underline font-medium"
                      >
                        Reset Caption
                      </button>
                    </div>

                    {/* Presets */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-theme-fg/50">Templates:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(SHARE_MESSAGE_PRESETS[currentPavtiLang] || SHARE_MESSAGE_PRESETS.mr).map((preset) => {
                          const active = (currentLines.shareMessage ?? currentDefaults.shareMessage) === preset.template;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => updateLine('shareMessage', preset.template)}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                                active
                                  ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-sm'
                                  : 'bg-theme-fg/5 hover:bg-theme-fg/10 border-theme-fg/10 text-theme-fg/70'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Placeholder badges */}
                    <div className="p-2.5 rounded-xl bg-theme-fg/[0.02] border border-theme-fg/5 space-y-1.5">
                      <span className="text-[10px] font-semibold text-theme-fg/50 uppercase tracking-wider block">
                        Insert Dynamic Tags (क्लिक करून जोडा):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { tag: '{donorName}', label: 'देणगीदार नाव' },
                          { tag: '{amount}', label: 'रक्कम' },
                          { tag: '{receiptNumber}', label: 'पावती क्र.' },
                          { tag: '{organizationName}', label: 'संस्थेचे नाव' },
                          { tag: '{receiptUrl}', label: 'पावती लिंक' },
                          { tag: '{date}', label: 'दिनांक' },
                          { tag: '{socialLinks}', label: 'सोशल लिंक्स' },
                        ].map(item => (
                          <button
                            key={item.tag}
                            type="button"
                            onClick={() => {
                              const cur = currentLines.shareMessage ?? currentDefaults.shareMessage;
                              updateLine('shareMessage', cur + ' ' + item.tag);
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-theme-fg/5 hover:bg-theme-fg/10 border border-theme-fg/10 text-theme-fg font-mono transition-colors"
                            title={`Click to insert ${item.tag}`}
                          >
                            <span className="text-saffron-400 font-bold">{item.tag}</span> <span className="text-theme-fg/40">({item.label})</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                      rows={6}
                      value={currentLines.shareMessage ?? currentDefaults.shareMessage}
                      onChange={e => updateLine('shareMessage', e.target.value)}
                      className="form-input font-devanagari text-xs leading-relaxed resize-y w-full"
                      placeholder={`Enter custom WhatsApp message template...`}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Live Preview Container with Tab Switcher */}
          <div className="lg:col-span-5 lg:sticky lg:top-6">
            <div className="bg-theme-fg/[0.03] border border-theme-fg/10 rounded-2xl p-4 sm:p-5 flex flex-col items-center shadow-lg">
              {/* Tab Switcher */}
              <div className="w-full flex items-center justify-between mb-3.5 pb-2.5 border-b border-theme-fg/10">
                <div className="flex items-center gap-1 bg-theme-fg/5 p-1 rounded-xl border border-theme-fg/10">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('PAVTI')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      previewMode === 'PAVTI'
                        ? 'bg-saffron-500 text-white shadow-sm'
                        : 'text-theme-fg/60 hover:text-theme-fg'
                    }`}
                  >
                    📄 Pavti Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('WHATSAPP')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      previewMode === 'WHATSAPP'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-theme-fg/60 hover:text-theme-fg'
                    }`}
                  >
                    💬 WhatsApp Msg
                  </button>
                </div>
                <span className="text-[10px] text-theme-fg/40 font-mono">Real-time</span>
              </div>

              {/* View 1: Pavti Design Preview */}
              {previewMode === 'PAVTI' && (
                <div className="w-full max-w-[360px] animate-fade-in">
                  <ReceiptPreview receipt={previewReceipt} />
                </div>
              )}

              {/* View 2: WhatsApp Chat Bubble Preview */}
              {previewMode === 'WHATSAPP' && (
                <div className="w-full max-w-[360px] bg-[#0c1317] dark:bg-[#0c1317] border border-emerald-900/30 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
                  {/* WhatsApp Chat Header */}
                  <div className="bg-[#1f2c34] px-3.5 py-2.5 flex items-center gap-2.5 border-b border-[#2a3942]">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                      {form.name ? form.name[0] : 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#e9edef] truncate">
                        {form.name || org?.name || 'Organization Official'}
                      </p>
                      <p className="text-[10px] text-[#8696a0]">Official WhatsApp Account</p>
                    </div>
                  </div>

                  {/* Chat Wallpaper Area */}
                  <div className="p-4 bg-[#0b141a] min-h-[260px] flex flex-col justify-end">
                    {/* Chat Bubble */}
                    <div className="bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-none shadow-md space-y-2 border border-emerald-600/20 max-w-[95%] ml-auto">
                      <div className="text-[11px] leading-relaxed whitespace-pre-wrap font-devanagari">
                        {(() => {
                          const currentPavtiLang = (form.receiptTemplateSettings?.language || 'mr') as 'mr' | 'hi' | 'en';
                          const currentDefaults = LANGUAGE_DEFAULT_LINES[currentPavtiLang] || LANGUAGE_DEFAULT_LINES.mr;
                          const currentLines = form.receiptTemplateSettings?.languages?.[currentPavtiLang] || form.receiptTemplateSettings || {};
                          const rawTpl = currentLines.shareMessage ?? currentDefaults.shareMessage;
                          return formatShareMessage(
                            rawTpl,
                            {
                              donorName: 'Saurabh Deshpande',
                              amount: 501,
                              receiptNumber: 'SGM-2026-0001',
                              organizationName: form.name || org?.name || 'श्री गणेश मंडळ',
                              receiptUrl: 'https://pavti.app/receipt/demo-id',
                              date: new Date().toLocaleDateString('en-IN'),
                              category: 'GENERAL',
                              socialLinksText: formatSocialLinksText(form.socialLinks),
                            },
                            currentPavtiLang,
                          );
                        })()}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-[#8696a0] pt-1">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[#53bdeb]">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Save Button */}
      <div className="pt-2">
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="btn-primary px-8 py-3 text-sm font-bold shadow-glow-saffron"
        >
          <Save size={18} />
          {updateMutation.isPending ? sl.saving : sl.saveSettings}
        </button>
      </div>

      {/* 6. Collection Areas */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-theme">
          <h3 className="text-base font-semibold text-theme-fg flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-saffron-500/10 flex items-center justify-center text-saffron-400">
              <MapPin size={18} />
            </div>
            {sl.areasTitle}
          </h3>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={newArea}
            onChange={e => setNewArea(e.target.value)}
            className="form-input flex-1"
            placeholder={sl.areasPlaceholder}
          />
          <button
            onClick={() => newArea && createAreaMutation.mutate(newArea)}
            disabled={!newArea || createAreaMutation.isPending}
            className="btn-primary px-5"
          >
            <Plus size={16} /> {sl.addArea}
          </button>
        </div>
        <div className="space-y-2">
          {(areas || []).map((a: any) => (
            <div key={a.id} className="flex items-center justify-between p-3.5 bg-theme-fg/5 rounded-xl border border-theme-fg/5">
              <div>
                <p className="text-sm font-semibold text-theme-fg">{a.name}</p>
                {a._count && <p className="text-xs text-theme-fg/40 mt-0.5">{sl.areaCount(a._count.collectors, a._count.receipts)}</p>}
              </div>
              <button
                onClick={() => deleteAreaMutation.mutate(a.id)}
                className="p-2 rounded-lg hover:bg-red-500/10 text-theme-fg/30 hover:text-red-400 transition-colors"
                title="Delete area"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {!areas?.length && <p className="text-xs text-theme-fg/30 text-center py-6">{sl.noAreas}</p>}
        </div>
      </div>

      {/* 7. Custom Categories */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-saffron-500/10 flex items-center justify-center text-saffron-400">
            <Tag size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-theme-fg">{sl.categoriesTitle}</h3>
            <p className="text-xs text-theme-fg/50 mt-0.5">{sl.categoriesDesc}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
          {([
            { kind: 'DONATION' as const, title: sl.donationCategoriesLabel, list: donationCategories },
            { kind: 'EXPENSE' as const, title: sl.expenseCategoriesLabel, list: expenseCategories },
          ]).map(({ kind, title, list }) => (
            <div key={kind}>
              <p className="text-xs font-semibold text-theme-fg/70 uppercase tracking-wider mb-2">{title}</p>
              <div className="flex gap-2 mb-3">
                <input
                  value={newCategory[kind]}
                  onChange={(e) => setNewCategory((p) => ({ ...p, [kind]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newCategory[kind].trim()) createCategoryMutation.mutate({ kind, label: newCategory[kind].trim() }); }}
                  className="form-input flex-1 text-sm"
                  placeholder={kind === 'EXPENSE' ? 'e.g. Catering' : 'e.g. Stage Decor'}
                />
                <button
                  onClick={() => newCategory[kind].trim() && createCategoryMutation.mutate({ kind, label: newCategory[kind].trim() })}
                  disabled={!newCategory[kind].trim() || createCategoryMutation.isPending}
                  className="btn-secondary px-4 text-sm"
                >
                  {sl.addCategory}
                </button>
              </div>
              <div className="space-y-1.5">
                {(list || []).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-theme-fg/5 rounded-lg border border-theme-fg/5">
                    <span className="text-sm text-theme-fg">{c.label}</span>
                    <button
                      onClick={() => deleteCategoryMutation.mutate(c.id)}
                      className="p-1 rounded-md hover:bg-red-500/10 text-theme-fg/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {!list?.length && <p className="text-xs text-theme-fg/30 py-2">{sl.noCategories}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Social Media Links */}
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-theme">
          <div className="w-8 h-8 rounded-lg bg-saffron-500/10 flex items-center justify-center text-saffron-400">
            <Globe size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-theme-fg">{sl.socialTitle}</h3>
            <p className="text-xs text-theme-fg/50">{sl.socialDesc}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SOCIAL_PLATFORMS.map((p) => (
            <div key={p.key}>
              <label className="form-label">{p.emoji} {sl[p.key as 'instagram' | 'facebook' | 'youtube' | 'website']}</label>
              <input
                value={form.socialLinks?.[p.key] || ''}
                onChange={(e) => setForm((prev: any) => ({ ...prev, socialLinks: { ...prev.socialLinks, [p.key]: e.target.value } }))}
                className="form-input"
                placeholder={`https://${p.key}.com/...`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
