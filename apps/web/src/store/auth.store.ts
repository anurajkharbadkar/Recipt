import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  orgId: string;
  areaId?: string;
  permissionsOverride?: any;
}

interface Organization {
  id: string;
  name: string;
  nameMarathi?: string;
  nameHindi?: string;
  logoUrl?: string;
  subscriptionPlan: string;
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeCampaignId: string | null;
  language: 'en' | 'hi' | 'mr';
  isAuthenticated: boolean;

  setAuth: (data: {
    user: User;
    organization: Organization;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setUser: (user: User) => void;
  setOrganization: (org: Organization) => void;
  setActiveCampaign: (campaignId: string) => void;
  setLanguage: (lang: 'en' | 'hi' | 'mr') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      accessToken: null,
      refreshToken: null,
      activeCampaignId: null,
      language: 'mr',
      isAuthenticated: false,

      setAuth: ({ user, organization, accessToken, refreshToken }) =>
        set({ user, organization, accessToken, refreshToken, isAuthenticated: true }),

      setUser: (user) => set({ user }),
      setOrganization: (organization) => set({ organization }),
      setActiveCampaign: (activeCampaignId) => set({ activeCampaignId }),
      setLanguage: (language) => set({ language }),

      logout: () =>
        set({
          user: null,
          organization: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          activeCampaignId: null,
        }),
    }),
    {
      name: 'pavti-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        activeCampaignId: state.activeCampaignId,
        language: state.language,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
