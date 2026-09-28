import React, { useState } from 'react';
import { X, CheckCircle, Database, Sparkles, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
} from '../firebase/config';

export function FirebaseConfigModal({ isOpen, onClose }) {
  const { isConfigured, configSource, switchMockUser, user } = useAuth();
  const [configJson, setConfigJson] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSaveJson = (e) => {
    e.preventDefault();
    setError('');

    try {
      // Allow pasting either raw JSON or JavaScript object format from Firebase Console
      let clean = configJson.trim();
      if (clean.startsWith('const firebaseConfig =')) {
        clean = clean.replace(/const firebaseConfig\s*=\s*/, '').replace(/;$/, '');
      }

      // If keys are not quoted, convert simple JS object to JSON
      if (!clean.startsWith('{')) {
        throw new Error('Please paste a valid Firebase configuration object starting with { and ending with }');
      }

      // Parse JSON
      const parsed = JSON.parse(clean);
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('Config must contain at least "apiKey" and "projectId"');
      }

      saveCustomFirebaseConfig(parsed);
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid JSON format. Please ensure valid quotes.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={20} color="#38bdf8" />
            <h3 className="modal-title">Firebase & Backend Settings</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Current Connection Status */}
        <div
          style={{
            background: isConfigured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${isConfigured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            {isConfigured ? (
              <>
                <CheckCircle size={18} color="#34d399" />
                <span style={{ color: '#34d399' }}>Live Firebase Connected ({configSource})</span>
              </>
            ) : (
              <>
                <Sparkles size={18} color="#fbbf24" />
                <span style={{ color: '#fbbf24' }}>Interactive Preview / Demo Mode</span>
              </>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            {isConfigured
              ? 'Your frontend is directly syncing with Firebase Auth and Cloud Firestore.'
              : 'Using local storage data simulation. You can create cards, assign codes, scan QR codes, and approve users with instant state.'}
          </p>
        </div>

        {/* Quick Role Switcher for Rapid Testing */}
        <div style={{ marginBottom: 24 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="#818cf8" />
            Quick Switch Test Accounts (Interactive Simulation):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
            <button
              type="button"
              className={`btn btn-sm ${user?.email === 'admin@b1cards.com' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                switchMockUser('admin@b1cards.com');
                onClose();
              }}
            >
              Admin Role
            </button>
            <button
              type="button"
              className={`btn btn-sm ${user?.email === 'alex.sales@b1cards.com' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                switchMockUser('alex.sales@b1cards.com');
                onClose();
              }}
            >
              Approved Rep
            </button>
            <button
              type="button"
              className={`btn btn-sm ${user?.email === 'sarah.new@b1cards.com' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                switchMockUser('sarah.new@b1cards.com');
                onClose();
              }}
            >
              Pending User
            </button>
          </div>
        </div>

        {/* Connect Live Firebase Form */}
        <form onSubmit={handleSaveJson}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Key size={14} /> Connect Custom Firebase Config (Optional):
          </label>
          <textarea
            className="form-textarea"
            rows={5}
            placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-project.firebaseapp.com",\n  "projectId": "my-project"\n}`}
            value={configJson}
            onChange={(e) => setConfigJson(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
          {error && (
            <div style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Save & Connect Live
            </button>
            {localStorage.getItem('b1_firebase_custom_config') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={clearCustomFirebaseConfig}
              >
                Reset to Default
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
