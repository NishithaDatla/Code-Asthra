import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type { UserRole } from '../../types';
import {
  LayoutDashboard,
  CalendarCheck,
  PackageCheck,
  User,
  Building2,
  HelpCircle,
  LogOut,
  Bell,
  Clock,
  Scale,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { KisanMargLogo } from '../common/KisanMargLogo';
import { useLanguage } from '../../i18n/LanguageContext';
import { MOCK_NOTIFICATIONS } from '../../data/mockData';

export interface SidebarProps {
  role?: UserRole;
  activePath?: string;
  className?: string;
}

interface SidebarLink {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role = 'FARMER',
  activePath,
  className,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const currentPath = activePath || location.pathname;
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;

  const farmerLinks: SidebarLink[] = [
    { label: t('nav.dashboard', 'Dashboard'), icon: <LayoutDashboard className="h-4 w-4" />, path: '/farmer/dashboard' },
    { label: t('nav.myRequests', 'Sell Your Crop'), icon: <PackageCheck className="h-4 w-4" />, path: '/farmer/request' },
    { label: t('nav.centres', 'Procurement Centres'), icon: <Building2 className="h-4 w-4" />, path: '/farmer/centres' },
    {
      label: t('nav.notifications', 'Notifications'),
      icon: <Bell className="h-4 w-4" />,
      path: '/farmer/notifications',
      badge: unreadCount > 0 ? String(unreadCount) : undefined,
    },
    { label: t('nav.profile', 'Profile'), icon: <User className="h-4 w-4" />, path: '/farmer/profile' },
  ];

  const staffLinks: SidebarLink[] = [
    { label: 'Operational Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, path: '/staff/dashboard' },
    { label: "Today's Bookings", icon: <CalendarCheck className="h-4 w-4" />, path: '/staff/bookings' },
    { label: 'Queue Operations', icon: <Clock className="h-4 w-4" />, path: '/staff/queue' },
    { label: 'Procurement Processing', icon: <Scale className="h-4 w-4" />, path: '/staff/procurement/proc-001' },
  ];

  const adminLinks: SidebarLink[] = [
    { label: 'Admin Command Center', icon: <LayoutDashboard className="h-4 w-4" />, path: '/admin/dashboard' },
    { label: 'Procurement Centres', icon: <Building2 className="h-4 w-4" />, path: '/admin/centres' },
    { label: 'Operational Analytics', icon: <BarChart3 className="h-4 w-4" />, path: '/admin/analytics' },
    { label: 'Congestion Monitor', icon: <AlertTriangle className="h-4 w-4" />, path: '/admin/congestion' },
  ];

  const links = role === 'FARMER' ? farmerLinks : role === 'CENTRE_STAFF' ? staffLinks : adminLinks;

  return (
    <aside className={cn('w-64 bg-white border-r border-slate-200 flex flex-col h-full select-none', className)}>
      <div className="p-4 border-b border-slate-100 cursor-pointer" onClick={() => navigate('/')}>
        <KisanMargLogo size="sm" />
      </div>

      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {role} Navigation
        </div>
        {links.map((link) => {
          const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path) && link.path !== '/staff/dashboard' && link.path !== '/farmer/dashboard');
          return (
            <button
              key={link.path}
              type="button"
              onClick={() => navigate(link.path)}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-2.5 rounded-km text-xs font-semibold transition-colors min-h-[40px] text-left',
                isActive
                  ? 'bg-forest-800 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(isActive ? 'text-amber-400' : 'text-slate-500')}>{link.icon}</span>
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                    isActive ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-700'
                  )}
                >
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-1">
        <button
          type="button"
          // DEVELOPMENT ONLY — Replace with real logout handler during authentication API integration
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-km text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
        >
          <LogOut className="h-4 w-4 text-rose-600" />
          <span>{role === 'FARMER' ? t('nav.logout', 'Logout') : 'Logout'}</span>
        </button>

        <div className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-500">
          <HelpCircle className="h-4 w-4 text-slate-400 shrink-0" />
          <span>{role === 'FARMER' ? t('nav.support', 'KisanMarg Support') : 'KisanMarg Support'}</span>
        </div>
      </div>
    </aside>
  );
};
