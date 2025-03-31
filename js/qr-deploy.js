// Mobile deployment with QR code functionality

// Get QR code related elements
const modalDeployBtn = document.getElementById('modalDeployBtn');
const qrOverlay = document.getElementById('qrOverlay');
const qrCloseButton = document.getElementById('qrCloseButton');
const qrUrl = document.getElementById('qr-url');

// Deploy to mobile functionality
modalDeployBtn.addEventListener('click', async () => {
  try {
    // Generate a unique ID for this deployment
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    // Get the current model URL from the gallery.js
    // Note: currentModelSrc and currentModelTitle are declared in gallery.js
    
    // Generate QR code
    const qrCode = document.getElementById('qr-code');
    QRCode.toCanvas(qrCode, currentModelSrc, { width: 200 }, function(error) {
      if (error) console.error('Error generating QR code:', error);
    });
    
    // Set the URL text
    qrUrl.textContent = currentModelSrc;
    
    // Show the QR code overlay
    qrOverlay.style.display = 'flex';
  } catch (error) {
    console.error('Error deploying to mobile:', error);
    alert('Failed to deploy model to mobile. Please try again.');
  }
});

// Close button functionality for QR code
qrCloseButton.addEventListener('click', () => {
  qrOverlay.style.display = 'none';
});

// Close QR overlay when clicking outside the QR container
qrOverlay.addEventListener('click', (event) => {
  if (event.target === qrOverlay) {
    qrOverlay.style.display = 'none';
  }
});

// Extend the ESC key functionality to close QR overlay
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && qrOverlay.style.display === 'flex') {
    qrOverlay.style.display = 'none';
  }
});
