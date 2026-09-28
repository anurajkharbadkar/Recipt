'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { mandalPagesApi, orgsApi, getErrorMessage } from '@/lib/api';
import {
  Globe, Calendar, Sparkles, Save, ExternalLink, Plus, Trash2,
  Shirt, Clock, Award, Building2, CreditCard, MapPin, Eye, Loader2,
  Upload, ImageIcon, Layers, ArrowUp, ArrowDown, LayoutGrid, Share2, Crown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MandalPageBuilderDashboard() {
  const { organization, user } = useAuthStore();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isPremium = organization?.subscriptionPlan === 'PREMIUM';

  const { data: config, isLoading } = useQuery({
    queryKey: ['mandal-page-config'],
    queryFn: mandalPagesApi.getMyConfig,
    enabled: isAdmin && isPremium,
  });

  if (!isPremium) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 animate-fade-in">
        <div className="relative rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-[#2A170B] via-[#1E1007] to-[#120904] text-amber-50 p-8 sm:p-12 shadow-2xl space-y-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-saffron-500/20 border border-saffron-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-saffron-950/60">
            <Crown size={40} className="animate-pulse" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="inline-block text-[11px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              🌟 Premium Plan Exclusive Feature
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-100 font-devanagari">
              मंडळ सार्वजनिक संकेतस्थळ (Public Webpage) ही Premium वैशिष्ट्य आहे
            </h1>
            <p className="text-xs sm:text-sm text-amber-200/70 leading-relaxed">
              तुमच्या मंडळासाठी स्वतंत्र सार्वजनिक वेबपेज (`/mandal/your-mandal`) तयार करा. ९/१० दिवसांचे दैनिक वेळापत्रक, पोशाख, स्पॉन्सर बॅनर आणि थेट देणगी माहिती प्रदर्शित करा.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-lg mx-auto bg-[#160B04] border border-amber-900/50 p-4 rounded-xl text-xs text-amber-200/90 font-medium">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <span>स्वतंत्र मंडळाची युनिक लिंक (/mandal/slug)</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <span>९/१० दिवसांचे दैनिक वेळापत्रक व पोशाख</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <span>स्पॉन्सर व जाहिरातदार बॅनर प्रदर्शन</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <span>डिजिटल पावती व ऑनलाईन वर्गणी लिंक</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/subscription"
              className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl bg-gradient-to-r from-saffron-600 via-amber-500 to-saffron-600 text-slate-950 font-black text-sm shadow-xl shadow-amber-950/80 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <CreditCard size={18} />
              <span>Upgrade to Premium Plan (₹1,999/season)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState<any>({
    slug: '',
    tagline: '',
    showHistory: true,
    showCommunityStats: true,
    showSocialInitiatives: true,
    showAchievements: true,
    aboutHistoryText: '',
    milestones: [],
    communityStats: {
      families: 250,
      volunteers: 120,
      yearsActive: 28,
      socialInitiatives: 15,
      culturalPrograms: 25,
    },
    socialInitiatives: [],
    achievements: [],
    customSections: [],
    coverImageUrl: '',
    themeColor: '#d97706',
    googleMapUrl: '',
    bankName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    upiId: '',
    qrImageUrl: '',
    days: [],
    sponsors: [],
  });

  const [activeTab, setActiveTab] = useState<'general' | 'custom-sections' | 'schedule' | 'sponsors'>('general');

  useEffect(() => {
    if (config) {
      let aboutText = config.aboutHistory || '';
      let isHistoryVisible = true;
      let isStatsVisible = true;
      let isInitiativesVisible = true;
      let isAchievementsVisible = true;
      let statsObj = {
        families: 250,
        volunteers: 120,
        yearsActive: 28,
        socialInitiatives: 15,
        culturalPrograms: 25,
      };
      let milestonesList: any[] = [
        { year: 1998, category: 'foundation', title: 'मंडळाची स्थापना व पहिला उत्सव', description: 'आनंद नगरमधील नागरिकांनी एकत्र येऊन पारंपारिक मातीच्या मूर्तीची प्रतिष्ठापना केली आणि सामुदायिक उत्सवाची मुहूर्तमेढ रोवली.' },
        { year: 2005, category: 'cultural', title: 'पारंपारिक लेझीम व सांस्कृतिक पथक', description: 'मंडळाने स्वतःचे पारंपारिक लेझीम व झांज पथक सुरू केले जे आज शहरात प्रसिद्ध आहे.' },
        { year: 2015, category: 'social', title: 'रक्तदान व वैद्यकीय मदत केंद्र', description: 'आरोग्य सेवेचा संकल्प घेऊन दरवर्षी मोफत रक्तदान व नेत्र तपासणी शिबिराचे आयोजन.' },
        { year: 2024, category: 'achievement', title: 'उत्कृष्ट नवरात्रोत्सव पुरस्कार', description: 'सामाजिक एकता आणि पर्यावरणपूरक उत्सवासाठी महापालिकेकडून विशेष सन्मान.' },
      ];
      let initiativesList: any[] = [
        { category: 'health', title: 'वार्षिक रक्तदान व आरोग्य तपासणी शिबीर', description: 'शासकीय रक्तपेढीच्या सहकार्याने दरवर्षी नवरात्रोत्सवात २०० हून अधिक रक्त बाटल्यांचे संकलन आणि मोफत नेत्र तपासणी.' },
        { category: 'education', title: 'सरस्वती शैक्षणिक साहाय्य व शिष्यवृत्ती', description: 'परिसरातील गरजू आणि होतकरू शालेय विद्यार्थ्यांना वह्या, पुस्तके, दप्तर वाटप आणि उच्च शिक्षणासाठी शिष्यवृत्ती.' },
        { category: 'environment', title: 'निर्माल्या संकलन व हरित परिसर मोहीम', description: 'उत्सवातील सर्व फुलांचे पुनर्प्रक्रिया करून सेंद्रिय खतात रूपांतर केले जाते आणि स्थानिक सार्वजनिक उद्यानांमध्ये वितरित केले जाते.' },
      ];
      let achievementsList: any[] = [
        { year: 2021, title: 'जिल्हास्तरीय आदर्श सार्वजनिक मंडळ पुरस्कार', description: 'शांतता, स्वच्छता, सामाजिक उपक्रम आणि शिस्तबद्ध उत्सव आयोजनासाठी महानगरपालिकेकडून विशेष सन्मान.', conferredBy: 'महानगरपालिका' },
        { year: 2024, title: 'सांस्कृतिक वारसा संवर्धन गौरव', description: 'पारंपरिक लोककला, लेझीम पथक आणि पारंपरिक वाद्यांच्या अखंड जतनासाठी राज्य सांस्कृतिक परिषदेकडून गौरव.', conferredBy: 'राज्य सांस्कृतिक परिषद' },
      ];
      let customSectionsList: any[] = [];

      if (typeof config.aboutHistory === 'string' && config.aboutHistory.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(config.aboutHistory);
          if (parsed.showHistory !== undefined) {
            isHistoryVisible = Boolean(parsed.showHistory);
          }
          if (parsed.showCommunityStats !== undefined) {
            isStatsVisible = Boolean(parsed.showCommunityStats);
          }
          if (parsed.showSocialInitiatives !== undefined) {
            isInitiativesVisible = Boolean(parsed.showSocialInitiatives);
          }
          if (parsed.showAchievements !== undefined) {
            isAchievementsVisible = Boolean(parsed.showAchievements);
          }
          if (parsed.description !== undefined) {
            aboutText = parsed.description;
          }
          if (parsed.communityStats && typeof parsed.communityStats === 'object') {
            statsObj = {
              families: Number(parsed.communityStats.families ?? 250),
              volunteers: Number(parsed.communityStats.volunteers ?? 120),
              yearsActive: Number(parsed.communityStats.yearsActive ?? 28),
              socialInitiatives: Number(parsed.communityStats.socialInitiatives ?? 15),
              culturalPrograms: Number(parsed.communityStats.culturalPrograms ?? 25),
            };
          }
          if (Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
            milestonesList = parsed.milestones.map((m: any) => ({
              year: Number(m.year) || 2000,
              category: m.category || 'foundation',
              title: typeof m.title === 'string' ? m.title : (m.title?.mr || m.title?.en || ''),
              description: typeof m.description === 'string' ? m.description : (m.description?.mr || m.description?.en || ''),
            }));
          }
          if (Array.isArray(parsed.socialInitiatives) && parsed.socialInitiatives.length > 0) {
            initiativesList = parsed.socialInitiatives.map((si: any) => ({
              category: si.category || 'health',
              title: typeof si.title === 'string' ? si.title : (si.title?.mr || si.title?.en || ''),
              description: typeof si.description === 'string' ? si.description : (si.description?.mr || si.description?.en || ''),
            }));
          }
          if (Array.isArray(parsed.achievements) && parsed.achievements.length > 0) {
            achievementsList = parsed.achievements.map((ach: any) => ({
              year: ach.year ? Number(ach.year) : 2024,
              title: typeof ach.title === 'string' ? ach.title : (ach.title?.mr || ach.title?.en || ''),
              description: typeof ach.description === 'string' ? ach.description : (ach.description?.mr || ach.description?.en || ''),
              conferredBy: typeof ach.conferredBy === 'string' ? ach.conferredBy : (ach.conferredBy?.mr || ach.conferredBy?.en || ''),
            }));
          }
          if (Array.isArray(parsed.customSections)) {
            customSectionsList = parsed.customSections.map((sec: any) => ({
              id: sec.id || `csec-${Date.now()}`,
              title: typeof sec.title === 'string' ? sec.title : (sec.title?.mr || sec.title?.en || ''),
              subtitle: typeof sec.subtitle === 'string' ? sec.subtitle : (sec.subtitle?.mr || sec.subtitle?.en || ''),
              layout: sec.layout || 'cards',
              enabled: sec.enabled !== false,
              items: Array.isArray(sec.items)
                ? sec.items.map((item: any) => ({
                    id: item.id || `item-${Date.now()}`,
                    title: typeof item.title === 'string' ? item.title : (item.title?.mr || item.title?.en || ''),
                    description: typeof item.description === 'string' ? item.description : (item.description?.mr || item.description?.en || ''),
                    tag: typeof item.tag === 'string' ? item.tag : (item.tag?.mr || item.tag?.en || ''),
                    value: item.value || '',
                    year: item.year ? Number(item.year) : undefined,
                    icon: item.icon || 'community',
                  }))
                : [],
            }));
          }
        } catch {
          // Fallback if not valid JSON
        }
      }

      setFormData({
        slug: config.slug || organization?.slug || '',
        tagline: config.tagline || '',
        showHistory: isHistoryVisible,
        showCommunityStats: isStatsVisible,
        showSocialInitiatives: isInitiativesVisible,
        showAchievements: isAchievementsVisible,
        aboutHistoryText: aboutText,
        milestones: milestonesList,
        communityStats: statsObj,
        socialInitiatives: initiativesList,
        achievements: achievementsList,
        customSections: customSectionsList,
        coverImageUrl: config.coverImageUrl || '',
        themeColor: config.themeColor || '#d97706',
        googleMapUrl: config.googleMapUrl || '',
        bankName: config.bankName || organization?.bankName || '',
        bankAccountNumber: config.bankAccountNumber || organization?.bankAccountNumber || '',
        bankIfsc: config.bankIfsc || organization?.bankIfsc || '',
        upiId: config.upiId || organization?.upiId || '',
        qrImageUrl: config.qrImageUrl || '',
        days: config.days || [],
        sponsors: config.sponsors || [],
      });
    }
  }, [config, organization]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        aboutHistory: JSON.stringify({
          showHistory: data.showHistory !== false,
          showCommunityStats: data.showCommunityStats !== false,
          showSocialInitiatives: data.showSocialInitiatives !== false,
          showAchievements: data.showAchievements !== false,
          description: data.aboutHistoryText || '',
          milestones: data.milestones || [],
          communityStats: data.communityStats || {},
          socialInitiatives: data.socialInitiatives || [],
          achievements: data.achievements || [],
          customSections: data.customSections || [],
        }),
      };
      return mandalPagesApi.updateConfig(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandal-page-config'] });
      toast.success('Mandal webpage settings & event schedule saved!');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to save configuration.'));
    },
  });

  const handleAddCustomSection = () => {
    setFormData((prev: any) => ({
      ...prev,
      customSections: [
        ...(prev.customSections || []),
        {
          id: `csec-${Date.now()}`,
          title: 'नवीन सानुकूल विभाग',
          subtitle: 'या विभागाची थोडक्यात माहिती...',
          layout: 'cards',
          enabled: true,
          items: [
            { id: `item-${Date.now()}`, title: 'पहिला घटक / विषय', description: 'सविस्तर तपशील...', tag: 'महत्त्वाचे', icon: 'community' }
          ],
        },
      ],
    }));
  };

  const handleRemoveCustomSection = (secIdx: number) => {
    setFormData((prev: any) => ({
      ...prev,
      customSections: prev.customSections.filter((_: any, i: number) => i !== secIdx),
    }));
  };

  const handleMoveCustomSection = (secIdx: number, direction: 'up' | 'down') => {
    setFormData((prev: any) => {
      const list = [...(prev.customSections || [])];
      const targetIdx = direction === 'up' ? secIdx - 1 : secIdx + 1;
      if (targetIdx < 0 || targetIdx >= list.length) return prev;
      const temp = list[secIdx];
      list[secIdx] = list[targetIdx];
      list[targetIdx] = temp;
      return { ...prev, customSections: list };
    });
  };

  const handleAddCustomItem = (secIdx: number) => {
    setFormData((prev: any) => {
      const list = [...(prev.customSections || [])];
      const items = list[secIdx].items || [];
      list[secIdx] = {
        ...list[secIdx],
        items: [
          ...items,
          { id: `item-${Date.now()}`, title: 'नवीन घटक', description: 'तपशील...', tag: 'नवीन', icon: 'community' }
        ]
      };
      return { ...prev, customSections: list };
    });
  };

  const handleRemoveCustomItem = (secIdx: number, itemIdx: number) => {
    setFormData((prev: any) => {
      const list = [...(prev.customSections || [])];
      list[secIdx] = {
        ...list[secIdx],
        items: list[secIdx].items.filter((_: any, i: number) => i !== itemIdx)
      };
      return { ...prev, customSections: list };
    });
  };

  const handleAddInitiative = () => {
    setFormData((prev: any) => ({
      ...prev,
      socialInitiatives: [
        ...(prev.socialInitiatives || []),
        { category: 'health', title: 'नवीन उपक्रम', description: 'उपक्रमाची माहिती...' },
      ],
    }));
  };

  const handleRemoveInitiative = (idx: number) => {
    setFormData((prev: any) => ({
      ...prev,
      socialInitiatives: prev.socialInitiatives.filter((_: any, i: number) => i !== idx),
    }));
  };

  const handleAddAchievement = () => {
    setFormData((prev: any) => ({
      ...prev,
      achievements: [
        ...(prev.achievements || []),
        { year: new Date().getFullYear(), title: 'नवीन पुरस्कार / सन्मान', description: 'पुरस्काराची माहिती...', conferredBy: 'आयोजक संस्था' },
      ],
    }));
  };

  const handleRemoveAchievement = (idx: number) => {
    setFormData((prev: any) => ({
      ...prev,
      achievements: prev.achievements.filter((_: any, i: number) => i !== idx),
    }));
  };

  const handleAddMilestone = () => {
    const newMilestone = {
      year: new Date().getFullYear(),
      category: 'foundation',
      title: 'नवीन टप्पा / उपक्रम',
      description: 'उपक्रमाची सविस्तर माहिती...',
    };
    setFormData((prev: any) => ({
      ...prev,
      milestones: [...(prev.milestones || []), newMilestone],
    }));
  };

  const handleRemoveMilestone = (idx: number) => {
    setFormData((prev: any) => ({
      ...prev,
      milestones: prev.milestones.filter((_: any, i: number) => i !== idx),
    }));
  };

  const presetMutation = useMutation({
    mutationFn: (presetType: 'NAVRATRI' | 'GANESHOTSAV') => mandalPagesApi.applyPreset(presetType),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mandal-page-config'] });
      if (data) {
        setFormData((prev: any) => ({ ...prev, days: data.days || [] }));
      }
      toast.success('Preset schedule template applied successfully!');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to apply preset template.'));
    },
  });

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-xs text-theme-fg/60">
        Only Mandal Admins can access the Public Webpage Builder.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-saffron-500 mb-2" size={24} />
        <p className="text-xs text-theme-fg/50">Loading Webpage Config...</p>
      </div>
    );
  }

  const fallbackSlug = (
    organization?.name
      ? organization.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : 'shree-ganesh-mandal-pune'
  ) || 'shree-ganesh-mandal-pune';

  const activeSlug = (formData.slug || config?.slug || organization?.slug || fallbackSlug).trim();
  const publicUrl = `/mandal/${activeSlug}`;

  const handleShareWebpageAdmin = async () => {
    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${publicUrl}` : publicUrl;
    const shareData = {
      title: formData.tagline || organization?.name || 'Mandal Public Webpage',
      text: `Check out ${organization?.name || 'our Mandal'}'s public festival webpage!`,
      url: fullUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          try {
            await navigator.clipboard.writeText(fullUrl);
            toast.success('Public webpage link copied to clipboard!');
          } catch {
            // fallback
          }
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(fullUrl);
        toast.success('Public webpage link copied to clipboard!');
      } catch {
        toast.error('Failed to copy link.');
      }
    }
  };

  const handleViewPublicWebpage = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined') {
      window.open(publicUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAddDay = () => {
    const nextDayNum = (formData.days?.length || 0) + 1;
    const newDay = {
      dayNumber: nextDayNum,
      title: `Day ${nextDayNum} Schedule`,
      dressCodeColor: 'Yellow',
      colorHex: '#EAB308',
      deityAvatar: '',
      events: [{ time: '07:30 AM', title: 'Kakad Aarti', eventType: 'AARTI' }],
    };
    setFormData((prev: any) => ({ ...prev, days: [...(prev.days || []), newDay] }));
  };

  const handleRemoveDay = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      days: prev.days.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleAddEvent = (dayIndex: number) => {
    const updatedDays = [...formData.days];
    const events = updatedDays[dayIndex].events || [];
    updatedDays[dayIndex].events = [...events, { time: '08:00 PM', title: 'Maha Aarti', eventType: 'AARTI' }];
    setFormData((prev: any) => ({ ...prev, days: updatedDays }));
  };

  const handleRemoveEvent = (dayIndex: number, eventIndex: number) => {
    const updatedDays = [...formData.days];
    updatedDays[dayIndex].events = updatedDays[dayIndex].events.filter((_: any, i: number) => i !== eventIndex);
    setFormData((prev: any) => ({ ...prev, days: updatedDays }));
  };

  const handleAddSponsor = () => {
    const newSponsor = { name: 'New Sponsor', logoUrl: '', tier: 'GOLD', websiteUrl: '' };
    setFormData((prev: any) => ({ ...prev, sponsors: [...(prev.sponsors || []), newSponsor] }));
  };

  const handleRemoveSponsor = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      sponsors: prev.sponsors.filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Title & Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-theme-fg flex items-center gap-2">
            <Globe className="text-saffron-500" size={24} />
            Mandal Public Webpage & Event Bulletin Builder
          </h1>
          <p className="text-xs text-theme-fg/50 mt-0.5">
            Configure your Mandal&apos;s public website, daily festival schedule, dress codes, and sponsors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareWebpageAdmin}
            className="btn-secondary text-xs px-3 py-2 min-h-[38px] flex items-center gap-1.5"
            title="Share Webpage Link"
          >
            <Share2 size={14} /> Share Webpage
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleViewPublicWebpage}
            className="btn-secondary text-xs px-3 py-2 min-h-[38px] flex items-center gap-1.5"
            title="View Public Webpage"
          >
            <Eye size={14} /> View Public Webpage
          </a>
          <button
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending}
            className="btn-primary text-xs px-4 py-2 min-h-[38px] flex items-center gap-1.5 shadow-sm"
          >
            {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save All Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-theme-fg/10 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'general' ? 'border-saffron-500 text-saffron-600' : 'border-transparent text-theme-fg/60 hover:text-theme-fg'
          }`}
        >
          <Building2 size={14} /> General &amp; History
        </button>
        <button
          onClick={() => setActiveTab('custom-sections')}
          className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'custom-sections' ? 'border-saffron-500 text-saffron-600' : 'border-transparent text-theme-fg/60 hover:text-theme-fg'
          }`}
        >
          <Layers size={14} /> Add Custom Webpage Sections ({formData.customSections?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'schedule' ? 'border-saffron-500 text-saffron-600' : 'border-transparent text-theme-fg/60 hover:text-theme-fg'
          }`}
        >
          <Calendar size={14} /> Festival Schedule ({formData.days?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('sponsors')}
          className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'sponsors' ? 'border-saffron-500 text-saffron-600' : 'border-transparent text-theme-fg/60 hover:text-theme-fg'
          }`}
        >
          <Award size={14} /> Sponsors ({formData.sponsors?.length || 0})
        </button>
      </div>

      {/* TAB 1: GENERAL & HISTORY */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="glass-card p-4 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold text-theme-fg">General Page Information &amp; Branding</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="form-label">Public Web URL Slug</label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[11px] text-theme-fg/40">/mandal/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="form-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Festival Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Navratri Festival 2026 Celebration"
                  className="form-input text-xs mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Google Maps Directions URL</label>
                <input
                  type="text"
                  value={formData.googleMapUrl}
                  onChange={(e) => setFormData({ ...formData, googleMapUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="form-input text-xs mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Mandal History &amp; Legacy Story (आमचा इतिहास)</label>
                <textarea
                  rows={4}
                  value={formData.aboutHistoryText || ''}
                  onChange={(e) => setFormData({ ...formData, aboutHistoryText: e.target.value })}
                  placeholder="Describe your Mandal's history, establishment year, heritage, and social work..."
                  className="form-input text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* Toggle History Timeline Section */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-theme-fg/10 pb-3">
              <div>
                <p className="text-xs font-bold text-theme-fg flex items-center gap-2">
                  <Building2 className="text-saffron-500" size={16} /> History Timeline Section (इतिहास व वाटचाल)
                </p>
                <p className="text-[11px] text-theme-fg/50 mt-0.5">
                  Toggle whether the history timeline events card appears on your public webpage.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.showHistory !== false}
                  onChange={(e) => setFormData({ ...formData, showHistory: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-theme-fg/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saffron-500"></div>
              </label>
            </div>

            {formData.showHistory !== false && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-theme-fg">Timeline Events ({formData.milestones?.length || 0})</span>
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                  >
                    <Plus size={13} /> Add Timeline Event
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.milestones?.map((m: any, mIdx: number) => (
                    <div key={mIdx} className="p-3.5 rounded-xl border border-theme-fg/10 bg-theme-fg/[0.015] space-y-2.5 text-xs">
                      <div className="flex items-center justify-between border-b border-theme-fg/10 pb-2">
                        <span className="font-bold text-saffron-600 text-[11px] bg-saffron-500/10 px-2 py-0.5 rounded-md">
                          Event #{mIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(mIdx)}
                          className="text-red-500 hover:text-red-600 text-xs flex items-center gap-1"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="form-label">Year (वर्ष)</label>
                          <input
                            type="number"
                            value={m.year}
                            onChange={(e) => {
                              const updated = [...formData.milestones];
                              updated[mIdx].year = Number(e.target.value);
                              setFormData({ ...formData, milestones: updated });
                            }}
                            className="form-input text-xs mt-1"
                          />
                        </div>

                        <div>
                          <label className="form-label">Category Tag (वर्ग)</label>
                          <select
                            value={m.category || 'foundation'}
                            onChange={(e) => {
                              const updated = [...formData.milestones];
                              updated[mIdx].category = e.target.value;
                              setFormData({ ...formData, milestones: updated });
                            }}
                            className="form-input text-xs mt-1"
                          >
                            <option value="foundation">पायाभरणी (Foundation)</option>
                            <option value="cultural">सांस्कृतिक (Cultural)</option>
                            <option value="social">सामाजिक (Social)</option>
                            <option value="achievement">पुरस्कार / यश (Achievement)</option>
                            <option value="community">सामुदायिक (Community)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-1">
                          <label className="form-label">Event Title (शीर्षक)</label>
                          <input
                            type="text"
                            value={m.title}
                            onChange={(e) => {
                              const updated = [...formData.milestones];
                              updated[mIdx].title = e.target.value;
                              setFormData({ ...formData, milestones: updated });
                            }}
                            placeholder="e.g. मंडळाची स्थापना व पहिला उत्सव"
                            className="form-input text-xs mt-1"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="form-label">Event Description (सविस्तर माहिती)</label>
                          <textarea
                            rows={2}
                            value={m.description}
                            onChange={(e) => {
                              const updated = [...formData.milestones];
                              updated[mIdx].description = e.target.value;
                              setFormData({ ...formData, milestones: updated });
                            }}
                            placeholder="e.g. आनंद नगरमधील नागरिकांनी एकत्र येऊन पारंपारिक मातीच्या मूर्तीची प्रतिष्ठापना केली..."
                            className="form-input text-xs mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Toggle Community Statistics Section */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-theme-fg/10 pb-3">
              <div>
                <p className="text-xs font-bold text-theme-fg flex items-center gap-2">
                  <Award className="text-saffron-500" size={16} /> Community Statistics Section (आमचा समुदाय)
                </p>
                <p className="text-[11px] text-theme-fg/50 mt-0.5">
                  Toggle whether the &quot;आमचा समुदाय&quot; numeric statistics counters appear on your public webpage.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.showCommunityStats !== false}
                  onChange={(e) => setFormData({ ...formData, showCommunityStats: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-theme-fg/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saffron-500"></div>
              </label>
            </div>

            {formData.showCommunityStats !== false && (
              <div className="p-3.5 rounded-xl border border-theme-fg/10 bg-theme-fg/[0.015] space-y-3 text-xs mt-2">
                <p className="font-bold text-theme-fg text-xs">Configure Counter Numbers (संख्यात्मक माहिती):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="form-label">Families (स्थानिक कुटुंबे)</label>
                    <input
                      type="number"
                      value={formData.communityStats?.families ?? 250}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          communityStats: { ...formData.communityStats, families: Number(e.target.value) },
                        });
                      }}
                      className="form-input text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="form-label">Volunteers (स्वयंसेवक)</label>
                    <input
                      type="number"
                      value={formData.communityStats?.volunteers ?? 120}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          communityStats: { ...formData.communityStats, volunteers: Number(e.target.value) },
                        });
                      }}
                      className="form-input text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="form-label">Years Active (वर्षांचा वारसा)</label>
                    <input
                      type="number"
                      value={formData.communityStats?.yearsActive ?? 28}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          communityStats: { ...formData.communityStats, yearsActive: Number(e.target.value) },
                        });
                      }}
                      className="form-input text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="form-label">Social Work (सामाजिक)</label>
                    <input
                      type="number"
                      value={formData.communityStats?.socialInitiatives ?? 15}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          communityStats: { ...formData.communityStats, socialInitiatives: Number(e.target.value) },
                        });
                      }}
                      className="form-input text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="form-label">Cultural Events (सांस्कृतिक)</label>
                    <input
                      type="number"
                      value={formData.communityStats?.culturalPrograms ?? 25}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          communityStats: { ...formData.communityStats, culturalPrograms: Number(e.target.value) },
                        });
                      }}
                      className="form-input text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Toggle Community Initiatives Section */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-theme-fg/10 pb-3">
              <div>
                <p className="text-xs font-bold text-theme-fg flex items-center gap-2">
                  <Building2 className="text-saffron-500" size={16} /> Community Initiatives Section (सामुदायिक उपक्रम)
                </p>
                <p className="text-[11px] text-theme-fg/50 mt-0.5">
                  Toggle whether the &quot;सामुदायिक उपक्रम&quot; social work cards appear on your public webpage.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.showSocialInitiatives !== false}
                  onChange={(e) => setFormData({ ...formData, showSocialInitiatives: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-theme-fg/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saffron-500"></div>
              </label>
            </div>

            {formData.showSocialInitiatives !== false && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-theme-fg">Social Initiatives Cards ({formData.socialInitiatives?.length || 0}):</span>
                  <button
                    type="button"
                    onClick={handleAddInitiative}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                  >
                    <Plus size={13} /> Add Social Initiative
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.socialInitiatives?.map((si: any, sIdx: number) => (
                    <div key={sIdx} className="p-3.5 rounded-xl border border-theme-fg/10 bg-theme-fg/[0.015] space-y-2.5 text-xs">
                      <div className="flex items-center justify-between border-b border-theme-fg/10 pb-2">
                        <span className="font-bold text-saffron-600 text-[11px] bg-saffron-500/10 px-2 py-0.5 rounded-md">
                          Initiative #{sIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInitiative(sIdx)}
                          className="text-red-500 hover:text-red-600 text-xs flex items-center gap-1"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="form-label">Category (वर्ग)</label>
                          <select
                            value={si.category || 'health'}
                            onChange={(e) => {
                              const updated = [...formData.socialInitiatives];
                              updated[sIdx].category = e.target.value;
                              setFormData({ ...formData, socialInitiatives: updated });
                            }}
                            className="form-input text-xs mt-1"
                          >
                            <option value="health">आरोग्य (Health)</option>
                            <option value="education">शिक्षण (Education)</option>
                            <option value="environment">पर्यावरण (Environment)</option>
                            <option value="community">सामुदायिक (Community)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="form-label">Title (उपक्रमाचे नाव)</label>
                          <input
                            type="text"
                            value={si.title}
                            onChange={(e) => {
                              const updated = [...formData.socialInitiatives];
                              updated[sIdx].title = e.target.value;
                              setFormData({ ...formData, socialInitiatives: updated });
                            }}
                            placeholder="e.g. वार्षिक रक्तदान व आरोग्य तपासणी शिबीर"
                            className="form-input text-xs mt-1"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="form-label">Description (सविस्तर माहिती)</label>
                          <textarea
                            rows={2}
                            value={si.description}
                            onChange={(e) => {
                              const updated = [...formData.socialInitiatives];
                              updated[sIdx].description = e.target.value;
                              setFormData({ ...formData, socialInitiatives: updated });
                            }}
                            placeholder="e.g. शासकीय रक्तपेढीच्या सहकार्याने दरवर्षी..."
                            className="form-input text-xs mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DEDICATED ADD CUSTOM WEBPAGE SECTIONS TAB */}
      {activeTab === 'custom-sections' && (
        <div className="space-y-4">
          <div className="glass-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-theme-fg/10">
              <div>
                <h3 className="text-sm font-bold text-theme-fg flex items-center gap-2">
                  <Layers className="text-saffron-500" size={18} /> Add Custom Webpage Sections
                </h3>
                <p className="text-xs text-theme-fg/50 mt-0.5">
                  Create, edit, reorder, or delete custom sections (e.g. Trustees/Committee, Awards, Digital Projects, Rules) for your Mandal webpage.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCustomSection}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shrink-0 shadow-sm min-h-[38px]"
              >
                <Plus size={14} /> Add New Custom Webpage Section
              </button>
            </div>

            {formData.customSections?.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-theme-fg/20 rounded-xl bg-theme-fg/[0.01] space-y-2">
                <Layers size={32} className="mx-auto text-theme-fg/30 mb-1" />
                <p className="text-xs font-semibold text-theme-fg/70">No Custom Webpage Sections Added Yet</p>
                <p className="text-[11px] text-theme-fg/40 max-w-md mx-auto">
                  Click the &quot;Add New Custom Webpage Section&quot; button above to create custom cards, lists, counter statistics, or narrative sections for your webpage.
                </p>
                <button
                  type="button"
                  onClick={handleAddCustomSection}
                  className="btn-secondary text-xs py-1.5 px-3 mt-2 inline-flex items-center gap-1"
                >
                  <Plus size={13} /> Create First Custom Section
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.customSections.map((sec: any, secIdx: number) => (
                  <div key={secIdx} className="p-3.5 sm:p-5 rounded-2xl border border-theme-fg/15 bg-theme-fg/[0.015] space-y-3 text-xs">
                    {/* Section Header Controls */}
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-theme-fg/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-saffron-600 text-xs bg-saffron-500/10 px-2.5 py-1 rounded-md">
                          Custom Section #{secIdx + 1}
                        </span>
                        <span className="text-[11px] text-theme-fg/40 font-medium">
                          ({sec.items?.length || 0} items)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Reorder Buttons */}
                        <div className="flex items-center border border-theme-fg/15 rounded-md overflow-hidden bg-theme-fg/5">
                          <button
                            type="button"
                            onClick={() => handleMoveCustomSection(secIdx, 'up')}
                            disabled={secIdx === 0}
                            className="p-1.5 text-theme-fg/60 hover:text-theme-fg hover:bg-theme-fg/10 disabled:opacity-30"
                            title="Move Section Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <div className="w-[1px] h-4 bg-theme-fg/15" />
                          <button
                            type="button"
                            onClick={() => handleMoveCustomSection(secIdx, 'down')}
                            disabled={secIdx === formData.customSections.length - 1}
                            className="p-1.5 text-theme-fg/60 hover:text-theme-fg hover:bg-theme-fg/10 disabled:opacity-30"
                            title="Move Section Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>

                        {/* Enable Toggle */}
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-1">
                          <input
                            type="checkbox"
                            checked={sec.enabled !== false}
                            onChange={(e) => {
                              const updated = [...formData.customSections];
                              updated[secIdx].enabled = e.target.checked;
                              setFormData({ ...formData, customSections: updated });
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-theme-fg/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-saffron-500"></div>
                          <span className="text-[11px] font-semibold text-theme-fg/70 ml-1.5">
                            {sec.enabled !== false ? 'Shown' : 'Hidden'}
                          </span>
                        </label>

                        {/* Delete Section */}
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomSection(secIdx)}
                          className="text-red-500 hover:text-red-600 p-1.5 text-xs flex items-center gap-1 ml-1"
                        >
                          <Trash2 size={13} /> Delete Section
                        </button>
                      </div>
                    </div>

                    {/* Section Title, Subtitle, & Layout selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="form-label">Section Title (शीर्षक)</label>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => {
                            const updated = [...formData.customSections];
                            updated[secIdx].title = e.target.value;
                            setFormData({ ...formData, customSections: updated });
                          }}
                          placeholder="e.g. गौरव आणि सन्मान / आमचे विश्वस्त मंडळ"
                          className="form-input text-xs mt-1"
                        />
                      </div>

                      <div>
                        <label className="form-label">Subtitle (उपशीर्षक / माहिती)</label>
                        <input
                          type="text"
                          value={sec.subtitle || ''}
                          onChange={(e) => {
                            const updated = [...formData.customSections];
                            updated[secIdx].subtitle = e.target.value;
                            setFormData({ ...formData, customSections: updated });
                          }}
                          placeholder="e.g. मंडळाचे विशेष उपक्रम व मार्गदर्शक तत्त्वे"
                          className="form-input text-xs mt-1"
                        />
                      </div>

                      <div>
                        <label className="form-label">Display Layout (लेआउट प्रकार)</label>
                        <select
                          value={sec.layout || 'cards'}
                          onChange={(e) => {
                            const updated = [...formData.customSections];
                            updated[secIdx].layout = e.target.value;
                            setFormData({ ...formData, customSections: updated });
                          }}
                          className="form-input text-xs mt-1"
                        >
                          <option value="cards">🃏 Cards Grid (कार्ड ग्रिड)</option>
                          <option value="timeline">⏳ Timeline List (इतिहास व टाइमलाइन)</option>
                          <option value="stats">📊 Numeric Stats (संख्यात्मक आकडे)</option>
                          <option value="text">📝 Paragraph Text (माहिती मजकूर)</option>
                        </select>
                      </div>
                    </div>

                    {/* Section Items Sub-Builder */}
                    <div className="pt-2 border-t border-theme-fg/10 space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-[11px] font-bold text-theme-fg/70">
                          Items inside Section ({sec.items?.length || 0}):
                        </p>
                        <button
                          type="button"
                          onClick={() => handleAddCustomItem(secIdx)}
                          className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 shrink-0"
                        >
                          <Plus size={12} /> Add Item to Section
                        </button>
                      </div>

                      <div className="space-y-2">
                        {sec.items?.map((item: any, itemIdx: number) => (
                          <div key={itemIdx} className="p-3 rounded-lg border border-theme-fg/10 bg-theme-fg/[0.01] space-y-2 text-xs">
                            <div className="flex items-center justify-between border-b border-theme-fg/5 pb-1">
                              <span className="text-[10px] font-semibold text-theme-fg/50">Item #{itemIdx + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomItem(secIdx, itemIdx)}
                                className="text-red-500 hover:text-red-600 text-[11px] flex items-center gap-0.5"
                              >
                                <Trash2 size={12} /> Delete Item
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                              <div>
                                <label className="form-label text-[10px]">Item Title (नाव / शीर्षक)</label>
                                <input
                                  type="text"
                                  value={item.title || ''}
                                  onChange={(e) => {
                                    const updated = [...formData.customSections];
                                    updated[secIdx].items[itemIdx].title = e.target.value;
                                    setFormData({ ...formData, customSections: updated });
                                  }}
                                  placeholder="e.g. अध्यक्ष / आदर्श मंडळ पुरस्कार"
                                  className="form-input text-xs mt-0.5 py-1"
                                />
                              </div>

                              <div>
                                <label className="form-label text-[10px]">Tag / Badge (वर्ग / पद)</label>
                                <input
                                  type="text"
                                  value={item.tag || ''}
                                  onChange={(e) => {
                                    const updated = [...formData.customSections];
                                    updated[secIdx].items[itemIdx].tag = e.target.value;
                                    setFormData({ ...formData, customSections: updated });
                                  }}
                                  placeholder="e.g. कार्यकारिणी / 2026"
                                  className="form-input text-xs mt-0.5 py-1"
                                />
                              </div>

                              <div>
                                <label className="form-label text-[10px]">Number / Year / Value</label>
                                <input
                                  type="text"
                                  value={item.value || (item.year ? String(item.year) : '')}
                                  onChange={(e) => {
                                    const updated = [...formData.customSections];
                                    updated[secIdx].items[itemIdx].value = e.target.value;
                                    setFormData({ ...formData, customSections: updated });
                                  }}
                                  placeholder="e.g. 500+ / 2026"
                                  className="form-input text-xs mt-0.5 py-1"
                                />
                              </div>

                              <div>
                                <label className="form-label text-[10px]">Icon Theme</label>
                                <select
                                  value={item.icon || 'community'}
                                  onChange={(e) => {
                                    const updated = [...formData.customSections];
                                    updated[secIdx].items[itemIdx].icon = e.target.value;
                                    setFormData({ ...formData, customSections: updated });
                                  }}
                                  className="form-input text-xs mt-0.5 py-1"
                                >
                                  <option value="award">🏆 Award / Honor</option>
                                  <option value="community">👥 Community</option>
                                  <option value="health">❤️ Health</option>
                                  <option value="education">📚 Education</option>
                                  <option value="environment">🍃 Environment</option>
                                </select>
                              </div>

                              <div className="sm:col-span-2 lg:col-span-4">
                                <label className="form-label text-[10px]">Description (माहिती / सविस्तर)</label>
                                <textarea
                                  rows={1}
                                  value={item.description || ''}
                                  onChange={(e) => {
                                    const updated = [...formData.customSections];
                                    updated[secIdx].items[itemIdx].description = e.target.value;
                                    setFormData({ ...formData, customSections: updated });
                                  }}
                                  placeholder="Detailed description or role..."
                                  className="form-input text-xs mt-0.5 py-1"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FESTIVAL SCHEDULE & DRESS CODES */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Presets Card */}
          <div className="glass-card p-4 bg-saffron-500/[0.03] border-saffron-500/20 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-bold text-theme-fg flex items-center gap-1.5">
                <Sparkles className="text-saffron-500" size={15} /> 1-Click Preset Templates
              </p>
              <p className="text-[11px] text-theme-fg/50 mt-0.5">
                Auto-fill pre-configured 9-Day Navratri colors or 10-Day Ganeshotsav Aarti schedules.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => presetMutation.mutate('NAVRATRI')}
                disabled={presetMutation.isPending}
                className="btn-secondary text-xs py-1.5 px-3 min-h-[34px]"
              >
                Load 9-Day Navratri Template
              </button>
              <button
                onClick={() => presetMutation.mutate('GANESHOTSAV')}
                disabled={presetMutation.isPending}
                className="btn-secondary text-xs py-1.5 px-3 min-h-[34px]"
              >
                Load 10-Day Ganeshotsav Template
              </button>
            </div>
          </div>

          {/* Days List */}
          <div className="space-y-3">
            {formData.days?.map((day: any, dIdx: number) => (
              <div key={dIdx} className="glass-card p-4 space-y-3 border-theme-fg/10">
                <div className="flex items-center justify-between gap-2 border-b border-theme-fg/10 pb-2">
                  <span className="text-xs font-bold text-saffron-600 bg-saffron-500/10 px-2 py-0.5 rounded-md">
                    Day {day.dayNumber}
                  </span>
                  <button
                    onClick={() => handleRemoveDay(dIdx)}
                    className="text-red-500 hover:text-red-600 p-1 text-xs flex items-center gap-1"
                  >
                    <Trash2 size={13} /> Remove Day
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="form-label">Day Title</label>
                    <input
                      type="text"
                      value={day.title}
                      onChange={(e) => {
                        const updated = [...formData.days];
                        updated[dIdx].title = e.target.value;
                        setFormData({ ...formData, days: updated });
                      }}
                      className="form-input text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      value={day.date ? new Date(day.date).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const updated = [...formData.days];
                        updated[dIdx].date = e.target.value;
                        setFormData({ ...formData, days: updated });
                      }}
                      className="form-input text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="form-label">Dress Code / Color</label>
                    <input
                      type="text"
                      value={day.dressCodeColor || ''}
                      onChange={(e) => {
                        const updated = [...formData.days];
                        updated[dIdx].dressCodeColor = e.target.value;
                        setFormData({ ...formData, days: updated });
                      }}
                      placeholder="e.g. Yellow / पिवळा"
                      className="form-input text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="form-label">Color Dot (Hex)</label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="color"
                        value={day.colorHex || '#EAB308'}
                        onChange={(e) => {
                          const updated = [...formData.days];
                          updated[dIdx].colorHex = e.target.value;
                          setFormData({ ...formData, days: updated });
                        }}
                        className="h-8 w-8 rounded cursor-pointer border border-theme-fg/20 p-0.5"
                      />
                      <input
                        type="text"
                        value={day.colorHex || '#EAB308'}
                        onChange={(e) => {
                          const updated = [...formData.days];
                          updated[dIdx].colorHex = e.target.value;
                          setFormData({ ...formData, days: updated });
                        }}
                        className="form-input text-xs flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Deity Avatar / Alankar</label>
                    <input
                      type="text"
                      value={day.deityAvatar || ''}
                      onChange={(e) => {
                        const updated = [...formData.days];
                        updated[dIdx].deityAvatar = e.target.value;
                        setFormData({ ...formData, days: updated });
                      }}
                      placeholder="e.g. Shailaputri Devi"
                      className="form-input text-xs mt-1"
                    />
                  </div>
                </div>

                {/* Events Timeline Editor */}
                <div className="space-y-2 pt-2 border-t border-theme-fg/5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-theme-fg/60 flex items-center gap-1">
                      <Clock size={12} /> Aarti & Event Items ({day.events?.length || 0})
                    </p>
                    <button
                      onClick={() => handleAddEvent(dIdx)}
                      className="text-[11px] font-semibold text-saffron-600 hover:text-saffron-500 flex items-center gap-0.5"
                    >
                      <Plus size={12} /> Add Event
                    </button>
                  </div>

                  {day.events?.map((evt: any, eIdx: number) => (
                    <div key={eIdx} className="flex items-center gap-2 bg-theme-fg/[0.02] p-2 rounded-lg border border-theme-fg/10 text-xs">
                      <input
                        type="text"
                        value={evt.time}
                        onChange={(e) => {
                          const updated = [...formData.days];
                          updated[dIdx].events[eIdx].time = e.target.value;
                          setFormData({ ...formData, days: updated });
                        }}
                        placeholder="Time"
                        className="form-input text-xs py-1 w-24 shrink-0"
                      />
                      <input
                        type="text"
                        value={evt.title}
                        onChange={(e) => {
                          const updated = [...formData.days];
                          updated[dIdx].events[eIdx].title = e.target.value;
                          setFormData({ ...formData, days: updated });
                        }}
                        placeholder="Event Title"
                        className="form-input text-xs py-1 flex-1"
                      />
                      <button
                        onClick={() => handleRemoveEvent(dIdx, eIdx)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddDay}
            className="btn-secondary text-xs w-full py-2.5 flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> Add Another Day
          </button>
        </div>
      )}

      {/* TAB 4: SPONSORS */}
      {activeTab === 'sponsors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-theme-fg">Sponsors & Partners</h2>
            <button
              onClick={handleAddSponsor}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Plus size={13} /> Add Sponsor
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formData.sponsors?.map((sp: any, sIdx: number) => (
              <div key={sIdx} className="glass-card p-4 space-y-2.5 text-xs border-theme-fg/10">
                <div className="flex items-center justify-between border-b border-theme-fg/10 pb-1.5">
                  <span className="font-bold text-saffron-600 text-[11px]">Sponsor #{sIdx + 1}</span>
                  <button onClick={() => handleRemoveSponsor(sIdx)} className="text-red-500 hover:text-red-600 p-1">
                    <Trash2 size={13} />
                  </button>
                </div>

                <div>
                  <label className="form-label">Sponsor Name</label>
                  <input
                    type="text"
                    value={sp.name}
                    onChange={(e) => {
                      const updated = [...formData.sponsors];
                      updated[sIdx].name = e.target.value;
                      setFormData({ ...formData, sponsors: updated });
                    }}
                    className="form-input text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="form-label">Tier</label>
                    <select
                      value={sp.tier || 'GOLD'}
                      onChange={(e) => {
                        const updated = [...formData.sponsors];
                        updated[sIdx].tier = e.target.value;
                        setFormData({ ...formData, sponsors: updated });
                      }}
                      className="form-input text-xs mt-1"
                    >
                      <option value="PLATINUM">PLATINUM</option>
                      <option value="GOLD">GOLD</option>
                      <option value="SILVER">SILVER</option>
                      <option value="LOCAL">LOCAL</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Logo URL</label>
                    <input
                      type="text"
                      value={sp.logoUrl || ''}
                      onChange={(e) => {
                        const updated = [...formData.sponsors];
                        updated[sIdx].logoUrl = e.target.value;
                        setFormData({ ...formData, sponsors: updated });
                      }}
                      placeholder="https://..."
                      className="form-input text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
