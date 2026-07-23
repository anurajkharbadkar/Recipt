'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { receiptsApi, campaignsApi, orgsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { DonationCategory, PaymentMode, CollectionType, ReceiptStatus } from '@pavti/shared';
import {
  User, Phone, MapPin, IndianRupee, Tag, CreditCard, FileText,
  MapPinned, MessageCircle, ArrowLeft, CheckCircle, Printer, Share2
} from 'lucide-react';
import ReceiptPreview from '@/components/receipt/ReceiptPreview';

const schema = z.object({
  campaignId: z.string().min(1, 'Campaign is required'),
  donorName: z.string().min(2, 'Donor name is required'),
  donorPhone: z.string().optional(),
  donorAddress: z.string().optional(),
  amount: z.number({ invalid_type_error: 'Enter a valid amount' }).min(1, 'Amount must be at least ₹1'),
  category: z.nativeEnum(DonationCategory).default(DonationCategory.GENERAL),
  paymentMode: z.nativeEnum(PaymentMode).default(PaymentMode.CASH),
  chequeNumber: z.string().optional(),
  notes: z.string().optional(),
  areaId: z.string().optional(),
  sendWhatsapp: z.boolean().default(true),
  sendSms: z.boolean().default(false),
  collectionType: z.nativeEnum(CollectionType).default(CollectionType.DONATION),
  status: z.nativeEnum(ReceiptStatus).default(ReceiptStatus.PAID),
});

type FormData = z.infer<typeof schema>;

const STEPS = ['Campaign & Donor', 'Amount & Details', 'Review & Send'];

