'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { receiptsApi, campaignsApi, orgsApi } from '@/lib/api';
import { shareReceiptViaWhatsApp, shareReceiptGeneric, prefetchReceiptImage } from '@/lib/whatsappShare';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  DonationCategory, PaymentMode, CollectionType, ReceiptStatus,
  RECEIPT_CATEGORIES_LABELS, PAYMENT_MODE_LABELS, RECEIPT_STATUS_LABELS,
} from '@pavti/shared';
import {
  User, Phone, MapPin, IndianRupee, Tag, CreditCard, FileText,
  MapPinned, ArrowLeft, CheckCircle, Printer, Share2, Loader2, Sparkles
} from 'lucide-react';
import ReceiptPreview from '@/components/receipt/ReceiptPreview';
import PickerWithAdd from '@/components/form/PickerWithAdd';
import { QRCodeSVG } from 'qrcode.react';
import { buildUpiPaymentLink } from '@/lib/upi';
import Link from 'next/link';

const schema = z.object({
  campaignId: z.string().min(1, 'Campaign is required'),
  donorName: z.string().min(2, 'Donor name is required'),
  donorPhone: z.string().optional(),
  donorAddress: z.string().optional(),
  amount: z.number({ invalid_type_error: 'Enter a valid amount' }).min(1, 'Amount must be at least ₹1'),
  // Not z.nativeEnum — category can be a preset DonationCategory value or a
  // custom label added inline via PickerWithAdd (see organizations.service.ts
  // CustomCategory), same relaxation as the backend DTO.
  category: z.string().default(DonationCategory.GENERAL),
  paymentMode: z.nativeEnum(PaymentMode).default(PaymentMode.CASH),
  chequeNumber: z.string().optional(),
  notes: z.string().optional(),
  areaId: z.string().optional(),
  collectionType: z.nativeEnum(CollectionType).default(CollectionType.DONATION),
  status: z.nativeEnum(ReceiptStatus).default(ReceiptStatus.PAID),
});

type FormData = z.infer<typeof schema>;

// Two steps, not three — donor info and amount/payment used to be separate
// taps, but neither is long enough alone to earn its own screen, and the
// extra "Continue" was pure friction for the common case (one donor, one
// amount, cash). Review still gets its own step since it's the one place a
// collector should actually stop and check what they're about to submit.
const STEPS = ['Details', 'Review & Send'];

