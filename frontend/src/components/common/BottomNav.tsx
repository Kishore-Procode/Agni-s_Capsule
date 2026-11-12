import React from 'react';
import { NavLink } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(23,36,58,0.06)] md:hidden">
      <div className="flex justify-around items-center h-20 px-space-xs relative">
        {/* Overview */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-14 transition-colors gap-1 ${
              isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px]">mark_email_unread</span>
          <span className="font-label-sm text-label-sm">Overview</span>
        </NavLink>

        {/* Capsules */}
        <NavLink
          to="/capsules"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-14 transition-colors gap-1 ${
              isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px]">archive</span>
          <span className="font-label-sm text-label-sm">Capsules</span>
        </NavLink>

        {/* Elevated Floating Create Seal Button */}
        <div className="relative -top-5 flex flex-col items-center justify-center">
          <NavLink
            to="/capsules/new"
            aria-label="Create new memory capsule"
            className="w-14 h-14 rounded-full bg-primary-container text-on-tertiary-fixed shadow-[0_4px_16px_rgba(23,36,58,0.25)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ring-2 ring-on-tertiary-container/40"
          >
            <span className="material-symbols-outlined text-[28px] text-tertiary-fixed-dim">
              draw
            </span>
          </NavLink>
          <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 font-medium">
            Create
          </span>
        </div>

        {/* Timeline */}
        <NavLink
          to="/timeline"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-14 transition-colors gap-1 ${
              isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px]">hourglass_top</span>
          <span className="font-label-sm text-label-sm">Timeline</span>
        </NavLink>

        {/* Vault Settings */}
        <NavLink
          to="/vault"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-14 transition-colors gap-1 ${
              isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px]">vpn_key</span>
          <span className="font-label-sm text-label-sm">Vault</span>
        </NavLink>
      </div>
    </nav>
  );
};

