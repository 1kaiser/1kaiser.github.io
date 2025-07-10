// Add this to the beginning of your js/qr-deploy.js file

// Enhanced error handling for CSP and model loading issues
const ErrorHandler = {
  // Track CSP violations
  cspViolations: new Set(),
  
  // Initialize error monitoring
  init() {
    // Monitor CSP violations
    document.addEventListener('securitypolicyviolation', (e) => {
      const violation = `${e.violatedDirective}: ${e.blockedURI}`;
      this.cspViolations.add(violation);
      console.warn('🛡️ CSP Violation:', violation);
      
      // Provide user-friendly feedback for piping server blocks
      if (e.blockedURI.includes('piping') || e.blockedURI.includes('ppng.io')) {
        this.showCSPError('Piping server blocked by security policy');
      }
    });

    // Monitor model loading errors
    window.addEventListener('error', (e) => {
      if (e.message && e.message.includes('GLTFLoader')) {
        console.warn('🎯 Model loading error:', e.message);
        this.handleModelError(e);
      }
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      if (e.reason && e.reason.message) {
        if (e.reason.message.includes('CSP') || e.reason.message.includes('security policy')) {
          this.showCSPError('Content blocked by security policy');
        }
        if (e.reason.message.includes('draco') || e.reason.message.includes('GLTF')) {
          this.handleModelError(e);
        }
      }
    });
  },

  // Handle CSP errors
  showCSPError(message) {
    const statusEl = document.getElementById('statusMessage');
    if (statusEl) {
      statusEl.textContent = `⚠️ ${message}. Check browser console for details.`;
      statusEl.style.color = '#FF9800';
      statusEl.style.display = 'block';
    }
  },

  // Handle model loading errors
  handleModelError(error) {
    console.warn('🎯 Handling model error:', error);
    
    // Try to refresh model viewers
    document.querySelectorAll('model-viewer').forEach(mv => {
      if (mv.src && !mv.dataset.errorRetried) {
        mv.dataset.errorRetried = 'true';
        this.retryModelLoad(mv);
      }
    });
  },

  // Retry model loading with fallback strategies
  retryModelLoad(modelViewer) {
    const originalSrc = modelViewer.src;
    
    console.log('🔄 Retrying model load:', originalSrc);
    
    // Strategy 1: Simple reload
    setTimeout(() => {
      modelViewer.src = '';
      setTimeout(() => {
        modelViewer.src = originalSrc;
      }, 200);
    }, 1000);

    // Strategy 2: If still failing, try without auto-rotate
    setTimeout(() => {
      if (modelViewer.loadingState === 'error') {
        modelViewer.autoRotate = false;
        modelViewer.src = originalSrc;
      }
    }, 3000);
  },

  // Get error summary
  getSummary() {
    return {
      cspViolations: Array.from(this.cspViolations),
      violationCount: this.cspViolations.size
    };
  }
};

// Initialize error handling
ErrorHandler.init();

// Enhanced POST function with better error handling
async function post(content, url) {
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
    // Enhanced error reporting
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error('🌐 Network error - possible CSP violation or server down:', url);
      ErrorHandler.showCSPError('Network request blocked or server unavailable');
    } else if (error.name === 'AbortError') {
      console.error('⏱️ Request timeout:', url);
    } else {
      console.error('❌ POST Failed:', url, error);
    }
    throw error;
  }
}

