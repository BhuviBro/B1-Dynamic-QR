import React, { useState } from 'react';
import { LogIn, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon } from '../components/GoogleIcon';

export function Login({ onGoToSignup, onOpenConfig }) {
  const { login, loginWithGoogle, switchMockUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google sign in error:', err);
      let message = err.message;
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'Google sign-in was closed before completing.';
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
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      console.error('Login error:', err);
      let message = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please verify and try again.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    switchMockUser(demoEmail);
  };

  return (
    <div style={{ maxWidth: 440, margin: '40px auto 0', padding: '0 8px' }}>
      <div className="card-panel" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            className="brand-icon"
            style={{ width: 56, height: 56, fontSize: 24, margin: '0 auto 14px', borderRadius: 16 }}
          >
            B1
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>B1 Cards</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Smart NFC & QR Card Management
          </p>
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
          onClick={handleGoogleSignIn}
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
            or sign in with email
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Need an account? </span>
          <button
            type="button"
            onClick={onGoToSignup}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Request Access
          </button>
        </div>

        {/* Demo Fast Login Bar */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={13} color="#818cf8" />
              Demo Quick Sign-In:
            </span>
            <button
              onClick={onOpenConfig}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: 11,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Backend Config
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 11, padding: '6px 4px' }}
              onClick={() => handleQuickLogin('admin@b1cards.com')}
            >
              Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 11, padding: '6px 4px' }}
              onClick={() => handleQuickLogin('alex.sales@b1cards.com')}
            >
              Approved Rep
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 11, padding: '6px 4px' }}
              onClick={() => handleQuickLogin('sarah.new@b1cards.com')}
            >
              Pending User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
