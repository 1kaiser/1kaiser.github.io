// Enhanced mobile deployment with QR code functionality using the original Space Opera mechanism
// This leverages the piping server for real-time communication between editor and mobile view

class MobileDeployment {
  constructor() {
    // Elements
    this.modalDeployBtn = document.getElementById('modalDeployBtn');
    this.qrOverlay = document.getElementById('qrOverlay');
    this.qrCloseButton = document.getElementById('qrCloseButton');
    this.qrCanvas = document.getElementById('qr-code');
    this.qrUrl = document.getElementById('qr-url');
    this.refreshMobileBtn = document.getElementById('refreshMobileBtn');
    this.statusMessage = document.getElementById('statusMessage');
    this.connectionStatus = document.getElementById('connectionStatus');
    
    // State
    this.pipeId = this.getRandomInt(1e+20);
    this.isDeployed = false;
    this.isSendingData = false;
    this.contentHasChanged = false;
    this.haveReceivedResponse = false;
    this.sessionList = [];
    this.mobilePingUrl = this.getPingUrl(this.pipeId);
    this.defaultToSceneViewer = true;
    
    // Configuration
    this.DOMAIN = 'https://piping.glitch.me/';
    this.REFRESH_DELAY = 20000; // 20s
    
    // Bind methods
    this.init = this.init.bind(this);
    this.deployToMobile = this.deployToMobile.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.refreshMobile = this.refreshMobile.bind(this);
    this.pingLoop = this.pingLoop.bind(this);
    this.updateConnectionStatus = this.updateConnectionStatus.bind(this);
  }
  
