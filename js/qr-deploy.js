/**
 * Google Space Opera Mobile View Implementation
 * Direct JavaScript translation from TypeScript
 * Handles CORS issues for GitHub Pages deployment
 */

// ===== UTILITY FUNCTIONS (from utils.ts) =====
const DOMAIN = 'https://piping.glitch.me/';

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// URL builders - exact copies from Google's utils.ts
function getSessionUrl(pipeId, sessionId) {
  return `${DOMAIN}${pipeId}-${sessionId}`;
}

function getPingUrl(pipeId) {
  return `${DOMAIN}ping-${pipeId}`;
}

function posterToSession(pipeId, sessionID, modelId) {
  return `${DOMAIN}${pipeId}-${sessionID}-${modelId}-poster`;
}

function gltfToSession(pipeId, sessionID, modelId) {
  return `${DOMAIN}${pipeId}-${sessionID}-${modelId}`;
}

function envToSession(pipeId, sessionID, envIsHdr) {
  const addOn = envIsHdr ? '#.hdr' : '';
  return `${DOMAIN}${pipeId}-${sessionID}-env${addOn}`;
}

// CORS-enabled POST function
async function post(content, url) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: content,
      mode: 'cors', // Explicit CORS mode
      headers: {
        'Content-Type': typeof content === 'string' ? 'application/json' : 'application/octet-stream'
      }
    });
    
    if (response.ok) {
      console.log('✅ POST Success:', url);
      return response;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ POST Failed:', url, error);
    throw error;
  }
}

// CORS-enabled GET with timeout (exact copy from Google's implementation)
async function getWithTimeout(url, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET', 
      signal: controller.signal,
      mode: 'cors' // Explicit CORS mode
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

function getMobileOperatingSystem() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Windows Phone must come first because its UA also contains "Android"
  if (/windows phone/i.test(userAgent)) {
    return 'Windows Phone';
  }

  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  // iOS detection from: http://stackoverflow.com/a/9039885/177710
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }

  return 'unknown';
}

