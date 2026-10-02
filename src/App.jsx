import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { WaitingApproval } from './pages/WaitingApproval';
import { RevokedScreen } from './pages/RevokedScreen';
import { Dashboard } from './pages/Dashboard';
import { GenerateCode } from './pages/GenerateCode';
import { AssignCode } from './pages/AssignCode';
import { AdminPanel } from './pages/AdminPanel';
import { PublicRedirectFallback } from './pages/PublicRedirectFallback';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { user, loading, isAdmin, isPending, isRevoked } = useAuth();

  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard' | 'generate' | 'assign' | 'admin'
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [assignCodeTarget, setAssignCodeTarget] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Check if current browser URL is a public redirect like /c/:code
  const pathname = window.location.pathname;
  const publicCodeMatch = pathname.match(/^\/c\/([a-zA-Z0-9]{6})(?:[/?#]|$)/i);
  if (publicCodeMatch && publicCodeMatch[1]) {
    return <PublicRedirectFallback code={publicCodeMatch[1].toUpperCase()} />;
  }

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="brand-icon"
            style={{ width: 56, height: 56, margin: '0 auto 16px', fontSize: 24 }}
          >
            B1
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading B1 Cards...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated: Show Login or Signup
  if (!user) {
    return (
      <div className="app-container">
        <main className="main-content">
          {authView === 'login' ? (
            <Login
              onGoToSignup={() => setAuthView('signup')}
              onOpenConfig={() => setIsConfigModalOpen(true)}
            />
          ) : (
            <Signup onGoToLogin={() => setAuthView('login')} />
          )}
        </main>
        <FirebaseConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
        />
      </div>
    );
  }

  // Revoked access
  if (isRevoked) {
    return (
      <div className="app-container">
        <RevokedScreen />
      </div>
    );
  }

  // Pending approval
  if (isPending) {
    return (
      <div className="app-container">
        <WaitingApproval />
      </div>
    );
  }

  // Approved user or admin
  const handleNavigateToAssign = (code = '') => {
    setAssignCodeTarget(code);
    setActivePage('assign');
  };

  return (
    <div className="app-container">
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenConfig={() => setIsConfigModalOpen(true)}
      />

      <main className="main-content">
        {activePage === 'dashboard' && (
          <Dashboard
            onNavigateToGenerate={() => setActivePage('generate')}
            onNavigateToAssign={handleNavigateToAssign}
          />
        )}

        {activePage === 'generate' && (
          <GenerateCode onNavigateToAssign={handleNavigateToAssign} />
        )}

        {activePage === 'assign' && (
          <AssignCode
            initialCode={assignCodeTarget}
            onClearInitialCode={() => setAssignCodeTarget('')}
          />
        )}

        {activePage === 'admin' && (
          isAdmin ? (
            <AdminPanel onNavigateToAssign={handleNavigateToAssign} />
          ) : (
            <Dashboard
              onNavigateToGenerate={() => setActivePage('generate')}
              onNavigateToAssign={handleNavigateToAssign}
            />
          )
        )}
      </main>

      <FirebaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
