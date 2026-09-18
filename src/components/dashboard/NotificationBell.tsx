'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Gift,
  Banknote,
  Zap,
  CreditCard,
  Info,
  Trash2,
  ExternalLink,
  BellOff,
  X,
} from 'lucide-react';
import { AppNotification, NotificationType } from '@/lib/notifications';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'referral':
      return <Gift className="w-4 h-4 text-emerald-400" />;
    case 'payout':
      return <Banknote className="w-4 h-4 text-blue-400" />;
    case 'subscription':
      return <Zap className="w-4 h-4 text-amber-400" />;
    case 'credit':
      return <CreditCard className="w-4 h-4 text-purple-400" />;
    default:
      return <Info className="w-4 h-4 text-primary" />;
  }
}

function getNotificationBadgeStyle(type: NotificationType) {
  switch (type) {
    case 'referral':
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    case 'payout':
      return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    case 'subscription':
      return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    case 'credit':
      return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
    default:
      return 'bg-primary/10 border-primary/30 text-primary';
  }
}

export function NotificationBell({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=25');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll for updates every 25 seconds
    const interval = setInterval(fetchNotifications, 25000);

    // Refetch when window regains focus
    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchNotifications]);

  // Handle outside click & escape key to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (item: AppNotification) => {
    if (!item.read) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      }).catch(() => {});
    }

    if (item.link) {
      setOpen(false);
      router.push(item.link);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const item = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (item && !item.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      fetchNotifications();
    }
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await fetch('/api/notifications?all=true', {
        method: 'DELETE',
      });
    } catch {
      fetchNotifications();
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Notifications"
        title="In-App Notifications"
      >
        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-primary rounded-full shadow-lg shadow-primary/40 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface border border-border shadow-2xl shadow-black/60 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-surface2/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/20 text-primary border border-primary/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1 font-medium"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface2 flex items-center justify-center text-muted">
                  <BellOff className="w-6 h-6 opacity-60" />
                </div>
                <p className="text-sm font-medium text-text">All caught up!</p>
                <p className="text-xs text-muted mt-1 max-w-[220px] mx-auto">
                  You&apos;ll be notified here when referral commissions, payouts, or tokens arrive.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`group relative p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    item.read
                      ? 'bg-transparent hover:bg-surface2/60 opacity-80'
                      : 'bg-primary/5 hover:bg-primary/10'
                  }`}
                >
                  {/* Type Icon Badge */}
                  <div
                    className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${getNotificationBadgeStyle(
                      item.type
                    )}`}
                  >
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          item.read ? 'text-text' : 'text-text font-bold'
                        }`}
                      >
                        {item.title}
                      </p>
                      {!item.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-muted font-medium">
                        {formatRelativeTime(item.created_at)}
                      </span>
                      {item.link && (
                        <span className="text-[10px] text-primary flex items-center gap-0.5 hover:underline font-medium">
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Individual Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNotification(e, item.id)}
                    className="absolute top-3 right-3 p-1 rounded-md text-muted hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border bg-surface2/30 flex items-center justify-between text-xs text-muted">
              <span>{notifications.length} total</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
