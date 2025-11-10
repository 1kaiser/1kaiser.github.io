// js/piping-utils.js
// Provides shared constants and functions for piping server management.
// Simplified to use only ppng.io.

// ===== PIPING SERVER CONFIGURATION =====
const PipingUtils_CURRENT_DOMAIN = 'https://ppng.io/';

// ===== UTILITY FUNCTIONS =====
function PipingUtils_getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// URL builders - use the hardcoded PipingUtils_CURRENT_DOMAIN
function PipingUtils_getSessionUrl(pipeId, sessionId) {
  return `${PipingUtils_CURRENT_DOMAIN}${pipeId}-${sessionId}`;
}

function PipingUtils_getPingUrl(pipeId) {
  return `${PipingUtils_CURRENT_DOMAIN}ping-${pipeId}`;
}

function PipingUtils_posterToSession(pipeId, sessionID, modelId) {
  return `${PipingUtils_CURRENT_DOMAIN}${pipeId}-${sessionID}-${modelId}-poster`;
}

function PipingUtils_gltfToSession(pipeId, sessionID, modelId) {
  return `${PipingUtils_CURRENT_DOMAIN}${pipeId}-${sessionID}-${modelId}`;
}

function PipingUtils_envToSession(pipeId, sessionID, envIsHdr) {
  const addOn = envIsHdr ? '#.hdr' : '';
  return `${PipingUtils_CURRENT_DOMAIN}${pipeId}-${sessionID}-env${addOn}`;
}

function PipingUtils_getMobileOperatingSystem() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (/windows phone/i.test(userAgent)) return 'Windows Phone';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'iOS';
  return 'unknown';
}

// Basic fetch POST and GET utilities.
async function PipingUtils_post(content, url) {
  const response = await fetch(url, {
    method: 'POST', body: content, mode: 'cors',
    headers: { 'Content-Type': typeof content === 'string' ? 'application/json' : 'application/octet-stream' },
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText} from POST ${url}`);
  return response;
}

async function PipingUtils_getWithTimeout(url, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { method: 'GET', signal: controller.signal, mode: 'cors' });
  clearTimeout(id);
  if (!response.ok && response.status !== 404) { // Allow 404 for piping GETs
      throw new Error(`HTTP ${response.status}: ${response.statusText} from GET ${url}`);
  }
  return response;
}


// To make these available globally IF this script is loaded:
window.PipingUtils = {
  // Expose functions
  getRandomInt: PipingUtils_getRandomInt,
  getSessionUrl: PipingUtils_getSessionUrl,
  getPingUrl: PipingUtils_getPingUrl,
  posterToSession: PipingUtils_posterToSession,
  gltfToSession: PipingUtils_gltfToSession,
  envToSession: PipingUtils_envToSession,
  getMobileOperatingSystem: PipingUtils_getMobileOperatingSystem,
  // Expose a getter for the current domain
  getCurrentDomain: () => PipingUtils_CURRENT_DOMAIN,
  // Basic fetch helpers
  post: PipingUtils_post,
  getWithTimeout: PipingUtils_getWithTimeout
};

console.log('[PipingUtils] piping-utils.js loaded and initialized window.PipingUtils.');
