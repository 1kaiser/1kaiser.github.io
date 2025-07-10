// Draco Decoder Support
// Configure Draco decoder before model-viewer loads
window.ModelViewerElement = window.ModelViewerElement || {};
window.ModelViewerElement.dracoDecoderLocation = 'https://unpkg.com/three@0.152.0/examples/js/libs/draco/';

// Alternative: Use Google's CDN for Draco
// window.ModelViewerElement.dracoDecoderLocation = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';

// Enhanced error handling for model-viewer
window.addEventListener('DOMContentLoaded', () => {
  // Global error handler for model loading
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('draco')) {
      console.warn('🔧 Draco decoder issue detected, attempting fallback...');
      event.preventDefault(); // Prevent console spam

      // Try to find and reload the problematic model viewer
      document.querySelectorAll('model-viewer').forEach(mv => {
        if (mv.src && !mv.dataset.dracoRetried) {
          mv.dataset.dracoRetried = 'true';
          const originalSrc = mv.src;
          setTimeout(() => {
            mv.src = '';
            setTimeout(() => {
              mv.src = originalSrc;
            }, 100);
          }, 500);
        }
      });
    }
  });
});

// Minimal initialization script
// Simple fallback initialization if external script doesn't load
document.addEventListener('DOMContentLoaded', function() {
  // Check if models configuration was loaded
  if (!window.modelsConfig || !window.initializeGallery) {
    console.error('Models configuration not loaded. Please ensure models/models.js is accessible.');

    // Show error message in gallery
    const gallery = document.getElementById('modelGallery');
    if (gallery) {
      gallery.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #666;">
          <h2>Error Loading Models</h2>
          <p>Could not load models configuration from models/models.js</p>
          <p>Please check that the file exists and is accessible.</p>
        </div>
      `;
    }
    return;
  }

  // Initialize the gallery if not already done
  // The check for window.initializeGallery is already done above
  // Redundant check: if (window.modelsConfig && window.initializeGallery) {
  // No, it's fine, initializeGallery might exist but modelsConfig might not.
  // The first check is !window.modelsConfig OR !window.initializeGallery
  // So if we pass that, both must exist.
  // However, it's safer to keep the check or ensure initializeGallery itself checks for modelsConfig.
  // For now, let's assume initializeGallery handles if modelsConfig is missing,
  // or that this ordering is intentional.
  if (window.modelsConfig && typeof window.initializeGallery === 'function') {
    console.log('Calling initializeGallery from main.js');
    window.initializeGallery(); // Explicitly call it here
  } else {
    // This case should ideally be caught by the check above,
    // but as a fallback if modelsConfig exists but initializeGallery doesn't for some reason.
    console.error('initializeGallery function not found, though modelsConfig might exist. Gallery cannot be initialized by main.js.');
  }

  // Initialize server status monitoring
  initializeServerStatus();
});

// Server status monitoring
function initializeServerStatus() {
  const statusElement = document.getElementById('serverStatus');
  const statusText = document.getElementById('serverStatusText');

  if (!statusElement || !statusText) return;

  // Show status indicator
  statusElement.style.display = 'block';
  statusElement.className = 'server-status testing';
  statusText.textContent = 'Testing servers...';

  // Monitor deployment system initialization
  const checkStatus = () => {
    if (window.mobileDeployment) {
      const currentServer = window.PipingServerUtils?.CURRENT_DOMAIN;
      if (currentServer) {
        statusElement.className = 'server-status connected';
        statusText.textContent = `Connected: ${currentServer.replace('https://', '').replace('/', '')}`;

        // Update server info in QR modal
        const serverInfo = document.getElementById('serverInfo');
        if (serverInfo) {
          serverInfo.textContent = `Using: ${currentServer}`;
        }
      } else {
        statusElement.className = 'server-status disconnected';
        statusText.textContent = 'No servers available';
      }
    } else {
      // If mobileDeployment is not yet available, wait and check again.
      // This is important as qr-deploy.js (which defines mobileDeployment) might load after main.js
      setTimeout(checkStatus, 1000);
    }
  };

  checkStatus();
}
