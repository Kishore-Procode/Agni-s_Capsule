import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useCapsules } from '../../context/CapsuleContext';
import { useAuth } from '../../context/AuthContext';

export const DesktopSidebar: React.FC = () => {
  const { unreadNotificationsCount } = useCapsules();
  const { user } = useAuth();

  return (
    <>
      {/* Desktop Top Header */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-20 bg-surface-container-lowest/90 backdrop-blur-xl z-50 shadow-[0_1px_8px_rgba(23,36,58,0.06)]">
        <div className="w-full h-20 px-gutter flex items-center justify-between gap-gutter">
          <Link to="/batch" className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-tertiary-container shadow-[0_2px_6px_rgba(23,36,58,0.18)]">
              <span className="material-symbols-outlined text-[22px]">history_edu</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-title-md text-primary tracking-tight leading-none">
                Agni's Capsule
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-space-xs">
                B.Tech CSE Batch of 2027 Vault
              </span>
            </div>
            <div className="hidden xl:flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-low rounded-full ml-space-sm">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                142 Verified Engineers • Convocation June 2027
              </span>
            </div>
          </Link>

          <div className="flex-1 max-w-md mx-space-md">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant pl-10 pr-space-md py-2 rounded-lg font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none transition-all ring-1 ring-transparent focus:ring-on-tertiary-container/30"
                placeholder="Search archives, roll numbers, squad ciphers..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-space-md">
            <Link
              to="/capsules/new"
              className="px-3.5 py-1.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">
                draw
              </span>
              <span>Draft Capsule</span>
            </Link>

            <Link
              to="/notifications"
              aria-label="Notifications"
              className="relative w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container hover:text-on-surface flex items-center justify-center text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-tertiary-container text-tertiary-fixed text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>

            <Link to="/vault" className="flex items-center gap-space-sm pl-space-xs group">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden ring-1 ring-on-tertiary-container/30 group-hover:ring-on-tertiary-container transition-all">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
                )}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface leading-tight">
                  {user?.fullName || 'Cadet Contributor'}
                </span>
                <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">
                  Class Guardian
                </span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-20 bottom-0 w-64 bg-surface-container-lowest z-40 flex-col justify-between py-space-lg shadow-[1px_0_12px_rgba(23,36,58,0.03)] border-r border-outline-variant/20">
        <div className="flex flex-col gap-space-lg">
          <div className="px-space-lg">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
              Registry Navigation
            </span>
          </div>
          <nav className="flex flex-col gap-1 px-space-md">
            <NavLink
              to="/batch"
              className={({ isActive }) =>
                `flex items-center gap-space-sm px-space-md py-2.5 rounded-lg font-body-md text-body-md transition-colors ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">hub</span>
              Batch '27 Hub
            </NavLink>

            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-space-sm px-space-md py-2.5 rounded-lg font-body-md text-body-md transition-colors ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              Overview
            </NavLink>

            <NavLink
              to="/capsules"
              className={({ isActive }) =>
                `flex items-center gap-space-sm px-space-md py-2.5 rounded-lg font-body-md text-body-md transition-colors ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
              My Capsules
            </NavLink>

            <NavLink
              to="/timeline"
              className={({ isActive }) =>
                `flex items-center gap-space-sm px-space-md py-2.5 rounded-lg font-body-md text-body-md transition-colors ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
              Timeline
            </NavLink>

            <NavLink
              to="/vault"
              className={({ isActive }) =>
                `flex items-center gap-space-sm px-space-md py-2.5 rounded-lg font-body-md text-body-md transition-colors ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">lock_clock</span>
              Cold Vault & Security
            </NavLink>
          </nav>
        </div>

        <div className="px-space-md">
          <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-xs border border-surface-container">
            <div className="flex items-center gap-space-xs text-on-tertiary-container">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span className="font-label-sm text-label-sm uppercase font-bold tracking-wider">
                Institutional Seal
              </span>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Encrypted SHA-256 ledger locked until June 18, 2027 Convocation.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

