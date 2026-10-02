import React, { useState, useEffect, useCallback } from 'react';
import {
  Camera,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  ExternalLink,
  QrCode,
  Info,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCard, assignCard } from '../firebase/cardService';
import { extractCodeFromInput, getCardRedirectUrl } from '../utils/codeGenerator';
import { ScannerModal } from '../components/ScannerModal';
import { StatusBadge } from '../components/StatusBadge';
import { QRCodeModal } from '../components/QRCodeModal';

export function AssignCode({ initialCode, onClearInitialCode }) {
  const { user, profile, isAdmin } = useAuth();

  const [inputCode, setInputCode] = useState(initialCode || '');
  const [activeCard, setActiveCard] = useState(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    customerName: '',
    phone: '',
    dateSold: new Date().toISOString().split('T')[0],
    url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLookup = useCallback(async (codeToLookup) => {
    const clean = extractCodeFromInput(codeToLookup);
    if (!clean) {
      setErrorMsg('Please enter a 6-character card code or scan a card.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoadingCard(true);

    try {
      const card = await getCard(clean);
      if (!card) {
        setErrorMsg(`Card "${clean}" was not found in the database. Please verify the code or generate it first.`);
        setActiveCard(null);
      } else {
        setActiveCard(card);
        // Pre-fill form if card already has data
        setFormData({
          businessName: card.businessName || '',
          customerName: card.customerName || '',
          phone: card.phone || '',
          dateSold: card.dateSold || new Date().toISOString().split('T')[0],
          url: card.url || '',
        });
      }
    } catch (err) {
      console.error('Error fetching card:', err);
      setErrorMsg('Error retrieving card record: ' + err.message);
    } finally {
      setLoadingCard(false);
    }
  }, []);

  // If initialCode provided, automatically lookup
  useEffect(() => {
    if (initialCode) {
      handleLookup(initialCode);
      if (onClearInitialCode) onClearInitialCode();
    }
  }, [initialCode, handleLookup, onClearInitialCode]);

  const handleScanSuccess = useCallback((scannedCode) => {
    setIsScannerOpen(false);
    setInputCode(scannedCode);
    handleLookup(scannedCode);
  }, [handleLookup]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!activeCard) return;

    // Requirement 4: Only admin can update an already assigned card!
    if (activeCard.status === 'assigned' && !isAdmin) {
      setErrorMsg('This card is already active. Only an administrator can update active cards.');
      return;
    }

    if (!formData.businessName.trim()) {
      setErrorMsg('Please enter a Business Name.');
      return;
    }

    if (!formData.url.trim()) {
      setErrorMsg('Please enter a destination URL (e.g. Google Maps review link).');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const updated = await assignCard(activeCard.code, formData, { user, profile });
      setActiveCard(updated);
      setSuccessMsg(
        activeCard.status === 'assigned'
          ? `Card ${activeCard.code} has been successfully updated by Administrator!`
          : `Card ${activeCard.code} has been successfully assigned and activated!`
      );
    } catch (err) {
      console.error('Error saving assignment:', err);
      setErrorMsg('Failed to save assignment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetCard = () => {
    setActiveCard(null);
    setInputCode('');
    setErrorMsg('');
    setSuccessMsg('');
    setFormData({
      businessName: '',
      customerName: '',
      phone: '',
      dateSold: new Date().toISOString().split('T')[0],
      url: '',
    });
  };

  const isCardAssigned = activeCard?.status === 'assigned';
  const isReadOnlyForUser = isCardAssigned && !isAdmin;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
          Assign Physical Card
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Scan or enter any card code to attach business customer details and target destination URL.
        </p>
      </div>

      {/* Entry Paths: Scanner or Manual Code Input */}
      {!activeCard ? (
        <div className="card-panel">
          {/* Path A: Camera Scanner */}
          <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
            <button
              type="button"
              className="btn btn-primary btn-lg btn-full"
              style={{ padding: '16px 20px', fontSize: 16 }}
              onClick={() => setIsScannerOpen(true)}
            >
              <Camera size={22} />
              Scan Physical Card QR (Camera)
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
              Uses your phone's browser camera to instantly scan the card
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '10px 0 20px',
              color: 'var(--text-dim)',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ padding: '0 12px' }}>Or Type Manually</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          {/* Path B: Manual Code Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup(inputCode);
            }}
          >
            <label className="form-label">6-Character Card Code</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. K3F9X1"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              />
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={loadingCard || !inputCode.trim()}
                style={{ minWidth: 110 }}
              >
                <Search size={16} />
                {loadingCard ? 'Searching...' : 'Find Card'}
              </button>
            </div>
            <div className="form-hint">
              Located directly below the QR code on the back of the physical card.
            </div>
          </form>

          {errorMsg && (
            <div
              className="notice-banner"
              style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: '#f87171',
                marginTop: 18,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}
        </div>
      ) : (
        /* Card Found -> Assignment / Edit Form */
        <div>
          {/* Card Info Header */}
          <div
            className="card-panel"
            style={{
              marginBottom: 16,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Selected Card</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <span className="code-badge" style={{ fontSize: 18, padding: '4px 12px' }}>
                    {activeCard.code}
                  </span>
                  <StatusBadge status={activeCard.status} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowQRModal(true)}
                >
                  <QrCode size={14} /> View QR
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleResetCard}>
                  Change Code
                </button>
              </div>
            </div>

            {/* Permanent attribution row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 14,
                paddingTop: 10,
                borderTop: '1px solid var(--border-subtle)',
                fontSize: 12,
              }}
            >
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Created by:</span>{' '}
                <strong style={{ color: '#f8fafc' }}>{activeCard.createdByName || 'Unknown'}</strong>
              </div>
              {activeCard.assignedByName && (
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Assigned by:</span>{' '}
                  <strong style={{ color: '#34d399' }}>{activeCard.assignedByName}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Locked Notice for non-admin on already active card */}
          {isReadOnlyForUser && (
            <div
              className="notice-banner"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                marginBottom: 16,
              }}
            >
              <Lock size={18} style={{ flexShrink: 0, color: '#f87171' }} />
              <div>
                <strong>Active Card (Locked):</strong> This card is already assigned to <strong>{activeCard.businessName}</strong>. To prevent accidental overrides, only an administrator can edit an active card's details or destination URL.
              </div>
            </div>
          )}

          {/* Notifications */}
          {successMsg && (
            <div
              className="notice-banner"
              style={{
                background: 'var(--success-bg)',
                border: '1px solid var(--success-border)',
                color: '#34d399',
                marginBottom: 16,
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>{successMsg}</div>
              <a
                href={getCardRedirectUrl(activeCard.code)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#38bdf8',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Test Redirect <ExternalLink size={12} />
              </a>
            </div>
          )}

          {errorMsg && (
            <div
              className="notice-banner"
              style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: '#f87171',
                marginBottom: 16,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Assignment Form */}
          <div className="card-panel">
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building size={18} color="#38bdf8" />
              {isCardAssigned
                ? (isAdmin ? 'Edit Card Assignment (Admin Access)' : 'Card Assignment Details (Read-Only)')
                : 'Enter Card Assignment Details'}
            </h3>

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">
                  Business Name <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Apex Dental Care"
                  value={formData.businessName}
                  disabled={isReadOnlyForUser}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Customer / Contact Person</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Michael Vance"
                  value={formData.customerName}
                  disabled={isReadOnlyForUser}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                <div className="form-group">
                  <label className="form-label">Customer Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. +1 (555) 234-5678"
                    value={formData.phone}
                    disabled={isReadOnlyForUser}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date Sold</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dateSold}
                    disabled={isReadOnlyForUser}
                    onChange={(e) =>
                      setFormData({ ...formData, dateSold: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Destination URL (Google Maps Review Link){' '}
                  <span style={{ color: '#f87171' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://g.page/r/your-review-link or https://maps.app.goo.gl/..."
                    value={formData.url}
                    disabled={isReadOnlyForUser}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-hint" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Info size={13} />
                  When the customer taps their NFC card or scans the QR, they are automatically forwarded here.
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                {!isReadOnlyForUser ? (
                  <button
                    type="submit"
                    className="btn btn-primary btn-full btn-lg"
                    disabled={isSubmitting}
                  >
                    <CheckCircle2 size={18} />
                    {isSubmitting
                      ? 'Saving Card...'
                      : isCardAssigned
                      ? 'Update Assignment (Admin)'
                      : 'Activate & Assign Card'}
                  </button>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      padding: '10px 0',
                    }}
                  >
                    Please contact an Administrator if this card's business or destination URL needs modification.
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* QR Code Inspection Modal */}
      {showQRModal && activeCard && (
        <QRCodeModal
          card={activeCard}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}