export default function NewReceiptPage() {
  const [step, setStep] = useState(0);
  const [createdReceipt, setCreatedReceipt] = useState<any>(null);
  const { activeCampaignId, language } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { data: campaigns } = useQuery({ queryKey: ['campaigns'], queryFn: campaignsApi.list });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: orgsApi.getAreas });
  const { data: existingDonors } = useQuery({ queryKey: ['existing-donors'], queryFn: receiptsApi.donors });

  const [donorSearch, setDonorSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const activeCampaigns = campaigns?.filter((c: any) => c.status === 'ACTIVE') || [];

  const { register, handleSubmit, watch, formState: { errors }, trigger, getValues, setValue } = useForm<FormData>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      campaignId: activeCampaignId || activeCampaigns[0]?.id || '',
      category: DonationCategory.GENERAL,
      paymentMode: PaymentMode.CASH,
      sendWhatsapp: true,
      sendSms: false,
      collectionType: CollectionType.DONATION,
      status: ReceiptStatus.PAID,
    },
  });

  const paymentMode = watch('paymentMode');
  const donorPhone = watch('donorPhone');
  const sendWhatsapp = watch('sendWhatsapp');

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
      setStep(3);
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
      0: ['campaignId', 'donorName', 'donorPhone'],
      1: ['amount', 'category', 'paymentMode'],
    };
    const valid = await trigger(fields[step] || []);
    if (valid) setStep(s => s + 1);
  };

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const handleShare = () => {
    if (!createdReceipt?.donorPhone) return;
    const url = `${window.location.origin}/receipt/${createdReceipt.id}`;
    const msg = encodeURIComponent(
      `🙏 नमस्कार ${createdReceipt.donorName}!\n\nआपली पावती: ${createdReceipt.receiptNumber}\nरक्कम: ₹${createdReceipt.amount}\n\nपावती पाहा: ${url}`
    );
    window.open(`https://wa.me/91${createdReceipt.donorPhone.replace(/\D/g, '')}?text=${msg}`);
  };

  if (step === 3 && createdReceipt) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            {language === 'mr' ? 'पावती तयार झाली!' : 'Receipt Created!'}
          </h2>
          <p className="text-white/50 text-sm mb-6">{createdReceipt.receiptNumber}</p>

          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <button onClick={handleShare} className="btn-primary gap-2" disabled={!createdReceipt.donorPhone}>
              <Share2 size={16} /> WhatsApp
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
          <h1 className="text-xl font-bold text-white">
            {language === 'mr' ? 'नवीन पावती' : language === 'hi' ? 'नई रसीद' : 'New Receipt'}
          </h1>
          <p className="text-xs text-white/40">{STEPS[step]}</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
            <div className={`h-full bg-gradient-brand transition-all duration-500 ${i <= step ? 'w-full' : 'w-0'}`} />
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 0: Campaign & Donor */}
        {step === 0 && (
          <div className="glass-card p-6 space-y-5 animate-slide-up">
            <div>
              <label className="form-label">Collection Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setValue('collectionType', CollectionType.DONATION)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${watch('collectionType') === CollectionType.DONATION ? 'bg-saffron-600 text-white shadow-glow-saffron' : 'bg-white/5 text-white/50 border border-white/8 hover:text-white'}`}
                >
                  🤝 Donation
                </button>
                <button
                  type="button"
                  onClick={() => setValue('collectionType', CollectionType.INTERNAL)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${watch('collectionType') === CollectionType.INTERNAL ? 'bg-saffron-600 text-white shadow-glow-saffron' : 'bg-white/5 text-white/50 border border-white/8 hover:text-white'}`}
                >
                  🏢 Internal Collection
                </button>
              </div>
            </div>

            <div>
              <label className="form-label">
                {language === 'mr' ? 'मोहीम' : 'Campaign'} *
              </label>
              <select {...register('campaignId')} className="form-select">
                <option value="">Select campaign...</option>
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
                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto glass-card border border-white/10 bg-navy-800 z-50 shadow-2xl rounded-xl">
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
                        className="w-full text-left px-4 py-2 text-xs text-white/80 hover:bg-saffron-600/20 hover:text-white border-b border-white/5 last:border-0"
                      >
                        <p className="font-semibold">{d.donorName}</p>
                        {d.donorPhone && <p className="text-[10px] text-white/40">{d.donorPhone}</p>}
                      </button>
                    ))}
                  {(existingDonors || []).filter((d: any) =>
                    d.donorName.toLowerCase().includes(donorSearch.toLowerCase()) ||
                    d.donorPhone?.includes(donorSearch)
                  ).length === 0 && (
                    <p className="p-3 text-xs text-white/30 text-center">No matching existing donors</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="form-label">
                <Phone size={12} className="inline mr-1" />
                {language === 'mr' ? 'मोबाईल नंबर' : 'Mobile Number'} ({language === 'mr' ? 'पर्यायी' : 'Optional'})
              </label>
              <input {...register('donorPhone')} className="form-input" placeholder="9876543210" type="tel" inputMode="numeric" />
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
              <select {...register('areaId')} className="form-select">
                <option value="">No specific area</option>
                {(areas || []).map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 1: Amount & Details */}
        {step === 1 && (
          <div className="glass-card p-6 space-y-5 animate-slide-up">
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
                    onClick={() => {
                      const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                      if (input) { input.value = amt.toString(); input.dispatchEvent(new Event('input', { bubbles: true })); }
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-saffron-600/10 text-saffron-400 border border-saffron-600/20 hover:bg-saffron-600/20 transition-colors"
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
              <select {...register('category')} className="form-select">
                {Object.values(DonationCategory).map((cat) => (
                  <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">
                <CreditCard size={12} className="inline mr-1" />
                {language === 'mr' ? 'देय पद्धत' : 'Payment Mode'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(PaymentMode).map((mode) => (
                  <label key={mode} className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-medium ${watch('paymentMode') === mode ? 'border-saffron-500 bg-saffron-600/15 text-saffron-400' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/8'}`}>
                    <input {...register('paymentMode')} type="radio" value={mode} className="hidden" />
                    {mode === 'CASH' ? '💵' : mode === 'UPI' ? '📱' : mode === 'CHEQUE' ? '📄' : mode === 'BANK_TRANSFER' ? '🏦' : '💻'}
                    {mode}
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
                <option value={ReceiptStatus.PAID}>🟢 PAID / RECEIVED</option>
                <option value={ReceiptStatus.PENDING}>🟡 PENDING / UNPAID (PLEDGED)</option>
              </select>
            </div>

            {/* Notification options */}
            <div className="border border-white/8 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Send Notification</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-10 h-5 rounded-full transition-colors relative ${watch('sendWhatsapp') ? 'bg-saffron-600' : 'bg-white/15'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${watch('sendWhatsapp') ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <input {...register('sendWhatsapp')} type="checkbox" className="hidden" />
                <div>
                  <p className="text-sm text-white/80 flex items-center gap-1.5">
                    <MessageCircle size={14} className="text-green-400" />
                    WhatsApp {!donorPhone && <span className="text-xs text-white/30">(phone required)</span>}
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-10 h-5 rounded-full transition-colors relative ${watch('sendSms') ? 'bg-saffron-600' : 'bg-white/15'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${watch('sendSms') ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <input {...register('sendSms')} type="checkbox" className="hidden" />
                <p className="text-sm text-white/80">SMS</p>
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="space-y-4 animate-slide-up">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Review Receipt</h3>
              <div className="space-y-3">
                {[
                  { label: 'Type', value: getValues('collectionType') },
                  { label: 'Donor', value: getValues('donorName') },
                  { label: 'Phone', value: getValues('donorPhone') || '—' },
                  { label: 'Amount', value: `₹${Number(getValues('amount') || 0).toLocaleString('en-IN')}` },
                  { label: 'Category', value: getValues('category') },
                  { label: 'Payment', value: getValues('paymentMode') },
                  { label: 'Status', value: getValues('status') },
                  { label: 'WhatsApp', value: getValues('sendWhatsapp') && getValues('donorPhone') ? '✅ Will be sent' : '❌ Not sending' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs text-white/40">{label}</span>
                    <span className="text-sm text-white font-medium">{value}</span>
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
          {step < 2 ? (
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
