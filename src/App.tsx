import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Skeleton } from './components/ui/Skeleton';
import { AuthProvider } from './context/AuthContext';
import { AiProvider } from './context/AiContext';
import { AiModelModal } from './components/ai/AiModelModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy loading for every route per performance requirements
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const RepositoriesPage = lazy(() =>
  import('./pages/RepositoriesPage').then((m) => ({ default: m.RepositoriesPage }))
);
const RepositoryDetailPage = lazy(() =>
  import('./pages/RepositoryDetailPage').then((m) => ({ default: m.RepositoryDetailPage }))
);
const ScanProgressPage = lazy(() =>
  import('./pages/ScanProgressPage').then((m) => ({ default: m.ScanProgressPage }))
);
const FindingsPage = lazy(() =>
  import('./pages/FindingsPage').then((m) => ({ default: m.FindingsPage }))
);
const AttackPathsPage = lazy(() =>
  import('./pages/AttackPathsPage').then((m) => ({ default: m.AttackPathsPage }))
);
const RemediationPage = lazy(() =>
  import('./pages/RemediationPage').then((m) => ({ default: m.RemediationPage }))
);
const QueuePage = lazy(() =>
  import('./pages/QueuePage').then((m) => ({ default: m.QueuePage }))
);
const IncidentDetailPage = lazy(() =>
  import('./pages/IncidentDetailPage').then((m) => ({ default: m.IncidentDetailPage }))
);
const MonitoringPage = lazy(() =>
  import('./pages/MonitoringPage').then((m) => ({ default: m.MonitoringPage }))
);
const GuardrailsPage = lazy(() =>
  import('./pages/GuardrailsPage').then((m) => ({ default: m.GuardrailsPage }))
);
const MemoryPage = lazy(() =>
  import('./pages/MemoryPage').then((m) => ({ default: m.MemoryPage }))
);
const EvalsPage = lazy(() =>
  import('./pages/EvalsPage').then((m) => ({ default: m.EvalsPage }))
);
const SubmitPage = lazy(() =>
  import('./pages/SubmitPage').then((m) => ({ default: m.SubmitPage }))
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const DemoPage = lazy(() =>
  import('./pages/DemoPage').then((m) => ({ default: m.DemoPage }))
);

const PageLoader: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 py-12 space-y-4">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-4 w-96" />
    <Skeleton className="h-80 w-full rounded-[20px]" />
  </div>
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AiProvider>
        <AiModelModal />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes: Landing, Live Demo & Analyst Login */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route
              path="/login"
              element={
                <AppLayout>
                  <LoginPage />
                </AppLayout>
              }
            />

            {/* Protected Console Routes: Requires valid session & token authentication */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/repositories"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <RepositoriesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/repositories/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <RepositoryDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/scans/:scanId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ScanProgressPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/findings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <FindingsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attack-paths"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AttackPathsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/remediation"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <RemediationPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Incident Triage Console & Backend Contract Routes */}
            <Route
              path="/queue"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <QueuePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/incidents/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <IncidentDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/monitoring"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MonitoringPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/guardrails"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <GuardrailsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/memory"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MemoryPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/evals"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <EvalsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/submit"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SubmitPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SettingsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AiProvider>
  </AuthProvider>
);
};
