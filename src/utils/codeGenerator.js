/**
 * Utility for generating and validating 6-character alphanumeric card codes
 * Example: "K3F9X1"
 */

// Charset: Uppercase letters and numbers (excluding easily confused 0, O, 1, I)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRandomCode(length = 6) {
  let result = '';
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += CHARSET[array[i] % CHARSET.length];
  }
  return result;
}

export function isValidCode(code) {
  if (!code || typeof code !== 'string') return false;
  const clean = code.trim().toUpperCase();
  return /^[A-Z0-9]{6}$/.test(clean);
}

export function extractCodeFromInput(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();

  // 1. Direct 6-character code
  if (/^[a-zA-Z0-9]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // 2. Standard B1 URL path: /c/XXXXXX
  const urlMatch = trimmed.match(/\/c\/([a-zA-Z0-9]{6})(?:[/?#]|$)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toUpperCase();
  }

  // 3. Query param format: ?code=XXXXXX or &code=XXXXXX
  const queryMatch = trimmed.match(/[?&]code=([a-zA-Z0-9]{6})(?:[&/#]|$)/i);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1].toUpperCase();
  }

  // 4. Code separated by delimiters like "B1 • MH98Y7" or "B1-MH98Y7"
  const delimitedMatch = trimmed.match(/(?:^|[\s:·•\/\-_])([a-zA-Z0-9]{6})(?:$|[\s:·•\/\-_])/);
  if (delimitedMatch && delimitedMatch[1]) {
    return delimitedMatch[1].toUpperCase();
  }

  // 5. Fallback 6-char substring
  const codeMatch = trimmed.match(/([a-zA-Z0-9]{6})/);
  if (codeMatch && codeMatch[1]) {
    return codeMatch[1].toUpperCase();
  }

  return trimmed.toUpperCase();
}

export function getCardRedirectUrl(code) {
  const configuredDomain = import.meta.env.VITE_PUBLIC_DOMAIN;
  let baseDomain = configuredDomain ? configuredDomain.trim() : window.location.origin;
  
  // Strip trailing slashes
  baseDomain = baseDomain.replace(/\/+$/, '');
  
  // Ensure http or https protocol
  if (!/^https?:\/\//i.test(baseDomain)) {
    baseDomain = 'https://' + baseDomain;
  }

  return `${baseDomain}/c/${code.toUpperCase()}`;
}
