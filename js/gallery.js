// Core gallery functionality

// Get all model cards
const modelCards = document.querySelectorAll('.model-card');
const overlay = document.getElementById('modelOverlay');
const modalViewer = document.getElementById('modalModelViewer');
const closeButton = document.getElementById('closeButton');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');

// Current model data - making it global so it can be accessed by QR code functionality
let currentModelSrc = '';
let currentModelTitle = '';

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
    currentModelSrc = card.getAttribute('data-model');
    currentModelTitle = card.getAttribute('data-title');
    
    // Set the source for the modal model viewer
    modalViewer.setAttribute('src', currentModelSrc);
    modalViewer.setAttribute('alt', currentModelTitle);
    
    // Update the download button in the modal
    modalDownloadBtn.href = currentModelSrc;
    modalDownloadBtn.setAttribute('download', currentModelTitle + '.glb');
    
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
