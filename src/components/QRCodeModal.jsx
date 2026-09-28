import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, ExternalLink, QrCode } from 'lucide-react';
import { getCardRedirectUrl } from '../utils/codeGenerator';

export function QRCodeModal({ card, onClose, onAssign }) {
  const [dataUrl, setDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const code = card?.code?.toUpperCase() || '';
  const redirectUrl = code ? getCardRedirectUrl(code) : '';

  useEffect(() => {
    let isMounted = true;
    if (!redirectUrl) return;

    async function generateHQQR() {
      try {
        const url = await QRCode.toDataURL(redirectUrl, {
          width: 512,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });
        if (isMounted) setDataUrl(url);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    }

    generateHQQR();
    return () => {
      isMounted = false;
    };
  }, [redirectUrl]);

  if (!card) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(redirectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copy card URL:', redirectUrl);
    }
  };

  const handleDownloadPNG = () => {
    if (!dataUrl) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const qrSize = 512;
      const padding = 40;
      const textHeight = 70;

      canvas.width = qrSize + padding * 2;
      canvas.height = qrSize + padding * 2 + textHeight;

      // Clean white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR
      ctx.drawImage(img, padding, padding, qrSize, qrSize);

      // Draw Code Text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`B1 • ${code}`, canvas.width / 2, qrSize + padding + 40);

      // Draw Subtitle
      ctx.fillStyle = '#64748b';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Scan to connect', canvas.width / 2, qrSize + padding + 68);

      // Export
      const downloadLink = document.createElement('a');
      downloadLink.download = `B1-Card-${code}.png`;
      downloadLink.href = canvas.toDataURL('image/png');
      downloadLink.click();
    };

    img.src = dataUrl;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <QrCode size={20} color="#38bdf8" />
            <h3 className="modal-title">QR Code & Link</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="qr-preview-box">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt={`QR code for ${code}`}
                style={{ width: 220, height: 220, borderRadius: 8 }}
              />
            ) : (
              <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#64748b' }}>Generating QR...</span>
              </div>
            )}
            <div className="qr-caption">{code}</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
              Public NFC/QR Redirection URL:
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.08)',
                padding: '8px 12px',
                borderRadius: 8,
                wordBreak: 'break-all',
                border: '1px solid rgba(56, 189, 248, 0.2)',
              }}
            >
              {redirectUrl}
            </div>
          </div>

          {card.status === 'assigned' && card.url && (
            <div
              style={{
                marginBottom: 20,
                textAlign: 'left',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: 12,
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Target Business / Review Link:</div>
              <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: 2 }}>{card.businessName}</div>
              <a
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  color: '#60a5fa',
                  marginTop: 4,
                  wordBreak: 'break-all',
                }}
              >
                {card.url} <ExternalLink size={12} />
              </a>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary btn-full" onClick={handleDownloadPNG}>
              <Download size={16} /> Download High-Res PNG
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button className="btn btn-secondary" onClick={handleCopyLink}>
                {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>

              <a
                href={redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <ExternalLink size={16} /> Test Redirect
              </a>
            </div>

            {onAssign && (
              <button
                className="btn btn-secondary"
                style={{ marginTop: 6, borderColor: 'rgba(56, 189, 248, 0.3)' }}
                onClick={() => {
                  onClose();
                  onAssign(card);
                }}
              >
                {card.status === 'assigned' ? 'Edit Assignment Details' : 'Assign Card Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
