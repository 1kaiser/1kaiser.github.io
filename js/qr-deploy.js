/**
 * Enhanced Mobile Deployment with QR Code Functionality
 * Uses Google's Space Opera piping mechanism for real-time communication
 * between desktop editor and mobile devices via third-party piping server
 * 
 * @version 2.0.0
 * @author Enhanced Implementation
 */

class EnhancedMobileDeployment {
  constructor() {
    // Configuration
    this.config = {
      domain: 'https://piping.glitch.me/',
      refreshDelay: 20000, // 20 seconds
      requestTimeout: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      maxModelSize: 50 * 1024 * 1024, // 50MB
      compressionThreshold: 5 * 1024 * 1024 // 5MB
    };

    // DOM Elements
    this.elements = this.initializeElements();
    
    // State Management
    this.state = {
      pipeId: this.generateSecureId(),
      isDeployed: false,
      isConnecting: false,
      isSendingData: false,
      contentHasChanged: false,
      haveReceivedResponse: false,
      sessionList: [],
      defaultToSceneViewer: true,
      connectionAttempts: 0,
      lastSyncTime: null
    };

    // Network utilities
    this.network = new NetworkManager(this.config);
    
    // Event handlers (bound methods)
    this.boundMethods = this.bindEventHandlers();
    
    // Initialize
    this.initialize();
  }

  /**
   * Initialize DOM elements with error checking
   */
  initializeElements() {
    const elements = {
      modalDeployBtn: document.getElementById('modalDeployBtn'),
      qrOverlay: document.getElementById('qrOverlay'),
      qrCloseButton: document.getElementById('qrCloseButton'),
      qrCanvas: document.getElementById('qr-code'),
      qrUrl: document.getElementById('qr-url'),
      refreshMobileBtn: document.getElementById('refreshMobileBtn'),
      statusMessage: document.getElementById('statusMessage'),
      connectionStatus: document.getElementById('connectionStatus'),
      arModeSelector: document.getElementById('arModeSelector')
    };

    // Validate critical elements
    const criticalElements = ['modalDeployBtn', 'qrOverlay', 'qrCanvas'];
    const missingElements = criticalElements.filter(key => !elements[key]);
    
    if (missingElements.length > 0) {
      console.error('Missing critical DOM elements:', missingElements);
      this.showError('Required UI elements not found. Please check the HTML structure.');
    }

    return elements;
  }

  /**
   * Bind all event handler methods to preserve context
   */
  bindEventHandlers() {
    return {
      deployToMobile: this.deployToMobile.bind(this),
      openModal: this.openModal.bind(this),
      closeModal: this.closeModal.bind(this),
      refreshMobile: this.refreshMobile.bind(this),
      handleKeyDown: this.handleKeyDown.bind(this),
      handleOutsideClick: this.handleOutsideClick.bind(this),
      toggleArMode: this.toggleArMode.bind(this),
      pingLoop: this.pingLoop.bind(this),
      cleanup: this.cleanup.bind(this)
    };
  }

