import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CapsuleProvider } from './context/CapsuleContext';
import { AppLayout } from './layouts/AppLayout';

import { OverviewDashboardPage } from './pages/OverviewDashboardPage';
import { CreateSealCapsulePage } from './pages/CreateSealCapsulePage';
import { MyCapsulesPage } from './pages/MyCapsulesPage';
import { CapsuleReadingExperiencePage } from './pages/CapsuleReadingExperiencePage';
import { VaultStorageSecurityPage } from './pages/VaultStorageSecurityPage';
import { NotificationCenterPage } from './pages/NotificationCenterPage';
import { CapsuleTimelineMilestonesPage } from './pages/CapsuleTimelineMilestonesPage';
import { BatchHubPage } from './pages/BatchHubPage';
import { AuthPage } from './pages/AuthPage';
import { GoogleCallbackPage } from './pages/GoogleCallbackPage';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC = () => {
  const { user } = useAuth();
  return user ? <AppLayout /> : <Navigate to="/auth" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CapsuleProvider>
          <BrowserRouter>
            <Routes>
              {/* Standalone Auth Routes */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

              {/* Main Application with Responsive Navigation Shell */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<OverviewDashboardPage />} />
                <Route path="/overview" element={<Navigate to="/" replace />} />
                <Route path="/capsules" element={<MyCapsulesPage />} />
                <Route path="/my-capsules" element={<Navigate to="/capsules" replace />} />
                <Route path="/capsules/new" element={<CreateSealCapsulePage />} />
                <Route path="/create-capsule" element={<Navigate to="/capsules/new" replace />} />
                <Route path="/capsules/:id/read" element={<CapsuleReadingExperiencePage />} />
                <Route path="/inbox/:id" element={<CapsuleReadingExperiencePage />} />
                <Route path="/timeline" element={<CapsuleTimelineMilestonesPage />} />
                <Route path="/vault" element={<VaultStorageSecurityPage />} />
                <Route path="/vault-settings" element={<Navigate to="/vault" replace />} />
                <Route path="/notifications" element={<NotificationCenterPage />} />
                <Route path="/batch" element={<BatchHubPage />} />
                <Route path="/batch-27-hub" element={<Navigate to="/batch" replace />} />
              </Route>

              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </BrowserRouter>
        </CapsuleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
