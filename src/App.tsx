import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './services/authContext';
import { AuthView } from './components/AuthView';
import { Navbar } from './components/Navbar';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { ChildrenRegisterView } from './components/ChildrenRegisterView';
import { BirthdayView } from './components/BirthdayView';
import { AttendanceView } from './components/AttendanceView';
import { TeamManagementView } from './components/TeamManagementView';
import { BirthdayEmailDigestView } from './components/BirthdayEmailDigestView';
import { AuditTrailView } from './components/AuditTrailView';
import { AccountView } from './components/AccountView';
import { AddChildModal } from './components/AddChildModal';
import { ImportChildrenModal } from './components/ImportChildrenModal';
import { BirthdayAlertModal } from './components/BirthdayAlertModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { NotificationService } from './services/notificationService';
import { StorageService } from './services/storage';
import { Child } from './types';
import { Church, ShieldCheck, Heart } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isApproved, isAdmin, activeBranch } = useAuth();
  
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeCelebrantsAlert, setActiveCelebrantsAlert] = useState<{ child: Child; age: number }[] | null>(null);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);

  // Automated Birthday Alert Detection Effect
  useEffect(() => {
    if (!isAuthenticated || !isApproved) return;

    const runAutomatedBirthdayCheck = () => {
      const allChildren = StorageService.getChildren();
      // Filter for active church branch
      const branchChildren = allChildren.filter(c => c.branch === activeBranch);
      
      const unannounced = NotificationService.checkAndGetUnannouncedBirthdays(branchChildren);
      
      if (unannounced.length > 0) {
        const settings = NotificationService.getSettings();

        // 1. Dispatch desktop browser push notification if enabled
        if (settings.desktopPushEnabled) {
          unannounced.forEach(({ child, age }) => {
            NotificationService.sendDesktopPush(child, age);
          });
        }

        // 2. Dispatch in-app celebration alert modal if enabled
        if (settings.inAppAlertsEnabled) {
          setActiveCelebrantsAlert(unannounced);
        }

        // Mark as alerted today so user is not repeatedly interrupted
        unannounced.forEach(({ child }) => {
          NotificationService.markAlertedToday(child.id);
        });
      }
    };

    // Run check immediately on mount or branch change
    runAutomatedBirthdayCheck();

    // Check periodically every 20 minutes
    const interval = setInterval(runAutomatedBirthdayCheck, 20 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isApproved, activeBranch]);

  // If not authenticated or pending approval, show AuthView
  if (!isAuthenticated || !isApproved) {
    return <AuthView />;
  }

  // Handle views restricted to admin
  const handleNavigate = (view: string) => {
    if ((view === 'team' || view === 'email-digest' || view === 'audit-trail') && !isAdmin) {
      setCurrentView('dashboard');
      return;
    }
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      
      {/* Top Navbar */}
      <Navbar onNavigate={handleNavigate} currentView={currentView} />

      {/* Sub Navigation Bar */}
      <Navigation
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAddChild={isAdmin ? () => setIsAddChildOpen(true) : undefined}
        onOpenImport={isAdmin ? () => setIsImportOpen(true) : undefined}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && (
          <DashboardView
            onNavigate={handleNavigate}
            onOpenAddChild={() => setIsAddChildOpen(true)}
            onOpenImport={() => setIsImportOpen(true)}
          />
        )}

        {currentView === 'children' && (
          <ChildrenRegisterView
            onOpenAddChild={() => setIsAddChildOpen(true)}
            onOpenImport={() => setIsImportOpen(true)}
          />
        )}

        {currentView === 'birthdays' && <BirthdayView />}

        {currentView === 'attendance' && <AttendanceView />}

        {currentView === 'team' && isAdmin && <TeamManagementView />}

        {currentView === 'audit-trail' && isAdmin && <AuditTrailView />}

        {currentView === 'email-digest' && isAdmin && <BirthdayEmailDigestView />}

        {currentView === 'account' && <AccountView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="w-5 h-5 object-contain rounded-md border border-slate-200"
            />
            <span className="font-semibold text-slate-700">The Shelter Junior Church Records</span>
            <span>•</span>
            <span>Branches: Shelter Okota, Community Church, Anthony Church</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Role-Based Safeguarding Active</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Add Child Modal */}
      {isAddChildOpen && (
        <AddChildModal
          isOpen={isAddChildOpen}
          onClose={() => setIsAddChildOpen(false)}
          onChildAdded={() => {
            // Force re-render or notification if needed
          }}
        />
      )}

      {/* Import Children Modal */}
      {isImportOpen && (
        <ImportChildrenModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImportComplete={() => {
            // Force re-render if needed
          }}
        />
      )}

      {/* Automated In-App Birthday Alert Modal */}
      {activeCelebrantsAlert && (
        <BirthdayAlertModal
          celebrants={activeCelebrantsAlert}
          onDismiss={() => setActiveCelebrantsAlert(null)}
          onNavigateToChild={(childId) => {
            setCurrentView('children');
          }}
          onOpenSettings={() => {
            setActiveCelebrantsAlert(null);
            setIsNotificationSettingsOpen(true);
          }}
        />
      )}

      {/* Notification Settings Modal */}
      {isNotificationSettingsOpen && (
        <NotificationSettingsModal
          isOpen={isNotificationSettingsOpen}
          onClose={() => setIsNotificationSettingsOpen(false)}
        />
      )}

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
