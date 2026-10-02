/**
 * B1 Cards — Serverless Public Redirect Function
 * Route: /c/:code
 * 
 * - If card exists & assigned -> HTTP 302 instant redirect to destination URL (e.g. Google Maps review link)
 * - If card exists & unassigned -> Render branded "This card isn't active yet" page
 * - If card does not exist -> Render branded 404 "Card not found" page
 */

const crypto = require('crypto');

// In-memory token cache to make redirects blazing fast across invocations
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Generate Google OAuth2 Access Token using standard Node.js crypto
 * Bypasses heavy SDK bundling and cold starts in serverless functions
 */
async function getServiceAccountToken(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < tokenExpiresAt - 60) {
    return cachedToken;
  }

  // Ensure standard RSA PEM private key formatting
  let cleanKey = privateKey.trim();
  if (!cleanKey.includes('\n')) {
    cleanKey = cleanKey.replace(/\\n/g, '\n');
  }

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${claim}`);
  const signature = sign.sign(cleanKey, 'base64url');
  const jwt = `${header}.${claim}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Auth token request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in || 3600);
  return cachedToken;
}

/**
 * Parse Service Account from Netlify Environment Variables
 */
function extractServiceAccount() {
  const saRaw =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_KEY ||
    process.env.FIREBASE_SERVICE_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (saRaw) {
    let raw = saRaw.trim();

    // Decode if base64 encoded
    if (!raw.startsWith('{') && !raw.startsWith('"')) {
      try {
        const decoded = Buffer.from(raw, 'base64').toString('utf-8');
        if (decoded.trim().startsWith('{')) {
          raw = decoded.trim();
        }
      } catch {}
    }

    try {
      let sa = JSON.parse(raw);
      if (typeof sa === 'string') sa = JSON.parse(sa);
      if (sa && (sa.client_email || sa.clientEmail) && (sa.private_key || sa.privateKey)) {
        return {
          projectId: sa.project_id || sa.projectId || process.env.VITE_FIREBASE_PROJECT_ID,
          clientEmail: sa.client_email || sa.clientEmail,
          privateKey: sa.private_key || sa.privateKey,
        };
      }
    } catch (e) {
      console.warn('FIREBASE_SERVICE_ACCOUNT / FIREBASE_KEY JSON parse warning:', e.message);
    }
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_KEY)) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_KEY,
    };
  }

  return null;
}