export default function NewReceiptPage() {
  const [step, setStep] = useState(0);
  const [createdReceipt, setCreatedReceipt] = useState<any>(null);
  const [sharing, setSharing] = useState(false);
  const { activeCampaignId, language, organization } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { data: campaigns } = useQuery({ queryKey: ['campaigns'], queryFn: campaignsApi.list });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: orgsApi.getAreas });
  const { data: existingDonors } = useQuery({ queryKey: ['existing-donors'], queryFn: receiptsApi.donors });
  const { data: customDonationCategories } = useQuery({ queryKey: ['categories', 'DONATION'], queryFn: () => orgsApi.getCategories('DONATION') });

  const [donorSearch, setDonorSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const activeCampaigns = campaigns?.filter((c: any) => c.status === 'ACTIVE') || [];

  const { register, handleSubmit, watch, formState: { errors }, trigger, getValues, setValue } = useForm<FormData>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      campaignId: activeCampaignId || activeCampaigns[0]?.id || '',
      category: DonationCategory.GENERAL,
      paymentMode: PaymentMode.CASH,
      collectionType: CollectionType.DONATION,
      status: ReceiptStatus.PAID,
    },
  });

  const paymentMode = watch('paymentMode');
  const watchedAmount = watch('amount');
  const watchedDonorName = watch('donorName');

  // Quick receipt: prefill from ?donorPhone= and jump straight to the amount step
  useEffect(() => {
    const quickPhone = searchParams.get('donorPhone');
    if (!quickPhone || !existingDonors) return;
    const donor = existingDonors.find((d: any) => d.donorPhone === quickPhone);
    if (!donor) return;
    setValue('donorName', donor.donorName);
    setValue('donorPhone', donor.donorPhone);
    if (donor.donorAddress) setValue('donorAddress', donor.donorAddress);
    if (donor.areaId) setValue('areaId', donor.areaId);
    setStep(1);
    toast.success(`Quick receipt for ${donor.donorName} ⚡`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingDonors]);

  const createMutation = useMutation({
    mutationFn: receiptsApi.create,
    onSuccess: (receipt) => {
      setCreatedReceipt(receipt);
      // Start fetching the pavti image the moment it exists, well before the
      // user reaches the WhatsApp button on the success screen — see
      // prefetchReceiptImage's comment in lib/whatsappShare.ts.
      if (receipt.donorPhone) prefetchReceiptImage(receipt.id);
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success(language === 'mr' ? 'पावती यशस्वीरित्या तयार झाली!' : 'Receipt created successfully!');
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || 'Failed to create receipt');
    },
  });

  const nextStep = async () => {
    const fields: Record<number, (keyof FormData)[]> = {
      0: ['campaignId', 'donorName', 'donorPhone', 'amount', 'category', 'paymentMode'],
    };
    const valid = await trigger(fields[step] || []);
    if (valid) setStep(s => s + 1);
  };

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const handleShareWhatsApp = async () => {
    if (!createdReceipt?.donorPhone) return;
    await shareReceiptViaWhatsApp({
      donorPhone: createdReceipt.donorPhone,
      donorName: createdReceipt.donorName,
      amount: createdReceipt.amount,
      receiptNumber: createdReceipt.receiptNumber,
      receiptId: createdReceipt.id,
      category: createdReceipt.category,
      status: createdReceipt.status,
      organization: organization as any,
    });
  };

  const handleShareGeneric = async () => {
    if (!createdReceipt) return;
    setSharing(true);
    try {
      await shareReceiptGeneric({
        donorPhone: createdReceipt.donorPhone || '',
        donorName: createdReceipt.donorName,
        amount: createdReceipt.amount,
        receiptNumber: createdReceipt.receiptNumber,
        receiptId: createdReceipt.id,
        category: createdReceipt.category,
        status: createdReceipt.status,
        organization: organization as any,
      });
    } finally {
      setSharing(false);
    }
  };

  if (createdReceipt) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-theme-fg mb-1">
            {language === 'mr' ? 'पावती तयार झाली!' : 'Receipt Created!'}
          </h2>
          <p className="text-theme-fg/50 text-sm mb-6">{createdReceipt.receiptNumber}</p>

          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="btn-primary gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold"
              disabled={!createdReceipt.donorPhone}
            >
              <Share2 size={16} /> WhatsApp
            </button>
            <button
              type="button"
              onClick={handleShareGeneric}
              className="btn-secondary gap-2"
              disabled={sharing}
            >
              {sharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
              {language === 'mr' ? 'इतर शेअर' : 'Other Apps'}
            </button>
            <button onClick={() => window.open(`/receipt/${createdReceipt.id}`, '_blank')} className="btn-secondary gap-2">
              <Printer size={16} /> View & Print
            </button>
            <button onClick={() => { setStep(0); setCreatedReceipt(null); }} className="btn-ghost gap-2">
              <FileText size={16} /> New Receipt
            </button>
          </div>
        </div>

        <ReceiptPreview receipt={createdReceipt} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-theme-fg">
            {language === 'mr' ? 'नवीन पावती' : language === 'hi' ? 'नई रसीद' : 'New Receipt'}
          </h1>
          <p className="text-xs text-theme-fg/40">{STEPS[step]}</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-theme-fg/10">
            <div className={`h-full bg-gradient-brand transition-all duration-500 ${i <= step ? 'w-full' : 'w-0'}`} />
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 0: Donor + Amount/Payment together — see the STEPS comment above */}
        {step === 0 && (
          <div className="space-y-4 animate-slide-up">
          <div className="glass-card p-6 space-y-5">
            {/* Collection Type is always DONATION here — Internal
                Collection (member contributions) has its own dedicated
                flow now (Members > Contributions > declare), which handles
                bulk-declaring against real Member records instead of a
                one-off receipt. Keeping that option here duplicated the
                same outcome through a worse path (2026-08-22). */}
            <div>
              <label className="form-label">
                {language === 'mr' ? 'इवेंट / उपक्रम' : language === 'hi' ? 'इवेंट / उत्सव' : 'Event'} *
              </label>
              <select {...register('campaignId')} className="form-select">
                <option value="">{language === 'mr' ? 'इवेंट निवडा...' : language === 'hi' ? 'इवेंट चुनें...' : 'Select event...'}</option>
                {activeCampaigns.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.campaignId && <p className="form-error">{errors.campaignId.message}</p>}
            </div>

            <div className="relative">
              <label className="form-label">
                <User size={12} className="inline mr-1" />
                {language === 'mr' ? 'नाव' : 'Name'} *
              </label>
              <input
                {...register('donorName')}
                onChange={(e) => {
                  setDonorSearch(e.target.value);
                  setShowSuggestions(true);
                  setValue('donorName', e.target.value);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="form-input"
                placeholder="Suresh Ramchandra Patil"
                autoComplete="off"
              />
              {errors.donorName && <p className="form-error">{errors.donorName.message}</p>}

              {showSuggestions && donorSearch.length >= 2 && (
                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto glass-card border border-theme-fg/10 bg-navy-800 z-50 shadow-2xl rounded-xl">
                  {(existingDonors || [])
                    .filter((d: any) =>
                      d.donorName.toLowerCase().includes(donorSearch.toLowerCase()) ||
                      d.donorPhone?.includes(donorSearch)
                    )
                    .map((d: any, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setValue('donorName', d.donorName);
                          if (d.donorPhone) setValue('donorPhone', d.donorPhone);
                          if (d.donorAddress) setValue('donorAddress', d.donorAddress);
                          if (d.areaId) setValue('areaId', d.areaId);
                          setShowSuggestions(false);
                          toast.success('Prefilled donor details! ⚡');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-theme-fg/80 hover:bg-saffron-600/20 hover:text-theme-fg border-b border-theme-fg/5 last:border-0"
                      >
                        <p className="font-semibold">{d.donorName}</p>
                        {d.donorPhone && <p className="text-[10px] text-theme-fg/40">{d.donorPhone}</p>}
                      </button>
                    ))}
                  {(existingDonors || []).filter((d: any) =>
                    d.donorName.toLowerCase().includes(donorSearch.toLowerCase()) ||
                    d.donorPhone?.includes(donorSearch)
                  ).length === 0 && (
                    <p className="p-3 text-xs text-theme-fg/30 text-center">No matching existing donors</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="form-label">
                <Phone size={12} className="inline mr-1" />
                {language === 'mr' ? 'मोबाईल नंबर' : 'Mobile Number'} ({language === 'mr' ? 'पर्यायी' : 'Optional'})
              </label>
              <input {...register('donorPhone')} className="form-input" placeholder="98XXXXXXXX" type="tel" inputMode="numeric" />
            </div>

            <div>
              <label className="form-label">
                <MapPin size={12} className="inline mr-1" />
                {language === 'mr' ? 'पत्ता' : 'Address'} ({language === 'mr' ? 'पर्यायी' : 'Optional'})
              </label>
              <textarea {...register('donorAddress')} className="form-input resize-none" rows={2} placeholder="Near Ganesh Temple, Ward A..." />
            </div>

            <div>
              <label className="form-label">
                <MapPinned size={12} className="inline mr-1" />
                {language === 'mr' ? 'संग्रह क्षेत्र' : 'Collection Area'}
              </label>
              <PickerWithAdd
                value={watch('areaId') || ''}
                onChange={(v) => setValue('areaId', v)}
                options={(areas || []).map((a: any) => ({ value: a.id, label: a.name }))}
                placeholder="No specific area"
                addLabel={language === 'mr' ? '+ नवीन क्षेत्र जोडा…' : '+ Add new area…'}
                addPlaceholder={language === 'mr' ? 'उदा. वॉर्ड C' : 'e.g. Ward C'}
                onAddNew={async (label) => {
                  const created = await orgsApi.createArea({ name: label });
                  queryClient.invalidateQueries({ queryKey: ['areas'] });
                  return created.id;
                }}
              />
            </div>
          </div>

          <div className="glass-card p-6 space-y-5">
            <div>
              <label className="form-label">
                <IndianRupee size={12} className="inline mr-1" />
                {language === 'mr' ? 'रक्कम' : 'Amount'} (₹) *
              </label>
              <input
                {...register('amount', { valueAsNumber: true })}
                className="form-input text-2xl font-bold"
                placeholder="0"
                type="number"
                inputMode="numeric"
                min={1}
              />
              {errors.amount && <p className="form-error">{errors.amount.message}</p>}

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[100, 251, 500, 1100, 2100, 5000, 11000, 21000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    // Go through react-hook-form directly instead of poking the
                    // DOM (the old code did `input.value = ...` + dispatched a
                    // fake 'input' event — but React patches the native value
                    // setter on controlled inputs, so it had already "seen" that
                    // assignment and didn't re-fire onChange for the dispatched
                    // event. The field looked filled in but RHF's real state
                    // stayed empty, so validation still failed with "Enter a
                    // valid amount" even though a number was visibly there.
                    onClick={() => setValue('amount', amt, { shouldValidate: true, shouldDirty: true })}
                    className="px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-bold bg-saffron-600/10 text-saffron-400 border border-saffron-600/20 hover:bg-saffron-600/20 active:scale-95 transition-all flex items-center justify-center"
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">
                <Tag size={12} className="inline mr-1" />
                {language === 'mr' ? 'देणगी प्रकार' : 'Donation Category'}
              </label>
              <PickerWithAdd
                value={watch('category') || DonationCategory.GENERAL}
                onChange={(v) => setValue('category', v)}
                options={[
                  ...Object.values(DonationCategory).map((cat) => ({ value: cat, label: RECEIPT_CATEGORIES_LABELS[cat][language] })),
                  ...(customDonationCategories || []).map((c: any) => ({ value: c.label, label: c.label })),
                ]}
                addLabel={language === 'mr' ? '+ नवीन प्रकार जोडा…' : '+ Add new category…'}
                addPlaceholder={language === 'mr' ? 'उदा. मंडप सजावट' : 'e.g. Stage Decor'}
                onAddNew={async (label) => {
                  const created = await orgsApi.createCategory('DONATION', label);
                  queryClient.invalidateQueries({ queryKey: ['categories', 'DONATION'] });
                  return created.label;
                }}
              />
            </div>

            <div>
              <label className="form-label">
                <CreditCard size={12} className="inline mr-1" />
                {language === 'mr' ? 'देय पद्धत' : 'Payment Mode'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(PaymentMode).map((mode) => (
                  <label key={mode} className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-medium ${watch('paymentMode') === mode ? 'border-saffron-500 bg-saffron-600/15 text-saffron-400' : 'border-theme-fg/10 bg-theme-fg/5 text-theme-fg/60 hover:bg-theme-fg/8'}`}>
                    <input {...register('paymentMode')} type="radio" value={mode} className="hidden" />
                    {mode === 'CASH' ? '💵' : mode === 'UPI' ? '📱' : mode === 'CHEQUE' ? '📄' : mode === 'BANK_TRANSFER' ? '🏦' : '💻'}
                    {PAYMENT_MODE_LABELS[mode][language]}
                  </label>
                ))}
              </div>
            </div>

            {paymentMode === 'CHEQUE' && (
              <div className="animate-slide-up">
                <label className="form-label">Cheque Number</label>
                <input {...register('chequeNumber')} className="form-input" placeholder="000123" />
              </div>
            )}

            {/* Collector-facing, in-person UPI QR — shown live the moment
                UPI is picked, not on the pavti itself (donor scans this on
                the collector's own screen while the collector is standing
                right there; the receipt hasn't been created yet, so the
                note field uses the donor's name/campaign rather than a
                receipt number). See lib/upi.ts for why this bypasses any
                payment gateway entirely (2026-08-21 architecture decision). */}
            {/* Collector-facing, in-person Direct Mandal UPI QR — shown live when UPI is selected */}
            {paymentMode === 'UPI' && (
              <div className="animate-slide-up glass-card p-4 text-center space-y-3 bg-theme-fg/[0.02]">
                {organization?.upiId ? (
                  <>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-theme-fg">
                        {language === 'mr' ? 'मंडळाचा थेट UPI QR कोड' : 'Direct Mandal UPI QR Code'}
                      </p>
                      <p className="text-[11px] text-theme-fg/50 mt-0.5">
                        {language === 'mr' ? 'देणगीदाराला स्कॅन करून पेमेंट करण्यासाठी हा QR दाखवा' : 'Show this to the donor to scan & pay directly via any UPI app'}
                      </p>
                    </div>
                    <div className="flex justify-center py-1">
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-theme-fg/10">
                        <QRCodeSVG
                          value={buildUpiPaymentLink({
                            upiId: organization.upiId,
                            payeeName: organization.name,
                            amount: watchedAmount || 0,
                            note: watchedDonorName || undefined,
                          })}
                          size={150}
                        />
                      </div>
                    </div>
                    <p className="text-xs font-mono font-medium text-saffron-500">{organization.upiId}</p>
                  </>
                ) : (
                  <p className="text-xs text-theme-fg/40 py-2">
                    {language === 'mr' ? 'पेमेंट QR दाखवण्यासाठी ' : 'Add your UPI ID in '}
                    <Link href="/settings" className="text-saffron-400 underline underline-offset-2">
                      {language === 'mr' ? 'सेटिंग्जमध्ये UPI ID जोडा' : 'Settings'}
                    </Link>
                    {language === 'mr' ? '.' : ' to show a payment QR here.'}
                  </p>
                )}
              </div>
            )}

            {/* Online Payment Explanation */}
            {paymentMode === 'ONLINE' && (
              <div className="animate-slide-up glass-card p-4 text-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1">
                <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                  <Sparkles size={16} className="text-amber-400 animate-pulse" />
                  <span>{language === 'mr' ? 'ऑनलाइन पेमेंट मोड (ऑटो-वेरिफाइड)' : 'Auto-Verified Online Payment'}</span>
                </div>
                <p className="text-[11px] text-theme-fg/70">
                  {language === 'mr'
                    ? 'पावती तयार केल्यावर डायनामिक QR आणि ऑटो-वेरिफाइड ऑनलाइन पेमेंट लिंक तयार होईल.'
                    : 'Creating this receipt will generate a Dynamic QR & Instant Verification Link.'}
                </p>
              </div>
            )}

            <div>
              <label className="form-label">
                <FileText size={12} className="inline mr-1" />
                {language === 'mr' ? 'टीप' : 'Notes'} ({language === 'mr' ? 'पर्यायी' : 'Optional'})
              </label>
              <textarea {...register('notes')} className="form-input resize-none" rows={2} placeholder="Any special notes..." />
            </div>

            <div>
              <label className="form-label">Payment Status</label>
              <select {...register('status')} className="form-select">
                <option value={ReceiptStatus.PAID}>🟢 {RECEIPT_STATUS_LABELS[ReceiptStatus.PAID][language]}</option>
                <option value={ReceiptStatus.PENDING}>🟡 {RECEIPT_STATUS_LABELS[ReceiptStatus.PENDING][language]} ({language === 'mr' ? 'अद्याप न भरलेले' : language === 'hi' ? 'अभी तक अदा नहीं' : 'not yet paid'})</option>
              </select>
            </div>

            {/* Sharing is manual, from the confirmation screen after the
                receipt is created — see handleShare below. Nothing to
                configure here; the "Share via WhatsApp" button only needs a
                donor phone to be enabled. */}
          </div>
          </div>
        )}

        {/* Step 1: Review */}
        {step === 1 && (
          <div className="space-y-4 animate-slide-up">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-theme-fg/60 uppercase tracking-wider mb-4">Review Receipt</h3>
              <div className="space-y-3">
                {[
                  { label: 'Donor', value: getValues('donorName') },
                  { label: 'Phone', value: getValues('donorPhone') || '—' },
                  { label: 'Amount', value: `₹${Number(getValues('amount') || 0).toLocaleString('en-IN')}` },
                  { label: 'Category', value: RECEIPT_CATEGORIES_LABELS[getValues('category')][language] },
                  { label: 'Payment', value: PAYMENT_MODE_LABELS[getValues('paymentMode')][language] },
                  { label: 'Status', value: RECEIPT_STATUS_LABELS[getValues('status')][language] },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-theme-fg/5">
                    <span className="text-xs text-theme-fg/40">{label}</span>
                    <span className="text-sm text-theme-fg font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-5">
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={nextStep} className="btn-primary flex-1">
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? (
                <span className="animate-pulse-soft">Creating...</span>
              ) : (
                <>✨ {language === 'mr' ? 'पावती तयार करा' : 'Create Receipt'}</>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
