import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { ExtensionPage } from './pages/ExtensionPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { ProfilePage } from './pages/ProfilePage';

export const App: React.FC = () => {
  const [userPlan, setUserPlan] = useState<'free' | 'premium'>('free');

  const togglePlan = () => {
    setUserPlan((prev) => (prev === 'free' ? 'premium' : 'free'));
  };

  return (
    <HashRouter>
      <Routes>
        <Route
          element={<AppLayout userPlan={userPlan} onPlanToggle={togglePlan} />}
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/extension" element={<ExtensionPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};
