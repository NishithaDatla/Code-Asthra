import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MOCK_NOTIFICATIONS } from '../data/mockData';
import type { NotificationItem, NotificationType } from '../types';
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
  ChevronRight,
  BellOff,
  Info,
  X,
} from 'lucide-react';

export const FarmerNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleSelectNotification = (notif: NotificationItem) => {
    // Mark as read when selected
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    setSelectedNotif(notif);
  };

  const handleNavigateToRelated = (notif: NotificationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Mark as read
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }

    // Close modal if open
    setSelectedNotif(null);

    switch (notif.relatedEntityType) {
      case 'booking':
        navigate(`/farmer/booking/${notif.relatedEntityId || 'bkg-101'}`);
        break;
      case 'queue':
        navigate(`/farmer/queue/${notif.relatedEntityId || 'bkg-101'}`);
        break;
      case 'procurement':
        navigate(`/farmer/procurement/${notif.relatedEntityId || 'proc-001'}`);
        break;
      case 'payment':
        navigate(`/farmer/payment/${notif.relatedEntityId || 'pay-001'}`);
        break;
      default:
        break;
    }
  };

  const getTypeIcon = (type: NotificationType) => {
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

  const getActionLabel = (type: NotificationType) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
      case 'SLOT_REMINDER':
        return 'View Booking';
      case 'QUEUE_CALLED':
        return 'View Queue';
      case 'PROCUREMENT_UPDATED':
        return 'View Procurement';
      case 'PAYMENT_PROCESSED':
        return 'View Payment';
      default:
        return null;
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
                  Notifications
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

        {/* Development-Only Demo Controls */}
        {import.meta.env.DEV && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-km text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-subtle">
            <span className="text-amber-900 font-mono text-[11px] font-bold">
              [Demo Controls — Development Only]
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setNotifications((prev) =>
                    prev.map((n) => ({ ...n, isRead: false }))
                  )
                }
                className="px-2.5 py-1 rounded text-[11px] font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors"
              >
                Set All Unread
              </button>
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="px-2.5 py-1 rounded text-[11px] font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors"
              >
                Set All Read
              </button>
              <button
                type="button"
                onClick={() => setNotifications(MOCK_NOTIFICATIONS)}
                className="px-2.5 py-1 rounded text-[11px] font-bold bg-amber-800 text-white hover:bg-amber-900 transition-colors"
              >
                Reset Default Mock Data
              </button>
            </div>
          </div>
        )}

        {/* Notifications Chronological List */}
        {notifications.length === 0 ? (
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
          <div className="space-y-3">
            {notifications.map((notif) => {
              const actionLabel = getActionLabel(notif.type);

              return (
                <div
                  key={notif.id}
                  onClick={() => handleSelectNotification(notif)}
                  className={`p-4 sm:p-5 rounded-km border transition-all cursor-pointer relative overflow-hidden ${
                    !notif.isRead
                      ? 'bg-white border-forest-300 border-l-4 border-l-forest-700 shadow-subtle'
                      : 'bg-white/80 border-slate-200 opacity-90 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Icon */}
                      <div className={`p-2.5 rounded-km shrink-0 ${!notif.isRead ? 'bg-forest-50 border border-forest-100' : 'bg-slate-100'}`}>
                        {getTypeIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`text-sm font-heading ${
                              !notif.isRead
                                ? 'font-extrabold text-slate-900'
                                : 'font-semibold text-slate-700'
                            }`}
                          >
                            {notif.title}
                          </h3>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-forest-600 shrink-0" title="Unread" />
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                          <span>{notif.createdAt}</span>
                          <span>•</span>
                          <span className="uppercase text-[10px] tracking-wider font-bold">
                            {notif.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-center">
                      {actionLabel && notif.relatedEntityType && (
                        <Button
                          variant="ghost"
                          size="sm"
                          rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                          onClick={(e) => handleNavigateToRelated(notif, e)}
                          className="text-xs font-semibold text-forest-800 hover:bg-forest-5 text-nowrap"
                        >
                          {actionLabel}
                        </Button>
                      )}

                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                          title="Mark as read"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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
                    {selectedNotif.createdAt}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-km border border-slate-200">
                  {selectedNotif.message}
                </p>

                <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-km text-xs text-slate-500 flex items-center gap-2">
                  <Info className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    This notification record is maintained via local mock state.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedNotif(null)}
                >
                  Close
                </Button>
                {selectedNotif.relatedEntityType && getActionLabel(selectedNotif.type) && (
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                    onClick={() => handleNavigateToRelated(selectedNotif)}
                  >
                    {getActionLabel(selectedNotif.type)}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </FarmerLayout>
  );
};