// ===== MOBILE DEPLOYMENT CLASS (from open_mobile_view.ts) =====
class GoogleMobileDeployment {
  constructor() {
    // State variables (exact match to Google's implementation)
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
    
    // Snippet state (model viewer configuration)
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
    
    // Initialize
    this.init();
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

  // Get viewable site URL (exact copy from Google's implementation)
  get viewableSite() {
    const path = window.location.origin + window.location.pathname;
    return `${path}view/?id=${this.pipeId}`;
  }

  // Check if we can refresh (exact logic from Google's implementation)
  get canRefresh() {
    return this.isDeployed && this.haveReceivedResponse &&
           !this.isSendingData && this.contentHasChanged;
  }

  // Update current state based on gallery selection
  updateState() {
    // Get current model info from global variables
    const gltfURL = window.currentModelSrc;
    this.isDeployable = gltfURL !== undefined;
    
    // Update URLs
    this.urls = {
      gltf: gltfURL,
      env: undefined // Environment images not implemented yet
    };

    // Update snippet with current model configuration
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

  // Check if content has changed (exact logic from Google's implementation)
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

  // Get updated content flags (exact copy from Google's implementation)
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

  // Get stale content (forces everything to update)
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

  // Initial deployment (exact copy from Google's implementation)
  onInitialDeploy() {
    this.updateState();
    
    if (!this.isDeployable) {
      this.updateStatus('No model selected. Please select a model first.', 'error');
      return;
    }

    this.openModal();
    this.isDeployed = true;
    
    // Set default AR modes if not set
    if (this.snippet.arConfig.arModes === undefined) {
      this.snippet.arConfig.arModes = 'webxr scene-viewer quick-look';
    }
    
    this.pingLoop();
    this.updateStatus('QR code generated. Scan with your mobile device.', 'info');
  }

  // Open QR modal (exact copy from Google's implementation)
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

    // Show URL
    if (this.elements.qrUrl) {
      this.elements.qrUrl.textContent = this.viewableSite;
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

  // Ping loop (exact copy from Google's implementation)
  async pingLoop() {
    if (!this.isDeployed) return;

    try {
      const pingReceived = await this.waitForPing();
      if (!pingReceived) {
        await this.delay(1000);
      }
    } catch (error) {
      console.log('Ping error:', error);
      await this.delay(1000);
    }
    
    // Continue loop
    this.pingLoop();
  }

  // Wait for ping (exact copy from Google's implementation)
  async waitForPing() {
    try {
      const response = await getWithTimeout(this.mobilePingUrl);
      
      if (response.ok) {
        const json = await response.json();
        this.sessionList.push(json);
        
        // Only update if not currently updating
        if (!this.isSendingData) {
          this.postInfo();
        }
        
        this.haveReceivedResponse = true;
        this.updateStatus(`Mobile device connected (${this.sessionList.length} devices)`, 'success');
        return true;
      }
      
      return false;
    } catch (error) {
      // Handle CORS errors gracefully
      if (error.message.includes('CORS')) {
        this.updateStatus('CORS error: Try running from localhost or use HTTPS', 'error');
      }
      return false;
    }
  }

  // Post info to mobile (exact copy from Google's implementation)
  async postInfo() {
    if (this.isSendingData) {
      console.log('Already sending data, skipping...');
      return;
    }
    
    console.log('📤 Posting info to mobile devices...');
    this.isSendingData = true;
    this.updateRefreshButton('sending');
    
    // Auto-reset after delay
    setTimeout(() => {
      this.isSendingData = false;
      this.updateRefreshButton('ready');
    }, this.REFRESH_DELAY);

    try {
      this.updateState();
      const sessionList = [...this.sessionList];
      const updatedContent = this.getUpdatedContent();
      const staleContent = this.getStaleContent();

      // Check if any sessions are stale
      let haveStale = false;
      for (let session of this.sessionList) {
        haveStale = haveStale || session.isStale;
      }

      // Get model data
      const gltfBlob = (updatedContent.gltfChanged || (haveStale && staleContent.gltfChanged)) ?
        await this.exportModelScene() : undefined;

      // Get environment data (not implemented yet)
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

      // Create poster
      const posterBlob = await this.createPoster();

      // Send to all sessions
      for (let session of sessionList) {
        await this.sendSessionContent(session, updatedContent, posterBlob, gltfBlob, envBlob);
      }

      // Update last sent state
      this.lastSnippetSent = { ...this.snippet };
      this.lastUrlsSent.env = env;
      this.lastUrlsSent.gltf = this.urls.gltf;

      this.contentHasChanged = this.getContentHasChanged();
      this.updateStatus('Successfully synced with mobile devices', 'success');
      this.updateRefreshButton('success');

    } catch (error) {
      console.error('❌ Failed to post info:', error);
      this.updateStatus('Failed to sync with mobile devices', 'error');
      this.updateRefreshButton('error');
    }
  }

  // Send content to individual session (exact copy from Google's implementation)
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
      // Send packet
      await post(JSON.stringify(packet), getSessionUrl(this.pipeId, session.id));

      // Send poster
      await post(posterBlob, posterToSession(this.pipeId, session.id, updatedContent.posterId));

      // Send model if changed
      if (updatedContent.gltfChanged && gltfBlob) {
        await post(gltfBlob, gltfToSession(this.pipeId, session.id, updatedContent.gltfId));
      }

      // Send environment if changed
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
    
    // Fallback: fetch the model directly
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
    
    // Return placeholder
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

// ===== ALTERNATIVE PIPING SERVERS FOR CORS ISSUES =====
const ALTERNATIVE_PIPING_SERVERS = [
  'https://piping.glitch.me/',
  'https://ppng.io/',
  'https://piping-server.herokuapp.com/',
  'https://pipes.sh/'
];

// Function to test which piping server works
async function findWorkingPipingServer() {
  for (const server of ALTERNATIVE_PIPING_SERVERS) {
    try {
      console.log(`🔍 Testing piping server: ${server}`);
      const response = await fetch(server, { 
        method: 'HEAD', 
        mode: 'cors',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok || response.status < 500) {
        console.log(`✅ Working server found: ${server}`);
        return server;
      }
    } catch (error) {
      console.log(`❌ Server failed: ${server} - ${error.message}`);
    }
  }
  
  console.error('❌ No working piping servers found');
  return null;
}

// ===== CORS PROXY FALLBACK =====
class CORSProxyManager {
  constructor() {
    this.proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://thingproxy.freeboard.io/fetch/'
    ];
    this.currentProxy = 0;
  }

  async proxyFetch(url, options = {}) {
    for (let i = 0; i < this.proxies.length; i++) {
      try {
        const proxy = this.proxies[(this.currentProxy + i) % this.proxies.length];
        const proxyUrl = proxy + encodeURIComponent(url);
        
        console.log(`🌐 Trying CORS proxy: ${proxy}`);
        const response = await fetch(proxyUrl, options);
        
        if (response.ok) {
          this.currentProxy = (this.currentProxy + i) % this.proxies.length;
          console.log(`✅ CORS proxy success: ${proxy}`);
          return response;
        }
      } catch (error) {
        console.log(`❌ CORS proxy failed: ${this.proxies[(this.currentProxy + i) % this.proxies.length]}`);
      }
    }
    
    throw new Error('All CORS proxies failed');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 Initializing Google Mobile Deployment...');
    
    // Test piping server connectivity
    const workingServer = await findWorkingPipingServer();
    
    if (workingServer) {
      // Override DOMAIN if we found a working alternative
      if (workingServer !== DOMAIN) {
        console.log(`🔄 Switching to working server: ${workingServer}`);
        // You would need to update the DOMAIN constant here
      }
      
      window.mobileDeployment = new GoogleMobileDeployment();
      console.log('✅ Google Mobile Deployment initialized successfully');
    } else {
      console.error('❌ No piping servers available. CORS issues detected.');
      
      // Show user-friendly error
      const statusEl = document.getElementById('statusMessage');
      if (statusEl) {
        statusEl.textContent = 'Mobile deployment unavailable due to CORS restrictions. Please run from localhost or use HTTPS.';
        statusEl.style.color = '#EA4335';
        statusEl.style.display = 'block';
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize Google Mobile Deployment:', error);
  }
});
