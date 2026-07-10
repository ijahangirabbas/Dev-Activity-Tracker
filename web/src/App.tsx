import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import QueryProvider from 'web/components/QueryProvider';
import AuthProvider from 'web/components/AuthProvider';

// Page imports
import Home from 'web/app/page';
import LoginPage from 'web/app/(auth)/login/page';
import SignupPage from 'web/app/(auth)/signup/page';
import ForgotPasswordPage from 'web/app/(auth)/forgot-password/page';
import ResetPasswordPage from 'web/app/(auth)/reset-password/page';
import PaymentPage from 'web/app/payment/page';
import DashboardLayout from 'web/app/(dashboard)/layout';
import OverviewPage from 'web/app/(dashboard)/dashboard/page';
import ProjectsPage from 'web/app/(dashboard)/projects/page';
import FilesPage from 'web/app/(dashboard)/files/page';
import TerminalsPage from 'web/app/(dashboard)/terminals/page';
import SettingsPage from 'web/app/(dashboard)/settings/page';
import AuthCallback from 'web/components/AuthCallback';

export default function App() {
  return (
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected dashboard routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<div />} />
              <Route path="/projects" element={<Navigate to="/dashboard?tab=projects" replace />} />
              <Route path="/files" element={<Navigate to="/dashboard?tab=files" replace />} />
              <Route path="/terminals" element={<Navigate to="/dashboard?tab=terminals" replace />} />
              <Route path="/settings" element={<Navigate to="/dashboard?tab=settings" replace />} />
            </Route>

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}
