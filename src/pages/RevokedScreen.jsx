import React from 'react';
import { Ban, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function RevokedScreen() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 440, margin: '60px auto 0', padding: '0 8px', textAlign: 'center' }}>
      <div className="card-panel" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#f87171',
          }}
        >
          <Ban size={32} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#f87171' }}>
          Access Suspended
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Access for <strong>{user?.email}</strong> has been revoked by an administrator. Please reach out to your team lead if you believe this is in error.
        </p>

        <button className="btn btn-secondary btn-full" onClick={logout}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
