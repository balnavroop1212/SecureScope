import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const { user, logout, updatePlan } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);

  const userPlan = user?.plan || 'free';
  const userName = user ? `${user.firstName} ${user.lastName}` : 'Guest User';
  const userEmail = user?.email || 'guest@securescope.local';

  const handlePlanToggle = async () => {
    const nextPlan = userPlan === 'free' ? 'premium' : 'free';
    await updatePlan(nextPlan);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-obsidian text-textMain">
      {/* Fixed Sidebar */}
      <Sidebar
        userPlan={userPlan}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col pl-64 overflow-hidden">
        {/* Sticky Header */}
        <Header
          userPlan={userPlan}
          userName={userName}
          userEmail={userEmail}
          isDemoMode={isDemoMode}
          onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
          onLogout={logout}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <Outlet context={{ isDemoMode, userPlan, onPlanToggle: handlePlanToggle }} />
        </main>
      </div>
    </div>
  );
};
