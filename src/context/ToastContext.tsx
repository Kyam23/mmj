/**
 * Toast Notification System & Context Provider
 * Barangay Bang-Bang Smart Garbage Monitoring System
 *
 * Alerts users immediately when endorsement requests are processed or when
 * a new announcement is posted.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X, Megaphone, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { Announcement, EndorsementRequest, NotificationItem } from '../types';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  action?: ToastAction;
  timestamp: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id' | 'timestamp'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Tracking refs to detect real-time changes
  const prevAnnouncementIds = useRef<Set<string>>(new Set());
  const prevEndorsementStatus = useRef<Map<string, string>>(new Map());
  const prevNotificationIds = useRef<Set<string>>(new Set());
  const isFirstPoll = useRef<boolean>(true);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id' | 'timestamp'>): string => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
      const newToast: ToastItem = {
        ...toast,
        id,
        duration: toast.duration ?? 5500,
        timestamp: Date.now()
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 toasts

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }

      return id;
    },
    [removeToast]
  );

  // Background listener: checks for new announcements and processed endorsement requests
  useEffect(() => {
    if (!user) {
      isFirstPoll.current = true;
      prevAnnouncementIds.current.clear();
      prevEndorsementStatus.current.clear();
      prevNotificationIds.current.clear();
      return;
    }

    const checkUpdates = async () => {
      try {
        const [announcements, endorsements, notifications] = await Promise.all([
          api.getAnnouncements().catch(() => [] as Announcement[]),
          api.getEndorsements().catch(() => [] as EndorsementRequest[]),
          api.getNotifications().catch(() => [] as NotificationItem[])
        ]);

        if (isFirstPoll.current) {
          // Initialize baseline state without firing toasts on immediate page load
          announcements.forEach((a) => prevAnnouncementIds.current.add(a.id));
          endorsements.forEach((e) => prevEndorsementStatus.current.set(e.id, e.status));
          notifications.forEach((n) => prevNotificationIds.current.add(n.id));
          isFirstPoll.current = false;
          return;
        }

        // 1. Detect New Announcements
        for (const ann of announcements) {
          if (!prevAnnouncementIds.current.has(ann.id)) {
            prevAnnouncementIds.current.add(ann.id);
            showToast({
              type: 'info',
              title: `New Barangay Advisory: ${ann.title}`,
              message: ann.content.length > 120 ? ann.content.slice(0, 120) + '...' : ann.content,
              duration: 7000
            });
          }
        }

        // 2. Detect Processed Endorsement Requests (Approved or Rejected)
        for (const end of endorsements) {
          const oldStatus = prevEndorsementStatus.current.get(end.id);

          // If status transitioned from Pending to Approved or Rejected
          if (oldStatus === 'Pending' && (end.status === 'Approved' || end.status === 'Rejected')) {
            prevEndorsementStatus.current.set(end.id, end.status);

            const isApproved = end.status === 'Approved';
            showToast({
              type: isApproved ? 'success' : 'warning',
              title: isApproved ? 'Endorsement Approved!' : 'Endorsement Request Update',
              message: isApproved
                ? `Purok Leader ${end.leader_name || 'Leader'} approved your "${end.purpose}". Certificate Code: ${end.certificate_code || 'Issued'}.`
                : `Your endorsement request for "${end.purpose}" was rejected: ${end.remarks || 'Please check requirements.'}`,
              duration: 8000
            });
          } else {
            prevEndorsementStatus.current.set(end.id, end.status);
          }
        }

        // 3. Detect New Targeted Notifications
        for (const notif of notifications) {
          if (!prevNotificationIds.current.has(notif.id)) {
            prevNotificationIds.current.add(notif.id);
            // Only toast if not already toasted by announcement/endorsement logic
            if (notif.type !== 'announcement') {
              showToast({
                type: notif.type === 'endorsement' ? 'success' : 'info',
                title: notif.title,
                message: notif.message,
                duration: 6000
              });
            }
          }
        }
      } catch (err) {
        // Silent catch for background polling
      }
    };

    // Initial check and recurring interval (every 4 seconds for fast feedback)
    checkUpdates();
    const interval = setInterval(checkUpdates, 4000);
    return () => clearInterval(interval);
  }, [user, showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, clearAllToasts }}>
      {children}

      {/* Floating Toast Container */}
      <div
        aria-live="assertive"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
      >
        {toasts.map((toast) => {
          const iconConfig = {
            success: {
              Icon: CheckCircle2,
              color: 'text-emerald-700',
              border: 'border-emerald-200 bg-emerald-50/95',
              badge: 'bg-emerald-100 text-emerald-800'
            },
            info: {
              Icon: Megaphone,
              color: 'text-sky-700',
              border: 'border-sky-200 bg-sky-50/95',
              badge: 'bg-sky-100 text-sky-800'
            },
            warning: {
              Icon: AlertTriangle,
              color: 'text-amber-700',
              border: 'border-amber-200 bg-amber-50/95',
              badge: 'bg-amber-100 text-amber-800'
            },
            error: {
              Icon: XCircle,
              color: 'text-rose-700',
              border: 'border-rose-200 bg-rose-50/95',
              badge: 'bg-rose-100 text-rose-800'
            }
          }[toast.type];

          const { Icon, color, border, badge } = iconConfig;

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto w-full p-4 rounded-xl border shadow-lg backdrop-blur-xs transition-all duration-200 animate-in slide-in-from-top-3 fade-in ${border}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg bg-white shadow-2xs shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-xs font-bold text-neutral-900 truncate">
                      {toast.title}
                    </h4>
                    <span className="text-[10px] text-neutral-400 font-mono shrink-0">Just now</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-700 leading-relaxed break-words">
                    {toast.message}
                  </p>

                  {toast.action && (
                    <button
                      onClick={() => {
                        toast.action?.onClick();
                        removeToast(toast.id);
                      }}
                      className="mt-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 block"
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-200/50 transition-colors shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
