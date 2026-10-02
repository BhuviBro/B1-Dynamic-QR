import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'radial-gradient(circle at 50% 20%, #151d30 0%, #080c14 100%)',
            color: '#f8fafc',
          }}
        >
          <div
            className="card-panel"
            style={{
              maxWidth: 440,
              textAlign: 'center',
              padding: '36px 24px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(18, 25, 41, 0.85)',
              backdropFilter: 'blur(16px)',
              borderRadius: 20,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                marginBottom: 16,
              }}
            >
              <AlertCircle size={32} />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
              The application encountered an unexpected issue while interacting with the camera or rendering state.
            </p>

            {this.state.error?.message && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontFamily: 'ui-monospace, monospace',
                  color: '#fca5a5',
                  marginBottom: 20,
                  textAlign: 'left',
                  wordBreak: 'break-all',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary btn-full"
                onClick={this.handleReset}
              >
                <Home size={16} /> Return to Home
              </button>
              <button
                className="btn btn-primary btn-full"
                onClick={this.handleReload}
              >
                <RefreshCw size={16} /> Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
