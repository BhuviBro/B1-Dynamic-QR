import React, { useEffect, useState } from 'react';
import { getCard } from '../firebase/cardService';
import { RedirectLoadingScreen } from '../components/RedirectLoadingScreen';

export function PublicRedirectFallback({ code }) {
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState('');

  useEffect(() => {
    async function checkCard() {
      if (!code) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const found = await getCard(code);
        if (!found) {
          setNotFound(true);
          setLoading(false);
        } else {
          setCard(found);

          // If assigned with destination URL -> redirect immediately!
          if (found.status === 'assigned' && found.url) {
            let target = found.url.trim();
            if (!/^https?:\/\//i.test(target)) {
              target = 'https://' + target;
            }
            setRedirectTarget(target);
            // Slight micro-pause (250ms) to allow the glowing radar animation to start gracefully
            setTimeout(() => {
              window.location.replace(target);
            }, 250);
            return;
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Redirect check error:', err);
        setNotFound(true);
        setLoading(false);
      }
    }

    checkCard();
  }, [code]);

  if (loading || redirectTarget) {
    return (
      <RedirectLoadingScreen
        code={code}
        businessName={card?.businessName}
        targetUrl={redirectTarget}
      />
    );
  }

  // Not Found Screen
  if (notFound || !card) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#0a0e17' }}>
        <div className="card-panel" style={{ maxWidth: 420, textAlign: 'center', padding: '36px 28px' }}>
          <div className="brand-icon" style={{ width: 64, height: 64, margin: '0 auto 20px', fontSize: 24, borderRadius: 18 }}>
            B1
          </div>
          <span className="badge-pill badge-revoked" style={{ marginBottom: 14 }}>
            Card Not Found
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 10px' }}>
            Card Not Found
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            We couldn't find a record for this card code. Check the QR code or URL and try again.
          </p>
          {code && (
            <div className="code-badge" style={{ fontSize: 16, marginBottom: 24 }}>
              Code: {code}
            </div>
          )}
          <div style={{ fontSize: 12, color: '#64748b' }}>
            B1 Cards — Smart NFC & QR Business Cards
          </div>
        </div>
      </div>
    );
  }

  // Unassigned Screen
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#0a0e17' }}>
      <div className="card-panel" style={{ maxWidth: 420, textAlign: 'center', padding: '36px 28px' }}>
        <div className="brand-icon" style={{ width: 64, height: 64, margin: '0 auto 20px', fontSize: 24, borderRadius: 18 }}>
          B1
        </div>
        <span className="badge-pill badge-unassigned" style={{ marginBottom: 14 }}>
          Card Inactive
        </span>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 10px' }}>
          This card isn't active yet
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          Please contact the person who gave you this card to activate it.
        </p>
        <div className="code-badge" style={{ fontSize: 16, marginBottom: 24 }}>
          Code: {card.code}
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          B1 Cards — Smart NFC & QR Business Cards
        </div>
      </div>
    </div>
  );
}
