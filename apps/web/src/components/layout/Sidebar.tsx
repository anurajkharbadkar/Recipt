'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useModuleAccessResolver } from '@/hooks/useModuleAccess';
import {
  Home, Plus, Megaphone,
  Receipt, BarChart3, Settings, LogOut, Menu, X,
  IndianRupee, BookOpen, Sun, Moon, UserSquare2
} from 'lucide-react';
import clsx from 'clsx';

// 'module' drives the permission check (see useModuleAccessResolver) and can
// differ from the href's own path — /members is the merged Staff & Collectors
// + Registered Members + Internal Collection screen, so it's visible to
// anyone who can view either underlying module, not just 'Members'.
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, labelMr: 'डॅशबोर्ड', module: 'Dashboard' },
  { href: '/receipts/new', label: 'New Receipt', icon: Plus, labelMr: 'नवीन पावती', highlight: true, module: 'Receipts' },
  { href: '/receipts', label: 'Receipts', icon: Receipt, labelMr: 'पावत्या', module: 'Receipts' },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone, labelMr: 'मोहीम', module: 'Campaigns' },
  { href: '/members', label: 'Members', icon: UserSquare2, labelMr: 'सभासद', module: 'Members', altModule: 'Collectors' },
  { href: '/expenses', label: 'Expenses', icon: IndianRupee, labelMr: 'खर्च', module: 'Expenses' },
  { href: '/reports', label: 'Reports', icon: BarChart3, labelMr: 'अहवाल', module: 'Reports' },
  { href: '/settings', label: 'Settings', icon: Settings, labelMr: 'सेटिंग्स', module: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, organization, logout, language } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const canView = useModuleAccessResolver();

  const isAllowed = (item: (typeof navItems)[number]) =>
    canView(item.module) || (item.altModule ? canView(item.altModule) : false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const currentTheme = savedTheme || 'light';
    setTheme(currentTheme);
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-theme">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-saffron">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm">e Pavti Book</div>
            <div className="text-[10px] text-saffron-400 font-devanagari">ई पावती बुक</div>
          </div>
        </div>
      </div>

      {/* Org Info */}
      {organization && (
        <div className="px-4 py-3 border-b border-theme">
          <div className="flex items-center gap-3">
            {organization.logoUrl ? (
              <img src={organization.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-saffron-600/20 flex items-center justify-center text-saffron-400 font-bold text-sm">
                {organization.name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{organization.name}</p>
              {organization.nameMarathi && (
                <p className="text-[10px] opacity-60 font-devanagari truncate">{organization.nameMarathi}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (!isAllowed(item)) return null;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/receipts/new');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'nav-link',
                isActive && 'active',
                item.highlight && !isActive && 'bg-saffron-600/10 text-saffron-400 border border-saffron-600/20',
              )}
            >
              <item.icon size={18} />
              <div>
                <div className="text-[13px]">{language === 'mr' ? item.labelMr : item.label}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User, Theme Toggle & Logout */}
      <div className="p-3 border-t border-theme">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-saffron-600/20 flex items-center justify-center text-saffron-400 font-semibold text-sm">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user.name}</p>
              <p className="text-[10px] opacity-60 capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
        )}
        
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="nav-link w-full mb-1 flex items-center gap-3"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          <span className="text-[13px]">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button onClick={handleLogout} className="nav-link w-full text-red-400 hover:bg-red-500/10 hover:text-red-400">
          <LogOut size={16} />
          <span className="text-[13px]">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden glass-card p-2 rounded-xl"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed left-0 top-0 h-full w-64 z-50 md:hidden transition-transform duration-300',
        'bg-navy-800 border-r border-theme',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-navy-800 border-r border-theme">
        <SidebarContent />
      </div>
    </>
  );
}
