/**
 * Updated Google Space Opera Mobile View Implementation
 * Fixed to use working piping servers with automatic fallback
 * Handles server selection and connectivity issues
 */

// js/piping-utils.js should be loaded before this script.
// It defines window.PipingUtils which contains the necessary functions and constants.

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
    this.sessionId = PipingUtils.getRandomInt(1e+20); // Use util
    this.sessionOs = PipingUtils.getMobileOperatingSystem(); // Use util
    
    // URLs will be set after server is found
    this.mobilePingUrl = ''; // Will be set in initialize
    this.sessionUrl = '';    // Will be set in initialize
    
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
    // Use PipingUtils.findWorkingPipingServer() which sets PipingUtils_CURRENT_DOMAIN
    const foundServer = await PipingUtils.findWorkingPipingServer();
    const currentPipingDomain = PipingUtils.getCurrentDomain(); // Get the domain chosen by the util

    if (!foundServer) { // findWorkingPipingServer returns null if no *tested* server worked, but sets a default
      this.showToast(`⚠️ No servers passed tests. Using default: ${currentPipingDomain.replace('https://', '').replace('/', '')}`);
      // Proceeding with default server
    } else {
      this.showToast(`Connected to: ${currentPipingDomain.replace('https://', '').replace('/', '')}`);
    }

    // Set URLs with working/default server from PipingUtils
    this.mobilePingUrl = PipingUtils.getPingUrl(this.pipeId);
    this.sessionUrl = PipingUtils.getSessionUrl(this.pipeId, this.sessionId);
    
    console.log(`Mobile Ping URL: ${this.mobilePingUrl}`);
    console.log(`Mobile Session URL: ${this.sessionUrl}`);

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
        // Use PipingUtils.post or a more robust post from this script if it needs specific error handling
        await PipingUtils.post(this.currentBlob, this.modelViewerUrl);
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

    // Set poster URL using PipingUtils
    this.posterUrl = PipingUtils.posterToSession(this.pipeId, this.sessionId, updatedContent.posterId);

    // Set model URL if changed using PipingUtils
    if (updatedContent.gltfChanged) {
      this.modelViewerUrl = PipingUtils.gltfToSession(this.pipeId, this.sessionId, updatedContent.gltfId);
    }

    // Set environment image URL using PipingUtils
    const { environmentImage } = this.config;
    this.envImageUrl = environmentImage == null ||
            environmentImage === 'neutral' || environmentImage === 'legacy' ?
        environmentImage :
        PipingUtils.envToSession(this.pipeId, this.sessionId, updatedContent.envIsHdr);

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
      // Use PipingUtils.getWithTimeout or a local version if more complex error handling is needed
      const response = await PipingUtils.getWithTimeout(this.sessionUrl);
      
      if (response.ok) {
        if (this.modelViewer) {
          this.modelViewer.showPoster();
        }
        
        const json = await response.json();
        this.initializeToast(json.updatedContent);
        this.waitForData(json);
        
        return true;
      } else {
        console.error('❌ Error fetching update from mobile view:', response.status, response.statusText, this.sessionUrl);
        // Potentially try to find a new server if response indicates server failure (e.g. 5xx)
        if (response.status >= 500 && response.status < 600) {
            const newServer = await PipingUtils.findWorkingPipingServer();
            if (newServer) { // Check if a new server was actually found and is different
                 const currentPipingDomain = PipingUtils.getCurrentDomain();
                 this.sessionUrl = PipingUtils.getSessionUrl(this.pipeId, this.sessionId); // Rebuild URL with new domain
                 this.showToast(`Reconnected to: ${currentPipingDomain.replace('https://', '').replace('/', '')}`);
                 return false; // Indicate failure to trigger retry in triggerFetchLoop
            }
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Exception in mobile view fetchLoop:', error);
      // This catch block might be hit for network errors or AbortError from timeout
      // If it's a network error, try to find a new server.
      if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) { // Generic network error
        const newServer = await PipingUtils.findWorkingPipingServer();
        if (newServer) {
            const currentPipingDomain = PipingUtils.getCurrentDomain();
            this.sessionUrl = PipingUtils.getSessionUrl(this.pipeId, this.sessionId);
            this.showToast(`Re-attempting connection via: ${currentPipingDomain.replace('https://', '').replace('/', '')}`);
            return false; // Indicate failure to trigger retry
        }
      }
      // For AbortError (timeout), typically we just want to try again without server change.
      return false; // Indicate failure to trigger retry
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
      // Use PipingUtils.post or a more robust post from this script if it needs specific error handling
      await PipingUtils.post(JSON.stringify(ping), this.mobilePingUrl);
      console.log('📡 Ping sent to editor');
    } catch (error) {
      console.error('❌ Failed to send ping:', error);
      this.showToast('Failed to connect to editor');
    }
  }

  // Utility delay function - can be kept here or moved to a general util if needed elsewhere
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
