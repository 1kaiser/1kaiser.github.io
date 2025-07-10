/**
 * Updated Google Space Opera Mobile View Implementation
 * Fixed to use working piping servers with automatic fallback
 * Handles server selection and connectivity issues
 */

// ===== PIPING SERVER CONFIGURATION =====
const PIPING_SERVERS = [
  'https://ppng.io/',           // Primary - usually most reliable
  'https://piping.onrender.com/', // Secondary - good fallback  
  'https://piping-server.herokuapp.com/', // Tertiary
  'https://pipes.sh/'           // Additional option
];

// Global state
let CURRENT_DOMAIN = PIPING_SERVERS[0];
let TESTED_SERVERS = new Map();

// ===== UTILITY FUNCTIONS =====
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

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

// ===== SERVER TESTING AND SELECTION =====
async function testPipingServer(serverUrl) {
  try {
    console.log(`🔍 Testing mobile piping server: ${serverUrl}`);
    
    const testResponse = await fetch(serverUrl, { 
      method: 'HEAD', 
      mode: 'cors',
      signal: AbortSignal.timeout(5000)
    });
    
    if (testResponse.status < 500) {
      console.log(`✅ Mobile server working: ${serverUrl}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`❌ Mobile server failed: ${serverUrl} - ${error.message}`);
    return false;
  }
}

async function findWorkingPipingServer() {
  // Check cached results first
  for (const [server, result] of TESTED_SERVERS.entries()) {
    if (result.working && (Date.now() - result.timestamp) < 300000) {
      console.log(`🎯 Using cached working server: ${server}`);
      CURRENT_DOMAIN = server;
      return server;
    }
  }
  
  // Test servers
  for (const server of PIPING_SERVERS) {
    const isWorking = await testPipingServer(server);
    TESTED_SERVERS.set(server, {
      working: isWorking,
      timestamp: Date.now()
    });
    
    if (isWorking) {
      CURRENT_DOMAIN = server;
      console.log(`🌟 Mobile selected working server: ${server}`);
      return server;
    }
  }
  
  console.error('❌ No working piping servers found for mobile');
  return null;
}

// Enhanced fetch functions
async function post(content, url) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: content,
      mode: 'cors',
      signal: AbortSignal.timeout(30000)
    });
    
    if (response.ok) {
      console.log('✅ Mobile POST Success:', url);
    } else {
      console.error('❌ Mobile POST Failed:', url, response.status);
      throw new Error(`Failed to post: ${url}`);
    }
  } catch (error) {
    console.error('❌ Mobile POST Error:', error);
    throw error;
  }
}

async function getWithTimeout(url, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      mode: 'cors'
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// ===== MOBILE VIEW CLASS =====
class GoogleMobileView {
  constructor() {
    // DOM Elements
    this.modelViewer = document.getElementById('mobileModelViewer');
    this.overlay = document.getElementById('overlay');
    this.toastElement = document.getElementById('snackbar-mobile');
    
    // State
    this.modelViewerUrl = '';
    this.posterUrl = '';
    this.currentBlob = undefined;
    this.editorUrls = undefined;
    
    // Configuration
    this.config = {};
    this.arConfig = {};
    this.extraAttributes = {};
    this.hotspots = [];
    this.bestPractices = undefined;
    this.envImageUrl = undefined;
    
    // Piping configuration
    this.pipeId = this.getUrlParam('id');
    this.sessionId = getRandomInt(1e+20);
    this.sessionOs = getMobileOperatingSystem();
    
    // URLs will be set after server is found
    this.mobilePingUrl = '';
    this.sessionUrl = '';
    
    // Toast state
    this.toastClassName = '';
    this.toastBody = '';
    
    console.log('📱 Google Mobile View initialized:', {
      pipeId: this.pipeId,
      sessionId: this.sessionId,
      os: this.sessionOs
    });
    
    // Initialize with server discovery
    this.initialize();
  }

  getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  async initialize() {
    if (!this.modelViewer) {
      console.error('❌ Model viewer element not found');
      this.showToast('Error: Model viewer not found');
      return;
    }
    
    if (!this.pipeId) {
      console.error('❌ No pipe ID found in URL');
      this.showToast('Error: No connection ID found in URL. Please scan QR code again.');
      return;
    }

    // Show loading overlay
    if (this.overlay) {
      this.overlay.style.display = 'flex';
    }

    // Find working server
    this.showToast('Connecting to server...');
    const workingServer = await findWorkingPipingServer();
    
    if (!workingServer) {
      this.showToast('❌ Cannot connect to any servers. Please try again later.');
      if (this.overlay) {
        this.overlay.innerHTML = `
          <div style="text-align: center; color: white; padding: 20px;">
            <h2>Connection Error</h2>
            <p>Cannot connect to piping servers.</p>
            <p>Please check your internet connection and try scanning the QR code again.</p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #4285F4; color: white; border: none; border-radius: 4px;">
              Retry
            </button>
          </div>
        `;
      }
      return;
    }

    // Set URLs with working server
    this.mobilePingUrl = getPingUrl(this.pipeId);
    this.sessionUrl = getSessionUrl(this.pipeId, this.sessionId);
    
    this.showToast(`Connected to: ${workingServer.replace('https://', '').replace('/', '')}`);

    // Set up event listeners
    this.modelViewer.addEventListener('load', () => this.modelIsLoaded());
    
    // Start communication
    console.log('📡 Starting mobile communication...');
    this.ping();
    this.triggerFetchLoop();
    
    console.log('✅ Mobile view initialized successfully');
  }

  // Update state from received data
  updateState(snippet, urls) {
    this.editorUrls = urls;
    this.hotspots = snippet.hotspots || [];
    this.arConfig = snippet.arConfig || {};
    this.config = snippet.config || {};
    this.extraAttributes = snippet.extraAttributes || {};
    this.bestPractices = snippet.bestPractices;
    
    console.log('📊 Mobile state updated:', {
      config: this.config,
      arConfig: this.arConfig,
      urls: urls
    });
  }

  // Scene Viewer mode check
  sceneViewerMode() {
    return this.arConfig.ar &&
           this.arConfig.arModes?.split(' ')[0] === 'scene-viewer';
  }

  // Repost GLTF for scene-viewer
  repostGLTF = async () => {
    try {
      if (this.sessionOs === 'Android' && this.currentBlob) {
        await post(this.currentBlob, this.modelViewerUrl);
        console.log('📤 Model reposted for scene-viewer');
      }
    } catch (error) {
      console.log('❌ Post failed on AR button press:', error);
    }
  };

  // Wait for data from editor
  waitForData(json) {
    const updatedContent = json.updatedContent;
    
    // Show overlay while loading
    if (this.overlay) {
      this.overlay.style.display = 'block';
    }

    this.updateState(json.snippet, json.urls);

    // Set poster URL
    this.posterUrl = posterToSession(this.pipeId, this.sessionId, updatedContent.posterId);

    // Set model URL if changed
    if (updatedContent.gltfChanged) {
      this.modelViewerUrl = gltfToSession(this.pipeId, this.sessionId, updatedContent.gltfId);
    }

    // Set environment image URL
    const { environmentImage } = this.config;
    this.envImageUrl = environmentImage == null ||
            environmentImage === 'neutral' || environmentImage === 'legacy' ?
        environmentImage :
        envToSession(this.pipeId, this.sessionId, updatedContent.envIsHdr);

    // Update model viewer
    this.updateModelViewer();

    // Set up AR button for scene-viewer
    if (this.sceneViewerMode()) {
      this.setupSceneViewerButton();
    }

    // Hide overlay
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  // Update model viewer with new configuration
  updateModelViewer() {
    if (!this.modelViewer) return;

    // Set source and poster
    if (this.modelViewerUrl) {
      this.modelViewer.src = this.modelViewerUrl;
    }
    
    if (this.posterUrl) {
      this.modelViewer.poster = this.posterUrl;
    }

    // Set environment image
    if (this.envImageUrl) {
      this.modelViewer.environmentImage = this.envImageUrl;
    }

    // Apply configuration
    const { config, arConfig } = this;
    
    if (config.autoRotate !== undefined) this.modelViewer.autoRotate = config.autoRotate;
    if (config.cameraControls !== undefined) this.modelViewer.cameraControls = config.cameraControls;
    if (config.shadowIntensity !== undefined) this.modelViewer.shadowIntensity = config.shadowIntensity;
    if (config.shadowSoftness !== undefined) this.modelViewer.shadowSoftness = config.shadowSoftness;
    if (config.exposure !== undefined) this.modelViewer.exposure = config.exposure;
    if (config.toneMapping !== undefined) this.modelViewer.toneMapping = config.toneMapping;
    if (config.reveal !== undefined) this.modelViewer.reveal = config.reveal;
    if (config.cameraOrbit) this.modelViewer.cameraOrbit = config.cameraOrbit;
    if (config.cameraTarget) this.modelViewer.cameraTarget = config.cameraTarget;
    if (config.fieldOfView) this.modelViewer.fieldOfView = config.fieldOfView;
    if (config.minCameraOrbit) this.modelViewer.minCameraOrbit = config.minCameraOrbit;
    if (config.maxCameraOrbit) this.modelViewer.maxCameraOrbit = config.maxCameraOrbit;
    if (config.minFov) this.modelViewer.minFieldOfView = config.minFov;
    if (config.maxFov) this.modelViewer.maxFieldOfView = config.maxFov;

    // Apply AR configuration
    if (arConfig.ar !== undefined) this.modelViewer.ar = arConfig.ar;
    if (arConfig.arModes) this.modelViewer.setAttribute('ar-modes', arConfig.arModes);

    // Apply extra attributes
    for (const [key, value] of Object.entries(this.extraAttributes)) {
      this.modelViewer.setAttribute(key, value);
    }

    console.log('🔄 Model viewer updated with new configuration');
  }

  // Set up scene-viewer button
  setupSceneViewerButton() {
    try {
      const arButton = this.modelViewer.shadowRoot?.querySelector('button[slot="ar-button"]') ||
                      this.modelViewer.shadowRoot?.getElementById('default-ar-button');
      
      if (arButton) {
        arButton.removeEventListener('click', this.repostGLTF);
        arButton.addEventListener('click', this.repostGLTF);
        console.log('🎯 Scene-viewer button configured');
      }
    } catch (error) {
      console.warn('⚠️ Could not configure scene-viewer button:', error);
    }
  }

  // Initialize toast
  initializeToast(json) {
    let body = json.gltfChanged ? 'model, ' : '';
    body = json.envChanged ? body.concat('environment, ') : body;
    body = json.stateChanged ? body.concat('settings, ') : body;
    body = body.slice(0, body.length - 2);
    this.toastBody = `Loading ${body}`;
    this.showToast(this.toastBody);
  }

  // Show toast notification
  showToast(message) {
    if (!this.toastElement) {
      console.log('📢 Toast (no element):', message);
      return;
    }
    
    this.toastElement.textContent = message;
    this.toastElement.className = 'show';
    
    setTimeout(() => {
      this.toastElement.className = '';
    }, 3000);
    
    console.log('📢 Toast:', message);
  }

  // Fetch loop with retry logic
  async fetchLoop() {
    try {
      const response = await getWithTimeout(this.sessionUrl);
      
      if (response.ok) {
        if (this.modelViewer) {
          this.modelViewer.showPoster();
        }
        
        const json = await response.json();
        this.initializeToast(json.updatedContent);
        this.waitForData(json);
        
        return true;
      } else {
        console.error('❌ Error fetching update:', response);
        return false;
      }
    } catch (error) {
      console.error('❌ Error in fetch loop:', error);
      
      // If it's a server connectivity error, try to find a working server
      if (error.message.includes('Failed to fetch') || error.name === 'AbortError') {
        console.log('🔄 Attempting to find alternative server...');
        const newServer = await findWorkingPipingServer();
        if (newServer && newServer !== CURRENT_DOMAIN) {
          this.sessionUrl = getSessionUrl(this.pipeId, this.sessionId);
          this.showToast(`Reconnected to: ${newServer.replace('https://', '').replace('/', '')}`);
          return false; // Try again with new server
        }
      }
      
      return false;
    }
  }

  // Continuous fetch loop
  async triggerFetchLoop() {
    try {
      const success = await this.fetchLoop();
      if (!success) {
        await this.delay(1000);
      }
    } catch (error) {
      console.error('❌ Error triggering fetch:', error);
      await this.delay(1000);
    }
    
    // Continue the loop
    this.triggerFetchLoop();
  }

  // Model loaded handler
  async modelIsLoaded() {
    console.log('📱 Model loaded on mobile device');
    
    // For scene-viewer on Android, export the scene
    if (this.sceneViewerMode()) {
      try {
        this.currentBlob = await this.modelViewer.exportScene();
        
        if (this.modelViewerUrl) {
          await post(this.currentBlob, this.modelViewerUrl);
          console.log('📤 Scene exported and posted for scene-viewer');
        }
      } catch (error) {
        console.error('❌ Failed to export or post scene:', error);
      }
    }
    
    // Update camera
    this.modelViewer.cameraOrbit = 'auto auto auto';
    const { cameraOrbit } = this.config;
    if (cameraOrbit) {
      this.modelViewer.cameraOrbit = cameraOrbit.toString();
    }
    this.modelViewer.jumpCameraToGoal();
    this.modelViewer.dismissPoster();
    
    console.log('✅ Model setup completed');
  }

  // Ping the editor
  async ping() {
    const ping = {
      os: getMobileOperatingSystem(),
      id: this.sessionId,
      isStale: true,
    };
    
    try {
      await post(JSON.stringify(ping), this.mobilePingUrl);
      console.log('📡 Ping sent to editor');
    } catch (error) {
      console.error('❌ Failed to send ping:', error);
      this.showToast('Failed to connect to editor');
    }
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get current statistics
  getStats() {
    return {
      pipeId: this.pipeId,
      sessionId: this.sessionId,
      sessionOs: this.sessionOs,
      modelViewerUrl: this.modelViewerUrl,
      isLoaded: !!this.modelViewer?.loaded,
      arMode: this.arConfig.arModes,
      currentServer: CURRENT_DOMAIN
    };
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.search.includes('id=')) {
    console.log('🚀 Initializing GoogleMobileView for view/index.html');
    window.mobileView = new GoogleMobileView();
  } else {
    console.warn('Mobile view loaded without an ID in the URL. Features may not work. Displaying error.');
    // Optionally, display an error to the user on the page
    document.body.innerHTML = '<div style="padding: 20px; text-align: center; font-family: sans-serif;"><h2>Error: Missing Information</h2><p>This mobile view page requires an ID to load content. Please access it by scanning a QR code from the main gallery.</p></div>';
  }
});

// Export for debugging
window.MobilePipingUtils = {
  PIPING_SERVERS,
  CURRENT_DOMAIN,
  testPipingServer,
  findWorkingPipingServer,
  TESTED_SERVERS
};
    
    // Show error in UI
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div style="text-align: center; color: white; padding: 20px;">
          <h2>Initialization Error</h2>
          <p>Failed to initialize mobile view.</p>
          <p>Error: ${error.message}</p>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #4285F4; color: white; border: none; border-radius: 4px;">
            Retry
          </button>
        </div>
      `;
    }
  }
});

// Export for debugging
window.MobilePipingUtils = {
  PIPING_SERVERS,
  CURRENT_DOMAIN,
  testPipingServer,
  findWorkingPipingServer,
  TESTED_SERVERS
};
