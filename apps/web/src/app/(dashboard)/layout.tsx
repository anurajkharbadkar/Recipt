'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { inferRouteModule } from '@pavti/shared';
import { useModuleAccessResolver } from '@/hooks/useModuleAccess';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import PendingPaymentBanner from '@/components/layout/PendingPaymentBanner';
import toast from 'react-hot-toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const canView = useModuleAccessResolver();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const module = inferRouteModule(pathname);
    // /members is the merged Staff&Collectors + Registered Members + Internal
    // Collection screen — its tabs are gated individually by the page itself,
    // so the route guard only needs to let someone in who can see at least
    // one of the two underlying modules, not both.
    const allowed = module === 'Members' ? (canView('Members') || canView('Collectors')) : canView(module);
    if (!allowed) {
      toast.error("You don't have access to this page");
      router.push('/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, user, isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <PendingPaymentBanner />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
