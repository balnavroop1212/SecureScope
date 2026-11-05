import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export interface AppLayoutProps {
  userPlan?: 'free' | 'premium';
  onPlanToggle?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  userPlan = 'free',
  onPlanToggle,
}) => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-obsidian text-textMain">
      {/* Fixed Sidebar */}
      <Sidebar userPlan={userPlan} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col pl-64 overflow-hidden">
        {/* Sticky Header */}
        <Header
          userPlan={userPlan}
          isDemoMode={isDemoMode}
          onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
          onLogout={() => console.log('Logout invoked')}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <Outlet context={{ isDemoMode, userPlan, onPlanToggle }} />
        </main>
      </div>
    </div>
  );
};
