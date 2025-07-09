/**
 * Updated Google Space Opera Mobile View Implementation
 * Fixed to use working piping servers from nwtgck's implementation
 * Handles server selection and fallback automatically
 */

// ===== PIPING SERVER CONFIGURATION =====
const PIPING_SERVERS = [
  'https://ppng.io/',           // Primary - usually most reliable
  'https://piping.onrender.com/', // Secondary - good fallback
  'https://piping-server.herokuapp.com/', // Tertiary - if available
  'https://pipes.sh/'           // Additional option
];

// Global server state
let CURRENT_DOMAIN = PIPING_SERVERS[0]; // Start with first server
let TESTED_SERVERS = new Map(); // Cache test results

// ===== UTILITY FUNCTIONS =====
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// URL builders - updated to use dynamic domain
function getSessionUrl(pipeId, sessionId) {
  return `${CURRENT_DOMAIN}${pipeId}-${sessionId}`;
}

function getPingUrl(pipeId) {
  return `${CURRENT_DOMAIN}ping-${pipeId}`;
}

function posterToSession(pipeId, sessionID, modelId) {
  return `${CURRENT_DOMAIN}${pipeId}-${sessionID}-${modelId}-poster`;
}

function gltfToSession(pipeId, sessionID, modelId) {
  return `${CURRENT_DOMAIN}${pipeId}-${sessionID}-${modelId}`;
}

function envToSession(pipeId, sessionID, envIsHdr) {
  const addOn = envIsHdr ? '#.hdr' : '';
  return `${CURRENT_DOMAIN}${pipeId}-${sessionID}-env${addOn}`;
}

