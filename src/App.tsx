import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Skeleton } from './components/ui/Skeleton';

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
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing / ConSentinel Hero (The only heavy/glassy page) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DemoPage />} />

          {/* Core Dashboard & Repository Intelligence Pages wrapped in Light AppLayout */}
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            }
          />
          <Route
            path="/repositories"
            element={
              <AppLayout>
                <RepositoriesPage />
              </AppLayout>
            }
          />
          <Route
            path="/repositories/:id"
            element={
              <AppLayout>
                <RepositoryDetailPage />
              </AppLayout>
            }
          />
          <Route
            path="/scans/:scanId"
            element={
              <AppLayout>
                <ScanProgressPage />
              </AppLayout>
            }
          />
          <Route
            path="/findings"
            element={
              <AppLayout>
                <FindingsPage />
              </AppLayout>
            }
          />
          <Route
            path="/attack-paths"
            element={
              <AppLayout>
                <AttackPathsPage />
              </AppLayout>
            }
          />
          <Route
            path="/remediation"
            element={
              <AppLayout>
                <RemediationPage />
              </AppLayout>
            }
          />

          {/* Incident Triage Console & Backend Contract Routes */}
          <Route
            path="/queue"
            element={
              <AppLayout>
                <QueuePage />
              </AppLayout>
            }
          />
          <Route
            path="/incidents/:id"
            element={
              <AppLayout>
                <IncidentDetailPage />
              </AppLayout>
            }
          />
          <Route
            path="/monitoring"
            element={
              <AppLayout>
                <MonitoringPage />
              </AppLayout>
            }
          />
          <Route
            path="/guardrails"
            element={
              <AppLayout>
                <GuardrailsPage />
              </AppLayout>
            }
          />
          <Route
            path="/memory"
            element={
              <AppLayout>
                <MemoryPage />
              </AppLayout>
            }
          />
          <Route
            path="/evals"
            element={
              <AppLayout>
                <EvalsPage />
              </AppLayout>
            }
          />
          <Route
            path="/submit"
            element={
              <AppLayout>
                <SubmitPage />
              </AppLayout>
            }
          />
          <Route
            path="/login"
            element={
              <AppLayout>
                <LoginPage />
              </AppLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
