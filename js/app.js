// Content from js/main.js
// Draco Decoder Support
// Configure Draco decoder before model-viewer loads
window.ModelViewerElement = window.ModelViewerElement || {};
window.ModelViewerElement.dracoDecoderLocation = 'https://unpkg.com/three@0.152.0/examples/js/libs/draco/';

// Alternative: Use Google's CDN for Draco
// window.ModelViewerElement.dracoDecoderLocation = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';

// Enhanced error handling for model-viewer (from main.js)
// Note:DOMContentLoaded listener for Draco errors
window.addEventListener('DOMContentLoaded', () => {
  // Global error handler for model loading
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('draco')) {
      console.warn('🔧 Draco decoder issue detected, attempting fallback...');
      event.preventDefault(); // Prevent console spam

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

// Minimal initialization script (from main.js)
// Note:DOMContentLoaded listener for gallery init and server status
document.addEventListener('DOMContentLoaded', function() {
  // Check if models configuration was loaded
  if (!window.modelsConfig || !window.initializeGallery) {
    console.error('Models configuration not loaded. Please ensure models/models.js is accessible.');
    const galleryErrorEl = document.getElementById('modelGallery');
    if (galleryErrorEl) {
      galleryErrorEl.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #666;">
          <h2>Error Loading Models</h2>
          <p>Could not load models configuration from models/models.js</p>
          <p>Please check that the file exists and is accessible.</p>
        </div>`;
    }
    return;
  }

  if (window.modelsConfig && typeof window.initializeGallery === 'function') {
    console.log('Calling initializeGallery from app.js'); // Updated log message
    window.initializeGallery();
  } else {
    console.error('initializeGallery function not found, though modelsConfig might exist. Gallery cannot be initialized by app.js.');
  }

  initializeServerStatus();
  initializeDraggableWindow();

  // AR mode selector integration (moved from gallery.js DOMContentLoaded)
  const arModeSelector = document.getElementById('arModeSelector');
  if (arModeSelector) {
    arModeSelector.addEventListener('change', (e) => {
      if (window.mobileDeployment) {
        window.mobileDeployment.toggleArMode(e.target.checked);
      }
    });
  }
});

// Server status monitoring (from main.js) - Adapted for new draggable window
function initializeServerStatus() {
  const statusWindow = document.getElementById('serverStatusWindow');
  const statusText = document.getElementById('serverStatusText');

  if (!statusWindow || !statusText) return;

  statusWindow.style.display = 'block'; // Make the window visible
  statusWindow.className = 'draggable-window testing'; // Set initial class for styling
  statusText.textContent = 'Initializing...';

  // Since we removed server testing, we just show the hardcoded server.
  // The logic to check for mobileDeployment is still relevant if qr-deploy.js needs to load.
  // A cleaner way might be for qr-deploy.js to call a status update function itself.
  // For now, this polling is a simple way to wait for it.

  const checkDeploymentStatus = () => {
    if (window.mobileDeployment) {
        const currentPipingDomain = PipingUtils.getCurrentDomain();
        statusWindow.className = 'draggable-window connected';
        statusText.textContent = `Using: ${currentPipingDomain.replace('https://', '').replace('/', '')}`;

        // Also update the info in the QR modal if it exists
        const serverInfo = document.getElementById('serverInfo');
        if (serverInfo) {
          serverInfo.textContent = `Using: ${currentPipingDomain}`;
        }
    } else {
        // If qr-deploy.js hasn't loaded window.mobileDeployment yet, check again.
        setTimeout(checkDeploymentStatus, 500);
    }
  };

  checkDeploymentStatus();
}

// Content from js/gallery.js
// Get gallery container and modal elements
const galleryDisplay = document.getElementById('modelGallery'); // Renamed to avoid conflict with main.js's gallery var in DOMContentLoaded
const overlay = document.getElementById('modelOverlay');
const modalViewer = document.getElementById('modalModelViewer');
const closeButton = document.getElementById('closeButton');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');

// Current model data - making it global so it can be accessed by QR code functionality
window.currentModelSrc = '';
window.currentModelTitle = '';

// AR mode selector integration was moved into the DOMContentLoaded listener from main.js
// to consolidate DOMContentLoaded logic.

// Event delegation for dynamically generated model cards
// Ensure galleryDisplay is not null before adding event listener
if (galleryDisplay) {
  galleryDisplay.addEventListener('click', (event) => {
    if (event.target.classList.contains('download-btn')) {
      event.stopPropagation();
      return;
    }

    const modelCard = event.target.closest('.model-card');
    if (modelCard) {
      const modelUrl = modelCard.dataset.modelUrl; // Get URL from data-model-url
      window.currentModelTitle = modelCard.dataset.title;
      window.currentModelSrc = modelUrl; // Keep this updated for download and QR deploy

      // Lazy load the model in the card itself
      const cardModelViewer = modelCard.querySelector('model-viewer');
      if (cardModelViewer && (!cardModelViewer.src || cardModelViewer.src !== modelUrl)) {
        console.log(`Loading model in card: ${modelUrl}`);
        cardModelViewer.src = modelUrl;
      }

      // Set up the modal viewer
      // modalViewer.setAttribute('src', modelUrl); // Moved to load event listener
      // modalViewer.setAttribute('alt', window.currentModelTitle); // Moved to load event listener

      modalDownloadBtn.href = modelUrl;
      modalDownloadBtn.setAttribute('download', window.currentModelTitle + '.glb');

      if (window.mobileDeployment && window.mobileDeployment.isDeployed) {
        window.mobileDeployment.contentHasChanged = true;
        if (window.mobileDeployment.sessionList.length > 0) {
          const refreshBtn = document.getElementById('refreshMobileBtn');
          if (refreshBtn) refreshBtn.style.display = 'block';
        }
      }

      // Function to open the modal (to avoid code duplication)
      const openModalWithModel = () => {
        console.log(`Model ${modelUrl} is ready or loaded in card, preparing and opening modal.`);
        if (modalViewer) {
          // Set a default camera orbit BEFORE setting the new src
          // This can help ensure the camera system is reset/re-initialized
          modalViewer.cameraOrbit = '0deg 75deg 105%'; // Default starting orbit

          modalViewer.setAttribute('src', modelUrl);
          modalViewer.setAttribute('alt', window.currentModelTitle);
        }
        if (overlay) {
          overlay.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
      };

      // Check if the card's model-viewer is already loaded with the correct src
      if (cardModelViewer && cardModelViewer.loaded && cardModelViewer.src === modelUrl) {
        // If already loaded and src is correct, open modal immediately
        openModalWithModel();
      } else if (cardModelViewer) {
        // Otherwise, if src is different or not loaded, ensure src is set and wait for it to load
        // The src attribute might have already been set just above this block if it was new
        // This event listener will handle the case where it's still loading
        cardModelViewer.addEventListener('load', openModalWithModel, { once: true });
      } else {
        // Fallback if cardModelViewer somehow isn't found (shouldn't happen)
        console.warn('Card model viewer not found, opening modal immediately (fallback).');
        openModalWithModel();
      }
    }
  });
} else {
  console.warn("Gallery display element ('modelGallery') not found. Click events for model cards will not work.");
}


// Close button functionality for modal
if (closeButton) {
  closeButton.addEventListener('click', () => {
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
    if (modalViewer) {
      modalViewer.src = ''; // Clear the source
      console.log('Modal closed by button, src cleared.');
    }
  });
}

// Close modal when clicking outside the modal content
if (overlay) {
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      overlay.style.display = 'none';
      document.body.style.overflow = 'auto';
      if (modalViewer) {
        modalViewer.src = ''; // Clear the source
        console.log('Modal closed by overlay click, src cleared.');
      }
    }
  });
}

// Close modal when pressing ESC key
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (overlay && overlay.style.display === 'flex') { // Check if overlay exists
      overlay.style.display = 'none';
      document.body.style.overflow = 'auto';
      if (modalViewer) {
        modalViewer.src = ''; // Clear the source
        console.log('Modal closed by ESC key, src cleared.');
      }
    }
  }
});

// Function to initialize gallery event delegation (from gallery.js)
// This function seems mostly for logging purposes as event delegation handles dynamic content.
function initializeGalleryEvents() {
  console.log('Gallery event delegation initialized (now part of app.js)');
}
window.initializeGalleryEvents = initializeGalleryEvents; // Export if needed elsewhere, though likely not.

console.log('app.js loaded');

// ===== Draggable Window Logic =====
function makeDraggable(element, handle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  const dragMouseDown = (e) => {
    e = e || window.event;
    e.preventDefault();
    // Get the mouse cursor position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Call a function whenever the cursor moves
    document.onmousemove = elementDrag;
  };

  const elementDrag = (e) => {
    e = e || window.event;
    e.preventDefault();
    // Calculate the new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Set the element's new position
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  };

  const closeDragElement = () => {
    // Stop moving when mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;
  };

  if (handle) {
    // If present, the header is where you move the DIV from
    handle.onmousedown = dragMouseDown;
  } else {
    // Otherwise, move the DIV from anywhere inside the DIV
    element.onmousedown = dragMouseDown;
  }
}

// Make the server status window draggable
// This is called in the main DOMContentLoaded listener
function initializeDraggableWindow() {
    const statusWindow = document.getElementById('serverStatusWindow');
    const statusHeader = document.getElementById('serverStatusHeader');
    if (statusWindow && statusHeader) {
        makeDraggable(statusWindow, statusHeader);
    }
}
