import { useAuthStore } from '@/store/auth.store';

/**
 * Single source of truth for "can this user view module X" — resolves
 * permissions statically based on the user's role, matching the simplified
 * roles-only access guard on the API side.
 */
export function useModuleAccessResolver() {
  const { user } = useAuthStore();

  return (moduleName: string | null): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'ORG_ADMIN') return true;
    if (!moduleName || moduleName === 'Dashboard') return true;

    if (user.role === 'COLLECTOR') {
      // Settings is allowed too, but only shows a small scoped-down screen
      // (app language + account link) — see settings/page.tsx's early
      // COLLECTOR/TREASURER branch — not the full org-configuration page.
      return moduleName === 'Receipts' || moduleName === 'Settings';
    }
    if (user.role === 'TREASURER') {
      // Subscription (billing/plan changes) stays admin-only — a Treasurer
      // manages money the org collects, not what the org itself pays this
      // app. Settings is allowed, but see the same scoped-down screen note
      // above for COLLECTOR.
      return moduleName !== 'Subscription';
    }
    if (user.role === 'VIEWER') {
      return ['Receipts', 'Reports'].includes(moduleName);
    }
    return true;
  };
}
