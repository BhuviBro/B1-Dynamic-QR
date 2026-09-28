import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
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
  FileSpreadsheet,
  CheckCircle2,
  Archive,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateCard, generateBatchCards } from '../firebase/cardService';
import { getCardRedirectUrl } from '../utils/codeGenerator';

export function GenerateCode({ onNavigateToAssign }) {
  const { user, profile } = useAuth();
  const [currentCard, setCurrentCard] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAllCodes, setCopiedAllCodes] = useState(false);
  const [recentBatch, setRecentBatch] = useState([]);
  const [batchCount, setBatchCount] = useState(5);
  const [batchLoading, setBatchLoading] = useState(false);
  const [lastBatchResult, setLastBatchResult] = useState(null);
  const [zippingProgress, setZippingProgress] = useState('');

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

  // One-tap single code generation
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

  // High-performance bulk batch generation
  const handleGenerateBatch = async () => {
    if (batchCount < 1) return;
    setBatchLoading(true);
    setLastBatchResult(null);

    try {
      const generatedList = await generateBatchCards({
        count: batchCount,
        user,
        profile,
      });

      setLastBatchResult(generatedList);
      setCurrentCard(generatedList[0]);
      setRecentBatch((prev) => [...generatedList, ...prev]);
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

  const handleCopyAllBatchCodes = async () => {
    if (!lastBatchResult || lastBatchResult.length === 0) return;
    const text = lastBatchResult.map((c) => c.code).join(', ');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAllCodes(true);
      setTimeout(() => setCopiedAllCodes(false), 2500);
    } catch {
      prompt('Copy all codes:', text);
    }
  };

  // Export batch as CSV for industrial print shop or spreadsheet
  const handleExportCSV = () => {
    if (!lastBatchResult || lastBatchResult.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Card_Code,Redirect_URL,Status,Created_At\n';

    lastBatchResult.forEach((c) => {
      const url = getCardRedirectUrl(c.code);
      csvContent += `${c.code},${url},${c.status},${c.createdAt}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `B1_Cards_Batch_${lastBatchResult.length}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to render high-res composite PNG data for a card
  const generateCardPNGData = (card) => {
    return new Promise((resolve, reject) => {
      const url = getCardRedirectUrl(card.code);
      QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      })
        .then((dataUri) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();

          img.onload = () => {
            const qrSize = 512;
            const padding = 40;
            const textHeight = 70;

            canvas.width = qrSize + padding * 2;
            canvas.height = qrSize + padding * 2 + textHeight;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, padding, padding, qrSize, qrSize);

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`B1 • ${card.code}`, canvas.width / 2, qrSize + padding + 40);

            ctx.fillStyle = '#64748b';
            ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('Scan to connect', canvas.width / 2, qrSize + padding + 68);

            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = reject;
          img.src = dataUri;
        })
        .catch(reject);
    });
  };

  // Download high-resolution PNG for a single card
  const handleDownloadPNG = async (cardToDownload = currentCard) => {
    if (!cardToDownload) return;
    try {
      const pngData = await generateCardPNGData(cardToDownload);
      const downloadLink = document.createElement('a');
      downloadLink.download = `B1-Card-${cardToDownload.code}.png`;
      downloadLink.href = pngData;
      downloadLink.click();
    } catch (err) {
      console.error('PNG download error:', err);
    }
  };

  // Download cards together in a single ZIP archive!
  const handleDownloadCardsAsZip = async (cardsList, zipNamePrefix = 'B1_Batch') => {
    if (!cardsList || cardsList.length === 0) return;
    setZippingProgress(`Preparing 0/${cardsList.length}...`);

    try {
      const zip = new JSZip();
      const folder = zip.folder(`${zipNamePrefix}_${cardsList.length}_Cards`);

      for (let i = 0; i < cardsList.length; i++) {
        setZippingProgress(`Bundling ${i + 1}/${cardsList.length}...`);
        const card = cardsList[i];
        const pngDataUrl = await generateCardPNGData(card);
        const base64Data = pngDataUrl.split(',')[1];
        folder.file(`B1-Card-${card.code}.png`, base64Data, { base64: true });
      }

      setZippingProgress('Compressing ZIP...');
      const blob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${zipNamePrefix}_${cardsList.length}_Cards_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('ZIP generation error:', err);
      alert('Error creating ZIP archive: ' + err.message);
    } finally {
      setZippingProgress('');
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
          Generate Blank QR Codes
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Generate unique 6-character codes for printing physical cards or encoding NFC tags before selling.
        </p>
      </div>

      {/* Main One-Tap Single Action */}
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

      {/* Bulk Batch Generation Card */}
      <div className="card-panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={18} color="#818cf8" /> Bulk Batch Generation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
              Generate multiple unique blank codes in one atomic batch for manufacturing sheets.
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
              <option value={50}>50 Cards</option>
            </select>

            <button
              className="btn btn-primary"
              onClick={handleGenerateBatch}
              disabled={batchLoading}
            >
              <Layers size={16} />
              {batchLoading ? `Generating ${batchCount}...` : `Generate ${batchCount} Cards`}
            </button>
          </div>
        </div>

        {/* Batch Success Result Box */}
        {lastBatchResult && lastBatchResult.length > 0 && (
          <div
            style={{
              marginTop: 18,
              padding: 16,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} color="#34d399" />
                <strong style={{ color: '#34d399', fontSize: 15 }}>
                  Batch of {lastBatchResult.length} Blank Cards Ready!
                </strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyAllBatchCodes}
                  title="Copy all codes as comma-separated text"
                >
                  {copiedAllCodes ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  {copiedAllCodes ? 'Codes Copied!' : 'Copy All Codes'}
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportCSV}
                  title="Export codes to CSV for Excel/Print Shop"
                >
                  <FileSpreadsheet size={14} color="#60a5fa" />
                  Export CSV
                </button>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleDownloadCardsAsZip(lastBatchResult, `B1_Batch_${lastBatchResult.length}`)}
                  disabled={Boolean(zippingProgress)}
                  title="Download all QR PNGs together in a single ZIP file"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)', fontWeight: 600 }}
                >
                  <Archive size={14} />
                  {zippingProgress || 'Download All PNGs (ZIP)'}
                </button>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Click any code below to preview its QR code and details above:
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
                gap: 8,
              }}
            >
              {lastBatchResult.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrentCard(c)}
                  style={{
                    background: currentCard?.code === c.code ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${currentCard?.code === c.code ? '#38bdf8' : 'var(--border-subtle)'}`,
                    color: currentCard?.code === c.code ? '#38bdf8' : '#f8fafc',
                    borderRadius: 8,
                    padding: '8px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Session History */}
      {recentBatch.length > 0 && !lastBatchResult && (
        <div className="card-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>
              Recently Generated In This Session ({recentBatch.length})
            </h3>
            {recentBatch.length > 1 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownloadCardsAsZip(recentBatch, `B1_Session_${recentBatch.length}`)}
                disabled={Boolean(zippingProgress)}
                title="Download all session QR codes as a single ZIP file"
              >
                <Archive size={14} />
                {zippingProgress || `Download All ${recentBatch.length} PNGs (ZIP)`}
              </button>
            )}
          </div>
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
