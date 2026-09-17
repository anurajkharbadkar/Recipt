'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleAuthButtonProps {
  onSuccess?: (data: any) => void;
  onUnregistered?: (googleProfile: { email: string; name: string; avatarUrl?: string; googleId: string }) => void;
  text?: string;
}

export default function GoogleAuthButton({ onSuccess, onUnregistered, text }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const { setAuth } = useAuthStore();

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  const handleCredentialResponse = async (response: any) => {
    const idToken = response.credential;
    if (!idToken) return;

    setLoading(true);
    try {
      const data = await authApi.googleLogin(idToken);
      if (data.registered === false) {
        if (onUnregistered) {
          onUnregistered(data);
        } else {
          toast.error('Account not registered yet. Please register your Mandal.');
        }
      } else {
        setAuth(data);
        toast.success(`Welcome back, ${data.user.name}!`);
        if (onSuccess) onSuccess(data);
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Google Sign-In failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!googleClientId) return;

    // Dynamically load Google GIS script if not present
    if (window.google?.accounts?.id) {
      setGisLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
        });
        setGisLoaded(true);
      }
    };
    document.head.appendChild(script);
  }, [googleClientId]);

  const triggerGooglePrompt = () => {
    if (loading) return;

    if (window.google?.accounts?.id && googleClientId) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.prompt();
    } else {
      toast.error('Google Sign-In is initializing or GOOGLE_CLIENT_ID is not configured yet.');
    }
  };

  return (
    <button
      type="button"
      onClick={triggerGooglePrompt}
      disabled={loading}
      className="w-full py-3 px-4 rounded-xl border border-theme-fg/15 bg-theme-bg/60 hover:bg-theme-fg/5 text-theme-fg font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin text-saffron-500" />
      ) : (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span>{text || 'Google द्वारे पुढे जा (Continue with Google)'}</span>
    </button>
  );
}
