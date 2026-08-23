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
}

interface Organization {
  id: string;
  name: string;
  nameMarathi?: string;
  nameHindi?: string;
  logoUrl?: string;
  brandColor?: string;
  /** Short login identifier every collector/treasurer needs alongside their phone + password. Shown in Settings. */
  mandalCode?: string;
  /** Standard+ only (see organizations.service.ts) — the mandal's own UPI VPA, used to build the donor-facing payment QR/link. Never rendered on the pavti itself. */
  upiId?: string;
  subscriptionPlan: string;
  subscriptionStatus?: string;
  subscriptionExpiry?: string | Date;
  /** Total receipts ever created by the org — powers the free-trial "X of 10 used" banner. See OrganizationsService.getMe. */
  receiptCount?: number;
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeCampaignId: string | null;
  language: 'en' | 'hi' | 'mr';
  isAuthenticated: boolean;
  // Zustand's `persist` rehydrates from localStorage asynchronously — on a
  // hard page load, isAuthenticated briefly reads its default `false` before
  // the persisted session loads. Route guards must wait for hasHydrated
  // before treating `false` as "actually logged out", or every refresh/direct
  // URL visit bounces a logged-in user to /login (see (dashboard)/layout.tsx).
  hasHydrated: boolean;
  completedTours: Record<string, boolean>;
  markTourCompleted: (pageKey: string) => void;
  resetTours: () => void;
  setHasHydrated: (v: boolean) => void;

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
      hasHydrated: false,
      completedTours: {},
      markTourCompleted: (pageKey) =>
        set((state) => ({
          completedTours: { ...state.completedTours, [pageKey]: true },
        })),
      resetTours: () => set({ completedTours: {} }),
      setHasHydrated: (v) => set({ hasHydrated: v }),

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
        completedTours: state.completedTours,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
