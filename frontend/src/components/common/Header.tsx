import React from 'react';
import { Link } from 'react-router-dom';
import { useCapsules } from '../../context/CapsuleContext';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const { unreadNotificationsCount } = useCapsules();
  const { user } = useAuth();

  return (
    <>
      {/* Mobile & Default Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
        <div className="h-16 px-gutter-mobile flex items-center justify-between">
          <Link to="/" className="flex items-center gap-space-sm group">
            {/* Seal Logo Icon */}
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-tertiary-fixed-dim shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">history_edu</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-headline-md text-title-md text-primary tracking-tight font-medium">
                  Agni's Capsule
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant/80 uppercase tracking-widest">
                Encrypted Vault
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-space-xs">
            {/* Notifications Button */}
            <Link
              to="/notifications"
              aria-label="Encrypted status and notifications"
              className="relative w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-on-tertiary-container animate-ping"></span>
              )}
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-on-tertiary-container"></span>
              )}
            </Link>

            {/* User Profile Avatar Link */}
            <Link
              to="/vault"
              aria-label="User Profile"
              className="w-11 h-11 flex items-center justify-center"
            >
              {user?.avatarUrl ? (
                <img
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-on-tertiary-container/30 hover:ring-tertiary-fixed transition-all"
                  src={user.avatarUrl}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};
