import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  QrCode,
  Edit3,
  ExternalLink,
  Copy,
  Check,
  Building,
  User,
  Phone,
  Calendar,
  Layers,
  Trash2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCards, deleteCard } from '../firebase/cardService';
import { StatusBadge } from '../components/StatusBadge';
import { QRCodeModal } from '../components/QRCodeModal';

export function Dashboard({ onNavigateToGenerate, onNavigateToAssign }) {
  const { user, profile, isAdmin } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unassigned'); // 'unassigned' | 'assigned' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQRCard, setSelectedQRCard] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');
  const [deletingCode, setDeletingCode] = useState('');

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCards({ user, profile }, (list) => {
      setCards(list);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user, profile]);

  // Counts
  const unassignedCount = useMemo(
    () => cards.filter((c) => c.status === 'unassigned').length,
    [cards]
  );
  const assignedCount = useMemo(
    () => cards.filter((c) => c.status === 'assigned').length,
    [cards]
  );

  // Filtered & Searched cards
  const filteredCards = useMemo(() => {
    let result = cards;

    // Filter by Tab
    if (activeTab === 'unassigned') {
      result = result.filter((c) => c.status === 'unassigned');
    } else if (activeTab === 'assigned') {
      result = result.filter((c) => c.status === 'assigned');
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.code?.toLowerCase().includes(q) ||
          c.businessName?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.createdByName?.toLowerCase().includes(q) ||
          c.assignedByName?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [cards, activeTab, searchQuery]);

  const handleCopyCode = async (code, e) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch {}
  };

  const handleDeleteCard = async (cardToDelete) => {
    const isBlank = cardToDelete.status === 'unassigned';
    const confirmPrompt = isBlank
      ? `Are you sure you want to delete blank card "${cardToDelete.code}"? This will permanently remove it from inventory.`
      : `Are you sure you want to delete active card "${cardToDelete.code}" (${cardToDelete.businessName})?`;

    if (!window.confirm(confirmPrompt)) return;

    setDeletingCode(cardToDelete.code);
    try {
      await deleteCard(cardToDelete.code, { user, profile });
    } catch (err) {
      alert('Failed to delete card: ' + err.message);
    } finally {
      setDeletingCode('');
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
            Cards Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            {isAdmin
              ? 'Full management: generate, assign, edit active cards & delete blank codes'
              : 'Browse blank inventory to assign to customers (active cards editable by Admin)'}
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={onNavigateToGenerate}
          style={{ boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)' }}
        >
          <PlusCircle size={18} /> Generate Code
        </button>
      </div>

      {/* Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          className="card-panel"
          style={{ padding: '16px 18px', background: 'rgba(17, 23, 38, 0.6)' }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>
            TOTAL CODES
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
            {cards.length}
          </div>
        </div>

        <div
          className="card-panel"
          style={{
            padding: '16px 18px',
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>
            UNASSIGNED (INVENTORY)
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fde68a', marginTop: 4 }}>
            {unassignedCount}
          </div>
        </div>

        <div
          className="card-panel"
          style={{
            padding: '16px 18px',
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <div style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>
            ASSIGNED (ACTIVE)
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#a7f3d0', marginTop: 4 }}>
            {assignedCount}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-dim)',
          }}
        />
        <input
          type="text"
          className="form-input"
          placeholder="Search by business name, customer, phone, code, creator, or rep..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: 42 }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'unassigned' ? 'active' : ''}`}
          onClick={() => setActiveTab('unassigned')}
        >
          Unassigned ({unassignedCount})
        </button>
        <button
          className={`tab-btn ${activeTab === 'assigned' ? 'active' : ''}`}
          onClick={() => setActiveTab('assigned')}
        >
          Assigned ({assignedCount})
        </button>
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({cards.length})
        </button>
      </div>

      {/* Cards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Loading cards...
        </div>
      ) : filteredCards.length === 0 ? (
        <div
          className="card-panel"
          style={{
            textAlign: 'center',
            padding: '48px 20px',
            border: '1px dashed var(--border-subtle)',
          }}
        >
          <Layers size={40} style={{ color: 'var(--text-dim)', marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
            {searchQuery
              ? 'No matching cards found'
              : activeTab === 'unassigned'
              ? 'No unassigned blank cards'
              : activeTab === 'assigned'
              ? 'No assigned cards yet'
              : 'No cards created yet'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto 20px' }}>
            {searchQuery
              ? 'Try modifying your search keywords or clear the filter.'
              : activeTab === 'unassigned'
              ? 'Generate a batch of unique 6-character codes for printing physical cards.'
              : 'Physical cards will appear here once reps assign them to customers.'}
          </p>

          <button className="btn btn-primary" onClick={onNavigateToGenerate}>
            <PlusCircle size={16} /> Generate Blank Card
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredCards.map((card) => {
            const isAssigned = card.status === 'assigned';
            const canDelete = !isAssigned ? (isAdmin || card.createdBy === user?.uid) : isAdmin;
            const canEdit = !isAssigned ? true : isAdmin; // Only admin can edit an active card!

            return (
              <div
                key={card.code}
                className="card-panel"
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Top Row: Code Pill + Status + Quick Copy */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="code-badge">{card.code}</span>
                    <button
                      onClick={(e) => handleCopyCode(card.code, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                      title="Copy 6-char code"
                    >
                      {copiedCode === card.code ? (
                        <Check size={14} color="#34d399" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <StatusBadge status={card.status} />
                  </div>

                  {card.createdAt && (
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {typeof card.createdAt === 'string'
                        ? new Date(card.createdAt).toLocaleDateString()
                        : card.createdAt.toDate
                        ? card.createdAt.toDate().toLocaleDateString()
                        : ''}
                    </span>
                  )}
                </div>

                {/* Assigned Details Section */}
                {isAssigned ? (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#f8fafc',
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Building size={16} color="#38bdf8" />
                      {card.businessName || 'Unnamed Business'}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '6px 12px',
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        marginTop: 6,
                      }}
                    >
                      {card.customerName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={14} style={{ color: 'var(--text-dim)' }} />
                          {card.customerName}
                        </div>
                      )}

                      {card.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Phone size={14} style={{ color: 'var(--text-dim)' }} />
                          {card.phone}
                        </div>
                      )}

                      {card.dateSold && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} style={{ color: 'var(--text-dim)' }} />
                          Sold: {card.dateSold}
                        </div>
                      )}
                    </div>

                    {card.url && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border-subtle)' }}>
                        <a
                          href={card.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 12,
                            color: '#60a5fa',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            textDecoration: 'none',
                            wordBreak: 'break-all',
                          }}
                        >
                          Review URL: {card.url} <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Blank card generated for manufacturing/printing. Ready to be assigned to a business by any approved rep.
                  </div>
                )}

                {/* Attribution info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--text-dim)',
                    flexWrap: 'wrap',
                    gap: 8,
                    background: 'rgba(0,0,0,0.15)',
                    padding: '6px 10px',
                    borderRadius: 6,
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-muted)' }}>Created by:</strong>{' '}
                    <span style={{ color: '#e2e8f0' }}>{card.createdByName || 'Unknown'}</span>
                  </div>
                  {card.assignedByName && (
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Assigned by:</strong>{' '}
                      <span style={{ color: '#34d399' }}>{card.assignedByName}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginTop: 4,
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: 10,
                  }}
                >
                  {/* Delete option for blank/unassigned cards */}
                  <div>
                    {canDelete && (
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={deletingCode === card.code}
                        onClick={() => handleDeleteCard(card)}
                        title={!isAssigned ? "Delete blank card" : "Delete card"}
                      >
                        <Trash2 size={14} />
                        {deletingCode === card.code ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedQRCard(card)}
                    >
                      <QrCode size={14} /> View QR
                    </button>

                    {/* Assign or Edit button with Admin permission check */}
                    {!isAssigned ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onNavigateToAssign(card.code)}
                      >
                        <Edit3 size={14} /> Assign Card
                      </button>
                    ) : canEdit ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onNavigateToAssign(card.code)}
                      >
                        <Edit3 size={14} /> Edit Details
                      </button>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          color: 'var(--text-dim)',
                          padding: '4px 8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: 6,
                          border: '1px solid var(--border-subtle)',
                        }}
                        title="Active cards can only be edited by an administrator"
                      >
                        <Lock size={12} /> Active (Admin Only)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Inspection Modal */}
      {selectedQRCard && (
        <QRCodeModal
          card={selectedQRCard}
          onClose={() => setSelectedQRCard(null)}
          onAssign={(c) => {
            setSelectedQRCard(null);
            onNavigateToAssign(c.code);
          }}
        />
      )}
    </div>
  );
}
