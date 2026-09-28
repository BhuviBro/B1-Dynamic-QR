import React from 'react';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function WaitingApproval() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 440, margin: '60px auto 0', padding: '0 8px', textAlign: 'center' }}>
      <div className="card-panel" style={{ border: '1px solid rgba(245, 158, 11, 0.25)' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#fbbf24',
          }}
        >
          <Clock size={32} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          Waiting for Approval
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          Your account request has been submitted and is currently in review. An administrator must approve your access before you can generate or assign B1 Cards.
        </p>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '14px 16px',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            textAlign: 'left',
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 2 }}>Account Email:</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{user?.email}</div>

          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 10, marginBottom: 2 }}>Current Status:</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: 13, fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
            Pending Administrator Approval
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 20 }}>
          This screen updates automatically in real-time once your request is approved.
        </p>

        <button className="btn btn-secondary btn-full" onClick={logout}>
          <LogOut size={16} /> Sign Out / Switch Account
        </button>
      </div>
    </div>
  );
}