// Inline Mobile-First Branded Standby & Error HTML Generator
function renderBrandedPage({ title, statusText, statusType, heading, message, code, debugInfo }) {
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
    * { box-sizing: border-box; margin: 0; padding: 0; }
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
    .logo-text { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; }
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
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px; line-height: 1.3; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
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
    .code-pill strong { color: #38bdf8; letter-spacing: 1px; }
    .footer { font-size: 12px; color: #64748b; margin-top: 12px; }
    .debug-box {
      margin-top: 16px;
      font-size: 11px;
      font-family: ui-monospace, monospace;
      color: #64748b;
      background: rgba(0,0,0,0.3);
      padding: 8px;
      border-radius: 8px;
      word-break: break-all;
      text-align: left;
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
    ${debugInfo ? `<div class="debug-box">${debugInfo}</div>` : ''}
  </div>
</body>
</html>`;
}

// Inline Mobile-First Animated Redirection Loading Page
function renderRedirectLoadingPage({ targetUrl, businessName, code }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta http-equiv="refresh" content="0; url=${targetUrl}">
  <title>B1 Cards — Connecting...</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at 50% 35%, #131d35 0%, #080c14 75%, #04060a 100%);
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 20px;
      text-align: center;
      overflow: hidden;
    }
    .radar-box {
      position: relative;
      width: 140px;
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 28px;
    }
    .radar-ring {
      position: absolute;
      border-radius: 50%;
      border: 1.5px solid rgba(56, 189, 248, 0.4);
      animation: radarPulse 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
    }
    .radar-ring.outer { inset: -20px; }
    .radar-ring.middle { inset: -8px; border-color: rgba(124, 58, 237, 0.45); animation-delay: 0.7s; }
    .logo-badge {
      position: relative;
      width: 84px;
      height: 84px;
      border-radius: 26px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 35px rgba(37, 99, 235, 0.5), 0 10px 25px rgba(0, 0, 0, 0.6);
      border: 2px solid rgba(255, 255, 255, 0.25);
    }
    .logo-badge .b1 { font-size: 32px; font-weight: 800; color: #fff; line-height: 1; }
    .logo-badge .sub { font-size: 9px; font-weight: 700; letter-spacing: 1.5px; color: rgba(255,255,255,0.8); margin-top: 3px; }
    h1 { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 8px; line-height: 1.3; }
    p { font-size: 14px; color: #94a3b8; margin-bottom: 20px; }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      margin-bottom: 24px;
      font-family: ui-monospace, monospace;
      font-size: 13px;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: 1.5px;
    }
    .pill .dot {
      width: 7px; height: 7px; border-radius: 50%; background: #34d399; box-shadow: 0 0 8px #34d399;
    }
    .bar-track {
      width: 100%; max-width: 240px; height: 4px; background: rgba(255, 255, 255, 0.08); border-radius: 9999px; overflow: hidden; position: relative; margin-bottom: 20px;
    }
    .bar-thumb {
      position: absolute; top: 0; bottom: 0; width: 50%; background: linear-gradient(90deg, transparent, #38bdf8, #818cf8, transparent); border-radius: 9999px; animation: shimmerBar 1.6s ease-in-out infinite;
    }
    .manual-link {
      display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 12px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); color: #38bdf8; font-size: 13px; font-weight: 600; text-decoration: none; margin-top: 10px;
    }
    .footer { margin-top: 32px; font-size: 11px; color: #64748b; letter-spacing: 0.5px; }
    @keyframes radarPulse {
      0% { transform: scale(0.8); opacity: 0.9; }
      50% { transform: scale(1.35); opacity: 0.35; }
      100% { transform: scale(1.95); opacity: 0; }
    }
    @keyframes shimmerBar {
      0% { left: -50%; }
      100% { left: 100%; }
    }
  </style>
</head>
<body>
  <div class="radar-box">
    <div class="radar-ring outer"></div>
    <div class="radar-ring middle"></div>
    <div class="logo-badge">
      <span class="b1">B1</span>
      <span class="sub">CARDS</span>
    </div>
  </div>
  <h1>${businessName ? 'Connecting to ' + businessName + '...' : 'Connecting to Destination...'}</h1>
  <p>Smart NFC &amp; QR dynamic redirection</p>
  ${code ? '<div class="pill"><span class="dot"></span>' + code.toUpperCase() + '</div>' : ''}
  <div class="bar-track">
    <div class="bar-thumb"></div>
  </div>
  <a class="manual-link" href="${targetUrl}">Tap here if not redirected &rarr;</a>
  <div class="footer">B1 Cards &bull; Contactless Smart Platform</div>
  <script>
    setTimeout(function() {
      window.location.replace(${JSON.stringify(targetUrl)});
    }, 150);
  </script>
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

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'b1-nfc';
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  const sa = extractServiceAccount();

  let card = null;
  let lookupError = null;

  // Method 1: Google Service Account Auth Token (Admin Access)
  if (sa) {
    try {
      const accessToken = await getServiceAccountToken(sa.clientEmail, sa.privateKey);
      const url = `https://firestore.googleapis.com/v1/projects/${sa.projectId || projectId}/databases/(default)/documents/cards/${code}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (resp.status === 404) {
        card = null;
      } else if (resp.ok) {
        const doc = await resp.json();
        const fields = doc.fields || {};
        card = {
          code,
          status: fields.status?.stringValue || 'unassigned',
          url: fields.url?.stringValue || '',
          businessName: fields.businessName?.stringValue || '',
        };
      } else {
        const errText = await resp.text();
        lookupError = `Service account Firestore read error (${resp.status}): ${errText}`;
      }
    } catch (e) {
      lookupError = `Service account token error: ${e.message}`;
      console.warn(lookupError);
    }
  }

  // Method 2: Direct Firestore REST API (using Web API Key & Project ID)
  let cardNotFound = false;
  if (!card) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/cards/${code}${apiKey ? `?key=${apiKey}` : ''}`;
      const resp = await fetch(url);

      if (resp.status === 404) {
        card = null;
        cardNotFound = true;
        lookupError = null; // Clear error since 404 is an expected valid result (card does not exist)
      } else if (resp.ok) {
        const doc = await resp.json();
        const fields = doc.fields || {};
        card = {
          code,
          status: fields.status?.stringValue || 'unassigned',
          url: fields.url?.stringValue || '',
          businessName: fields.businessName?.stringValue || '',
        };
        lookupError = null;
      } else if (resp.status === 403) {
        lookupError = `Firestore Security Rules rejected public read (403 Permission Denied). To enable instant QR / NFC redirects, go to Firebase Console > Firestore Database > Rules and ensure "allow read: if true;" is set on /cards/{code}.`;
      } else {
        const errText = await resp.text().catch(() => '');
        lookupError = `Firestore REST error (${resp.status}): ${errText}`;
      }
    } catch (restErr) {
      console.warn('REST lookup error:', restErr.message);
      if (!lookupError) {
        lookupError = `Network / REST error: ${restErr.message}`;
      }
    }
  }

  // 1. If assigned and URL exists -> HTTP 302 instant redirect with animated radar screen!
  if (card && card.status === 'assigned' && card.url) {
    let targetUrl = card.url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }
    return {
      statusCode: 302,
      headers: {
        Location: targetUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'text/html; charset=utf-8',
      },
      body: renderRedirectLoadingPage({
        targetUrl,
        businessName: card.businessName,
        code,
      }),
    };
  }

  // 2. If unassigned -> Branded standby screen
  if (card && card.status === 'unassigned') {
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
  }

  // 3. If card confirmed not found in Firestore -> 404 Branded page
  if (cardNotFound || (!card && !lookupError)) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: renderBrandedPage({
        title: 'B1 Cards — Card Not Found',
        statusText: 'Card Not Found',
        statusType: 'error',
        heading: 'Card Not Found',
        message: "We couldn't find a record for this card code in the database. Please check the QR code or link.",
        code,
      }),
    };
  }

  // 4. Permission / Configuration Notice with actionable instructions
  const isPermissionDenied = lookupError && lookupError.includes('403');
  return {
    statusCode: isPermissionDenied ? 403 : 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: renderBrandedPage({
      title: isPermissionDenied ? 'B1 Cards — Firestore Rules Required' : 'B1 Cards — Connection Pending',
      statusText: isPermissionDenied ? 'Permission Denied (403)' : 'Service Notice',
      statusType: 'inactive',
      heading: isPermissionDenied ? 'Publish Firestore Security Rules' : 'Firebase Connection Pending',
      message: isPermissionDenied
        ? 'Card lookup was rejected by Cloud Firestore security rules. In Firebase Console &gt; Firestore Database &gt; Rules, publish the rule allowing public read for cards: <code>allow read: if true;</code>'
        : 'The redirect function is awaiting valid Firebase credentials in Netlify.',
      code,
      debugInfo: `Diagnostics: Project: ${projectId} | SA Present: ${Boolean(sa)} | Error: ${lookupError || 'None'}`,
    }),
  };
};
