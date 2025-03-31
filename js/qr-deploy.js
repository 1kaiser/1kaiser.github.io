// Mobile deployment with QR code functionality using Piping Server

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
    
    // Use the Piping Server for deployment
    const pipingServerUrl = 'https://piping.glitch.me/deploy';
    
    // Get the current model URL
    const modelUrl = currentModelSrc; // This is defined in gallery.js
    
    // Post the model URL to the piping server
    const response = await fetch(pipingServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ modelUrl })
    });
    
    // Process the response from the piping server
    const data = await response.json();
    
    if (data.mobileUrl) {
      // Generate QR code with the mobile URL
      const qrCode = document.getElementById('qr-code');
      QRCode.toCanvas(qrCode, data.mobileUrl, { width: 200 }, function(error) {
        if (error) console.error('Error generating QR code:', error);
      });
      
      // Set the URL text
      qrUrl.textContent = data.mobileUrl;
      
      // Show the QR code overlay
      qrOverlay.style.display = 'flex';
    } else {
      throw new Error('No mobile URL returned from piping server');
    }
  } catch (error) {
    console.error('Error deploying to mobile:', error);
    alert('Failed to deploy model to mobile. Please try again.');
    
    // Fallback to direct QR code generation if piping server fails
    const qrCode = document.getElementById('qr-code');
    QRCode.toCanvas(qrCode, currentModelSrc, { width: 200 }, function(error) {
      if (error) console.error('Error generating QR code:', error);
    });
    
    qrUrl.textContent = currentModelSrc;
    qrOverlay.style.display = 'flex';
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
