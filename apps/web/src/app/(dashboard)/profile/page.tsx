'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authApi, getErrorMessage } from '@/lib/api';
import { USER_ROLE_LABELS, UserRole } from '@pavti/shared';
import { User, Phone, Mail, ShieldCheck, KeyRound, Save, Eye, EyeOff, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const labels = {
  en: {
    title: 'My Account', subtitle: 'Your own login details — not your Mandal’s.',
    identity: 'Identity', name: 'Name', email: 'Email', phone: 'Phone (login ID)',
    phoneNote: 'Your phone number is how you log in — contact your Mandal Admin to change it.',
    saveProfile: 'Save Changes', saving: 'Saving...', profileSaved: 'Profile updated',
    security: 'Password', currentPassword: 'Current Password', newPassword: 'New Password', confirmPassword: 'Confirm New Password',
    changePassword: 'Change Password', changing: 'Changing...', passwordChanged: 'Password changed',
    mismatch: 'New password and confirmation don’t match', tooShort: 'New password must be at least 8 characters',
    organization: 'Organization', role: 'Role',
  },
  hi: {
    title: 'मेरा खाता', subtitle: 'आपकी अपनी लॉगिन जानकारी — आपके मंडल की नहीं।',
    identity: 'पहचान', name: 'नाम', email: 'ईमेल', phone: 'फोन (लॉगिन आईडी)',
    phoneNote: 'आपका फोन नंबर आपकी लॉगिन आईडी है — बदलने के लिए अपने मंडल एडमिन से संपर्क करें।',
    saveProfile: 'बदलाव सहेजें', saving: 'सहेजा जा रहा है...', profileSaved: 'प्रोफ़ाइल अपडेट हुई',
    security: 'पासवर्ड', currentPassword: 'वर्तमान पासवर्ड', newPassword: 'नया पासवर्ड', confirmPassword: 'नए पासवर्ड की पुष्टि करें',
    changePassword: 'पासवर्ड बदलें', changing: 'बदला जा रहा है...', passwordChanged: 'पासवर्ड बदल गया',
    mismatch: 'नया पासवर्ड और पुष्टि मेल नहीं खाते', tooShort: 'नया पासवर्ड कम से कम 8 अक्षर का होना चाहिए',
    organization: 'संस्था', role: 'भूमिका',
  },
  mr: {
    title: 'माझे खाते', subtitle: 'तुमची स्वतःची लॉगिन माहिती — तुमच्या मंडळाची नाही.',
    identity: 'ओळख', name: 'नाव', email: 'ईमेल', phone: 'फोन (लॉगिन आयडी)',
    phoneNote: 'तुमचा फोन नंबर हाच तुमचा लॉगिन आयडी आहे — बदलण्यासाठी तुमच्या मंडळ अ‍ॅडमिनशी संपर्क साधा.',
    saveProfile: 'बदल जतन करा', saving: 'जतन होत आहे...', profileSaved: 'प्रोफाइल अपडेट झाले',
    security: 'पासवर्ड', currentPassword: 'सध्याचा पासवर्ड', newPassword: 'नवीन पासवर्ड', confirmPassword: 'नवीन पासवर्डची पुष्टी करा',
    changePassword: 'पासवर्ड बदला', changing: 'बदलत आहे...', passwordChanged: 'पासवर्ड बदलला',
    mismatch: 'नवीन पासवर्ड आणि पुष्टी जुळत नाहीत', tooShort: 'नवीन पासवर्ड किमान 8 अक्षरांचा असावा',
    organization: 'संस्था', role: 'भूमिका',
  },
};

export default function ProfilePage() {
  const { user, organization, language, setUser } = useAuthStore();
  const l = labels[language] || labels.en;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  if (!user) return null;

  const profileDirty = name !== user.name || email !== (user.email || '');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await authApi.updateProfile({ name, email: email || undefined });
      setUser({ ...user, name: updated.name, email: updated.email });
      toast.success(l.profileSaved);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Could not update profile — please try again.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error(l.tooShort); return; }
    if (newPassword !== confirmPassword) { toast.error(l.mismatch); return; }

    setChangingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success(l.passwordChanged);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Could not change password — please try again.'));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-theme-fg">{l.title}</h1>
        <p className="text-sm text-theme-fg/50 mt-0.5">{l.subtitle}</p>
      </div>

      {/* Identity summary */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-saffron-600/20 flex items-center justify-center text-saffron-400 font-bold text-2xl border border-theme shadow-md shrink-0">
          {user.name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-theme-fg truncate">{user.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-theme-fg/50 mt-1">
            <ShieldCheck size={13} />
            <span>{USER_ROLE_LABELS[user.role as UserRole]?.[language] || user.role}</span>
            {organization?.name && (
              <>
                <span className="opacity-40">&middot;</span>
                <Building2 size={13} />
                <span className="truncate">{organization.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSaveProfile} className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-theme-fg flex items-center gap-2">
          <User size={16} className="text-saffron-500" /> {l.identity}
        </h3>

        <div>
          <label className="form-label">{l.name}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder={l.name} />
        </div>

        <div>
          <label className="form-label flex items-center gap-1.5"><Mail size={12} /> {l.email}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="you@example.com" />
        </div>

        <div>
          <label className="form-label flex items-center gap-1.5"><Phone size={12} /> {l.phone}</label>
          <input value={user.phone} disabled className="form-input opacity-60 cursor-not-allowed" />
          <p className="text-[11px] text-theme-fg/40 mt-1.5">{l.phoneNote}</p>
        </div>

        <button type="submit" disabled={!profileDirty || savingProfile} className="btn-primary text-sm">
          <Save size={15} /> {savingProfile ? l.saving : l.saveProfile}
        </button>
      </form>

      {/* Password form */}
      <form onSubmit={handleChangePassword} className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-theme-fg flex items-center gap-2">
          <KeyRound size={16} className="text-saffron-500" /> {l.security}
        </h3>

        <div>
          <label className="form-label">{l.currentPassword}</label>
          <input
            type={showPasswords ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="form-input"
            autoComplete="current-password"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">{l.newPassword}</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="form-label">{l.confirmPassword}</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowPasswords((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-theme-fg/50 hover:text-theme-fg transition-colors"
          >
            {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
            {showPasswords ? 'Hide' : 'Show'}
          </button>
          <button
            type="submit"
            disabled={!currentPassword || !newPassword || !confirmPassword || changingPassword}
            className="btn-primary text-sm"
          >
            <KeyRound size={15} /> {changingPassword ? l.changing : l.changePassword}
          </button>
        </div>
      </form>
    </div>
  );
}
