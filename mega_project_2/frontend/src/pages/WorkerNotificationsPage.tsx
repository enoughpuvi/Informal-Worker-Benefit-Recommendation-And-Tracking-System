import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationApi } from '../services/api';
import { NotificationItem } from '../types';
import { Bell, Check, CheckCheck, ArrowRight } from 'lucide-react';

export const WorkerNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    notificationApi.getNotifications()
      .then((data) => setNotifications(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600" />
            Notifications & Welfare Updates
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification(s).` : 'All caught up!'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">No notifications yet</h3>
          <p className="text-xs text-slate-500">Status changes and document reviews will be alerted here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                n.is_read
                  ? 'bg-white border-slate-200 opacity-80'
                  : 'bg-emerald-50/40 border-emerald-300 shadow-xs'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  )}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-600">
                  <span>{new Date(n.created_at).toLocaleString('en-IN')}</span>
                  {n.related_id && (
                    <Link
                      to={`/track/${n.related_id}`}
                      className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                    >
                      Track Ref: {n.related_id} <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  title="Mark as read"
                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
