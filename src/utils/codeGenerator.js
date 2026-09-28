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

  // If input is a URL like https://domain.com/c/K3F9X1 or /c/K3F9X1
  const urlMatch = trimmed.match(/\/c\/([a-zA-Z0-9]{6})(?:[/?#]|$)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toUpperCase();
  }

  // If input is directly the 6-char code
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
