// Content from js/main.js
// Draco Decoder Support
// Configure Draco decoder before model-viewer loads
// Sourced from unpkg, which hosts Google's Draco library.
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

// Event delegation for dynamically generated model cards (legacy path --
// the gallery has been Vue-driven for a while now and no longer creates a
// #modelGallery element or .expand-btn buttons, so this branch is inert on
// the current markup; left in place in case something upstream still
// targets it, rather than deleting behavior that isn't actually broken).
if (galleryDisplay) {
  // Handles clicks on the expand button to open the modal
  galleryDisplay.addEventListener('click', (event) => {
    if (event.target.classList.contains('expand-btn')) {
      const modelCard = event.target.closest('.model-card');
      if (modelCard) {
        const modelUrl = modelCard.dataset.modelUrl;
        const modelTitle = modelCard.dataset.title;
        openModalWithModel(modelUrl, modelTitle);
      }
    }
  });
} else {
  console.warn("Gallery display element ('modelGallery') not found. Click events for model cards will not work.");
}

// Moved out of the dead `if (galleryDisplay)` branch above and exposed on
// `window` so the Vue-based gallery (js/gallery-vue.js) can trigger this
// same modal -- previously only reachable via the now-inert .expand-btn
// delegation, which meant this whole modal (camera-controls, AR, the
// built-in download button, blob caching) was unreachable from the
// current gallery despite being fully built and wired.
const openModalWithModel = (modelUrl, modelTitle, autoRotate) => {
  window.currentModelTitle = modelTitle;
  window.currentModelSrc = modelUrl;

  modalDownloadBtn.href = modelUrl;
  modalDownloadBtn.setAttribute('download', modelTitle + '.glb');

  if (window.mobileDeployment && window.mobileDeployment.isDeployed) {
    window.mobileDeployment.contentHasChanged = true;
    if (window.mobileDeployment.sessionList.length > 0) {
      const refreshBtn = document.getElementById('refreshMobileBtn');
      if (refreshBtn) refreshBtn.style.display = 'block';
    }
  }

  if (modalViewer) {
    // The model might be in the browser's cache thanks to the interactive viewer
    // Fetching it again to be sure and to place it in our specific cache if not already.
    //
    // Real bug found while wiring this up to the new expand buttons (this
    // modal was previously unreachable -- see the comment above
    // openModalWithModel -- so this had never actually run in practice):
    // the original code called `cache.put(url, response.clone())` WITHOUT
    // awaiting it, then immediately read `.blob()` on the sibling
    // (original) response. In this Chromium build that reliably hangs
    // `.blob()` forever -- reproduced in isolation with a bare
    // fetch+clone+put+blob sequence, and confirmed fixed by simply
    // awaiting `cache.put()` before reading the blob, rather than racing
    // the two reads of the tee'd stream against each other.
    caches.open('models-cache').then(cache => {
      cache.match(modelUrl).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse.blob();
        }
        return fetch(modelUrl).then(networkResponse => {
          return cache.put(modelUrl, networkResponse.clone()).then(() => networkResponse.blob());
        });
      }).then(blob => {
        const objectURL = URL.createObjectURL(blob);
        modalViewer.src = ''; // Clear previous model
        modalViewer.cameraOrbit = '0deg 75deg 105%';
        modalViewer.setAttribute('src', objectURL);
        modalViewer.setAttribute('alt', modelTitle);
        if (autoRotate) {
          modalViewer.setAttribute('auto-rotate', '');
        } else {
          modalViewer.removeAttribute('auto-rotate');
        }
      });
    });
  }

  if (overlay) {
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
};
window.openModelModal = openModalWithModel;


// Close button functionality for modal
if (closeButton) {
  closeButton.addEventListener('click', () => {
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
    if (modalViewer) {
      modalViewer.src = ''; // Clear the source
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

// ===== New Dual-Mode Gallery Logic =====

let isCarouselMode = false;
let gallery, cards, numCards;

function applyStaticLayout() {
    if (!gallery || !cards) return;

    cards.forEach((card, i) => {
        // Store static transform for returning from carousel mode
        if (!card.dataset.staticTransform) {
            const center_x = gallery.offsetWidth / 2 - card.offsetWidth / 2;
            const center_y = gallery.offsetHeight / 2 - card.offsetHeight / 2;
            const random_rotate_z = (Math.random() * 20) - 10;
            const random_x = (Math.random() * 100) - 50;
            const random_y = (Math.random() * 100) - 50;
            const position_x = center_x + random_x + (i - numCards / 2) * 120; // Reduced spread
            const position_y = center_y + random_y;

            card.dataset.staticLeft = `${position_x}px`;
            card.dataset.staticTop = `${position_y}px`;
            card.dataset.staticTransform = `rotateZ(${random_rotate_z}deg) scale(0.7)`;
            card.dataset.staticZIndex = i;
        }

        card.style.left = card.dataset.staticLeft;
        card.style.top = card.dataset.staticTop;
        card.style.transform = card.dataset.staticTransform;
        card.style.zIndex = card.dataset.staticZIndex;

        const modelViewer = card.querySelector('model-viewer');
        if (modelViewer && !modelViewer.dataset.revealed) {
            modelViewer.reveal();
            modelViewer.dataset.revealed = 'true';
        }
    });
}

function applyCarouselLayout(progress) {
    if (!gallery || !cards) return;

    cards.forEach((card, i) => {
        const cardOffset = (numCards > 1) ? (i / (numCards - 1)) - 0.5 : 0;
        const mouseOffset = progress - 0.5;
        const distance = Math.abs(cardOffset - mouseOffset);

        const rotation = (cardOffset - mouseOffset) * 40;
        const translationX = (cardOffset - mouseOffset) * 400;
        const scale = 1 - (distance * 0.2);
        const zIndex = Math.round(100 - (distance * 50));

        // We need to position the cards from the center
        const center_x = gallery.offsetWidth / 2 - card.offsetWidth / 2;
        const center_y = gallery.offsetHeight / 2 - card.offsetHeight / 2;

        card.style.left = `${center_x}px`;
        card.style.top = `${center_y}px`;
        card.style.transform = `translateX(${translationX}px) rotateY(${rotation}deg) scale(${scale})`;
        card.style.zIndex = zIndex;
    });
}

// After the gallery is initialized, set up the dual-mode logic.
document.addEventListener('DOMContentLoaded', () => {
    gallery = document.getElementById('modelGallery');
    if (gallery) {
        const observer = new MutationObserver(() => {
            cards = gallery.querySelectorAll('.model-card');
            numCards = cards.length;
            if (numCards > 0) {
                // Set the initial static layout
                setTimeout(() => {
                    applyStaticLayout();
                }, 100);

                // Add event listeners for mode switching
                gallery.addEventListener('mouseenter', handleMouseEnter);
                gallery.addEventListener('mouseleave', handleMouseLeave);

                observer.disconnect();
            }
        });
        observer.observe(gallery, { childList: true });
    }
});

function handleMouseEnter() {
    isCarouselMode = true;
    gallery.addEventListener('mousemove', handleMouseMove);
    // Initial transition to carousel view (center)
    applyCarouselLayout(0.5);
}

function handleMouseLeave() {
    isCarouselMode = false;
    gallery.removeEventListener('mousemove', handleMouseMove);
    // Transition back to static layout
    applyStaticLayout();
}

function handleMouseMove(e) {
    if (!isCarouselMode) return;
    const galleryRect = gallery.getBoundingClientRect();
    const mouseX = e.clientX - galleryRect.left;
    const progress = mouseX / galleryRect.width;
    applyCarouselLayout(progress);
}