// Enhanced export model scene with error handling
async function exportModelScene() {
  try {
    const modalViewer = document.getElementById('modalModelViewer');
    if (!modalViewer) {
      throw new Error('Modal viewer not found');
    }
    
    // Check if model is loaded
    if (!modalViewer.loaded) {
      console.warn('⚠️ Model not loaded yet, waiting...');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Model load timeout')), 10000);
        modalViewer.addEventListener('load', () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });
      });
    }

    // Try export with fallback
    if (typeof modalViewer.exportScene === 'function') {
      const blob = await modalViewer.exportScene();
      console.log('✅ Scene exported successfully, size:', blob.size);
      return blob;
    }
    
    throw new Error('exportScene not available');
    
  } catch (error) {
    console.warn('⚠️ Scene export failed, using fallback:', error.message);
    
    // Fallback: fetch the original model
    if (window.currentModelSrc) {
      try {
        const response = await fetch(window.currentModelSrc);
        if (response.ok) {
          const blob = await response.blob();
          console.log('✅ Using original model as fallback, size:', blob.size);
          return blob;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
    }
    
    // Last resort: empty blob
    console.warn('🚨 Using empty blob as last resort');
    return new Blob(['model export failed'], { type: 'application/octet-stream' });
  }
}

// Export error handler for debugging
window.DeploymentErrorHandler = ErrorHandler;

/**
 * Updated Google Space Opera Mobile View Implementation
 * Fixed to use working piping servers from nwtgck's implementation
 * Handles server selection and fallback automatically
 */

// ===== UTILITY FUNCTIONS (Now mostly rely on PipingUtils) =====

// The complex post and getWithTimeout functions with integrated ErrorHandler
// and retry logic remain here as they are specific to this deployment context.
// Simpler base versions are in PipingUtils if ever needed.

// Enhanced POST function with better error handling and retry logic
async function post(content, url) { // This 'post' is specific to qr-deploy's needs
  let currentPipingDomain = PipingUtils.getCurrentDomain(); // Get domain from util
  let attemptUrl = url;

  // If the URL doesn't already have a domain, prepend the current piping domain
  // This logic might need adjustment if `url` can sometimes be absolute.
  // Assuming `url` is often a path that needs the domain.
  // For now, the URL construction helpers from PipingUtils should be used to generate full URLs.
  // This means `url` passed to this post function should already be a full URL.

  try {
    const response = await fetch(attemptUrl, {
      method: 'POST',
      body: content,
      mode: 'cors',
      headers: {
        'Content-Type': typeof content === 'string' ? 'application/json' : 'application/octet-stream'
      },
      signal: AbortSignal.timeout(30000)
    });
    
    if (response.ok) {
      console.log('✅ POST Success:', attemptUrl);
      return response;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText} from URL ${attemptUrl}`);
    }
  } catch (error) {
    console.warn(`⚠️ POST failed with ${currentPipingDomain}: ${attemptUrl}`, error);
    // Try to find a new working server
    const newWorkingServer = await PipingUtils.findWorkingPipingServer();
    if (newWorkingServer && newWorkingServer !== currentPipingDomain) {
      console.log(`🔄 Retrying POST with new server: ${newWorkingServer}`);
      // Reconstruct the URL with the new domain if the original URL was based on the old domain
      // This assumes the URL structure allows simple replacement.
      // It's safer if URLs are always constructed fresh using PipingUtils.getXUrl() functions.
      // For this refactor, let's assume `url` is the original full path and we reconstruct it.
      // This part is tricky if `url` was not originally formed with `currentPipingDomain`.
      // The URL helpers (getSessionUrl etc.) should be used to get the correct new URL.
      // This retry logic needs to be robust.
      // For now, we'll assume the URL path part needs to be extracted and prepended with new server.
      // This is a simplification. A better way is to re-generate the URL using the new domain.
      let originalPath = "";
      try {
        originalPath = new URL(url).pathname + new URL(url).search + new URL(url).hash;
      } catch(e) { /* if url is not absolute */ originalPath = url; }
      
      const newAttemptUrl = newWorkingServer + originalPath.substring(1); // Assuming path starts with / after domain

      try {
        const retryResponse = await fetch(newAttemptUrl, {
          method: 'POST',
          body: content,
          mode: 'cors',
          headers: { 'Content-Type': typeof content === 'string' ? 'application/json' : 'application/octet-stream'},
          signal: AbortSignal.timeout(30000)
        });
        if (retryResponse.ok) {
          console.log('✅ POST Success with alternative server:', newAttemptUrl);
          return retryResponse;
        } else {
           throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText} from URL ${newAttemptUrl} (retry)`);
        }
      } catch (retryError) {
        console.error('❌ POST Retry also failed:', retryError);
        if (ErrorHandler && typeof ErrorHandler.showCSPError === 'function' && retryError.name === 'TypeError' && retryError.message.includes('Failed to fetch')) {
            ErrorHandler.showCSPError('Network request blocked or server unavailable on retry.');
        }
        throw retryError; // Throw the error from the retry attempt
      }
    } else if (!newWorkingServer) {
        console.error('❌ No alternative working server found for POST.');
    }
    // If newWorkingServer is the same as currentPipingDomain, or no new server, throw original error
    if (ErrorHandler && typeof ErrorHandler.showCSPError === 'function' && error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        ErrorHandler.showCSPError('Network request blocked or server unavailable.');
    }
    throw error; // Throw the original error
  }
}