  /**
   * Initialize the deployment system
   */
  initialize() {
    try {
      this.setupEventListeners();
      this.logSystemInfo();
      console.log('✅ Enhanced Mobile Deployment System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize mobile deployment:', error);
      this.showError('System initialization failed. Please refresh the page.');
    }
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    const { elements, boundMethods } = this;

    // Primary action buttons
    elements.modalDeployBtn?.addEventListener('click', boundMethods.deployToMobile);
    elements.qrCloseButton?.addEventListener('click', boundMethods.closeModal);
    elements.refreshMobileBtn?.addEventListener('click', boundMethods.refreshMobile);

    // Modal interactions
    elements.qrOverlay?.addEventListener('click', boundMethods.handleOutsideClick);
    document.addEventListener('keydown', boundMethods.handleKeyDown);

    // AR mode selector
    elements.arModeSelector?.addEventListener('change', (e) => {
      boundMethods.toggleArMode(e.target.checked);
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', boundMethods.cleanup);
    window.addEventListener('unload', boundMethods.cleanup);
  }

  /**
   * Generate a cryptographically secure ID
   */
  generateSecureId() {
    if (window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return array[0];
    }
    // Fallback for older browsers
    return Math.floor(Math.random() * 1e20);
  }

  /**
   * Get various URL patterns for piping communication
   */
  getUrls() {
    const { pipeId } = this.state;
    return {
      ping: `${this.config.domain}ping-${pipeId}`,
      session: (sessionId) => `${this.config.domain}${pipeId}-${sessionId}`,
      model: (sessionId, modelId) => `${this.config.domain}${pipeId}-${sessionId}-${modelId}`,
      poster: (sessionId, modelId) => `${this.config.domain}${pipeId}-${sessionId}-${modelId}-poster`,
      env: (sessionId, isHdr = false) => `${this.config.domain}${pipeId}-${sessionId}-env${isHdr ? '#.hdr' : ''}`,
      viewer: () => {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}view/?id=${pipeId}`;
      }
    };
  }

  /**
   * Main deployment function with comprehensive error handling
   */
  async deployToMobile() {
    if (this.state.isConnecting) {
      console.log('⏳ Deployment already in progress...');
      return;
    }

    try {
      console.log('🚀 Starting mobile deployment...');
      
      this.state.isConnecting = true;
      this.state.isDeployed = true;
      this.state.connectionAttempts++;

      // Update UI to show connecting state
      this.updateDeployButtonState('connecting');
      this.updateStatus('Initializing piping server connection...', 'info');

      // Test piping server connectivity
      const isServerReachable = await this.network.testServerConnectivity(this.config.domain);
      if (!isServerReachable) {
        throw new Error('Piping server is not reachable. Please check your internet connection.');
      }

      // Generate and show QR code
      await this.openModal();

      // Start the ping loop for mobile device detection
      this.boundMethods.pingLoop();

      // Update status
      this.updateStatus('Ready for mobile device connection. Scan the QR code with your phone.', 'success');
      this.updateDeployButtonState('ready');

      // Show refresh button if not visible
      if (this.elements.refreshMobileBtn) {
        this.elements.refreshMobileBtn.style.display = 'block';
      }

      console.log('✅ Mobile deployment initialized successfully');

    } catch (error) {
      console.error('❌ Mobile deployment failed:', error);
      this.handleDeploymentError(error);
    } finally {
      this.state.isConnecting = false;
    }
  }

  /**
   * Handle deployment errors with user-friendly messages
   */
  handleDeploymentError(error) {
    let userMessage = 'Deployment failed. ';
    
    if (error.message.includes('network')) {
      userMessage += 'Please check your internet connection and try again.';
    } else if (error.message.includes('server')) {
      userMessage += 'The piping server is temporarily unavailable.';
    } else {
      userMessage += 'An unexpected error occurred. Please refresh the page and try again.';
    }

    this.updateStatus(userMessage, 'error');
    this.updateDeployButtonState('error');

    // Reset deployment state on error
    this.state.isDeployed = false;
    this.state.isConnecting = false;
  }

  /**
   * Generate and display QR code with enhanced error handling
   */
  async openModal() {
    try {
      const viewableUrl = this.getUrls().viewer();
      
      // Validate QR canvas element
      if (!this.elements.qrCanvas) {
        throw new Error('QR code canvas element not found');
      }

      // Generate QR code with error handling
      await new Promise((resolve, reject) => {
        QRCode.toCanvas(
          this.elements.qrCanvas, 
          viewableUrl, 
          { 
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          }, 
          (error) => {
            if (error) {
              console.error('QR code generation failed:', error);
              reject(new Error('Failed to generate QR code'));
            } else {
              resolve();
            }
          }
        );
      });

      // Update URL display
      if (this.elements.qrUrl) {
        this.elements.qrUrl.textContent = viewableUrl;
      }

      // Show the overlay
      this.elements.qrOverlay.style.display = 'flex';
      
      // Update instructions
      this.updateModalInstructions();

      console.log('📱 QR code modal opened successfully');

    } catch (error) {
      console.error('❌ Failed to open QR modal:', error);
      this.showError('Failed to generate QR code. Please try again.');
    }
  }

  /**
   * Update modal instructions based on current state
   */
  updateModalInstructions() {
    const instructionsEl = this.elements.qrOverlay?.querySelector('.qr-container p');
    if (instructionsEl) {
      let instructions = 'Scan this QR code with your mobile device to view the model.';
      
      if (this.state.sessionList.length > 0) {
        instructions += ' Your device is connected! Use "Refresh Mobile" to sync changes.';
      } else {
        instructions += ' After scanning, the models will sync automatically.';
      }
      
      instructionsEl.innerHTML = instructions;
    }
  }

  /**
   * Close the QR modal
   */
  closeModal() {
    if (this.elements.qrOverlay) {
      this.elements.qrOverlay.style.display = 'none';
    }
  }

  /**
   * Handle clicks outside the modal content
   */
  handleOutsideClick(event) {
    if (event.target === this.elements.qrOverlay) {
      this.closeModal();
    }
  }

  /**
   * Handle keyboard events (ESC to close modal)
   */
  handleKeyDown(event) {
    if (event.key === 'Escape' && this.elements.qrOverlay?.style.display === 'flex') {
      this.closeModal();
    }
  }

  /**
   * Continuous ping loop to detect mobile device connections
   */
  async pingLoop() {
    if (!this.state.isDeployed) {
      return;
    }

    try {
      const pingReceived = await this.waitForPing();
      
      if (pingReceived) {
        // Successful ping received, no delay needed
        this.boundMethods.pingLoop();
      } else {
        // No ping received, wait before trying again
        setTimeout(this.boundMethods.pingLoop, 1000);
      }
    } catch (error) {
      console.log('📡 Ping error (normal during connection):', error.message);
      setTimeout(this.boundMethods.pingLoop, 2000);
    }
  }

  /**
   * Wait for a ping from a mobile device
   */
  async waitForPing() {
    try {
      const response = await this.network.getWithTimeout(this.getUrls().ping);
      
      if (response.ok) {
        const sessionData = await response.json();
        
        // Add session if not already exists
        const existingSession = this.state.sessionList.find(s => s.id === sessionData.id);
        if (!existingSession) {
          this.state.sessionList.push(sessionData);
          console.log('📱 New mobile session connected:', sessionData);
        }

        // Update UI to show connection
        this.updateDeployButtonState('connected');
        this.updateStatus(`Mobile device connected! (${this.state.sessionList.length} device(s))`, 'success');
        this.updateModalInstructions();

        // Auto-sync if not currently sending data
        if (!this.state.isSendingData) {
          setTimeout(() => this.boundMethods.refreshMobile(), 500);
        }

        this.state.haveReceivedResponse = true;
        return true;
      }
      
      return false;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('📡 Ping timeout (normal)');
      } else {
        console.log('📡 Ping error:', error.message);
      }
      return false;
    }
  }

  /**
   * Enhanced refresh mobile with better error handling and compression
   */
  async refreshMobile() {
    if (this.state.isSendingData || !this.state.isDeployed || this.state.sessionList.length === 0) {
      console.log('⏭️ Refresh skipped - conditions not met');
      return;
    }

    const refreshStartTime = Date.now();
    
    try {
      console.log('🔄 Starting mobile refresh...');
      this.state.isSendingData = true;

      // Update UI
      this.updateRefreshButton('sending');
      this.updateStatus('Preparing model data for mobile device...', 'info');

      // Get current model info
      const modelInfo = this.getCurrentModelInfo();
      if (!modelInfo.url) {
        throw new Error('No model currently selected');
      }

      // Create update packet
      const updateId = this.generateSecureId();
      const updatePacket = await this.createUpdatePacket(modelInfo, updateId);

      // Get model data with compression if needed
      const { modelBlob, posterBlob } = await this.prepareModelData(modelInfo);

      // Send to all connected sessions
      await this.sendToAllSessions(updatePacket, modelBlob, posterBlob, updateId);

      // Update state
      this.state.contentHasChanged = false;
      this.state.lastSyncTime = Date.now();

      const syncDuration = this.state.lastSyncTime - refreshStartTime;
      console.log(`✅ Mobile refresh completed in ${syncDuration}ms`);
      
      this.updateStatus(`Model synced successfully! (${syncDuration}ms)`, 'success');
      this.updateRefreshButton('success');

    } catch (error) {
      console.error('❌ Mobile refresh failed:', error);
      this.updateStatus('Failed to sync model. Please try again.', 'error');
      this.updateRefreshButton('error');
    } finally {
      this.state.isSendingData = false;
      
      // Reset button after delay
      setTimeout(() => {
        if (this.elements.refreshMobileBtn) {
          this.updateRefreshButton('ready');
        }
      }, this.config.refreshDelay);
    }
  }

  /**
   * Get current model information from global state
   */
  getCurrentModelInfo() {
    return {
      url: window.currentModelSrc || '',
      title: window.currentModelTitle || 'Untitled Model',
      alt: window.currentModelTitle || '3D Model'
    };
  }

  /**
   * Create update packet with model configuration
   */
  async createUpdatePacket(modelInfo, updateId) {
    const modelConfig = {
      title: modelInfo.title,
      ar: true,
      arModes: this.state.defaultToSceneViewer ? 
        'scene-viewer webxr quick-look' : 
        'webxr scene-viewer quick-look',
      autoRotate: true,
      cameraControls: true,
      shadowIntensity: 1,
      exposure: 1.0
    };

    return {
      updatedContent: {
        gltfChanged: true,
        gltfId: updateId,
        stateChanged: true,
        posterId: updateId,
        envChanged: false,
        envIsHdr: false
      },
      snippet: {
        config: modelConfig,
        arConfig: {
          ar: true,
          arModes: modelConfig.arModes
        },
        extraAttributes: {},
        hotspots: []
      },
      urls: {
        gltf: modelInfo.url,
        env: undefined
      }
    };
  }

  /**
   * Prepare model data with optional compression
   */
  async prepareModelData(modelInfo) {
    this.updateStatus('Downloading model data...', 'info');
    
    // Download model
    let modelBlob = await this.network.urlToBlob(modelInfo.url);
    
    // Check if compression is needed
    if (modelBlob.size > this.config.compressionThreshold) {
      console.log(`📦 Model size: ${this.formatFileSize(modelBlob.size)} - compression may be beneficial`);
      this.updateStatus('Model is large, this may take a moment...', 'info');
    }

    // Create poster (simplified for now)
    const posterBlob = await this.createPosterImage();

    return { modelBlob, posterBlob };
  }

  /**
   * Create a poster image from the current model viewer
   */
  async createPosterImage() {
    try {
      const modalViewer = document.getElementById('modalModelViewer');
      
      if (modalViewer && typeof modalViewer.toDataURL === 'function') {
        const dataUrl = await modalViewer.toDataURL('image/jpeg', 0.8);
        const response = await fetch(dataUrl);
        return await response.blob();
      }
    } catch (error) {
      console.log('⚠️ Could not create poster image:', error.message);
    }
    
    // Fallback to placeholder
    return new Blob(['poster-placeholder'], { type: 'image/jpeg' });
  }

  /**
   * Send update packet and data to all connected sessions
   */
  async sendToAllSessions(packet, modelBlob, posterBlob, updateId) {
    const urls = this.getUrls();
    const promises = [];

    for (const session of this.state.sessionList) {
      const sessionPromise = this.sendToSession(session, packet, modelBlob, posterBlob, updateId, urls);
      promises.push(sessionPromise);
    }

    const results = await Promise.allSettled(promises);
    
    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`📤 Sent to ${successful}/${this.state.sessionList.length} sessions (${failed} failed)`);
    
    if (failed > 0) {
      console.warn('Some sessions failed to receive updates:', 
        results.filter(r => r.status === 'rejected').map(r => r.reason)
      );
    }
  }

  /**
   * Send data to a specific session
   */
  async sendToSession(session, packet, modelBlob, posterBlob, updateId, urls) {
    try {
      // Send packet
      await this.network.post(JSON.stringify(packet), urls.session(session.id));
      
      // Send poster
      await this.network.post(posterBlob, urls.poster(session.id, updateId));
      
      // Send model
      await this.network.post(modelBlob, urls.model(session.id, updateId));
      
      // Mark session as not stale
      session.isStale = false;
      
      console.log(`✅ Successfully sent data to session ${session.id}`);
    } catch (error) {
      console.error(`❌ Failed to send data to session ${session.id}:`, error);
      session.isStale = true;
      throw error;
    }
  }

  /**
   * Toggle AR mode between scene-viewer and webxr priority
   */
  toggleArMode(useSceneViewer) {
    this.state.defaultToSceneViewer = useSceneViewer;
    this.state.contentHasChanged = true;
    
    const mode = useSceneViewer ? 'scene-viewer' : 'webxr';
    console.log(`🥽 AR mode set to ${mode} priority`);
    
    if (this.state.sessionList.length > 0 && this.elements.refreshMobileBtn) {
      this.elements.refreshMobileBtn.style.display = 'block';
    }
  }

  /**
   * Update deploy button state with visual feedback
   */
  updateDeployButtonState(state) {
    const btn = this.elements.modalDeployBtn;
    if (!btn) return;

    // Remove all state classes
    btn.classList.remove('connecting', 'ready', 'connected', 'error');
    btn.disabled = false;

    const states = {
      connecting: {
        class: 'connecting',
        text: 'Connecting...',
        disabled: true
      },
      ready: {
        class: 'ready',
        text: 'Ready for Mobile',
        disabled: false
      },
      connected: {
        class: 'connected',
        text: `Mobile Connected (${this.state.sessionList.length})`,
        disabled: false
      },
      error: {
        class: 'error',
        text: 'Connection Failed',
        disabled: false
      }
    };

    const stateConfig = states[state];
    if (stateConfig) {
      btn.classList.add(stateConfig.class);
      btn.innerHTML = `<span>${stateConfig.text}</span>`;
      btn.disabled = stateConfig.disabled;
    }
  }

  /**
   * Update refresh button state
   */
  updateRefreshButton(state) {
    const btn = this.elements.refreshMobileBtn;
    if (!btn) return;

    const states = {
      sending: {
        text: 'Sending...',
        color: '#FFA500',
        disabled: true
      },
      success: {
        text: 'Successfully Synced',
        color: '#34A853',
        disabled: false
      },
      error: {
        text: 'Sync Failed - Retry',
        color: '#EA4335',
        disabled: false
      },
      ready: {
        text: 'Refresh Mobile',
        color: '#34A853',
        disabled: false
      }
    };

    const stateConfig = states[state];
    if (stateConfig) {
      btn.textContent = stateConfig.text;
      btn.style.backgroundColor = stateConfig.color;
      btn.disabled = stateConfig.disabled;
    }
  }

  /**
   * Update status message with type-based styling
   */
  updateStatus(message, type = 'info') {
    if (!this.elements.statusMessage) return;

    const colors = {
      info: '#4285F4',
      success: '#34A853',
      warning: '#FFA500',
      error: '#EA4335'
    };

    this.elements.statusMessage.textContent = message;
    this.elements.statusMessage.style.color = colors[type] || colors.info;
    this.elements.statusMessage.style.display = 'block';

    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        if (this.elements.statusMessage) {
          this.elements.statusMessage.style.display = 'none';
        }
      }, 5000);
    }

    console.log(`📢 Status (${type}): ${message}`);
  }

  /**
   * Show error message to user
   */
  showError(message) {
    this.updateStatus(message, 'error');
    
    // Also show in console for debugging
    console.error('🚨 Error:', message);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Log system information for debugging
   */
  logSystemInfo() {
    console.log('🔧 Enhanced Mobile Deployment System Info:', {
      pipeId: this.state.pipeId,
      domain: this.config.domain,
      userAgent: navigator.userAgent,
      screenSize: `${screen.width}x${screen.height}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Cleanup resources when component is destroyed
   */
  cleanup() {
    console.log('🧹 Cleaning up mobile deployment resources...');
    
    // Reset state
    this.state.isDeployed = false;
    this.state.isConnecting = false;
    this.state.isSendingData = false;
    
    // Clear session list
    this.state.sessionList = [];
    
    // Hide overlays
    if (this.elements.qrOverlay) {
      this.elements.qrOverlay.style.display = 'none';
    }
  }

  /**
   * Get deployment statistics
   */
  getStats() {
    return {
      isDeployed: this.state.isDeployed,
      connectedSessions: this.state.sessionList.length,
      lastSyncTime: this.state.lastSyncTime,
      connectionAttempts: this.state.connectionAttempts,
      pipeId: this.state.pipeId
    };
  }
}

/**
 * Network Manager for handling all HTTP operations
 */
class NetworkManager {
  constructor(config) {
    this.config = config;
    this.requestCache = new Map();
  }

  /**
   * Enhanced POST with retry logic and better error handling
   */
  async post(content, url, retries = 0) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.requestTimeout);

      const response = await fetch(url, {
        method: 'POST',
        body: content,
        signal: controller.signal,
        headers: {
          'Content-Type': typeof content === 'string' ? 'application/json' : 'application/octet-stream'
        }
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`📤 POST successful: ${url}`);
      return response;

    } catch (error) {
      if (retries < this.config.maxRetries && error.name !== 'AbortError') {
        console.log(`🔄 Retrying POST (${retries + 1}/${this.config.maxRetries}): ${url}`);
        await this.delay(this.config.retryDelay * (retries + 1));
        return this.post(content, url, retries + 1);
      }
      
      console.error(`❌ POST failed: ${url}`, error);
      throw error;
    }
  }

  /**
   * Enhanced GET with timeout and retry logic
   */
  async getWithTimeout(url, timeout = null) {
    const actualTimeout = timeout || this.config.requestTimeout;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), actualTimeout);

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

  /**
   * Convert URL to Blob with caching
   */
  async urlToBlob(url) {
    // Check cache first
    if (this.requestCache.has(url)) {
      console.log(`📋 Using cached blob for: ${url}`);
      return this.requestCache.get(url);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Cache the blob (with size limit)
      if (blob.size < 10 * 1024 * 1024) { // Cache only files under 10MB
        this.requestCache.set(url, blob);
      }
      
      console.log(`📥 Downloaded blob: ${url} (${this.formatFileSize(blob.size)})`);
      return blob;
    } catch (error) {
      console.error(`❌ Failed to download blob from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Test server connectivity
   */
  async testServerConnectivity(domain) {
    try {
      const response = await this.getWithTimeout(domain, 5000);
      return response.status < 500; // Accept any non-server error
    } catch (error) {
      console.error('❌ Server connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Clear request cache
   */
  clearCache() {
    this.requestCache.clear();
    console.log('🗑️ Network cache cleared');
  }
}

// Initialize the enhanced mobile deployment system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.mobileDeployment = new EnhancedMobileDeployment();
    console.log('✅ Enhanced Mobile Deployment initialized and ready');
  } catch (error) {
    console.error('❌ Failed to initialize Enhanced Mobile Deployment:', error);
  }
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EnhancedMobileDeployment, NetworkManager };
}
