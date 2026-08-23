'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { Sparkles, Building2, Calendar, Users, Receipt, ArrowRight, CheckCircle2, X } from 'lucide-react';
import LogoMark from '@/components/brand/LogoMark';

export default function OnboardingWelcomeModal() {
  const { user, organization, language, completedTours, markTourCompleted } = useAuthStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Open if welcome tour has not been dismissed yet
    if (user && organization && !completedTours['welcome']) {
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [user, organization, completedTours]);

  if (!open) return null;

  const handleDismiss = () => {
    markTourCompleted('welcome');
    setOpen(false);
  };

  const text = {
    mr: {
      welcome: `नमस्कार, ${user?.name || 'अध्यक्ष/खजिनदार'}! 👋`,
      title: 'ई-पावती बुक (E-PavtiBook) मध्ये आपले सहर्ष स्वागत!',
      subtitle: 'तुमच्या मंडळाचे डिजिटल जमा-खर्च व्यवस्थापन सुरू करण्यासाठी या ४ सोप्या पायऱ्या पूर्ण करा:',
      step1Title: '१. मंडळाची माहिती व UPI ID नोंदवा',
      step1Desc: 'बँक खाते क्रमांक आणि मंडळाचा UPI ID जोडा.',
      step1Btn: 'सेटिंग्ज उघडा',
      step2Title: '२. चालू उत्सव/उपक्रम सुरू करा',
      step2Desc: 'श्री गणेशोत्सव किंवा नवरात्रोत्सव सक्रिय करा.',
      step2Btn: 'उत्सव सुरू करा',
      step3Title: '३. कार्यकर्ते व खजिनदार जोडा',
      step3Desc: 'कार्यकर्त्यांना मोबाईलवरून पावती फाडण्याची मुभा द्या.',
      step3Btn: 'कार्यकर्ते जोडा',
      step4Title: '४. पहिली डिजिटल पावती फाडा',
      step4Desc: 'देणगीदाराला व्हॉट्सॲपवर त्वरित पावती पाठवा.',
      step4Btn: 'पावती फाडा',
      gotIt: 'समजले, पुढे चला',
    },
    hi: {
      welcome: `नमस्ते, ${user?.name || 'अध्यक्ष/कोषाध्यक्ष'}! 👋`,
      title: 'ई-पावती बुक (E-PavtiBook) में आपका स्वागत है!',
      subtitle: 'अपने मंडल का डिजिटल संग्रह और लेखा-जोखा शुरू करने के लिए ये 4 चरण पूरे करें:',
      step1Title: '1. मंडल की जानकारी और UPI ID दर्ज करें',
      step1Desc: 'बैंक खाता विवरण और मंडल की UPI ID जोड़ें।',
      step1Btn: 'सेटिंग्स खोलें',
      step2Title: '2. चालू उत्सव/इवेंट शुरू करें',
      step2Desc: 'गणेशोत्सव या नवरात्रोत्सव इवेंट को सक्रिय करें।',
      step2Btn: 'इवेंट शुरू करें',
      step3Title: '3. कार्यकर्ता और कोषाध्यक्ष जोड़ें',
      step3Desc: 'कार्यकर्ताओं को अपने फोन से रसीद काटने का अधिकार दें।',
      step3Btn: 'कार्यकर्ता जोड़ें',
      step4Title: '4. पहली डिजिटल रसीद काटें',
      step4Desc: 'दानदाता को व्हाट्सएप पर तुरंत रसीद भेजें।',
      step4Btn: 'रसीद काटें',
      gotIt: 'समझ गया, आगे बढ़ें',
    },
    en: {
      welcome: `Welcome, ${user?.name || 'Admin'}! 👋`,
      title: 'Welcome to E-PavtiBook Digital Collection Portal',
      subtitle: 'Complete these 4 simple steps to set up your Mandal & start collecting digitally:',
      step1Title: '1. Setup Mandal Bank & UPI ID',
      step1Desc: 'Configure bank details and custom UPI VPA in Settings.',
      step1Btn: 'Open Settings',
      step2Title: '2. Launch Active Event / Campaign',
      step2Desc: 'Activate Ganesh Utsav or Navratri 2026 campaign.',
      step2Btn: 'Setup Event',
      step3Title: '3. Add Karyakartas & Collectors',
      step3Desc: 'Give volunteers login access to collect on mobile.',
      step3Btn: 'Add Collectors',
      step4Title: '4. Issue Your First Digital Pavti',
      step4Desc: 'Create receipts and share instantly on WhatsApp.',
      step4Btn: 'New Receipt',
      gotIt: 'Got it, let\'s start!',
    },
  };

  const t = text[language] || text.mr;

  const steps = [
    {
      num: 1,
      icon: <Building2 size={16} className="text-saffron-500" />,
      title: t.step1Title,
      desc: t.step1Desc,
      btnText: t.step1Btn,
      href: '/settings',
    },
    {
      num: 2,
      icon: <Calendar size={16} className="text-amber-500" />,
      title: t.step2Title,
      desc: t.step2Desc,
      btnText: t.step2Btn,
      href: '/campaigns',
    },
    {
      num: 3,
      icon: <Users size={16} className="text-emerald-500" />,
      title: t.step3Title,
      desc: t.step3Desc,
      btnText: t.step3Btn,
      href: '/members',
    },
    {
      num: 4,
      icon: <Receipt size={16} className="text-blue-500" />,
      title: t.step4Title,
      desc: t.step4Desc,
      btnText: t.step4Btn,
      href: '/receipts/new',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="glass-card max-w-lg w-full p-6 sm:p-7 animate-scale-in relative bg-white dark:bg-[#1A120B] shadow-2xl border border-saffron-500/30">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-theme-fg/40 hover:text-theme-fg p-1.5 rounded-lg hover:bg-theme-fg/5 transition-all"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <LogoMark size={36} className="rounded-xl shadow-md shrink-0" />
          <div>
            <span className="text-xs font-semibold text-saffron-600 dark:text-saffron-400 flex items-center gap-1">
              <Sparkles size={12} /> {t.welcome}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-theme-fg leading-snug">
              {t.title}
            </h2>
          </div>
        </div>

        <p className="text-xs text-theme-fg/60 mb-5 leading-relaxed">
          {t.subtitle}
        </p>

        <div className="space-y-3 mb-6">
          {steps.map((s) => (
            <div
              key={s.num}
              className="p-3 rounded-xl border border-theme/20 bg-theme-fg/[0.02] hover:bg-theme-fg/[0.04] transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-theme-fg/5 flex items-center justify-center shrink-0">
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-theme-fg truncate">{s.title}</p>
                  <p className="text-[11px] text-theme-fg/50 truncate">{s.desc}</p>
                </div>
              </div>
              <Link
                href={s.href}
                onClick={handleDismiss}
                className="text-[11px] font-semibold text-saffron-600 dark:text-saffron-400 hover:underline shrink-0 flex items-center gap-0.5"
              >
                {s.btnText} <ArrowRight size={11} />
              </Link>
            </div>
          ))}
        </div>

        <button
          onClick={handleDismiss}
          className="btn-primary text-xs font-semibold w-full min-h-[42px] flex items-center justify-center gap-2 shadow-md"
        >
          <CheckCircle2 size={15} />
          {t.gotIt}
        </button>
      </div>
    </div>
  );
}
