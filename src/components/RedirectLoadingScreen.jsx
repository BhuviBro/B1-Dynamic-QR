import React, { useState, useEffect } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';

export function RedirectLoadingScreen({ code, businessName, targetUrl }) {
  const [showManualLink, setShowManualLink] = useState(false);

  // If redirect takes more than 2 seconds, display a direct tap button
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowManualLink(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 35%, #131d35 0%, #080c14 75%, #04060a 100%)',
        color: '#f8fafc',
        padding: '24px 20px',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      {/* Background Ambient Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(124, 58, 237, 0.12) 50%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Radar Rings & Glowing Monogram */}
        <div
          style={{
            position: 'relative',
            width: 140,
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          {/* Radar Ring 1 (Outer) */}
          <div
            style={{
              position: 'absolute',
              inset: -20,
              borderRadius: '50%',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              animation: 'radarPulse 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
            }}
          />

          {/* Radar Ring 2 (Middle) */}
          <div
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: '50%',
              border: '1.5px solid rgba(124, 58, 237, 0.45)',
              animation: 'radarPulse 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite 0.7s',
            }}
          />

          {/* Center B1 Glowing Badge */}
          <div
            style={{
              position: 'relative',
              width: 84,
              height: 84,
              borderRadius: 26,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 35px rgba(37, 99, 235, 0.5), 0 10px 25px rgba(0, 0, 0, 0.6)',
              border: '2px solid rgba(255, 255, 255, 0.25)',
              animation: 'subtleFloat 3s ease-in-out infinite',
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-1px',
                lineHeight: 1,
              }}
            >
              B1
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '1.5px',
                color: 'rgba(255, 255, 255, 0.8)',
                marginTop: 3,
                textTransform: 'uppercase',
              }}
            >
              CARDS
            </span>
          </div>
        </div>

        {/* Live Status Header */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.3px',
            color: '#ffffff',
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          {businessName ? `Connecting to ${businessName}...` : 'Connecting to Destination...'}
        </h1>

        <p
          style={{
            fontSize: 14,
            color: '#94a3b8',
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Smart NFC & QR dynamic redirection
        </p>

        {/* Card Code Pill */}
        {code && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 9999,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#34d399',
                boxShadow: '0 0 8px #34d399',
                display: 'inline-block',
                animation: 'pulseDot 1.8s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 13,
                fontWeight: 700,
                color: '#38bdf8',
                letterSpacing: '1.5px',
              }}
            >
              {code.toUpperCase()}
            </span>
          </div>
        )}

        {/* Shimmering Progress Bar */}
        <div
          style={{
            width: '100%',
            maxWidth: 240,
            height: 4,
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 9999,
            overflow: 'hidden',
            position: 'relative',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '50%',
              background: 'linear-gradient(90deg, transparent, #38bdf8, #818cf8, transparent)',
              borderRadius: 9999,
              animation: 'shimmerBar 1.6s ease-in-out infinite',
            }}
          />
        </div>

        {/* Manual Redirect Fallback Button (visible if redirect takes > 2s) */}
        {showManualLink && targetUrl && (
          <div style={{ marginTop: 8, animation: 'fadeIn 0.3s ease' }}>
            <a
              href={targetUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 12,
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Tap here to open link <ArrowRight size={14} />
            </a>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 32,
            fontSize: 11,
            color: '#64748b',
            letterSpacing: '0.5px',
          }}
        >
          B1 Cards • Contactless Smart Platform
        </div>
      </div>

      {/* Embedded Keyframe Animations */}
      <style>{`
        @keyframes radarPulse {
          0% {
            transform: scale(0.8);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.35);
            opacity: 0.35;
          }
          100% {
            transform: scale(1.95);
            opacity: 0;
          }
        }

        @keyframes subtleFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes pulseDot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.85);
          }
        }

        @keyframes shimmerBar {
          0% {
            left: -50%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
