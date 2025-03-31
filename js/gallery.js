// Core gallery functionality

// Get all model cards
const modelCards = document.querySelectorAll('.model-card');
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

// Prevent download buttons from triggering the card click
document.querySelectorAll('.download-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
  });
});

// Add click event to each model card
modelCards.forEach(card => {
  card.addEventListener('click', () => {
    // Get model data from the card
    window.currentModelSrc = card.getAttribute('data-model');
    window.currentModelTitle = card.getAttribute('data-title');
    const modelDesc = card.getAttribute('data-desc');
    
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
  });
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
