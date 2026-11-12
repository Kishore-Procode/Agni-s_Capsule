import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { BottomNav } from '../components/common/BottomNav';
import { DesktopSidebar } from '../components/common/DesktopSidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="bg-surface font-body-md text-on-surface flex flex-col min-h-screen">
      {/* Mobile Top Header */}
      <div className="md:hidden">
        <Header />
      </div>

      {/* Desktop Top Header & Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 md:pt-20">
        <Outlet />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
};

