import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { KisanMargLogo } from '../common/KisanMargLogo';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { IconButton } from '../ui/IconButton';
import type { UserRole } from '../../types';
import { Menu, Bell, LogOut, User } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';

import { useLanguage } from '../../i18n/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../services/notificationApi';

export interface NavbarProps {
  role?: UserRole;
  userName?: string;
  userPhone?: string;
  onOpenMobileMenu?: () => void;
  onSwitchRole?: (role: UserRole) => void;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  role = 'FARMER',
  userName = 'Ramesh Patel',
  userPhone = '+91 98765 43210',
  onOpenMobileMenu,
  className,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, token, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const activeRole: UserRole = user?.role ? (user.role as UserRole) : role;
  const displayName = user?.full_name || userName;
  const displayPhone = user?.phone_number ? `+91 ${user.phone_number.replace(/^\+91/, '')}` : userPhone;

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    let isMounted = true;
    notificationApi
      .getNotifications(token)
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data)) {
          const count = res.data.filter((n) => !n.is_read).length;
          setUnreadCount(count);
        }
      })
      .catch(() => {
        if (isMounted) setUnreadCount(0);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const roleBadges: Record<UserRole, { label: string; variant: 'forest' | 'amber' | 'info' | 'warning' }> = {
    FARMER: { label: 'Farmer Portal', variant: 'forest' },
    CENTRE_STAFF: { label: 'Centre Staff', variant: 'info' },
    CENTRE_ADMIN: { label: 'Centre Admin', variant: 'amber' },
    SYSTEM_ADMIN: { label: 'System Admin', variant: 'warning' },
  };

  const currentBadge = roleBadges[activeRole] || roleBadges.FARMER;

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <header className={cn('sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-subtle', className)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile menu toggle + Logo */}
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <IconButton
              icon={<Menu className="h-5 w-5 text-slate-700" />}
              ariaLabel="Open navigation menu"
              onClick={onOpenMobileMenu}
              className="lg:hidden"
            />
          )}
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <KisanMargLogo size="md" />
          </div>
          <div className="hidden md:block ml-2">
            <Badge variant={currentBadge.variant} size="sm">
              {currentBadge.label}
            </Badge>
          </div>
        </div>

        {/* Center: Quick navigation links for Desktop */}
        {activeRole === 'FARMER' ? (
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => navigate('/farmer/dashboard')}
              className="hover:text-forest-800 transition-colors py-4"
            >
              {t('nav.dashboard', 'Dashboard')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/farmer/request')}
              className="hover:text-forest-800 transition-colors py-4"
            >
              {t('nav.myRequests', 'Sell Your Crop')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/farmer/centres')}
              className="hover:text-forest-800 transition-colors py-4"
            >
              {t('nav.centres', 'Procurement Centres')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/farmer/notifications')}
              className="hover:text-forest-800 transition-colors py-4 flex items-center gap-1.5"
            >
              {t('nav.notifications', 'Notifications')}
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/farmer/profile')}
              className="hover:text-forest-800 transition-colors py-4"
            >
              {t('nav.profile', 'Profile')}
            </button>
          </nav>
        ) : (
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600" />
        )}

        {/* Right: Notifications, Language Selector, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector for Farmers */}
          {activeRole === 'FARMER' && <LanguageSelector />}

          <div className="relative">
            <IconButton
              icon={<Bell className="h-5 w-5 text-slate-600" />}
              ariaLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              size="md"
              onClick={() => navigate('/farmer/notifications')}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-amber-500 text-slate-900 text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white pointer-events-none font-mono shadow-sm">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* User profile dropdown */}
          <Dropdown
            trigger={
              <button className="flex items-center gap-2.5 p-1 rounded-km hover:bg-slate-100 transition-colors text-left focus:outline-none">
                <Avatar name={displayName} roleBadge={activeRole} size="md" />
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-bold text-slate-900 leading-tight">{displayName}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{displayPhone}</span>
                </div>
              </button>
            }
            items={[
              { id: 'profile', label: 'My Profile', icon: <User className="h-3.5 w-3.5" />, onClick: () => navigate('/farmer/profile') },
              {
                id: 'logout',
                label: 'Logout',
                danger: true,
                icon: <LogOut className="h-3.5 w-3.5" />,
                onClick: handleLogout,
              },
            ]}
          />
        </div>
      </div>
    </header>
  );
};
