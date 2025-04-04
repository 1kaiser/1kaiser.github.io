// anime-animations.js - Main animations for the 3D model gallery

import {
  animate,
  stagger,
  utils,
  createTimeline,
  eases
} from '../lib/anime.esm.js';

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  const modelCards = document.querySelectorAll('.model-card');
  const overlay = document.getElementById('modelOverlay');
  const modal = overlay.querySelector('.modal');
  const qrOverlay = document.getElementById('qrOverlay');
  const qrContainer = qrOverlay.querySelector('.qr-container');
  
  // Run initial page load animations
  initPageLoadAnimations();
  
  // Setup event listeners for animations
  setupAnimationListeners();
  
  /**
   * Initial animations when page loads
   */
  function initPageLoadAnimations() {
    // Animate the title
    animate('h1', {
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 1000,
      easing: 'outExpo'
    });
    
    // Animate the model cards with staggered entrance
    animate(modelCards, {
      opacity: [0, 1],
      translateY: [50, 0],
      scale: [0.9, 1],
      duration: 800,
      delay: stagger(120, { from: 'center' }),
      easing: 'outExpo'
    });
  }
  
  /**
   * Setup event listeners for interactive animations
   */
  function setupAnimationListeners() {
    // Enhanced hover effects for cards
    modelCards.forEach(card => {
      // Remove the default hover transition from CSS
      card.style.transition = 'none';
      
      // Mouse enter animation
      card.addEventListener('mouseenter', () => {
        animate(card, {
          scale: 1.05,
          translateY: -10,
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
          duration: 500,
          easing: 'outQuint'
        });
      });
      
      // Mouse leave animation
      card.addEventListener('mouseleave', () => {
        animate(card, {
          scale: 1,
          translateY: 0,
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          duration: 700,
          easing: 'outElastic(1, 0.3)'
        });
      });
      
      // Click animation - Add a quick pulse
      card.addEventListener('click', () => {
        animate(card, {
          scale: [1, 1.1, 1],
          duration: 300,
          easing: 'outQuad'
        });
      });
    });
    
    // Enhance modal animations
    setupModalAnimations(overlay, modal);
    
    // Enhance QR overlay animations
    setupQROverlayAnimations(qrOverlay, qrContainer);
    
    // Add animation to download buttons
    animateButtons();
  }
  
  /**
   * Setup animations for the modal
   */
  function setupModalAnimations(overlay, modal) {
    // Original open modal function in gallery.js
    const originalCardClick = modelCards[0].onclick;
    
    // Replace click handler on cards to include animation
    modelCards.forEach(card => {
      card.onclick = function() {
        // Get the clicked card's position for animation start point
        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;
        
        // Reset modal styles for animation
        modal.style.opacity = '0';
        modal.style.transform = `translate(-50%, -50%) scale(0.7)`;
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transition = 'none';
        
        // Show overlay without animation first
        overlay.style.opacity = '0';
        overlay.style.display = 'flex';
        
        // Create timeline for coordinated animation
        const timeline = createTimeline();
        
        // Animate overlay background
        timeline.add(overlay, {
          opacity: [0, 1],
          duration: 400,
          easing: 'outQuad'
        });
        
        // Animate modal
        timeline.add(modal, {
          opacity: [0, 1],
          scale: [0.7, 1],
          translateX: ['-50%', '-50%'],
          translateY: ['-50%', '-50%'],
          duration: 500,
          easing: 'outExpo'
        }, '-=300');
        
        // Call the original click handler
        if (originalCardClick) {
          originalCardClick.call(this);
        } else {
          // Fallback if original handler is not available
          const currentModelSrc = card.getAttribute('data-model');
          const currentModelTitle = card.getAttribute('data-title');
          
          // Update modal content
          const modalViewer = document.getElementById('modalModelViewer');
          const modalDownloadBtn = document.getElementById('modalDownloadBtn');
          
          window.currentModelSrc = currentModelSrc;
          window.currentModelTitle = currentModelTitle;
          
          modalViewer.setAttribute('src', currentModelSrc);
          modalViewer.setAttribute('alt', currentModelTitle);
          
          modalDownloadBtn.href = currentModelSrc;
          modalDownloadBtn.setAttribute('download', currentModelTitle + '.glb');
        }
        
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
      };
    });
    
    // Enhanced close modal animation
    const closeButton = document.getElementById('closeButton');
    const originalCloseClick = closeButton.onclick;
    
    closeButton.onclick = function() {
      // Create a timeline for closing animation
      const timeline = createTimeline();
      
      // Animate modal
      timeline.add(modal, {
        opacity: [1, 0],
        scale: [1, 0.8],
        duration: 300,
        easing: 'outQuad'
      });
      
      // Animate overlay
      timeline.add(overlay, {
        opacity: [1, 0],
        duration: 300,
        easing: 'outQuad'
      }, '-=200');
      
      // Hide the overlay after animation completes
      setTimeout(() => {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Call original handler if available
        if (originalCloseClick) {
          originalCloseClick.call(this);
        }
      }, 300);
    };
    
    // Enhanced click outside to close
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeButton.onclick();
      }
    });
  }
  
  /**
   * Setup animations for the QR overlay
   */
  function setupQROverlayAnimations(qrOverlay, qrContainer) {
    // Get QR close button
    const qrCloseButton = document.getElementById('qrCloseButton');
    
    // Enhanced close QR overlay animation
    if (qrCloseButton) {
      const originalQrClose = qrCloseButton.onclick;
      
      qrCloseButton.onclick = function() {
        // Animate the container
        const qrAnimation = animate(qrContainer, {
          opacity: [1, 0],
          scale: [1, 0.8],
          duration: 300,
          easing: 'outQuad'
        });
        
        // Animate the overlay
        animate(qrOverlay, {
          opacity: [1, 0],
          duration: 300,
          easing: 'outQuad',
          delay: 100
        });
        
        // Hide overlay after animation completes
        qrAnimation.then(() => {
          qrOverlay.style.display = 'none';
          
          // Call original close function if it exists
          if (originalQrClose) {
            originalQrClose.call(this);
          }
        });
      };
      
      // Enhanced click outside to close
      qrOverlay.addEventListener('click', (event) => {
        if (event.target === qrOverlay) {
          qrCloseButton.onclick();
        }
      });
    }
  }
  
  /**
   * Animate buttons (download and deploy)
   */
  function animateButtons() {
    // Get all buttons
    const buttons = document.querySelectorAll('.download-btn, .modal-download-btn, .modal-deploy-btn, .qr-close, .modal-refresh-btn');
    
    // Add hover and click animations
    buttons.forEach(button => {
      // Remove default transitions
      button.style.transition = 'none';
      
      // Hover animations
      button.addEventListener('mouseenter', () => {
        animate(button, {
          scale: 1.05,
          duration: 300,
          easing: 'outQuad'
        });
      });
      
      button.addEventListener('mouseleave', () => {
        animate(button, {
          scale: 1,
          duration: 300,
          easing: 'outQuad'
        });
      });
      
      // Click animation
      button.addEventListener('click', () => {
        animate(button, {
          scale: [1, 0.95, 1],
          duration: 300,
          easing: 'outQuad'
        });
      });
    });
  }
  
  /**
   * Create a pulsing animation for elements
   * @param {HTMLElement} element - Element to animate
   * @param {Object} options - Animation options
   */
  function createPulseAnimation(element, options = {}) {
    const defaultOptions = {
      scale: [1, 1.05],
      opacity: [0.8, 1],
      duration: 1000,
      loop: true,
      direction: 'alternate',
      easing: 'easeInOutSine'
    };
    
    const mergedOptions = {...defaultOptions, ...options};
    return animate(element, mergedOptions);
  }
  
  // Create pulsing effect for connection status indicator
  const statusIndicator = document.querySelector('.status-indicator');
  if (statusIndicator) {
    createPulseAnimation(statusIndicator);
  }
  
  // Expose animation functions to window for other scripts
  window.animeAnimations = {
    createPulseAnimation,
    animate
  };
});
