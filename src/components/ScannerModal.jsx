import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { extractCodeFromInput } from '../utils/codeGenerator';

export function ScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [detectedCode, setDetectedCode] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  const scannerInstanceRef = useRef(null);
  const hasScannedRef = useRef(false);
  const onScanSuccessRef = useRef(onScanSuccess);
  const onCloseRef = useRef(onClose);

  // Keep callback refs synchronized without triggering useEffect
  onScanSuccessRef.current = onScanSuccess;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      setDetectedCode('');
      setErrorMsg('');
      setIsInitializing(true);
      hasScannedRef.current = false;
      return;
    }

    hasScannedRef.current = false;
    setDetectedCode('');
    setErrorMsg('');
    setIsInitializing(true);

    let isCancelled = false;

    const startScanner = async () => {
      try {
        // Container must be in DOM
        const container = document.getElementById('qr-reader-container');
        if (!container || isCancelled) return;

        const html5QrCode = new Html5Qrcode('qr-reader-container');
        scannerInstanceRef.current = html5QrCode;

        const config = {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxEdge = Math.floor(minEdge * 0.75);
            return { width: Math.max(180, qrboxEdge), height: Math.max(180, qrboxEdge) };
          },
          aspectRatio: 1.0,
        };

        const handleFrameSuccess = async (decodedText) => {
          if (hasScannedRef.current || isCancelled) return;
          hasScannedRef.current = true;

          const cleanCode = extractCodeFromInput(decodedText);
          if (!cleanCode) {
            // Not a recognized code, allow re-scan after 1.5s
            setTimeout(() => {
              hasScannedRef.current = false;
            }, 1500);
            return;
          }

          // Gentle haptic feedback on mobile devices
          if (navigator.vibrate) {
            try {
              navigator.vibrate(120);
            } catch {}
          }

          setDetectedCode(cleanCode);

          // Gracefully stop the scanner and release camera track
          const instance = scannerInstanceRef.current;
          scannerInstanceRef.current = null;

          if (instance) {
            try {
              if (instance.isScanning) {
                await instance.stop();
              }
            } catch (stopErr) {
              console.warn('Scanner stop notice:', stopErr);
            }
            try {
              instance.clear();
            } catch {}
          }

          // Provide smooth visual confirmation before closing modal
          setTimeout(() => {
            if (!isCancelled && onScanSuccessRef.current) {
              onScanSuccessRef.current(cleanCode);
            }
          }, 350);
        };

        // Try rear (environment) camera first; if unavailable, try default/user camera
        try {
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            handleFrameSuccess,
            () => {} // Frame error callback (ignored)
          );
        } catch (envErr) {
          console.warn('Rear camera unavailable, falling back to front camera:', envErr);
          if (!isCancelled) {
            await html5QrCode.start(
              { facingMode: 'user' },
              config,
              handleFrameSuccess,
              () => {}
            );
          }
        }

        if (!isCancelled) {
          setIsInitializing(false);
        }
      } catch (err) {
        console.error('Camera init error:', err);
        if (!isCancelled) {
          setIsInitializing(false);
          const isPerm = err?.message?.toLowerCase().includes('permission') ||
                         err?.name?.includes('NotAllowedError');
          setErrorMsg(
            isPerm
              ? 'Camera access was denied. Please allow camera permissions in your browser or type the card code manually.'
              : 'Unable to start camera stream. Please ensure no other app is using the camera, or enter the code manually.'
          );
        }
      }
    };

    // Small delay to ensure the modal DOM element has mounted
    const timer = setTimeout(startScanner, 180);

    return () => {
      isCancelled = true;
      clearTimeout(timer);

      const instance = scannerInstanceRef.current;
      scannerInstanceRef.current = null;

      if (instance) {
        try {
          if (instance.isScanning) {
            instance.stop().catch(() => {}).finally(() => {
              try { instance.clear(); } catch {}
            });
          } else {
            try { instance.clear(); } catch {}
          }
        } catch {}
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 380, padding: '24px 20px' }}
      >
        <div className="modal-header" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={20} color="#38bdf8" />
            <h3 className="modal-title" style={{ fontSize: 18 }}>Scan Physical Card QR</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Point your camera at the QR code on the back of the card.
          </p>

          {/* Scanner Viewfinder Box */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 300,
              minHeight: 280,
              margin: '0 auto 16px',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#090d16',
              border: detectedCode
                ? '2px solid #10b981'
                : '2px solid rgba(56, 189, 248, 0.4)',
              boxShadow: detectedCode
                ? '0 0 24px rgba(16, 185, 129, 0.4)'
                : '0 0 20px rgba(56, 189, 248, 0.15)',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* The HTML5QrCode injects video and canvas elements inside here */}
            <div
              id="qr-reader-container"
              style={{
                width: '100%',
                height: '100%',
                display: detectedCode ? 'none' : 'block',
              }}
            />

            {/* Initializing Spinner */}
            {isInitializing && !errorMsg && !detectedCode && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(9, 13, 22, 0.85)',
                  gap: 12,
                  zIndex: 2,
                }}
              >
                <Loader2 size={28} className="spin-animation" color="#38bdf8" />
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Starting camera...</span>
              </div>
            )}

            {/* Instant Scanned Code Success Overlay */}
            {detectedCode && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(9, 13, 22, 0.95)',
                  padding: 20,
                  zIndex: 10,
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                    marginBottom: 12,
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Card Detected
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '2px',
                    color: '#38bdf8',
                    margin: '6px 0 10px',
                  }}
                >
                  {detectedCode}
                </div>
                <span style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 size={13} className="spin-animation" /> Loading card details...
                </span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div
              className="notice-banner notice-banner-warning"
              style={{ textAlign: 'left', marginBottom: 16 }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13 }}>{errorMsg}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {errorMsg ? (
              <button
                type="button"
                className="btn btn-secondary btn-full"
                onClick={() => {
                  setErrorMsg('');
                  setIsInitializing(true);
                  // Trigger restart
                  setTimeout(() => {
                    hasScannedRef.current = false;
                  }, 50);
                }}
              >
                <RefreshCw size={14} /> Retry Camera
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={onClose}
            >
              Cancel / Type Manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
