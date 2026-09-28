/**
 * B1 Cards — Serverless Public Redirect Function
 * Route: /c/:code
 * 
 * - If card exists & assigned -> HTTP 302 instant redirect to destination URL (e.g. Google Maps review link)
 * - If card exists & unassigned -> Render branded "This card isn't active yet" page
 * - If card does not exist -> Render branded 404 "Card not found" page
 */

const admin = require('firebase-admin');

// Cache Firestore instance across function invocations
let db = null;
let lastInitError = null;

function initFirebase() {
  if (db) return db;

  try {
    if (admin.apps.length > 0) {
      db = admin.firestore();
      return db;
    }

    let credential = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      let rawSa = process.env.FIREBASE_SERVICE_ACCOUNT.trim();

      // Check if value is base64 encoded
      if (!rawSa.startsWith('{') && !rawSa.startsWith('"')) {
        try {
          const decoded = Buffer.from(rawSa, 'base64').toString('utf-8');
          if (decoded.trim().startsWith('{')) {
            rawSa = decoded.trim();
          }
        } catch {}
      }

      let sa = null;
      try {
        sa = JSON.parse(rawSa);
        // Handle double-stringified JSON if Netlify or copy-paste added extra outer quotes
        if (typeof sa === 'string') {
          sa = JSON.parse(sa);
        }
      } catch (parseErr) {
        lastInitError = `JSON parse failed for FIREBASE_SERVICE_ACCOUNT: ${parseErr.message}`;
        console.error(lastInitError);
      }

      if (sa) {
        // Fix standard Google Service Account literal \n in private_key
        if (sa.private_key) {
          sa.private_key = sa.private_key.replace(/\\n/g, '\n');
        }
        credential = admin.credential.cert(sa);
      }
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    }

    if (credential) {
      admin.initializeApp({ credential });
      db = admin.firestore();
      return db;
    } else if (!lastInitError) {
      lastInitError = 'FIREBASE_SERVICE_ACCOUNT environment variable is not set in Netlify.';
    }
  } catch (err) {
    lastInitError = `Firebase Admin initialization error: ${err.message}`;
    console.error(lastInitError);
  }

  return db;
}

// Inline Mobile-First Branded Standby & Error HTML Generator
function renderBrandedPage({ title, statusText, statusType, heading, message, code }) {
  const isInactive = statusType === 'inactive';
  const badgeColor = isInactive ? '#f59e0b' : '#ef4444';
  const badgeBg = isInactive ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  const badgeBorder = isInactive ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: radial-gradient(circle at 50% 20%, #151d30 0%, #080c14 100%);
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
      overflow-x: hidden;
    }
    .container {
      width: 100%;
      max-width: 420px;
      background: rgba(18, 25, 41, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 24px;
      padding: 36px 28px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 60px rgba(59, 130, 246, 0.08);
      position: relative;
    }
    .logo-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
      margin-bottom: 20px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      background: ${badgeBg};
      color: ${badgeColor};
      border: 1px solid ${badgeBorder};
      margin-bottom: 16px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
      line-height: 1.3;
    }
    p {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .code-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px dashed rgba(255, 255, 255, 0.15);
      padding: 8px 16px;
      border-radius: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 14px;
      color: #cbd5e1;
      margin-bottom: 24px;
    }
    .code-pill strong {
      color: #38bdf8;
      letter-spacing: 1px;
    }
    .footer {
      font-size: 12px;
      color: #64748b;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-wrapper">
      <span class="logo-text">B1</span>
    </div>
    <br>
    <div class="badge">${statusText}</div>
    <h1>${heading}</h1>
    <p>${message}</p>
    ${code ? `<div class="code-pill">Card Code: <strong>${code}</strong></div>` : ''}
    <div class="footer">B1 Cards — Smart NFC & QR Business Cards</div>
  </div>
</body>
</html>`;
}

exports.handler = async (event) => {
  // Extract 6-character card code from query string or URL path
  let code = (event.queryStringParameters && event.queryStringParameters.code) || '';
  if (!code && event.path) {
    const parts = event.path.split('/').filter(Boolean);
    const cIndex = parts.indexOf('c');
    if (cIndex !== -1 && parts[cIndex + 1]) {
      code = parts[cIndex + 1];
    } else if (parts.length > 0) {
      code = parts[parts.length - 1];
    }
  }

  code = (code || '').trim().toUpperCase();

  if (!code) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: renderBrandedPage({
        title: 'B1 Cards — Invalid Request',
        statusText: 'Invalid Request',
        statusType: 'error',
        heading: 'Missing Card Code',
        message: 'No card identifier was provided in the URL.',
      }),
    };
  }

  const firestore = initFirebase();

  // If Firebase Admin is not configured, show clear diagnostic message
  if (!firestore) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: renderBrandedPage({
        title: 'B1 Cards — Configuration Pending',
        statusText: 'Service Notice',
        statusType: 'inactive',
        heading: 'Firebase Service Pending',
        message: 'The redirect function is awaiting your Firebase Service Account key in Netlify. Please check Netlify Environment Variables.',
        code,
      }),
    };
  }

  try {
    const cardRef = firestore.collection('cards').doc(code);
    const snap = await cardRef.get();

    if (!snap.exists) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: renderBrandedPage({
          title: 'B1 Cards — Card Not Found',
          statusText: 'Card Not Found',
          statusType: 'error',
          heading: 'Card Not Found',
          message: "We couldn't find a record for this card code. Please check the QR code or link.",
          code,
        }),
      };
    }

    const card = snap.data();

    // 1. If assigned and URL exists -> HTTP 302 instant redirect!
    if (card.status === 'assigned' && card.url) {
      let targetUrl = card.url.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }
      return {
        statusCode: 302,
        headers: {
          Location: targetUrl,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: '',
      };
    }

    // 2. If unassigned -> Branded standby screen
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: renderBrandedPage({
        title: "B1 Cards — Card Not Active",
        statusText: 'Inactive Card',
        statusType: 'inactive',
        heading: "This card isn't active yet",
        message: 'Please contact the person who gave you this card to activate it.',
        code,
      }),
    };
  } catch (error) {
    console.error('Error fetching card doc:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: renderBrandedPage({
        title: 'B1 Cards — Temporary Error',
        statusText: 'Server Error',
        statusType: 'error',
        heading: 'Unable to process card',
        message: 'A temporary error occurred while looking up this card. Please try again in a few moments.',
        code,
      }),
    };
  }
};
