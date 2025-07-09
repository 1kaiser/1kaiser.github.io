/**
 * Google Space Opera Mobile View Implementation
 * Direct JavaScript translation from mobile_view.ts
 * Runs on mobile devices to receive and display 3D models via piping
 */

// ===== CONSTANTS AND UTILITIES =====
const DOMAIN = 'https://piping.glitch.me/';
const TOAST_TIME = 3000; // 3 seconds

// Utility functions (exact copies from Google's utils.ts)
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

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

async function post(content, url) {
  const response = await fetch(url, {
    method: 'POST',
    body: content,
  });
  
  if (response.ok) {
    console.log('✅ POST Success:', url);
  } else {
    console.error('❌ POST Failed:', url);
    throw new Error(`Failed to post: ${url}`);
  }
}

async function getWithTimeout(url, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
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

function timePasses(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== MOBILE VIEW CLASS (from mobile_view.ts) =====
class GoogleMobileView {
  constructor() {
    // DOM Elements
    this.modelViewer = document.getElementById('mobileModelViewer');
    this.overlay = document.getElementById('overlay');
    this.toastElement = document.getElementById('snackbar-mobile');
    
    // State (exact match to Google's implementation)
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
    this.pipeId = window.location.search.replace('?id=', '');
    this.mobilePingUrl = getPingUrl(this.pipeId);
    this.sessionId = getRandomInt(1e+20);
    this.sessionUrl = getSessionUrl(this.pipeId, this.sessionId);
    this.sessionOs = getMobileOperatingSystem();
    
    // Toast state
    this.toastClassName = '';
    this.toastBody = '';
    
    console.log('📱 Google Mobile View initialized:', {
      pipeId: this.pipeId,
      sessionId: this.sessionId,
      os: this.sessionOs
    });
    
    // Initialize
    this.initialize();
  }

  initialize() {
    if (!this.modelViewer) {
      console.error('❌ Model viewer element not found');
      return;
    }
    
    if (!this.pipeId) {
      console.error('❌ No pipe ID found in URL');
      this.showToast('Error: No connection ID found in URL');
      return;
    }

    // Set up event listeners
    this.modelViewer.addEventListener('load', () => this.modelIsLoaded());
    
    // Show overlay initially
    if (this.overlay) {
      this.overlay.style.display = 'flex';
    }
    
    // Start the communication process
    this.ping();
    this.triggerFetchLoop();
    
    console.log('✅ Mobile view initialized successfully');
  }

  // Update state from received data (exact copy from Google's implementation)
  updateState(snippet, urls) {
    this.editorUrls = urls;
    this.hotspots = snippet.hotspots || [];

    // Set all of the other relevant snippet information
    this.arConfig = snippet.arConfig || {};
    this.config = snippet.config || {};
    this.extraAttributes = snippet.extraAttributes || {};
    this.bestPractices = snippet.bestPractices;
    
    console.log('📊 State updated:', {
      config: this.config,
      arConfig: this.arConfig,
      urls: urls
    });
  }

  // Scene Viewer mode check (exact copy from Google's implementation)
  sceneViewerMode() {
    return this.arConfig.ar &&
           this.arConfig.arModes?.split(' ')[0] === 'scene-viewer';
  }

  // Repost GLTF for scene-viewer (exact copy from Google's implementation)
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

  // Wait for data from editor (exact copy from Google's implementation)
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

    // Update model viewer attributes
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

    // Apply configuration (exact mapping from Google's implementation)
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

  // Set up scene-viewer button (exact copy from Google's implementation)
  setupSceneViewerButton() {
    try {
      const arButton = this.modelViewer.shadowRoot?.querySelector('button[slot="ar-button"]') ||
                      this.modelViewer.shadowRoot?.getElementById('default-ar-button');
      
      if (arButton) {
        // Remove existing listeners to prevent duplicates
        arButton.removeEventListener('click', this.repostGLTF);
        
        // Add new listener for scene-viewer POST
        arButton.addEventListener('click', this.repostGLTF);
        console.log('🎯 Scene-viewer button configured');
      }
    } catch (error) {
      console.warn('⚠️ Could not configure scene-viewer button:', error);
    }
  }

  // Initialize toast (exact copy from Google's implementation)
  initializeToast(json) {
    let body = json.gltfChanged ? 'gltf model, ' : '';
    body = json.envChanged ? body.concat('environment image, ') : body;
    body = json.stateChanged ? body.concat('snippet, ') : body;
    body = body.slice(0, body.length - 2).concat('.');
    this.toastBody = `Loading ${body}`;
    this.showToast(this.toastBody);
  }

  // Show toast notification
  showToast(message) {
    if (!this.toastElement) return;
    
    this.toastElement.textContent = message;
    this.toastElement.className = 'show';
    
    setTimeout(() => {
      this.toastElement.className = '';
    }, TOAST_TIME);
    
    console.log('📢 Toast:', message);
  }

  // Fetch loop to get updates from editor (exact copy from Google's implementation)
  async fetchLoop() {
    try {
      const response = await getWithTimeout(this.sessionUrl);
      
      if (response.ok) {
        // Show poster while loading new data
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
      return false;
    }
  }

  // Continuous fetch loop (exact copy from Google's implementation)
  async triggerFetchLoop() {
    try {
      const success = await this.fetchLoop();
      if (!success) {
        await timePasses(1000);
      }
    } catch (error) {
      console.error('❌ Error triggering fetch:', error);
      await timePasses(1000);
    }
    
    // Continue the loop
    this.triggerFetchLoop();
  }

  // Model loaded handler (exact copy from Google's implementation)
  async modelIsLoaded() {
    console.log('📱 Model loaded on mobile device');
    
    // For scene-viewer on Android, export the scene
    if (this.sceneViewerMode()) {
      try {
        this.currentBlob = await this.modelViewer.exportScene();
        
        // Post the blob to the URL for scene-viewer
        if (this.modelViewerUrl) {
          await post(this.currentBlob, this.modelViewerUrl);
          console.log('📤 Scene exported and posted for scene-viewer');
        }
      } catch (error) {
        console.error('❌ Failed to export or post scene:', error);
      }
    }
    
    // Update camera (exact copy from Google's implementation)
    this.modelViewer.cameraOrbit = 'auto auto auto';
    const { cameraOrbit } = this.config;
    if (cameraOrbit) {
      this.modelViewer.cameraOrbit = cameraOrbit.toString();
    }
    this.modelViewer.jumpCameraToGoal();
    this.modelViewer.dismissPoster();
    
    console.log('✅ Model setup completed');
  }

  // Ping the editor (exact copy from Google's implementation)
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

  // Get current statistics
  getStats() {
    return {
      pipeId: this.pipeId,
      sessionId: this.sessionId,
      sessionOs: this.sessionOs,
      modelViewerUrl: this.modelViewerUrl,
      isLoaded: !!this.modelViewer?.loaded,
      arMode: this.arConfig.arModes
    };
  }
}

// ===== ALTERNATIVE MOBILE VIEW FOR CORS ISSUES =====
class CORSFallbackMobileView extends GoogleMobileView {
  constructor() {
    super();
    this.corsProxies = [
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://thingproxy.freeboard.io/fetch/'
    ];
    this.currentProxy = 0;
  }

  async getWithTimeout(url, timeout = 30000) {
    // Try direct fetch first
    try {
      return await super.getWithTimeout(url, timeout);
    } catch (error) {
      if (error.message.includes('CORS')) {
        console.log('🌐 CORS error detected, trying proxy...');
        return await this.proxyFetch(url, timeout);
      }
      throw error;
    }
  }

  async proxyFetch(url, timeout) {
    for (let i = 0; i < this.corsProxies.length; i++) {
      try {
        const proxy = this.corsProxies[(this.currentProxy + i) % this.corsProxies.length];
        const proxyUrl = proxy + encodeURIComponent(url);
        
        console.log(`🌐 Trying CORS proxy: ${proxy}`);
        const response = await fetch(proxyUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(timeout)
        });
        
        if (response.ok) {
          this.currentProxy = (this.currentProxy + i) % this.corsProxies.length;
          console.log(`✅ CORS proxy success: ${proxy}`);
          return response;
        }
      } catch (error) {
        console.log(`❌ CORS proxy failed: ${this.corsProxies[(this.currentProxy + i) % this.corsProxies.length]}`);
      }
    }
    
    throw new Error('All CORS proxies failed');
  }
}

// ===== INITIALIZATION =====
window.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('🚀 Initializing Google Mobile View...');
    
    // Check if we're in the mobile view page
    if (!window.location.search.includes('id=')) {
      console.warn('⚠️ No pipe ID in URL - this page should be accessed via QR code');
      return;
    }
    
    // Test if CORS is an issue
    fetch('https://piping.glitch.me/', { method: 'HEAD', mode: 'cors' })
      .then(() => {
        console.log('✅ CORS OK - using direct connection');
        window.mobileView = new GoogleMobileView();
      })
      .catch(error => {
        if (error.message.includes('CORS')) {
          console.log('🌐 CORS detected - using fallback with proxies');
          window.mobileView = new CORSFallbackMobileView();
        } else {
          console.log('✅ Network error (not CORS) - using direct connection');
          window.mobileView = new GoogleMobileView();
        }
      });
    
  } catch (error) {
    console.error('❌ Failed to initialize mobile view:', error);
    
    // Show error in UI
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div style="text-align: center; color: white; padding: 20px;">
          <h2>Connection Error</h2>
          <p>Failed to connect to the editor.</p>
          <p>Please try refreshing or scanning the QR code again.</p>
        </div>
      `;
    }
  }
});

// Export for debugging
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GoogleMobileView, CORSFallbackMobileView };
}