  init() {
    // Set up event listeners
    this.modalDeployBtn.addEventListener('click', this.deployToMobile);
    this.qrCloseButton.addEventListener('click', this.closeModal);
    if (this.refreshMobileBtn) {
      this.refreshMobileBtn.addEventListener('click', this.refreshMobile);
    }
    
    // Close QR overlay when clicking outside or pressing ESC
    this.qrOverlay.addEventListener('click', (event) => {
      if (event.target === this.qrOverlay) {
        this.closeModal();
      }
    });
    
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.qrOverlay.style.display === 'flex') {
        this.closeModal();
      }
    });
  }
  
  // Random integer generator for unique IDs
  getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }
  
  // URL helpers
  getSessionUrl(sessionId) {
    return `${this.DOMAIN}${this.pipeId}-${sessionId}`;
  }
  
  getPingUrl(pipeId) {
    return `${this.DOMAIN}ping-${pipeId}`;
  }
  
  posterToSession(sessionID, modelId) {
    return `${this.DOMAIN}${this.pipeId}-${sessionID}-${modelId}-poster`;
  }
  
  gltfToSession(sessionID, modelId) {
    return `${this.DOMAIN}${this.pipeId}-${sessionID}-${modelId}`;
  }
  
  envToSession(sessionID, envIsHdr) {
    const addOn = envIsHdr ? '#.hdr' : '';
    return `${this.DOMAIN}${this.pipeId}-${sessionID}-env${addOn}`;
  }
  
  // Get the full URL for mobile viewing
  getViewableSite() {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}view/?id=${this.pipeId}`;
  }
  
  // Generate and show QR code
  openModal() {
    const viewableSite = this.getViewableSite();
    
    // Generate QR code
    QRCode.toCanvas(this.qrCanvas, viewableSite, { width: 200 }, (error) => {
      if (error) console.error('Error generating QR code:', error);
    });
    
    // Show the URL text
    this.qrUrl.textContent = viewableSite;
    
    // Show the overlay
    this.qrOverlay.style.display = 'flex';
    
    // Update instructions to include refresh information
    const instructionsEl = document.querySelector('.qr-container p');
    if (instructionsEl) {
      instructionsEl.innerHTML = 'Scan this code with your mobile device to view the model. After scanning, click the "Refresh Mobile" button to update changes.';
    }
    
    // Show the refresh button if not already visible
    if (this.refreshMobileBtn && this.isDeployed) {
      this.refreshMobileBtn.style.display = 'block';
    }
  }
  
  closeModal() {
    this.qrOverlay.style.display = 'none';
  }
  
  // Main deployment function
  async deployToMobile() {
    try {
      console.log('Deploying model to mobile...');
      
      // Mark as deployed
      this.isDeployed = true;
      
      // Update button to show connecting state
      this.updateDeployButtonState('connecting');
      
      // Update UI to show deployment is in progress
      this.updateStatus('Connecting to piping server...', '#FFA500'); // Orange color for "in progress"
      
      // Generate the QR code and show the modal
      this.openModal();
      
      // Start listening for mobile device connections
      this.pingLoop();
      
      // If we have a refresh button, show it
      if (this.refreshMobileBtn) {
        this.refreshMobileBtn.style.display = 'block';
      }
      
      // After a short delay, update status to waiting for connections if no connections yet
      setTimeout(() => {
        if (this.sessionList.length === 0 && this.isDeployed) {
          this.updateStatus('Piping server connected. Waiting for mobile device to scan QR code...', '#4285F4');
          this.updateDeployButtonState('ready');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error deploying to mobile:', error);
      this.updateStatus('Failed to deploy model to mobile. Please try again.', '#DC143C');
      this.updateDeployButtonState('error');
    }
  }
  
  // Update deploy button state
  updateDeployButtonState(state) {
    if (!this.modalDeployBtn) return;
    
    // Reset all states
    this.modalDeployBtn.classList.remove('connecting', 'ready', 'error', 'connected');
    
    switch (state) {
      case 'connecting':
        this.modalDeployBtn.classList.add('connecting');
        this.modalDeployBtn.innerHTML = '<span>Connecting...</span>';
        this.modalDeployBtn.disabled = true;
        break;
      case 'ready':
        this.modalDeployBtn.classList.add('ready');
        this.modalDeployBtn.innerHTML = '<span>Piping Server Ready</span>';
        this.modalDeployBtn.disabled = false;
        break;
      case 'connected':
        this.modalDeployBtn.classList.add('connected');
        this.modalDeployBtn.innerHTML = '<span>Mobile Connected</span>';
        this.modalDeployBtn.disabled = false;
        break;
      case 'error':
        this.modalDeployBtn.classList.add('error');
        this.modalDeployBtn.innerHTML = '<span>Connection Failed</span>';
        this.modalDeployBtn.disabled = false;
        break;
      default:
        this.modalDeployBtn.innerHTML = '<span>Deploy to Mobile</span>';
        this.modalDeployBtn.disabled = false;
    }
  }
  
  // Update status message
  updateStatus(message, color = 'white') {
    if (this.statusMessage) {
      this.statusMessage.textContent = message;
      this.statusMessage.style.color = color;
      this.statusMessage.style.display = 'block';
      
      // Auto-hide success messages after 5 seconds
      if (color === '#4285F4') {
        setTimeout(() => {
          this.statusMessage.style.display = 'none';
        }, 5000);
      }
    }
    
    // Also update connection status
    const isConnecting = color === '#FFA500'; // Orange indicates connecting
    const isConnected = color === '#4285F4'; // Blue indicates connected
    const isError = color === '#DC143C'; // Red indicates error
    
    if (isConnecting) {
      this.updateConnectionStatus('connecting', message);
    } else if (isConnected) {
      this.updateConnectionStatus('connected', message);
    } else if (isError) {
      this.updateConnectionStatus('error', message);
    }
  }
  
  // Update connection status indicator
  updateConnectionStatus(state, message) {
    if (!this.connectionStatus) return;
    
    const indicator = this.connectionStatus.querySelector('.status-indicator');
    const statusText = this.connectionStatus.querySelector('.status-text');
    
    // Show the status
    this.connectionStatus.style.display = 'inline-flex';
    
    // Clear any existing classes
    indicator.classList.remove('status-connected', 'status-connecting', 'status-error');
    
    switch (state) {
      case 'connecting':
        indicator.classList.add('status-connecting');
        statusText.textContent = 'Connecting to piping server...';
        break;
      case 'connected':
        indicator.classList.add('status-connected');
        statusText.textContent = 'Connected to piping server';
        break;
      case 'error':
        indicator.style.backgroundColor = '#EA4335'; // Red
        statusText.textContent = 'Connection error';
        break;
      default:
        this.connectionStatus.style.display = 'none';
    }
  }
  
  // POST helper function
  async post(content, url) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: content,
      });
      
      if (response.ok) {
        console.log('Success posting to:', url);
        return true;
      } else {
        console.error('Failed to post to:', url);
        return false;
      }
    } catch (error) {
      console.error('Error in post request:', error);
      return false;
    }
  }
  
  // GET with timeout helper
  async getWithTimeout(url, timeout = 30000) {
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
  
  // Get mobile operating system
  getMobileOperatingSystem() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
      return 'Windows Phone';
    }
    
    if (/android/i.test(userAgent)) {
      return 'Android';
    }
    
    // iOS detection
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return 'iOS';
    }
    
    return 'unknown';
  }
  
  // Wait for a ping from a mobile device
  async waitForPing() {
    try {
      const response = await this.getWithTimeout(this.mobilePingUrl);
      
      if (response.ok) {
        const json = await response.json();
        
        // Add the session to our list if not already there
        const sessionExists = this.sessionList.some(session => session.id === json.id);
        if (!sessionExists) {
          this.sessionList.push(json);
        }
        
        // Update deploy button state to connected
        this.updateDeployButtonState('connected');
        
        // Update UI to show connection success
        this.updateStatus('Mobile device connected! You can now view your model.', '#4285F4');
        
        // Only update if not currently updating
        if (!this.isSendingData) {
          this.refreshMobile();
        }
        
        this.haveReceivedResponse = true;
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('Error waiting for ping:', error);
      return false;
    }
  }
  
  // Continuously listen for pings from mobile devices
  async pingLoop() {
    try {
      if (!await this.waitForPing()) {
        // Wait a second before trying again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.log('Error in ping loop:', error);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Continue the loop if we're still deployed
    if (this.isDeployed) {
      this.pingLoop();
    }
  }
  
  // Create a blob from a URL
  async urlToBlob(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch url: ${url}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('Error converting URL to blob:', error);
      throw error;
    }
  }
  
  // Refresh the model on connected mobile devices
  async refreshMobile() {
    if (this.isSendingData || !this.isDeployed || this.sessionList.length === 0) {
      return;
    }
    
    try {
      console.log('Refreshing mobile view...');
      this.isSendingData = true;
      
      // Change refresh button state
      if (this.refreshMobileBtn) {
        this.refreshMobileBtn.textContent = 'Sending...';
        this.refreshMobileBtn.style.backgroundColor = '#FFA500'; // Orange
        this.refreshMobileBtn.disabled = true;
      }
      
      this.updateStatus('Sending data to mobile device. Textured models will take some time.', 'white');
      
      // Set a timeout to reset sending state
      setTimeout(() => {
        this.isSendingData = false;
        
        // Reset refresh button
        if (this.refreshMobileBtn) {
          this.refreshMobileBtn.textContent = 'Refresh Mobile';
          this.refreshMobileBtn.style.backgroundColor = '#34A853'; // Green
          this.refreshMobileBtn.disabled = false;
        }
      }, this.REFRESH_DELAY);
      
      // Get current model info from global variables (defined in gallery.js)
      const modelUrl = window.currentModelSrc;
      const modelTitle = window.currentModelTitle;
      
      if (!modelUrl) {
        throw new Error('No model URL available');
      }
      
      // Create a unique ID for this update
      const updateId = this.getRandomInt(1e+20);
      
      // Create a screenshot/poster of the current model viewer state
      const modalViewer = document.getElementById('modalModelViewer');
      let posterBlob;
      
      if (modalViewer) {
        // If possible, get a proper poster from model-viewer
        if (typeof modalViewer.toDataURL === 'function') {
          const dataUrl = await modalViewer.toDataURL();
          posterBlob = await (await fetch(dataUrl)).blob();
        } else {
          // Fallback to a basic blob
          posterBlob = new Blob(['placeholder'], { type: 'image/png' });
        }
      } else {
        posterBlob = new Blob(['placeholder'], { type: 'image/png' });
      }
      
      // Get the model data as a blob
      const modelBlob = await this.urlToBlob(modelUrl);
      
      // Package the model data and configuration
      const modelConfig = {
        title: modelTitle,
        ar: true,
        arModes: this.defaultToSceneViewer ? 
          'scene-viewer webxr quick-look' : 
          'webxr scene-viewer quick-look',
        autoRotate: true,
        cameraControls: true,
        shadowIntensity: 1
      };
      
      // For each connected mobile session, send the updated data
      for (const session of this.sessionList) {
        // Create a packet with all the necessary info
        const packet = {
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
            gltf: modelUrl,
            env: undefined
          }
        };
        
        // Send the packet to the session
        const sessionUrl = this.getSessionUrl(session.id);
        await this.post(JSON.stringify(packet), sessionUrl);
        
        // Send poster image
        const posterUrl = this.posterToSession(session.id, updateId);
        await this.post(posterBlob, posterUrl);
        
        // Send model data
        const modelSessionUrl = this.gltfToSession(session.id, updateId);
        await this.post(modelBlob, modelSessionUrl);
        
        // Mark session as not stale
        session.isStale = false;
      }
      
      this.contentHasChanged = false;
      this.updateStatus('Model successfully refreshed on mobile device!', '#4285F4');
      
      // Update refresh button to success state
      if (this.refreshMobileBtn) {
        this.refreshMobileBtn.textContent = 'Successfully Refreshed';
        this.refreshMobileBtn.style.backgroundColor = '#34A853'; // Green
        this.refreshMobileBtn.disabled = false;
        
        // Reset text after 3 seconds
        setTimeout(() => {
          if (this.refreshMobileBtn) {
            this.refreshMobileBtn.textContent = 'Refresh Mobile';
          }
        }, 3000);
      }
      
    } catch (error) {
      console.error('Error refreshing mobile view:', error);
      this.updateStatus('Failed to refresh mobile view. Please try again.', '#DC143C');
      
      // Reset refresh button to error state
      if (this.refreshMobileBtn) {
        this.refreshMobileBtn.textContent = 'Refresh Failed - Try Again';
        this.refreshMobileBtn.style.backgroundColor = '#EA4335'; // Red
        this.refreshMobileBtn.disabled = false;
      }
    } finally {
      this.isSendingData = false;
    }
  }
  
  // Toggle AR mode between scene-viewer priority and webxr priority
  toggleArMode(useSceneViewer) {
    this.defaultToSceneViewer = useSceneViewer;
    console.log(`AR mode set to ${this.defaultToSceneViewer ? 'scene-viewer' : 'webxr'} priority`);
  }
}

// Initialize the mobile deployment functionality when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.mobileDeployment = new MobileDeployment();
  window.mobileDeployment.init();
});
