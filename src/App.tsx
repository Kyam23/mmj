/**
 * SMART GARBAGE MONITORING SYSTEM
 * Barangay Bang-Bang, Cordova, Cebu, Philippines
 * Main Application Orchestrator with Dark/Light Theme & Account Recovery
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { PasswordResetModal } from './components/auth/PasswordResetModal';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SchedulesManager } from './components/admin/SchedulesManager';
import { HouseholdsManager } from './components/admin/HouseholdsManager';
import { UsersManager } from './components/admin/UsersManager';
import { MonitoringView } from './components/admin/MonitoringView';
import { ReportsView } from './components/admin/ReportsView';
import { AnnouncementsManager } from './components/admin/AnnouncementsManager';
import { SystemSettingsView } from './components/admin/SystemSettingsView';
import { ActivityLogsView } from './components/admin/ActivityLogsView';

// Collector Components
import { CollectorDashboard } from './components/collector/CollectorDashboard';
import { CollectorTasks } from './components/collector/CollectorTasks';

// Leader Components
import { LeaderDashboard } from './components/leader/LeaderDashboard';
import { DisposalVerificationView } from './components/leader/DisposalVerificationView';
import { PaymentVerificationView } from './components/leader/PaymentVerificationView';
import { EndorsementProcessingView } from './components/leader/EndorsementProcessingView';

// Resident Components
import { ResidentDashboard } from './components/resident/ResidentDashboard';
import { ResidentDisposalView } from './components/resident/ResidentDisposalView';
import { ResidentPaymentsView } from './components/resident/ResidentPaymentsView';
import { ResidentEndorsementsView } from './components/resident/ResidentEndorsementsView';
import { ResidentProfileView } from './components/resident/ResidentProfileView';
import { LandingPage } from './components/public/LandingPage';
import { EmailVerificationModal } from './components/auth/EmailVerificationModal';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [viewLandingPage, setViewLandingPage] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  // Email verification state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyUserId, setVerifyUserId] = useState('');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyDemoCode, setVerifyDemoCode] = useState('');

  // Reset tab to dashboard on role switch
  useEffect(() => {
    setCurrentTab('dashboard');
  }, [user?.role]);

  // If user is not logged in or explicitly requested the public landing page
  if (!user || viewLandingPage) {
    return (
      <>
        <LandingPage
          onEnterApp={() => {
            setViewLandingPage(false);
            setCurrentTab('dashboard');
          }}
          onClose={() => {
            setViewLandingPage(false);
            setCurrentTab('dashboard');
          }}
          onOpenForgotPassword={() => setIsForgotOpen(true)}
        />
        <PasswordResetModal
          isOpen={isForgotOpen}
          onClose={() => setIsForgotOpen(false)}
          onSuccess={() => {
            setIsForgotOpen(false);
            setIsLoginOpen(true);
          }}
          onBackToLogin={() => {
            setIsForgotOpen(false);
            setIsLoginOpen(true);
          }}
        />
        <EmailVerificationModal
          isOpen={verifyModalOpen}
          userId={verifyUserId}
          email={verifyEmail}
          demoCode={verifyDemoCode}
          onClose={() => setVerifyModalOpen(false)}
          onVerified={() => {
            setVerifyModalOpen(false);
            setViewLandingPage(false);
            setCurrentTab('dashboard');
          }}
        />
      </>
    );
  }

  const renderContent = () => {
    if (!user) {
      return (
        <div className="py-20 text-center space-y-4 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Sign In Required</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Please sign in as Admin, Collector, Purok Leader, or Resident to view this municipal portal.
          </p>
          <button
            onClick={() => setIsLoginOpen(true)}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            Open Sign In Dialog
          </button>
        </div>
      );
    }

    const role = user.role;

    // Admin Views
    if (role === 'admin') {
      switch (currentTab) {
        case 'dashboard':
          return <AdminDashboard onNavigate={setCurrentTab} />;
        case 'schedules':
          return <SchedulesManager />;
        case 'monitoring':
          return <MonitoringView />;
        case 'households':
          return <HouseholdsManager />;
        case 'residents':
        case 'staff':
          return <UsersManager />;
        case 'payments':
          return <PaymentVerificationView />;
        case 'endorsements':
          return <EndorsementProcessingView />;
        case 'reports':
          return <ReportsView />;
        case 'announcements':
          return <AnnouncementsManager />;
        case 'settings':
          return <SystemSettingsView />;
        case 'activity-logs':
          return <ActivityLogsView />;
        default:
          return <AdminDashboard onNavigate={setCurrentTab} />;
      }
    }

    // Collector Views
    if (role === 'collector') {
      switch (currentTab) {
        case 'dashboard':
          return <CollectorDashboard onNavigate={setCurrentTab} />;
        case 'assigned-tasks':
          return <CollectorTasks />;
        case 'collection-history':
          return <MonitoringView />;
        case 'schedules':
          return <SchedulesManager />;
        case 'announcements':
          return <AnnouncementsManager />;
        case 'profile':
          return <ResidentProfileView />;
        default:
          return <CollectorDashboard onNavigate={setCurrentTab} />;
      }
    }

    // Leader Views
    if (role === 'leader') {
      switch (currentTab) {
        case 'dashboard':
          return <LeaderDashboard onNavigate={setCurrentTab} />;
        case 'purok-households':
          return <HouseholdsManager />;
        case 'disposal-verification':
          return <DisposalVerificationView />;
        case 'payment-verification':
          return <PaymentVerificationView />;
        case 'endorsement-processing':
          return <EndorsementProcessingView />;
        case 'purok-schedules':
          return <SchedulesManager />;
        case 'announcements':
          return <AnnouncementsManager />;
        case 'profile':
          return <ResidentProfileView />;
        default:
          return <LeaderDashboard onNavigate={setCurrentTab} />;
      }
    }

    // Resident Views
    if (role === 'resident') {
      switch (currentTab) {
        case 'dashboard':
          return <ResidentDashboard onNavigate={setCurrentTab} />;
        case 'resident-schedules':
          return <SchedulesManager />;
        case 'my-disposal':
          return <ResidentDisposalView />;
        case 'contributions':
          return <ResidentPaymentsView />;
        case 'endorsements':
          return <ResidentEndorsementsView />;
        case 'announcements':
          return <AnnouncementsManager />;
        case 'profile':
          return <ResidentProfileView />;
        default:
          return <ResidentDashboard onNavigate={setCurrentTab} />;
      }
    }

    return <AdminDashboard onNavigate={setCurrentTab} />;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-['Public_Sans',sans-serif] transition-colors">
      {/* Top Bar Contract Navigation */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onViewLandingPage={() => setViewLandingPage(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="py-24 text-center text-xs text-neutral-400 dark:text-neutral-500 animate-pulse font-mono">
              Loading Barangay Bang-Bang system records...
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
        onOpenForgotPassword={() => {
          setIsLoginOpen(false);
          setIsForgotOpen(true);
        }}
      />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
        onRequireVerification={(userId, email, demoCode) => {
          setVerifyUserId(userId);
          setVerifyEmail(email);
          setVerifyDemoCode(demoCode || '749201');
          setVerifyModalOpen(true);
        }}
      />
      <PasswordResetModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        onSuccess={() => {
          setIsForgotOpen(false);
          setIsLoginOpen(true);
        }}
        onBackToLogin={() => {
          setIsForgotOpen(false);
          setIsLoginOpen(true);
        }}
      />
      <EmailVerificationModal
        isOpen={verifyModalOpen}
        userId={verifyUserId}
        email={verifyEmail}
        demoCode={verifyDemoCode}
        onClose={() => setVerifyModalOpen(false)}
        onVerified={() => {
          setVerifyModalOpen(false);
          setViewLandingPage(false);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <MainLayout />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
