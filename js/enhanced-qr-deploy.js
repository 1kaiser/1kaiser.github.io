// This is an enhanced version of the qr-deploy.js with Anime.js animations
// It maintains all the original functionality while adding smooth animations

// Import Anime.js modules
import {
  animate,
  stagger,
  utils,
  createTimeline,
  eases
} from './lib/anime.esm.js';

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
    
    // Animation states
    this.connectionStatusAnimation = null;
    this.deployButtonAnimation = null;
    
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
  
  // URL helpers (no changes from original)
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
  
  getViewableSite() {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}view/?id=${this.pipeId}`;
  }
  
  // Generate and show QR code with smooth animations
  openModal() {
    const viewableSite = this.getViewableSite();
    
    // Generate QR code
    QRCode.toCanvas(this.qrCanvas, viewableSite, { width: 200 }, (error) => {
      if (error) console.error('Error generating QR code:', error);
      
      // Animate QR code appearance after it's generated
      animate(this.qrCanvas, {
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: 800,
        easing: 'outElastic(1, 0.3)'
      });
    });
    
    // Show the URL text with typing animation
    this.qrUrl.textContent = '';
    this.qrUrl.style.display = 'block';
    
    // Create "typing" effect for URL
    const textAnimation = animate({
      currentLength: 0,
      finalLength: viewableSite.length
    }, {
      currentLength: viewableSite.length,
      duration: 1000,
      easing: 'linear',
      round: 1,
      update: (anim) => {
        const currentValue = anim.animations[0].currentValue;
        this.qrUrl.textContent = viewableSite.substring(0, currentValue);
      }
    });
    
    // Reset container for animation
    const qrContainer = this.qrOverlay.querySelector('.qr-container');
    qrContainer.style.opacity = '0';
    qrContainer.style.transform = 'scale(0.8)';
    
    // Show overlay first with fade effect
    this.qrOverlay.style.opacity = '0';
    this.qrOverlay.style.display = 'flex';
    
    // Create timeline for coordinated animations
    const timeline = createTimeline();
    
    // Animate overlay background
    timeline.add(this.qrOverlay, {
      opacity: [0, 1],
      duration: 300,
      easing: 'outQuad'
    });
    
    // Animate container appearance
    timeline.add(qrContainer, {
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: 500,
      easing: 'outExpo'
    }, '-=100');
    
    // Show the refresh button if not already visible
    if (this.refreshMobileBtn && this.isDeployed) {
      this.refreshMobileBtn.style.display = 'block';
      this.refreshMobileBtn.style.opacity = '0';
      
      // Animate refresh button appearing
      animate(this.refreshMobileBtn, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 500,
        easing: 'outQuad',
        delay: 500
      });
    }
  }
  
  // Close modal with smooth animations
  closeModal() {
    const qrContainer = this.qrOverlay.querySelector('.qr-container');
    
    // Create timeline for closing animation
    const timeline = createTimeline();
    
    // Animate container disappearance
    timeline.add(qrContainer, {
      opacity: [1, 0],
      scale: [1, 0.8],
      duration: 300,
      easing: 'outQuad'
    });
    
    // Animate overlay background
    timeline.add(this.qrOverlay, {
      opacity: [1, 0],
      duration: 300,
      easing: 'outQuad'
    }, '-=200');
    
    // Hide the overlay after animation completes
    timeline.then(() => {
      this.qrOverlay.style.display = 'none';
    });
  }
  
  // Main deployment function with enhanced animations
  async deployToMobile() {
    try {
      console.log('Deploying model to mobile...');
      
      // Mark as deployed
      this.isDeployed = true;
      
      // Animated button state change
      this.updateDeployButtonState('connecting');
      
      // Update UI to show deployment is in progress with animation
      this.updateStatus('Connecting to piping server...', '#FFA500'); // Orange color
      
      // Generate the QR code and show the modal with animations
      this.openModal();
      
      // Start listening for mobile device connections
      this.pingLoop();
      
      // If we have a refresh button, show it with animation
      if (this.refreshMobileBtn) {
        this.refreshMobileBtn.style.display = 'block';
        animate(this.refreshMobileBtn, {
          opacity: [0, 1],
          translateY: [10, 0],
          duration: 500,
          delay: 300,
          easing: 'outQuad'
        });
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
  
  // Update deploy button state with animations
  updateDeployButtonState(state) {
    if (!this.modalDeployBtn) return;
    
    // If there's an ongoing animation, complete it immediately
    if (this.deployButtonAnimation) {
      this.deployButtonAnimation.pause();
    }
    
    // Reset all states
    this.modalDeployBtn.classList.remove('connecting', 'ready', 'error', 'connected');
    
    const buttonText = {
      connecting: 'Connecting...',
      ready: 'Piping Server Ready',
      connected: 'Mobile Connected',
      error: 'Connection Failed',
      default: 'Deploy to Mobile'
    };
    
    const buttonColors = {
      connecting: '#FFA500', // Orange
      ready: '#34A853',     // Green
      connected: '#4285F4', // Blue
      error: '#EA4335',     // Red
      default: '#4285F4'    // Blue
    };
    
    // Apply class and text
    this.modalDeployBtn.classList.add(state);
    
    // Animated text change
    const currentText = this.modalDeployBtn.textContent.trim();
    const newText = buttonText[state] || buttonText.default;
    
    // Only animate if text is different
    if (currentText !== newText) {
      // Fade out current text, change it, fade in new text
      this.deployButtonAnimation = animate(this.modalDeployBtn, {
        opacity: [1, 0, 1],
        scale: [1, 0.95, 1],
        backgroundColor: buttonColors[state],
        duration: 400,
        easing: 'outQuad',
        update: (anim) => {
          // Change text at the midpoint of the animation
          if (anim.progress > 50 && this.modalDeployBtn.innerHTML !== `<span>${newText}</span>`) {
            this.modalDeployBtn.innerHTML = `<span>${newText}</span>`;
          }
        }
      });
    } else {
      // Just animate the background color
      this.deployButtonAnimation = animate(this.modalDeployBtn, {
        backgroundColor: buttonColors[state],
        duration: 400,
        easing: 'outQuad'
      });
    }
    
    // Set disabled state as needed
    this.modalDeployBtn.disabled = state === 'connecting';
    
    // For connecting state, add a continuous pulse animation
    if (state === 'connecting') {
      animate(this.modalDeployBtn, {
        scale: [1, 1.05],
        duration: 800,
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutSine'
      });
    }
  }
  
  // Update status message with animations
  updateStatus(message, color = 'white') {
    if (this.statusMessage) {
      // Prepare animation - fade out current message
      animate(this.statusMessage, {
        opacity: [1, 0],
        translateY: [0, -10],
        duration: 200,
        easing: 'outQuad',
        complete: () => {
          // Update message content and color
          this.statusMessage.textContent = message;
          this.statusMessage.style.color = color;
          
          // Fade in new message
          animate(this.statusMessage, {
            opacity: [0, 1],
            translateY: [10, 0],
            duration: 400,
            easing: 'outQuad'
          });
        }
      });
      
      this.statusMessage.style.display = 'block';
      
      // Auto-hide success messages after 5 seconds with animation
      if (color === '#4285F4') {
        setTimeout(() => {
          animate(this.statusMessage, {
            opacity: [1, 0],
            translateY: [0, -10],
            duration: 500,
            easing: 'outQuad',
            complete: () => {
              this.statusMessage.style.display = 'none';
            }
          });
        }, 5000);
      }
    }
    
    // Also update connection status with animation
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
  
  // Update connection status indicator with animations
  updateConnectionStatus(state, message) {
    if (!this.connectionStatus) return;
    
    const indicator = this.connectionStatus.querySelector('.status-indicator');
    const statusText = this.connectionStatus.querySelector('.status-text');
    
    // Stop any existing animation
    if (this.connectionStatusAnimation) {
      this.connectionStatusAnimation.pause();
    }
    
    // Prepare animation if status is currently hidden
    if (this.connectionStatus.style.display === 'none') {
      this.connectionStatus.style.opacity = '0';
      this.connectionStatus.style.display = 'inline-flex';
    }
    
    // Clear any existing classes
    indicator.classList.remove('status-connecting', 'status-connected', 'status-error');
    
    // Set new indicator state
    const indicatorColors = {
      connecting: '#FFA500', // Orange
      connected: '#34A853',  // Green
      error: '#EA4335'       // Red
    };
    
    const statusMessages = {
      connecting: 'Connecting to piping server...',
      connected: 'Connected to piping server',
      error: 'Connection error'
    };
    
    // Animate the indicator color change and text update
    this.connectionStatusAnimation = animate({
      dummy: 0
    }, {
      dummy: 100,
      duration: 300,
      easing: 'outQuad',
      update: () => {
        // Update indicator color
        indicator.style.backgroundColor = indicatorColors[state];
        
        // Add pulsing animation for connecting state
        if (state === 'connecting' && !indicator.classList.contains('status-connecting')) {
          indicator.classList.add('status-connecting');
          
          // Create pulsing animation
          animate(indicator, {
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
            duration: 1500,
            loop: true,
            easing: 'easeInOutSine'
          });
        } else if (state !== 'connecting') {
          // Remove pulsing animation for other states
          indicator.style.animation = 'none';
        }
      },
      complete: () => {
        // Update status text with fade effect
        animate(statusText, {
          opacity: [0, 1],
          duration: 300,
          easing: 'outQuad',
          begin: () => {
            statusText.textContent = message || statusMessages[state];
          }
        });
      }
    });
  }
  
  // Enhanced refreshMobile method with animations
  async refreshMobile() {
    if (this.isSendingData || !this.isDeployed || this.sessionList.length === 0) {
      return;
    }
    
    try {
      console.log('Refreshing mobile view...');
      this.isSendingData = true;
      
      // Animate the refresh button state change
      if (this.refreshMobileBtn) {
        // First animation: change to "Sending..." state
        animate(this.refreshMobileBtn, {
          backgroundColor: '#FFA500', // Orange
          scale: [1, 0.95],
          duration: 300,
          easing: 'outQuad',
          complete: () => {
            this.refreshMobileBtn.textContent = 'Sending...';
            this.refreshMobileBtn.disabled = true;
          }
        });
      }
      
      // Animate status message update
      this.updateStatus('Sending data to mobile device. Textured models will take some time.', 'white');
      
      // Set a timeout to reset sending state
      setTimeout(() => {
        this.isSendingData = false;
        
        // Reset refresh button with animation
        if (this.refreshMobileBtn) {
          animate(this.refreshMobileBtn, {
            backgroundColor: '#34A853', // Green
            scale: [0.95, 1],
            duration: 300,
            easing: 'outQuad',
            complete: () => {
              this.refreshMobileBtn.textContent = 'Refresh Mobile';
              this.refreshMobileBtn.disabled = false;
            }
          });
        }
      }, this.REFRESH_DELAY);
      
      // Original data sending code
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
      
      // Show success message with animation
      this.updateStatus('Model successfully refreshed on mobile device!', '#4285F4');
      
      // Update refresh button to success state with animation
      if (this.refreshMobileBtn) {
        animate(this.refreshMobileBtn, {
          backgroundColor: '#34A853', // Green
          scale: [0.95, 1, 1.05, 1],
          duration: 800,
          easing: 'outElastic(1, 0.3)',
          complete: () => {
            this.refreshMobileBtn.textContent = 'Successfully Refreshed';
            this.refreshMobileBtn.disabled = false;
            
            // Reset text after 3 seconds with animation
            setTimeout(() => {
              if (this.refreshMobileBtn) {
                animate(this.refreshMobileBtn, {
                  scale: [1, 0.95, 1],
                  duration: 400,
                  easing: 'outQuad',
                  update: (anim) => {
                    // Change text at the midpoint of the animation
                    if (anim.progress > 50 && this.refreshMobileBtn.textContent !== 'Refresh Mobile') {
                      this.refreshMobileBtn.textContent = 'Refresh Mobile';
                    }
                  }
                });
              }
            }, 3000);
          }
        });
      }
      
    } catch (error) {
      console.error('Error refreshing mobile view:', error);
      this.updateStatus('Failed to refresh mobile view. Please try again.', '#DC143C');
      
      // Reset refresh button to error state with animation
      if (this.refreshMobileBtn) {
        animate(this.refreshMobileBtn, {
          backgroundColor: '#EA4335', // Red
          duration: 300,
          easing: 'outQuad',
          complete: () => {
            this.refreshMobileBtn.textContent = 'Refresh Failed - Try Again';
            this.refreshMobileBtn.disabled = false;
          }
        });
      }
    } finally {
      this.isSendingData = false;
    }
  }
  
  // The rest of the methods remain the same as original
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
  
  getMobileOperatingSystem() {
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
        
        // Update deploy button state to connected with animation
        this.updateDeployButtonState('connected');
        
        // Update UI to show connection success with animation
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