// ===== SERVER TESTING AND SELECTION =====
async function testPipingServer(serverUrl) {
  const testId = getRandomInt(1e+10);
  const testPath = `test-${testId}`;
  const testUrl = `${serverUrl}${testPath}`;
  
  try {
    console.log(`🔍 Testing piping server: ${serverUrl}`);
    
    // Test with a simple HEAD request first
    const headResponse = await fetch(testUrl, { 
      method: 'HEAD', 
      mode: 'cors',
      signal: AbortSignal.timeout(5000)
    });
    
    // If HEAD works, test POST capability
    if (headResponse.status < 500) {
      const postResponse = await fetch(testUrl, {
        method: 'POST',
        body: JSON.stringify({test: 'connectivity'}),
        mode: 'cors',
        signal: AbortSignal.timeout(5000)
      });
      
      if (postResponse.ok || postResponse.status === 404) {
        console.log(`✅ Server working: ${serverUrl}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.log(`❌ Server failed: ${serverUrl} - ${error.message}`);
    return false;
  }
}

async function findWorkingPipingServer() {
  // Check if we have a cached working server
  for (const [server, result] of TESTED_SERVERS.entries()) {
    if (result.working && (Date.now() - result.timestamp) < 300000) { // 5 min cache
      console.log(`🎯 Using cached working server: ${server}`);
      CURRENT_DOMAIN = server;
      return server;
    }
  }
  
  // Test servers in order
  for (const server of PIPING_SERVERS) {
    const isWorking = await testPipingServer(server);
    TESTED_SERVERS.set(server, {
      working: isWorking,
      timestamp: Date.now()
    });
    
    if (isWorking) {
      CURRENT_DOMAIN = server;
      console.log(`🌟 Selected working server: ${server}`);
      return server;
    }
  }
  
  console.error('❌ No working piping servers found');
  return null;
}

// Enhanced POST function with retry logic
async function post(content, url) {
  let lastError;
  
  // Try current server first
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: content,
      mode: 'cors',
      headers: {
        'Content-Type': typeof content === 'string' ? 'application/json' : 'application/octet-stream'
      },
      signal: AbortSignal.timeout(30000)
    });
    
    if (response.ok) {
      console.log('✅ POST Success:', url);
      return response;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    lastError = error;
    console.warn('⚠️ POST failed with current server, trying alternatives...');
  }
  
  // If current server fails, try to find a working one
  const workingServer = await findWorkingPipingServer();
  if (workingServer && workingServer !== CURRENT_DOMAIN) {
    // Retry with new server
    const newUrl = url.replace(CURRENT_DOMAIN, workingServer);
    try {
      const response = await fetch(newUrl, {
        method: 'POST',
        body: content,
        mode: 'cors',
        headers: {
          'Content-Type': typeof content === 'string' ? 'application/json' : 'application/octet-stream'
        },
        signal: AbortSignal.timeout(30000)
      });
      
      if (response.ok) {
        console.log('✅ POST Success with alternative server:', newUrl);
        return response;
      }
    } catch (retryError) {
      console.error('❌ Retry also failed:', retryError);
    }
  }
  
  console.error('❌ All POST attempts failed:', lastError);
  throw lastError;
}

// Enhanced GET function with retry logic
async function getWithTimeout(url, timeout = 30000) {
  let lastError;
  
  // Try current server first
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'GET', 
      signal: controller.signal,
      mode: 'cors'
    });
    
    clearTimeout(id);
    
    if (response.ok) {
      return response;
    } else if (response.status === 404) {
      // 404 is expected for waiting requests
      return response;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    lastError = error;
    
    // Don't retry for timeout/abort errors in GET (normal for piping)
    if (error.name === 'AbortError') {
      throw error;
    }
  }
  
  // If server seems down, try to find working alternative
  const workingServer = await findWorkingPipingServer();
  if (workingServer && workingServer !== CURRENT_DOMAIN) {
    const newUrl = url.replace(CURRENT_DOMAIN, workingServer);
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(newUrl, {
        method: 'GET', 
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(id);
      console.log('✅ GET Success with alternative server');
      return response;
    } catch (retryError) {
      console.error('❌ GET retry failed:', retryError);
    }
  }
  
  throw lastError;
}

function getMobileOperatingSystem() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if (/windows phone/i.test(userAgent)) {
    return 'Windows Phone';
  }

  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }

  return 'unknown';
}

// ===== MOBILE DEPLOYMENT CLASS =====
class GoogleMobileDeployment {
  constructor() {
    // State variables
    this.pipeId = getRandomInt(1e+20);
    this.isDeployed = false;
    this.isDeployable = false;
    this.isSendingData = false;
    this.contentHasChanged = false;
    this.haveReceivedResponse = false;
    this.sessionList = [];
    this.mobilePingUrl = getPingUrl(this.pipeId);
    this.defaultToSceneViewer = false;
    
    // URLs state
    this.urls = { gltf: '', env: '' };
    this.lastUrlsSent = { gltf: '', env: '' };
    
    // Snippet state
    this.snippet = {
      config: {},
      arConfig: {},
      extraAttributes: {},
      hotspots: [],
      bestPractices: undefined
    };
    this.lastSnippetSent = {};
    
    // Configuration
    this.REFRESH_DELAY = 20000; // 20s
    
    // DOM elements
    this.elements = this.initializeElements();
    
    // Initialize server connection
    this.initializeServer();
  }

  async initializeServer() {
    console.log('🚀 Initializing piping server connection...');
    this.updateStatus('Finding working piping server...', 'info');
    
    const workingServer = await findWorkingPipingServer();
    
    if (workingServer) {
      this.updateStatus(`Connected to: ${workingServer}`, 'success');
      console.log(`✅ Successfully connected to: ${workingServer}`);
      
      // Update ping URL with working server
      this.mobilePingUrl = getPingUrl(this.pipeId);
      
      // Initialize event listeners after server is ready
      this.init();
    } else {
      this.updateStatus('❌ No working piping servers available. Please try again later.', 'error');
      console.error('❌ Failed to find working piping server');
      
      // Disable deploy button
      if (this.elements.modalDeployBtn) {
        this.elements.modalDeployBtn.disabled = true;
        this.elements.modalDeployBtn.textContent = 'Servers Unavailable';
      }
    }
  }

  initializeElements() {
    return {
      modalDeployBtn: document.getElementById('modalDeployBtn'),
      qrOverlay: document.getElementById('qrOverlay'),
      qrCloseButton: document.getElementById('qrCloseButton'),
      qrCanvas: document.getElementById('qr-code'),
      qrUrl: document.getElementById('qr-url'),
      refreshMobileBtn: document.getElementById('refreshMobileBtn'),
      statusMessage: document.getElementById('statusMessage'),
      arModeSelector: document.getElementById('arModeSelector')
    };
  }

  init() {
    // Set up event listeners
    if (this.elements.modalDeployBtn) {
      this.elements.modalDeployBtn.addEventListener('click', () => this.onInitialDeploy());
    }
    
    if (this.elements.qrCloseButton) {
      this.elements.qrCloseButton.addEventListener('click', () => this.closeModal());
    }
    
    if (this.elements.refreshMobileBtn) {
      this.elements.refreshMobileBtn.addEventListener('click', () => this.postInfo());
    }
    
    if (this.elements.arModeSelector) {
      this.elements.arModeSelector.addEventListener('change', (e) => {
        this.onSelectArMode(e.target.checked);
      });
    }

    // Modal close events
    if (this.elements.qrOverlay) {
      this.elements.qrOverlay.addEventListener('click', (e) => {
        if (e.target === this.elements.qrOverlay) this.closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.qrOverlay?.style.display === 'flex') {
        this.closeModal();
      }
    });

    console.log('🔧 Google Mobile Deployment initialized');
  }

  // Get viewable site URL
  get viewableSite() {
    const path = window.location.origin + window.location.pathname;
    return `${path}view/?id=${this.pipeId}`;
  }

  // Check if we can refresh
  get canRefresh() {
    return this.isDeployed && this.haveReceivedResponse &&
           !this.isSendingData && this.contentHasChanged;
  }

  // Update current state based on gallery selection
  updateState() {
    const gltfURL = window.currentModelSrc;
    this.isDeployable = gltfURL !== undefined;
    
    this.urls = {
      gltf: gltfURL,
      env: undefined
    };

    this.snippet = {
      config: {
        ar: true,
        autoRotate: true,
        cameraControls: true,
        shadowIntensity: 1
      },
      arConfig: {
        ar: true,
        arModes: this.defaultToSceneViewer ? 
          'scene-viewer webxr quick-look' : 
          'webxr scene-viewer quick-look'
      },
      extraAttributes: {},
      hotspots: []
    };

    this.contentHasChanged = this.getContentHasChanged();
  }

  // Check if content has changed
  getContentHasChanged() {
    return this.stateHasChanged() || this.isNewModel() ||
           this.isNewSource(this.urls.env, this.lastUrlsSent.env);
  }

  stateHasChanged() {
    return JSON.stringify(this.snippet) !== JSON.stringify(this.lastSnippetSent);
  }

  isNewSource(src, lastSrc) {
    return src !== undefined && (src !== lastSrc);
  }

  isNewModel() {
    return this.isNewSource(this.urls.gltf, this.lastUrlsSent.gltf);
  }

  envIsHdr() {
    return typeof this.urls.env === 'string' &&
           this.urls.env.substr(this.urls.env.length - 4) === '.hdr';
  }

  // Get updated content flags
  getUpdatedContent() {
    return {
      gltfChanged: this.isNewModel(),
      stateChanged: this.stateHasChanged(),
      posterId: getRandomInt(1e+20),
      envChanged: this.isNewSource(this.urls.env, this.lastUrlsSent.env),
      envIsHdr: this.envIsHdr(),
      gltfId: getRandomInt(1e+20)
    };
  }

  // Get stale content
  getStaleContent() {
    return {
      gltfChanged: true,
      stateChanged: true,
      posterId: getRandomInt(1e+20),
      envChanged: this.urls.env != undefined &&
                 this.urls.env !== 'neutral' && this.urls.env !== 'legacy',
      envIsHdr: this.envIsHdr(),
      gltfId: getRandomInt(1e+20)
    };
  }

  // Initial deployment
  onInitialDeploy() {
    this.updateState();
    
    if (!this.isDeployable) {
      this.updateStatus('No model selected. Please select a model first.', 'error');
      return;
    }

    this.openModal();
    this.isDeployed = true;
    
    if (this.snippet.arConfig.arModes === undefined) {
      this.snippet.arConfig.arModes = 'webxr scene-viewer quick-look';
    }
    
    this.pingLoop();
    this.updateStatus(`QR code generated. Using server: ${CURRENT_DOMAIN}`, 'info');
  }

  // Open QR modal
  openModal() {
    if (!this.elements.qrCanvas || !window.QRCode) {
      this.updateStatus('QR code functionality not available', 'error');
      return;
    }

    // Generate QR code
    QRCode.toCanvas(this.elements.qrCanvas, this.viewableSite, { width: 200 }, (error) => {
      if (error) {
        console.error('QR code generation failed:', error);
        this.updateStatus('Failed to generate QR code', 'error');
      }
    });

    // Show URL and server info
    if (this.elements.qrUrl) {
      this.elements.qrUrl.innerHTML = `
        <div style="margin-bottom: 10px;">${this.viewableSite}</div>
        <div style="font-size: 10px; color: #666;">Using: ${CURRENT_DOMAIN}</div>
      `;
    }

    // Show overlay
    if (this.elements.qrOverlay) {
      this.elements.qrOverlay.style.display = 'flex';
    }

    // Show refresh button
    if (this.elements.refreshMobileBtn) {
      this.elements.refreshMobileBtn.style.display = 'block';
    }
  }

  closeModal() {
    if (this.elements.qrOverlay) {
      this.elements.qrOverlay.style.display = 'none';
    }
  }

  // Ping loop with enhanced error handling
  async pingLoop() {
    if (!this.isDeployed) return;

    try {
      const pingReceived = await this.waitForPing();
      if (!pingReceived) {
        await this.delay(1000);
      }
    } catch (error) {
      console.log('Ping error:', error);
      
      // If it's a server error, try to find working server
      if (error.message.includes('Failed to fetch') || error.message.includes('HTTP 5')) {
        this.updateStatus('Server connection lost, finding alternative...', 'error');
        const newServer = await findWorkingPipingServer();
        if (newServer) {
          this.mobilePingUrl = getPingUrl(this.pipeId);
          this.updateStatus(`Reconnected to: ${newServer}`, 'success');
        }
      }
      
      await this.delay(1000);
    }
    
    this.pingLoop();
  }

  // Wait for ping
  async waitForPing() {
    try {
      const response = await getWithTimeout(this.mobilePingUrl);
      
      if (response.ok) {
        const json = await response.json();
        this.sessionList.push(json);
        
        if (!this.isSendingData) {
          this.postInfo();
        }
        
        this.haveReceivedResponse = true;
        this.updateStatus(`Mobile device connected (${this.sessionList.length} devices)`, 'success');
        return true;
      }
      
      return false;
    } catch (error) {
      if (error.name === 'AbortError') {
        return false; // Normal timeout, not an error
      }
      throw error;
    }
  }

  // Post info to mobile
  async postInfo() {
    if (this.isSendingData) {
      console.log('Already sending data, skipping...');
      return;
    }
    
    console.log('📤 Posting info to mobile devices...');
    this.isSendingData = true;
    this.updateRefreshButton('sending');
    this.updateStatus('Syncing with mobile devices...', 'info');
    
    setTimeout(() => {
      this.isSendingData = false;
      this.updateRefreshButton('ready');
    }, this.REFRESH_DELAY);

    try {
      this.updateState();
      const sessionList = [...this.sessionList];
      const updatedContent = this.getUpdatedContent();
      const staleContent = this.getStaleContent();

      let haveStale = false;
      for (let session of this.sessionList) {
        haveStale = haveStale || session.isStale;
      }

      const gltfBlob = (updatedContent.gltfChanged || (haveStale && staleContent.gltfChanged)) ?
        await this.exportModelScene() : undefined;

      let envBlob;
      const { env } = this.urls;
      if (env != null && env !== 'neutral' && env !== 'legacy' &&
          (updatedContent.envChanged || (haveStale && staleContent.envChanged))) {
        try {
          const response = await fetch(env);
          if (response.ok) {
            envBlob = await response.blob();
          }
        } catch (error) {
          console.warn('Failed to fetch environment image:', error);
        }
      }

      const posterBlob = await this.createPoster();

      for (let session of sessionList) {
        await this.sendSessionContent(session, updatedContent, posterBlob, gltfBlob, envBlob);
      }

      this.lastSnippetSent = { ...this.snippet };
      this.lastUrlsSent.env = env;
      this.lastUrlsSent.gltf = this.urls.gltf;

      this.contentHasChanged = this.getContentHasChanged();
      this.updateStatus('Successfully synced with mobile devices', 'success');
      this.updateRefreshButton('success');

    } catch (error) {
      console.error('❌ Failed to post info:', error);
      this.updateStatus(`Failed to sync: ${error.message}`, 'error');
      this.updateRefreshButton('error');
    }
  }

  // Send content to individual session
  async sendSessionContent(session, updatedContent, posterBlob, gltfBlob, envBlob) {
    if (session.isStale) {
      updatedContent = this.getStaleContent();
    }
    session.isStale = true;

    const packet = {
      updatedContent: updatedContent,
      snippet: this.snippet,
      urls: this.urls
    };

    try {
      await post(JSON.stringify(packet), getSessionUrl(this.pipeId, session.id));
      await post(posterBlob, posterToSession(this.pipeId, session.id, updatedContent.posterId));

      if (updatedContent.gltfChanged && gltfBlob) {
        await post(gltfBlob, gltfToSession(this.pipeId, session.id, updatedContent.gltfId));
      }

      if (updatedContent.envChanged && envBlob) {
        await post(envBlob, envToSession(this.pipeId, session.id, updatedContent.envIsHdr));
      }

      session.isStale = false;
      console.log(`✅ Successfully sent to session ${session.id}`);
    } catch (error) {
      console.error(`❌ Failed to send to session ${session.id}:`, error);
      session.isStale = true;
      throw error;
    }
  }

  // Export model scene
  async exportModelScene() {
    const modalViewer = document.getElementById('modalModelViewer');
    if (modalViewer && typeof modalViewer.exportScene === 'function') {
      return await modalViewer.exportScene();
    }
    
    if (this.urls.gltf) {
      const response = await fetch(this.urls.gltf);
      if (response.ok) {
        return await response.blob();
      }
    }
    
    throw new Error('Could not export model scene');
  }

  // Create poster image
  async createPoster() {
    try {
      const modalViewer = document.getElementById('modalModelViewer');
      if (modalViewer && typeof modalViewer.toDataURL === 'function') {
        const dataUrl = await modalViewer.toDataURL('image/jpeg', 0.8);
        const response = await fetch(dataUrl);
        return await response.blob();
      }
    } catch (error) {
      console.warn('Could not create poster image:', error);
    }
    
    return new Blob(['poster'], { type: 'image/jpeg' });
  }

  // AR mode selection
  onSelectArMode(isSceneViewer) {
    this.defaultToSceneViewer = isSceneViewer;
    if (this.defaultToSceneViewer) {
      this.snippet.arConfig.arModes = 'scene-viewer webxr quick-look';
    } else {
      this.snippet.arConfig.arModes = 'webxr scene-viewer quick-look';
    }
    this.contentHasChanged = true;
    
    if (this.sessionList.length > 0 && this.elements.refreshMobileBtn) {
      this.elements.refreshMobileBtn.style.display = 'block';
    }
  }

  // UI update methods
  updateStatus(message, type = 'info') {
    if (this.elements.statusMessage) {
      const colors = {
        info: '#4285F4',
        success: '#34A853',
        error: '#EA4335'
      };
      
      this.elements.statusMessage.textContent = message;
      this.elements.statusMessage.style.color = colors[type] || colors.info;
      this.elements.statusMessage.style.display = 'block';
      
      console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
  }

  updateRefreshButton(state) {
    const btn = this.elements.refreshMobileBtn;
    if (!btn) return;

    const states = {
      sending: { text: 'Sending...', color: '#FFA500', disabled: true },
      success: { text: 'Successfully Synced', color: '#34A853', disabled: false },
      error: { text: 'Sync Failed - Retry', color: '#EA4335', disabled: false },
      ready: { text: 'Refresh Mobile', color: '#34A853', disabled: false }
    };

    const config = states[state];
    if (config) {
      btn.textContent = config.text;
      btn.style.backgroundColor = config.color;
      btn.disabled = config.disabled;
    }
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 Initializing Google Mobile Deployment with updated servers...');
    
    // Initialize the mobile deployment (it will handle server selection internally)
    window.mobileDeployment = new GoogleMobileDeployment();
    
  } catch (error) {
    console.error('❌ Failed to initialize Google Mobile Deployment:', error);
    
    // Show user-friendly error
    const statusEl = document.getElementById('statusMessage');
    if (statusEl) {
      statusEl.textContent = 'Failed to initialize mobile deployment. Please refresh and try again.';
      statusEl.style.color = '#EA4335';
      statusEl.style.display = 'block';
    }
  }
});

// Export for debugging
window.PipingServerUtils = {
  PIPING_SERVERS,
  CURRENT_DOMAIN,
  testPipingServer,
  findWorkingPipingServer,
  TESTED_SERVERS
};
