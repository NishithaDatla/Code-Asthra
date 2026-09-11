import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  ArrowLeft,
  Bell,
  BellRing,
  CalendarCheck,
  Clock,
  Scale,
  CreditCard,
  AlertTriangle,
  CheckCheck,
  BellOff,
  RefreshCw,
  X,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/notificationApi';
import type { BackendNotification, NotificationTypeBackend } from '../services/notificationApi';
import { ApiError } from '../services/apiClient';

export const FarmerNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { token } = useAuth();

  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [pendingReadIds, setPendingReadIds] = useState<Set<string>>(new Set());
  const [selectedNotif, setSelectedNotif] = useState<BackendNotification | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await notificationApi.getNotifications(token);
      if (res.success && res.data) {
        setNotifications(res.data);
      } else {
        setErrorMsg(res.message || 'Failed to retrieve notifications.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Failed to fetch notifications.');
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected error occurred while fetching notifications.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!token || pendingReadIds.has(id)) return;

    setPendingReadIds((prev) => new Set(prev).add(id));

    try {
      const res = await notificationApi.markNotificationRead(token, id);
      if (res.success && res.data) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: res.data.read_at } : n))
        );
      }
    } catch (err: unknown) {
      console.warn('[Mark Read Error]:', err);
    } finally {
      setPendingReadIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;

    const unreadItems = notifications.filter((n) => !n.is_read);
    for (const item of unreadItems) {
      await handleMarkAsRead(item.id);
    }
  };

  const handleSelectNotification = (notif: BackendNotification) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif.id);
    }
    setSelectedNotif(notif);
  };

  const getTypeIcon = (type: NotificationTypeBackend) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return <CalendarCheck className="h-5 w-5 text-forest-700 shrink-0" />;
      case 'SLOT_REMINDER':
        return <Clock className="h-5 w-5 text-amber-600 shrink-0" />;
      case 'QUEUE_CALLED':
        return <BellRing className="h-5 w-5 text-amber-700 shrink-0" />;
      case 'PROCUREMENT_UPDATED':
        return <Scale className="h-5 w-5 text-forest-800 shrink-0" />;
      case 'PAYMENT_PROCESSED':
        return <CreditCard className="h-5 w-5 text-emerald-700 shrink-0" />;
      case 'SYSTEM_ALERT':
        return <AlertTriangle className="h-5 w-5 text-amber-800 shrink-0" />;
      default:
        return <Bell className="h-5 w-5 text-slate-600 shrink-0" />;
    }
  };

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/farmer/dashboard')}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
                  {t('farmer.dashboard.notifications')}
                </h1>
                {unreadCount > 0 ? (
                  <Badge variant="amber" size="sm" className="font-mono">
                    {unreadCount} Unread
                  </Badge>
                ) : (
                  <Badge variant="forest" size="sm" className="font-mono">
                    All Read
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Stay updated on your procurement slots, queue status, and payment disbursements.
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCheck className="h-4 w-4 text-forest-700" />}
              onClick={handleMarkAllAsRead}
              className="shrink-0 text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {errorMsg && (
          <Alert type="danger" onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {isLoading ? (
          <div className="py-12 text-center">
            <RefreshCw className="h-6 w-6 text-forest-700 animate-spin mx-auto mb-2" />
            <p className="text-xs font-mono text-slate-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          /* EMPTY STATE */
          <Card className="bg-white border-slate-200 text-center p-8 sm:p-12 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <BellOff className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                No notifications yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1 leading-relaxed">
                Important updates about your booking confirmations, queue arrival alerts, and payment disbursements will appear here.
              </p>
            </div>
          </Card>
        ) : (
          /* NOTIFICATIONS LIST */
          <div className="space-y-3">
            {notifications.map((notif) => {
              const isPendingRead = pendingReadIds.has(notif.id);

              return (
                <div
                  key={notif.id}
                  onClick={() => handleSelectNotification(notif)}
                  className={`p-4 sm:p-5 rounded-km border transition-all cursor-pointer relative overflow-hidden ${
                    !notif.is_read
                      ? 'bg-white border-forest-300 border-l-4 border-l-forest-700 shadow-subtle'
                      : 'bg-white/80 border-slate-200 opacity-90 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Icon */}
                      <div
                        className={`p-2.5 rounded-km shrink-0 ${
                          !notif.is_read ? 'bg-forest-50 border border-forest-100' : 'bg-slate-100'
                        }`}
                      >
                        {getTypeIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`text-sm font-heading ${
                              !notif.is_read
                                ? 'font-extrabold text-slate-900'
                                : 'font-semibold text-slate-700'
                            }`}
                          >
                            {notif.title}
                          </h3>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-forest-600 shrink-0" title="Unread" />
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>

                        <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                          <span>{new Date(notif.created_at).toLocaleString()}</span>
                          <span>•</span>
                          <span className="uppercase text-[10px] tracking-wider font-bold">
                            {notif.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mark Read Action */}
                    {!notif.is_read && (
                      <div className="flex items-center gap-2 shrink-0 self-center">
                        <button
                          type="button"
                          disabled={isPendingRead}
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
                          title="Mark as read"
                        >
                          {isPendingRead ? (
                            <RefreshCw className="h-4 w-4 animate-spin text-forest-700" />
                          ) : (
                            <CheckCheck className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Lightweight Notification Detail Modal */}
        {selectedNotif && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="bg-white max-w-lg w-full p-6 space-y-5 relative shadow-modal border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 bg-forest-50 border border-forest-200 rounded-km">
                  {getTypeIcon(selectedNotif.type)}
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-900">
                    {selectedNotif.title}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(selectedNotif.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-km border border-slate-200">
                  {selectedNotif.message}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedNotif(null)}>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </FarmerLayout>
  );
};
