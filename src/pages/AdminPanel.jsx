import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  CheckCircle,
  Ban,
  Search,
  ExternalLink,
  Layers,
  QrCode,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToUsers,
  updateUserStatus,
  updateUserRole,
  subscribeToCards,
  deleteCard,
} from '../firebase/cardService';
import { StatusBadge } from '../components/StatusBadge';
import { QRCodeModal } from '../components/QRCodeModal';

export function AdminPanel({ onNavigateToAssign }) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'cards'
  const [usersList, setUsersList] = useState([]);
  const [cardsList, setCardsList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [cardSearch, setCardSearch] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [selectedQRCard, setSelectedQRCard] = useState(null);
  const [deletingCode, setDeletingCode] = useState('');

  // Subscriptions
  useEffect(() => {
    const unsubUsers = subscribeToUsers((data) => {
      setUsersList(data);
    });

    const unsubCards = subscribeToCards({ user, profile: { role: 'admin' } }, (data) => {
      setCardsList(data);
    });

    return () => {
      if (typeof unsubUsers === 'function') unsubUsers();
      if (typeof unsubCards === 'function') unsubCards();
    };
  }, [user, profile]);

  // Pending user requests count
  const pendingUsers = useMemo(
    () => usersList.filter((u) => u.status === 'pending'),
    [usersList]
  );

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return usersList;
    const q = userSearch.toLowerCase().trim();
    return usersList.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.status?.toLowerCase().includes(q)
    );
  }, [usersList, userSearch]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    if (!cardSearch.trim()) return cardsList;
    const q = cardSearch.toLowerCase().trim();
    return cardsList.filter(
      (c) =>
        c.code?.toLowerCase().includes(q) ||
        c.businessName?.toLowerCase().includes(q) ||
        c.customerName?.toLowerCase().includes(q) ||
        c.createdByName?.toLowerCase().includes(q) ||
        c.assignedByName?.toLowerCase().includes(q)
    );
  }, [cardsList, cardSearch]);

  const handleStatusChange = async (targetUid, newStatus) => {
    setActionLoading((prev) => ({ ...prev, [targetUid]: true }));
    try {
      await updateUserStatus(targetUid, newStatus);
    } catch (err) {
      alert('Error updating status: ' + err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetUid]: false }));
    }
  };

  const handleRoleToggle = async (targetUid, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmText =
      newRole === 'admin'
        ? 'Grant administrator privileges to this user?'
        : 'Demote this user to regular rep status?';

    if (!window.confirm(confirmText)) return;

    setActionLoading((prev) => ({ ...prev, [targetUid]: true }));
    try {
      await updateUserRole(targetUid, newRole);
    } catch (err) {
      alert('Error changing role: ' + err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetUid]: false }));
    }
  };

  const handleDeleteCard = async (cardToDelete) => {
    const isBlank = cardToDelete.status === 'unassigned';
    const confirmText = isBlank
      ? `Delete blank QR code "${cardToDelete.code}"?`
      : `Delete active card "${cardToDelete.code}" (${cardToDelete.businessName})?`;

    if (!window.confirm(confirmText)) return;

    setDeletingCode(cardToDelete.code);
    try {
      await deleteCard(cardToDelete.code, { user, profile });
    } catch (err) {
      alert('Error deleting card: ' + err.message);
    } finally {
      setDeletingCode('');
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={28} color="#818cf8" />
          Admin Control Center
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Manage user access permissions, review pending signup requests, edit active cards, and inspect system-wide attribution.
        </p>
      </div>

      {/* Pending User Requests Banner */}
      {pendingUsers.length > 0 && (
        <div
          className="notice-banner"
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: '#fef3c7',
            padding: '14px 18px',
            marginBottom: 20,
          }}
        >
          <AlertTriangle size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong>{pendingUsers.length} Pending User Access {pendingUsers.length === 1 ? 'Request' : 'Requests'}</strong>
            <p style={{ fontSize: 12, color: '#fde68a', marginTop: 2 }}>
              New users cannot generate or assign cards until approved by an admin.
            </p>
          </div>
          <button
            className="btn btn-sm btn-primary"
            style={{ background: '#f59e0b', color: '#111827', fontWeight: 700 }}
            onClick={() => {
              setActiveTab('users');
              setUserSearch('pending');
            }}
          >
            Review Now
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: 20 }}>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} /> User Management ({usersList.length})
          {pendingUsers.length > 0 && (
            <span
              style={{
                background: '#f59e0b',
                color: '#111',
                borderRadius: '50%',
                fontSize: 11,
                padding: '1px 6px',
                fontWeight: 700,
              }}
            >
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          className={`tab-btn ${activeTab === 'cards' ? 'active' : ''}`}
          onClick={() => setActiveTab('cards')}
        >
          <Layers size={16} /> System-Wide Cards & Attribution ({cardsList.length})
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div>
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
              placeholder="Search users by email, name, role, or status..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ paddingLeft: 42 }}
            />
            {userSearch && (
              <button
                onClick={() => setUserSearch('')}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredUsers.length === 0 ? (
              <div className="card-panel" style={{ textAlign: 'center', padding: '36px' }}>
                <p style={{ color: 'var(--text-muted)' }}>No matching users found.</p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isCurrentAuthUser = u.uid === user?.uid;
                const isLoadingThis = actionLoading[u.uid];

                return (
                  <div
                    key={u.uid}
                    className="card-panel"
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      border:
                        u.status === 'pending'
                          ? '1px solid rgba(245, 158, 11, 0.4)'
                          : '1px solid var(--border-subtle)',
                      background:
                        u.status === 'pending'
                          ? 'rgba(245, 158, 11, 0.04)'
                          : 'var(--bg-surface)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 15, color: '#f8fafc' }}>
                            {u.displayName || u.email.split('@')[0]}
                          </span>
                          <StatusBadge status={u.role} type="role" />
                          <StatusBadge status={u.status} />
                          {isCurrentAuthUser && (
                            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                              (You)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                          {u.email}
                        </div>
                      </div>

                      {u.requestedAt && (
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                          Requested:{' '}
                          {typeof u.requestedAt === 'string'
                            ? new Date(u.requestedAt).toLocaleDateString()
                            : u.requestedAt?.toDate
                            ? u.requestedAt.toDate().toLocaleDateString()
                            : ''}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 8,
                        paddingTop: 8,
                        borderTop: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Status Actions */}
                      {u.status !== 'approved' && (
                        <button
                          className="btn btn-success btn-sm"
                          disabled={isLoadingThis}
                          onClick={() => handleStatusChange(u.uid, 'approved')}
                        >
                          <CheckCircle size={14} /> Approve Access
                        </button>
                      )}

                      {u.status !== 'revoked' && !isCurrentAuthUser && (
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={isLoadingThis}
                          onClick={() => handleStatusChange(u.uid, 'revoked')}
                        >
                          <Ban size={14} /> Revoke Access
                        </button>
                      )}

                      {/* Role Toggle */}
                      {!isCurrentAuthUser && (
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={isLoadingThis}
                          onClick={() => handleRoleToggle(u.uid, u.role)}
                        >
                          {u.role === 'admin' ? 'Demote to User' : 'Make Admin'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM-WIDE CARDS & ATTRIBUTION */}
      {activeTab === 'cards' && (
        <div>
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
              placeholder="Search all cards by code, business, creator, or assigned rep..."
              value={cardSearch}
              onChange={(e) => setCardSearch(e.target.value)}
              style={{ paddingLeft: 42 }}
            />
            {cardSearch && (
              <button
                onClick={() => setCardSearch('')}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredCards.length === 0 ? (
              <div className="card-panel" style={{ textAlign: 'center', padding: '36px' }}>
                <p style={{ color: 'var(--text-muted)' }}>No cards found matching your query.</p>
              </div>
            ) : (
              filteredCards.map((card) => {
                const isAssigned = card.status === 'assigned';
                return (
                  <div key={card.code} className="card-panel" style={{ padding: '16px 20px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="code-badge">{card.code}</span>
                        <StatusBadge status={card.status} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedQRCard(card)}
                        >
                          <QrCode size={14} /> View QR
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={deletingCode === card.code}
                          onClick={() => handleDeleteCard(card)}
                          title="Delete card"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Attribution Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 12,
                        background: 'rgba(255, 255, 255, 0.02)',
                        padding: 12,
                        borderRadius: 10,
                        border: '1px solid var(--border-subtle)',
                        marginBottom: 10,
                      }}
                    >
                      {/* Who Generated */}
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Generated By
                        </span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', marginTop: 2 }}>
                          {card.createdByName || 'Unknown'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {card.createdAt
                            ? typeof card.createdAt === 'string'
                              ? new Date(card.createdAt).toLocaleString()
                              : card.createdAt.toDate
                              ? card.createdAt.toDate().toLocaleString()
                              : ''
                            : 'N/A'}
                        </div>
                      </div>

                      {/* Who Sold / Assigned */}
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Sold / Assigned By
                        </span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isAssigned ? '#34d399' : 'var(--text-muted)', marginTop: 2 }}>
                          {isAssigned ? (card.assignedByName || 'Assigned Rep') : 'Not Yet Assigned'}
                        </div>
                        {isAssigned && card.dateSold && (
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            Date Sold: {card.dateSold}
                          </div>
                        )}
                      </div>

                      {/* Target Business */}
                      {isAssigned && (
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Business & Customer
                          </span>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', marginTop: 2 }}>
                            {card.businessName}
                          </div>
                          {card.customerName && (
                            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                              {card.customerName} {card.phone ? `(${card.phone})` : ''}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Destination URL & Edit Action */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 8,
                        fontSize: 12,
                      }}
                    >
                      {card.url ? (
                        <a
                          href={card.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#60a5fa',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            textDecoration: 'none',
                            maxWidth: 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Destination: {card.url} <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>
                          URL not yet assigned
                        </span>
                      )}

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onNavigateToAssign(card.code)}
                      >
                        {isAssigned ? 'Edit Card Details' : 'Assign Card'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* QR Inspection Modal */}
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
