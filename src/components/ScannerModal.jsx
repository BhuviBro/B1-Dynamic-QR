import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';
import { extractCodeFromInput } from '../utils/codeGenerator';

export function ScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [errorMsg, setErrorMsg] = useState('');
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode = null;
    let isStopped = false;

    const startScanner = async () => {
      setErrorMsg('');
      try {
        html5QrCode = new Html5Qrcode('qr-reader-container');
        scannerInstanceRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (isStopped) return;
            isStopped = true;

            const detectedCode = extractCodeFromInput(decodedText);
            if (detectedCode) {
              // Try gentle haptic feedback on mobile devices
              if (navigator.vibrate) {
                try {
                  navigator.vibrate(100);
                } catch {}
              }

              html5QrCode
                .stop()
                .then(() => {
                  onScanSuccess(detectedCode);
                })
                .catch((e) => {
                  console.warn('Error stopping scanner:', e);
                  onScanSuccess(detectedCode);
                });
            }
          },
          () => {
            // Frame callback (no QR code found in current frame, ignore)
          }
        );
      } catch (err) {
        console.error('Camera init error:', err);
        setErrorMsg(
          err?.message?.includes('Permission')
            ? 'Camera access was denied. Please allow camera permissions in your browser or enter the code manually.'
            : 'Unable to start camera. Please ensure no other app is using it or enter the code manually.'
        );
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(startScanner, 150);

    return () => {
      clearTimeout(timer);
      isStopped = true;
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerInstanceRef.current = null;
          });
      }
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={20} color="#38bdf8" />
            <h3 className="modal-title">Scan Physical Card QR</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
            Point your phone camera at the QR code on the physical B1 card.
          </p>

          <div
            id="qr-reader-container"
            style={{
              width: '100%',
              maxWidth: 320,
              minHeight: 280,
              margin: '0 auto 16px',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#000',
              border: '2px solid rgba(56, 189, 248, 0.4)',
            }}
          />

          {errorMsg && (
            <div
              className="notice-banner notice-banner-warning"
              style={{ textAlign: 'left', marginBottom: 16 }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-full" onClick={onClose}>
              Cancel / Type Manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
