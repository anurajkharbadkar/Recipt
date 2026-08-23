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
      return moduleName === 'Receipts';
    }
    if (user.role === 'TREASURER') {
      // Subscription (billing/plan changes) is admin territory, same as
      // Settings — a Treasurer manages money the org collects, not what
      // the org itself pays this app.
      return moduleName !== 'Settings' && moduleName !== 'Subscription';
    }
    if (user.role === 'VIEWER') {
      return ['Receipts', 'Reports'].includes(moduleName);
    }
    return true;
  };
}
