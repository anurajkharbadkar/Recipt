'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { permissionsApi } from '@/lib/api';
import { inferRouteModule } from '@pavti/shared';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import toast from 'react-hot-toast';

function resolveCanView(module: string | null, role: string, overrides: any, roleDefaults: any[] | undefined): boolean {
  if (!module || module === 'Dashboard') return true;
  if (role === 'SUPER_ADMIN' || role === 'ORG_ADMIN') return true;

  if (overrides && overrides[module]?.canView !== undefined) {
    return !!overrides[module].canView;
  }

  const row = roleDefaults?.find((r) => r.role === role && r.module === module);
  if (row) return !!row.canView;

  // Fallback for the brief window before role defaults have loaded / been seeded
  if (role === 'COLLECTOR') return module === 'Receipts';
  if (role === 'TREASURER') return !['Settings', 'Collectors'].includes(module);
  return true;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const { data: roleDefaults, isLoading: loadingPerms } = useQuery({
    queryKey: ['role-defaults'],
    queryFn: permissionsApi.getRoleDefaults,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !user || loadingPerms) return;
    const module = inferRouteModule(pathname);
    const allowed = resolveCanView(module, user.role, user.permissionsOverride, roleDefaults);
    if (!allowed) {
      toast.error("You don't have access to this page");
      router.push('/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, user, roleDefaults, isAuthenticated, loadingPerms]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
