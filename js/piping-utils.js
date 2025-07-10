// js/piping-utils.js
// Provides shared constants and functions for piping server management.

// ===== PIPING SERVER CONFIGURATION =====
const PIPING_SERVERS = [
  'https://ppng.io/',
  'https://piping.onrender.com/',
  'https://piping-server.herokuapp.com/',
  'https://pipes.sh/'
];

// Global server state managed by these utils
// These are intended to be modified by findWorkingPipingServer and used by URL builders.
var PipingUtils_CURRENT_DOMAIN = PIPING_SERVERS[0]; // Using var for wider compatibility if not module
var PipingUtils_TESTED_SERVERS = new Map();

// ===== UTILITY FUNCTIONS =====
function PipingUtils_getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// URL builders - use the PipingUtils_CURRENT_DOMAIN
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

// ===== SERVER TESTING AND SELECTION =====
async function PipingUtils_testPipingServer(serverUrl) {
  const testId = PipingUtils_getRandomInt(1e+10);
  const testPath = `test-${testId}`;
  const testUrl = `${serverUrl}${testPath}`;

  try {
    // console.log(`🔍 [PipingUtils] Testing server: ${serverUrl}`);
    const headResponse = await fetch(testUrl, { method: 'HEAD', mode: 'cors', signal: AbortSignal.timeout(3000) });
    if (headResponse.status < 500) {
      const postResponse = await fetch(testUrl, {
        method: 'POST', body: JSON.stringify({test: 'connectivity'}), mode: 'cors',
        headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(3000)
      });
      if (postResponse.ok || postResponse.status === 404) {
        // console.log(`✅ [PipingUtils] Server working: ${serverUrl}`);
        return true;
      }
    }
    // console.log(`⚠️ [PipingUtils] Server test failed (HEAD or POST): ${serverUrl}`);
    return false;
  } catch (error) {
    // console.log(`❌ [PipingUtils] Server test exception: ${serverUrl} - ${error.message}`);
    return false;
  }
}

async function PipingUtils_findWorkingPipingServer() {
  // console.log('[PipingUtils] Finding working piping server...');
  for (const [server, result] of PipingUtils_TESTED_SERVERS.entries()) {
    if (result.working && (Date.now() - result.timestamp) < 300000) { // 5 min cache
      // console.log(`🎯 [PipingUtils] Using cached working server: ${server}`);
      PipingUtils_CURRENT_DOMAIN = server;
      return server;
    }
  }

  for (const server of PIPING_SERVERS) { // Uses const PIPING_SERVERS from this file
    const isWorking = await PipingUtils_testPipingServer(server);
    PipingUtils_TESTED_SERVERS.set(server, { working: isWorking, timestamp: Date.now() });
    if (isWorking) {
      PipingUtils_CURRENT_DOMAIN = server;
      console.log(`🌟 [PipingUtils] Selected working server: ${server}`);
      return server;
    }
  }

  console.error('❌ [PipingUtils] No working piping servers found.');
  PipingUtils_CURRENT_DOMAIN = PIPING_SERVERS[0]; // Fallback
  console.warn(`⚠️ [PipingUtils] Defaulting to first server: ${PipingUtils_CURRENT_DOMAIN} as no server passed tests.`);
  return null; // Indicates no server *passed tests*, but CURRENT_DOMAIN is set to a default.
}

// Basic fetch POST and GET utilities.
// The more complex retry logic and ErrorHandler integration will remain in the consuming scripts (qr-deploy.js, mobile_view.js)
// as they are more tightly coupled with the specific error handling and UI update needs of those contexts.
// These are simpler helpers if needed, or can be omitted if the consuming scripts always use their own.

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
// (This is a simple approach; modules would be better for larger projects)
window.PipingUtils = {
  PIPING_SERVERS, // Expose the list
  // Expose functions, they will use the internal PipingUtils_CURRENT_DOMAIN and PipingUtils_TESTED_SERVERS
  getRandomInt: PipingUtils_getRandomInt,
  getSessionUrl: PipingUtils_getSessionUrl,
  getPingUrl: PipingUtils_getPingUrl,
  posterToSession: PipingUtils_posterToSession,
  gltfToSession: PipingUtils_gltfToSession,
  envToSession: PipingUtils_envToSession,
  getMobileOperatingSystem: PipingUtils_getMobileOperatingSystem,
  findWorkingPipingServer: PipingUtils_findWorkingPipingServer, // This sets the internal domain and returns it
  // Expose a getter for the current domain determined by findWorkingPipingServer
  getCurrentDomain: () => PipingUtils_CURRENT_DOMAIN,
  // Basic fetch helpers (optional, consuming scripts might have their own more complex ones)
  post: PipingUtils_post,
  getWithTimeout: PipingUtils_getWithTimeout
};

console.log('[PipingUtils] piping-utils.js loaded and initialized window.PipingUtils.');
