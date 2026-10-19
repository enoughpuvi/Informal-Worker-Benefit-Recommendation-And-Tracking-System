import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';

// Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatbotWidget } from './components/ChatbotWidget';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WorkerDashboard } from './pages/WorkerDashboard';
import { WorkerProfilePage } from './pages/WorkerProfilePage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { SchemeDiscoveryPage } from './pages/SchemeDiscoveryPage';
import { SchemeDetailPage } from './pages/SchemeDetailPage';
import { WorkerApplicationsPage } from './pages/WorkerApplicationsPage';
import { TrackApplicationPage } from './pages/TrackApplicationPage';
import { WorkerDocumentsPage } from './pages/WorkerDocumentsPage';
import { WorkerNotificationsPage } from './pages/WorkerNotificationsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminSchemesPage } from './pages/AdminSchemesPage';
import { AdminDatasetUploadPage } from './pages/AdminDatasetUploadPage';
import { AdminApplicationsPage } from './pages/AdminApplicationsPage';
import { AdminWorkersPage } from './pages/AdminWorkersPage';
import { AdminReportsPage } from './pages/AdminReportsPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { GrievanceReportPage } from './pages/GrievanceReportPage';
import { TrustedPortalsPage } from './pages/TrustedPortalsPage';
import { VoiceAssistantPage } from './pages/VoiceAssistantPage';
// import { HelpPage } from './pages/HelpPage';

// Route Guards
const ProtectedWorkerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isPublicPage = ['/', '/login', '/register'].includes(location.pathname);
  const showSidebar = isAuthenticated && !isPublicPage;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex">
        {showSidebar && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <main className={`flex-1 transition-all p-4 sm:p-6 lg:p-8 ${showSidebar ? 'md:ml-64' : ''}`}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/track" element={<TrackApplicationPage />} />
            <Route path="/track/:appNo" element={<TrackApplicationPage />} />
            <Route path="/schemes" element={<SchemeDiscoveryPage />} />
            <Route path="/schemes/:schemeId" element={<SchemeDetailPage />} />
            <Route path="/portals" element={<TrustedPortalsPage />} />
            <Route path="/voice-assistant" element={<VoiceAssistantPage />} />
            {/* <Route path="/help" element={<HelpPage />} /> */}

            {/* Worker Protected Routes */}
            <Route path="/dashboard" element={<ProtectedWorkerRoute><WorkerDashboard /></ProtectedWorkerRoute>} />
            <Route path="/profile" element={<ProtectedWorkerRoute><WorkerProfilePage /></ProtectedWorkerRoute>} />
            <Route path="/recommendations" element={<ProtectedWorkerRoute><RecommendationsPage /></ProtectedWorkerRoute>} />
            <Route path="/applications" element={<ProtectedWorkerRoute><WorkerApplicationsPage /></ProtectedWorkerRoute>} />
            <Route path="/documents" element={<ProtectedWorkerRoute><WorkerDocumentsPage /></ProtectedWorkerRoute>} />
            <Route path="/notifications" element={<ProtectedWorkerRoute><WorkerNotificationsPage /></ProtectedWorkerRoute>} />
            <Route path="/issues" element={<ProtectedWorkerRoute><GrievanceReportPage /></ProtectedWorkerRoute>} />

            {/* Admin Protected Routes */}
            <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/admin/schemes" element={<ProtectedAdminRoute><AdminSchemesPage /></ProtectedAdminRoute>} />
            <Route path="/admin/dataset-upload" element={<ProtectedAdminRoute><AdminDatasetUploadPage /></ProtectedAdminRoute>} />
            <Route path="/admin/applications" element={<ProtectedAdminRoute><AdminApplicationsPage /></ProtectedAdminRoute>} />
            <Route path="/admin/workers" element={<ProtectedAdminRoute><AdminWorkersPage /></ProtectedAdminRoute>} />
            <Route path="/admin/issues" element={<ProtectedAdminRoute><GrievanceReportPage /></ProtectedAdminRoute>} />
            <Route path="/admin/analytics" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/admin/reports" element={<ProtectedAdminRoute><AdminReportsPage /></ProtectedAdminRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedAdminRoute><AdminAuditLogsPage /></ProtectedAdminRoute>} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Floating RAG Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <AppLayout />
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
