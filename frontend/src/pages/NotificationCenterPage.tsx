import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCapsules } from '../context/CapsuleContext';
import { useAuth } from '../context/AuthContext';

export const NotificationCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markNotificationRead, markAllNotificationsRead, breakWaxSeal } = useCapsules();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'delivery' | 'reminder' | 'acknowledgement'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  const handleBreakWaxAction = async (capsuleId?: string, notifId?: string) => {
    if (notifId) markNotificationRead(notifId);
    if (capsuleId) {
      await breakWaxSeal(capsuleId);
      navigate(`/capsules/${capsuleId}/read`);
    }
  };

  const cohortBadge = user?.graduationYear ? `Class of '${String(user.graduationYear).slice(-2)}` : "CSE '27";

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 md:pt-6 pb-28 md:pb-12 bg-surface">
      <div className="flex flex-col w-full max-w-3xl mx-auto pb-10">
        {/* Dispatch Banner Header */}
        <div className="px-gutter-mobile md:px-0 pt-space-md pb-space-xs">
          <div className="flex items-center gap-space-xs mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim animate-ping"></span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-tertiary-fixed-variant font-semibold">
              Dispatch Logs &amp; Alerts
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary tracking-tight font-serif">
              Notification Center
            </h2>
            <div className="flex items-center gap-2">
              <span className="font-label-md text-label-md text-secondary bg-surface-container-high px-2.5 py-0.5 rounded-full font-semibold">
                {cohortBadge}
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="font-label-sm text-label-sm text-on-tertiary-container hover:underline cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed">
            Track future capsule delivery dispatches, reminder pulses, and recipient acknowledgements across time.
          </p>
        </div>

        {/* Filter Ledger Tabs */}
        <div className="px-gutter-mobile md:px-0 py-space-sm overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-space-xs min-w-max">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
              }`}
            >
              All Alerts ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('delivery')}
              className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                activeFilter === 'delivery'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
              }`}
            >
              Deliveries ({notifications.filter((n) => n.type === 'delivery').length})
            </button>
            <button
              onClick={() => setActiveFilter('reminder')}
              className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                activeFilter === 'reminder'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
              }`}
            >
              Reminders ({notifications.filter((n) => n.type === 'reminder').length})
            </button>
            <button
              onClick={() => setActiveFilter('acknowledgement')}
              className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                activeFilter === 'acknowledgement'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
              }`}
            >
              Acknowledgements ({notifications.filter((n) => n.type === 'acknowledgement').length})
            </button>
          </div>
        </div>

        {/* Notification Stream OR Empty State */}
        <div className="px-gutter-mobile md:px-0 flex flex-col gap-space-sm mt-space-sm">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest rounded-xl border border-dashed border-surface-container gap-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-surface-container-low text-on-tertiary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">notifications_off</span>
              </div>
              <h3 className="font-headline-md text-title-md text-primary font-serif">
                Dispatch Logs Clear
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                No active notifications or delivery pulses found in this corridor.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => markNotificationRead(item.id)}
                className={`relative p-space-md rounded-xl bg-surface-container-lowest shadow-sm border transition-all cursor-pointer overflow-hidden ${
                  !item.isRead
                    ? 'border-surface-container-high hover:border-tertiary-fixed-dim/50'
                    : 'border-surface-container-low opacity-80'
                }`}
              >
                {/* Amber ambient accent glow for active delivery alerts */}
                {item.type === 'delivery' && (
                  <div className="absolute -right-8 -top-8 w-28 h-28 bg-tertiary-fixed-dim/20 rounded-full blur-2xl pointer-events-none"></div>
                )}

                <div className="flex items-start justify-between gap-space-sm mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full shadow-sm ${
                        item.type === 'delivery'
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                          : item.type === 'reminder'
                          ? 'bg-surface-container-high text-primary'
                          : 'bg-primary text-on-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {item.type === 'delivery'
                          ? 'mark_email_unread'
                          : item.type === 'reminder'
                          ? 'sensors'
                          : 'verified'}
                      </span>
                    </span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-tertiary-fixed-variant font-bold">
                      {item.title}
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary">{item.timestamp}</span>
                </div>

                <div className="flex gap-space-sm">
                  {item.imageUrl && (
                    <div className="w-16 h-16 rounded-lg bg-surface-container overflow-hidden flex-shrink-0 relative border border-surface-container">
                      <img className="w-full h-full object-cover" alt={item.title} src={item.imageUrl} />
                      <div className="absolute inset-0 bg-primary/10"></div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline-md text-headline-md text-primary leading-tight truncate font-serif">
                      {item.subtitle || item.title}
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 line-clamp-2">
                      {item.message}
                    </p>
                    {item.meta?.cipher && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="material-symbols-outlined text-[13px] text-on-tertiary-container">
                          verified_user
                        </span>
                        <span className="font-label-sm text-label-sm text-secondary tracking-tight font-mono">
                          {item.meta.cipher}
                        </span>
                      </div>
                    )}
                    {item.meta?.attempt && (
                      <span className="font-label-sm text-label-sm text-secondary font-semibold mt-1 inline-block">
                        Attempt {item.meta.attempt} of {item.meta.maxAttempts || 5}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Triggers */}
                {item.type === 'delivery' && item.meta?.actionLabel && (
                  <div className="mt-space-md pt-space-xs flex items-center justify-between gap-space-sm border-t border-surface-container-low">
                    <div className="flex items-center gap-1 text-secondary">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      <span className="font-label-sm text-label-sm">Delivered via outbox worker</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBreakWaxAction(item.capsuleId, item.id);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg font-label-md text-label-md font-semibold hover:bg-tertiary-fixed-dim transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <span className="w-4 h-4 rounded-full bg-on-tertiary-fixed/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[11px] text-on-tertiary-fixed">
                          lock_open
                        </span>
                      </span>
                      <span>{item.meta.actionLabel}</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};
