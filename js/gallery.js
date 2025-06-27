// Core gallery functionality with event delegation for dynamic content

// Get gallery container and modal elements
const gallery = document.getElementById('modelGallery');
const overlay = document.getElementById('modelOverlay');
const modalViewer = document.getElementById('modalModelViewer');
const closeButton = document.getElementById('closeButton');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');

// Current model data - making it global so it can be accessed by QR code functionality
window.currentModelSrc = '';
window.currentModelTitle = '';

// AR mode selector integration
document.addEventListener('DOMContentLoaded', () => {
  const arModeSelector = document.getElementById('arModeSelector');
  
  if (arModeSelector) {
    arModeSelector.addEventListener('change', (e) => {
      // If mobile deployment is initialized, update its AR mode
      if (window.mobileDeployment) {
        window.mobileDeployment.toggleArMode(e.target.checked);
      }
    });
  }
});

// Event delegation for dynamically generated model cards
gallery.addEventListener('click', (event) => {
  // Handle download button clicks - prevent propagation to card click
  if (event.target.classList.contains('download-btn')) {
    event.stopPropagation();
    return;
  }
  
  // Find the closest model card to the clicked element
  const modelCard = event.target.closest('.model-card');
  
  // If a model card was clicked, open the modal
  if (modelCard) {
    // Get model data from the card attributes
    window.currentModelSrc = modelCard.getAttribute('data-model');
    window.currentModelTitle = modelCard.getAttribute('data-title');
    const modelDesc = modelCard.getAttribute('data-desc');
    
    // Set the source for the modal model viewer
    modalViewer.setAttribute('src', window.currentModelSrc);
    modalViewer.setAttribute('alt', window.currentModelTitle);
    
    // Update the download button in the modal
    modalDownloadBtn.href = window.currentModelSrc;
    modalDownloadBtn.setAttribute('download', window.currentModelTitle + '.glb');
    
    // If mobile deployment is active and there are connected sessions, mark content as changed
    if (window.mobileDeployment && window.mobileDeployment.isDeployed) {
      window.mobileDeployment.contentHasChanged = true;
      
      // Show refresh button if sessions exist
      if (window.mobileDeployment.sessionList.length > 0) {
        const refreshBtn = document.getElementById('refreshMobileBtn');
        if (refreshBtn) refreshBtn.style.display = 'block';
      }
    }
    
    // Show the overlay
    overlay.style.display = 'flex';
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  }
});

// Close button functionality for modal
closeButton.addEventListener('click', () => {
  overlay.style.display = 'none';
  document.body.style.overflow = 'auto';
});

// Close modal when clicking outside the modal content
overlay.addEventListener('click', (event) => {
  if (event.target === overlay) {
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
});

// Close modal when pressing ESC key
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (overlay.style.display === 'flex') {
      overlay.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }
});

// Function to initialize gallery event delegation (called after dynamic content is generated)
function initializeGalleryEvents() {
  // This function can be called if additional initialization is needed
  // Currently, event delegation handles everything automatically
  console.log('Gallery event delegation initialized for dynamic content');
}

// Export function for potential use by other scripts
window.initializeGalleryEvents = initializeGalleryEvents;
