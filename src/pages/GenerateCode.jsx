import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  PlusCircle,
  QrCode,
  ArrowRight,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateCard } from '../firebase/cardService';
import { getCardRedirectUrl } from '../utils/codeGenerator';

export function GenerateCode({ onNavigateToAssign }) {
  const { user, profile } = useAuth();
  const [currentCard, setCurrentCard] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [recentBatch, setRecentBatch] = useState([]);
  const [batchCount, setBatchCount] = useState(1);
  const [batchLoading, setBatchLoading] = useState(false);

  // Render QR when currentCard changes
  useEffect(() => {
    if (!currentCard) return;

    const url = getCardRedirectUrl(currentCard.code);
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((dataUri) => {
        setQrDataUrl(dataUri);
      })
      .catch((err) => console.error('QR rendering error:', err));
  }, [currentCard]);

  // One-tap generation
  const handleGenerateOne = async () => {
    setLoading(true);
    setCopiedLink(false);
    setCopiedCode(false);

    try {
      const newCard = await generateCard({ user, profile });
      setCurrentCard(newCard);
      setRecentBatch((prev) => [newCard, ...prev]);
    } catch (err) {
      console.error('Failed to generate card:', err);
      alert('Error generating code: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Optional Bulk Generation for manufacturing runs
  const handleGenerateBatch = async () => {
    if (batchCount < 1) return;
    setBatchLoading(true);

    try {
      const generated = [];
      for (let i = 0; i < batchCount; i++) {
        const card = await generateCard({ user, profile });
        generated.push(card);
      }
      setCurrentCard(generated[0]);
      setRecentBatch((prev) => [...generated, ...prev]);
    } catch (err) {
      console.error('Batch generation error:', err);
      alert('Error during batch generation: ' + err.message);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!currentCard) return;
    const url = getCardRedirectUrl(currentCard.code);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      prompt('Copy URL:', url);
    }
  };

  const handleCopyCode = async () => {
    if (!currentCard) return;
    try {
      await navigator.clipboard.writeText(currentCard.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleDownloadPNG = (cardToDownload = currentCard) => {
    if (!cardToDownload || !qrDataUrl) return;

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

      // Label & Card Code
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`B1 • ${cardToDownload.code}`, canvas.width / 2, qrSize + padding + 40);

      // Subtitle
      ctx.fillStyle = '#64748b';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Scan to connect', canvas.width / 2, qrSize + padding + 68);

      const downloadLink = document.createElement('a');
      downloadLink.download = `B1-Card-${cardToDownload.code}.png`;
      downloadLink.href = canvas.toDataURL('image/png');
      downloadLink.click();
    };

    img.src = qrDataUrl;
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
          Generate Blank QR Code
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Generate unique 6-character codes for printing physical cards or encoding NFC tags before selling.
        </p>
      </div>

      {/* Main One-Tap Action */}
      <div className="card-panel" style={{ textAlign: 'center', marginBottom: 24 }}>
        {!currentCard ? (
          <div style={{ padding: '24px 8px' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(124,58,237,0.2))',
                border: '1px solid rgba(59,130,246,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#38bdf8',
              }}
            >
              <QrCode size={36} />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Ready to Produce Cards
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: 14,
                maxWidth: 420,
                margin: '0 auto 24px',
                lineHeight: 1.5,
              }}
            >
              Tap below to instantly generate a unique blank code. The QR code is rendered immediately with high-resolution PNG download for your print shop.
            </p>

            <button
              className="btn btn-primary btn-lg"
              style={{ minWidth: 240, fontSize: 16 }}
              onClick={handleGenerateOne}
              disabled={loading}
            >
              <Sparkles size={18} />
              {loading ? 'Generating Code...' : 'One-Tap Generate Code'}
            </button>
          </div>
        ) : (
          /* Live Rendered Card & QR Result */
          <div>
            <div style={{ display: 'inline-block', marginBottom: 12 }}>
              <span className="badge-pill badge-unassigned">
                <Clock size={12} /> Ready for Printing / Flashing
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '2px',
                  color: '#38bdf8',
                }}
              >
                {currentCard.code}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopyCode}
                title="Copy Code"
              >
                {copiedCode ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* QR Canvas Preview */}
            <div className="qr-preview-box">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR for ${currentCard.code}`}
                  style={{ width: 220, height: 220, borderRadius: 8 }}
                />
              ) : (
                <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Loading QR...
                </div>
              )}
              <div className="qr-caption">{currentCard.code}</div>
            </div>

            {/* Redirection Link */}
            <div style={{ margin: '14px 0 20px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Physical Card URL Target:
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  color: '#93c5fd',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  display: 'inline-block',
                  maxWidth: '100%',
                  wordBreak: 'break-all',
                }}
              >
                {getCardRedirectUrl(currentCard.code)}
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 10,
                maxWidth: 480,
                margin: '0 auto 16px',
              }}
            >
              <button className="btn btn-primary" onClick={() => handleDownloadPNG(currentCard)}>
                <Download size={16} /> Download PNG
              </button>

              <button className="btn btn-secondary" onClick={handleCopyLink}>
                {copiedLink ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                {copiedLink ? 'Link Copied!' : 'Copy Link'}
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                marginTop: 18,
                paddingTop: 18,
                borderTop: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={handleGenerateOne}
                disabled={loading}
              >
                <PlusCircle size={16} /> Generate Another
              </button>

              <button
                className="btn btn-success"
                onClick={() => onNavigateToAssign(currentCard.code)}
              >
                Assign Card Now <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Batch Generation Utility Box */}
      <div className="card-panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={18} color="#818cf8" /> Bulk Batch Generation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
              Generate multiple blank codes in bulk for production print sheets.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              className="form-select"
              value={batchCount}
              onChange={(e) => setBatchCount(Number(e.target.value))}
              style={{ width: 'auto', padding: '8px 12px' }}
            >
              <option value={5}>5 Cards</option>
              <option value={10}>10 Cards</option>
              <option value={20}>20 Cards</option>
            </select>

            <button
              className="btn btn-secondary"
              onClick={handleGenerateBatch}
              disabled={batchLoading}
            >
              {batchLoading ? 'Generating...' : `Generate Batch`}
            </button>
          </div>
        </div>
      </div>

      {/* Session History */}
      {recentBatch.length > 0 && (
        <div className="card-panel">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            Recently Generated In This Session ({recentBatch.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {recentBatch.map((c) => (
              <button
                key={c.code}
                onClick={() => setCurrentCard(c)}
                style={{
                  background: currentCard?.code === c.code ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${currentCard?.code === c.code ? '#38bdf8' : 'var(--border-subtle)'}`,
                  color: currentCard?.code === c.code ? '#38bdf8' : 'var(--text-main)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {c.code}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
