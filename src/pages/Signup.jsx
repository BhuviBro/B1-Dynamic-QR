import React, { useState } from 'react';
import { UserPlus, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon } from '../components/GoogleIcon';

export function Signup({ onGoToLogin }) {
  const { signup, loginWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google sign-up error:', err);
      let message = err.message;
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'Google sign-up was closed before completing.';
      } else if (err.code === 'auth/popup-blocked') {
        message = 'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'Google Sign-in is not yet enabled in Firebase Console. Enable "Google" under Authentication > Sign-in method.';
      }
      setError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, fullName);
      // Auth state will automatically switch to waiting approval screen
    } catch (err) {
      console.error('Signup error:', err);
      let msg = err.message;
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Try signing in.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: '40px auto 0', padding: '0 8px' }}>
      <div className="card-panel" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={onGoToLogin}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </button>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            className="brand-icon"
            style={{ width: 52, height: 52, fontSize: 20, margin: '0 auto 12px', borderRadius: 14 }}
          >
            B1
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Request Access</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Create an account to manage NFC & QR business cards.
          </p>
        </div>

        <div className="notice-banner notice-banner-info">
          <Shield size={18} style={{ flexShrink: 0, color: '#38bdf8' }} />
          <div>
            <strong>Approval Required:</strong> New accounts remain in pending status until reviewed and approved by an administrator.
          </div>
        </div>

        {error && (
          <div className="notice-banner" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: '#f87171' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {/* Continue with Google */}
        <button
          type="button"
          className="btn btn-secondary btn-full btn-lg"
          onClick={handleGoogleSignUp}
          disabled={googleLoading || loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: 14,
            padding: '12px 16px',
            borderRadius: 12,
            transition: 'all 0.2s ease',
          }}
        >
          <GoogleIcon size={18} />
          {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              fontWeight: 600,
            }}
          >
            or register with email
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Alex Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Work Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password (min 6 chars)</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            <UserPlus size={18} />
            {loading ? 'Submitting Request...' : 'Submit Access Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