// Enhanced GET function with retry logic
async function getWithTimeout(url, timeout = 30000) { // This 'getWithTimeout' is specific to qr-deploy's needs
  let currentPipingDomain = PipingUtils.getCurrentDomain();
  let attemptUrl = url;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(attemptUrl, { method: 'GET', signal: controller.signal, mode: 'cors' });
    clearTimeout(id);
    
    if (response.ok || response.status === 404) { // 404 is expected for piping GETs
      return response;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText} from URL ${attemptUrl}`);
    }
  } catch (error) {
    console.warn(`⚠️ GET failed or timed out with ${currentPipingDomain}: ${attemptUrl}`, error);
    if (error.name === 'AbortError') { // Don't retry client-side timeouts for GET
        throw error;
    }

    const newWorkingServer = await PipingUtils.findWorkingPipingServer();
    if (newWorkingServer && newWorkingServer !== currentPipingDomain) {
      console.log(`🔄 Retrying GET with new server: ${newWorkingServer}`);
      let originalPath = "";
      try {
        originalPath = new URL(url).pathname + new URL(url).search + new URL(url).hash;
      } catch(e) { originalPath = url; }
      const newAttemptUrl = newWorkingServer + originalPath.substring(1);

      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const retryResponse = await fetch(newAttemptUrl, { method: 'GET', signal: controller.signal, mode: 'cors'});
        clearTimeout(id);
        if (retryResponse.ok || retryResponse.status === 404) {
          console.log('✅ GET Success with alternative server:', newAttemptUrl);
          return retryResponse;
        } else {
          throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText} from URL ${newAttemptUrl} (retry)`);
        }
      } catch (retryError) {
        console.error('❌ GET Retry also failed:', retryError);
        throw retryError;
      }
    } else if (!newWorkingServer) {
        console.error('❌ No alternative working server found for GET.');
    }
    throw error; // Throw original error if no retry or retry failed
  }
}


// ===== MOBILE DEPLOYMENT CLASS =====
class GoogleMobileDeployment {
  constructor() {
    // State variables
    this.pipeId = PipingUtils.getRandomInt(1e+20); // Use util
    this.isDeployed = false;
    this.isDeployable = false;
    this.isSendingData = false;
    this.contentHasChanged = false;
    this.haveReceivedResponse = false;
    this.sessionList = [];
    // this.mobilePingUrl = getPingUrl(this.pipeId); // Will be set in initializeServer
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
    // PipingUtils.findWorkingPipingServer() now sets PipingUtils_CURRENT_DOMAIN internally
    // and also returns the server. We can use PipingUtils.getCurrentDomain() or the returned value.
    
    if (workingServer) { // newWorkingServer will be null if no server passed tests, but a default is set in PipingUtils
      const currentPipingDomain = PipingUtils.getCurrentDomain(); // Get the domain set by findWorkingPipingServer
      this.updateStatus(`Connected to: ${currentPipingDomain}`, 'success');
      console.log(`✅ Successfully connected to: ${currentPipingDomain}`);
      
      // Update ping URL with working server
      this.mobilePingUrl = PipingUtils.getPingUrl(this.pipeId); // Use util
      
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
      await post(JSON.stringify(packet), PipingUtils.getSessionUrl(this.pipeId, session.id));
      await post(posterBlob, PipingUtils.posterToSession(this.pipeId, session.id, updatedContent.posterId));

      if (updatedContent.gltfChanged && gltfBlob) {
        await post(gltfBlob, PipingUtils.gltfToSession(this.pipeId, session.id, updatedContent.gltfId));
      }

      if (updatedContent.envChanged && envBlob) {
        await post(envBlob, PipingUtils.envToSession(this.pipeId, session.id, updatedContent.envIsHdr));
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
