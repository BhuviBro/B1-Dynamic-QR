import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  QrCode,
  Shield,
  LogOut,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';

export function Navbar({ activePage, setActivePage, onOpenConfig }) {
  const { user, profile, isAdmin, isApproved, logout } = useAuth();

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand" onClick={() => setActivePage('dashboard')}>
            <div className="brand-icon">B1</div>
            <div>
              <span className="brand-text">B1 Cards</span>
              <span className="brand-badge" style={{ marginLeft: 6 }}>
                Admin
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          {user && isApproved && (
            <nav className="nav-links-desktop">
              <button
                className={`nav-btn ${activePage === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActivePage('dashboard')}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>

              <button
                className={`nav-btn ${activePage === 'generate' ? 'active' : ''}`}
                onClick={() => setActivePage('generate')}
              >
                <PlusCircle size={16} />
                Generate Code
              </button>

              <button
                className={`nav-btn ${activePage === 'assign' ? 'active' : ''}`}
                onClick={() => setActivePage('assign')}
              >
                <QrCode size={16} />
                Assign Code
              </button>

              {isAdmin && (
                <button
                  className={`nav-btn ${activePage === 'admin' ? 'active' : ''}`}
                  onClick={() => setActivePage('admin')}
                >
                  <Shield size={16} />
                  Admin Panel
                </button>
              )}
            </nav>
          )}

          {/* User Profile / Status */}
          {user && (
            <div className="user-menu">
              <div className="user-pill">
                <div className="user-avatar">
                  {(profile?.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
                <span className="user-email-text">{profile?.displayName || user.email}</span>
                <StatusBadge status={profile?.role} type="role" />
              </div>

              {onOpenConfig && (
                <button
                  className="nav-btn"
                  onClick={onOpenConfig}
                  title="Firebase Settings"
                  style={{ padding: '6px 8px' }}
                >
                  <Sliders size={16} />
                </button>
              )}

              <button
                className="btn btn-secondary btn-sm"
                onClick={logout}
                title="Sign Out"
                style={{ padding: '6px 10px' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation (Appears on phones) */}
      {user && isApproved && (
        <nav className="bottom-nav">
          <button
            className={`bottom-nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </button>

          <button
            className={`bottom-nav-item ${activePage === 'generate' ? 'active' : ''}`}
            onClick={() => setActivePage('generate')}
          >
            <PlusCircle />
            <span>Generate</span>
          </button>

          <button
            className={`bottom-nav-item ${activePage === 'assign' ? 'active' : ''}`}
            onClick={() => setActivePage('assign')}
          >
            <QrCode />
            <span>Assign</span>
          </button>

          {isAdmin && (
            <button
              className={`bottom-nav-item ${activePage === 'admin' ? 'active' : ''}`}
              onClick={() => setActivePage('admin')}
            >
              <Shield />
              <span>Admin</span>
            </button>
          )}
        </nav>
      )}
    </>
  );
}
