// mobile-animations.js - Animation functions for the mobile view

import {
  animate,
  createTimeline,
  utils
} from '../lib/anime.esm.js';

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  const modelViewer = document.getElementById('mobileModelViewer');
  const overlay = document.getElementById('overlay');
  const toast = document.getElementById('snackbar-mobile');
  
  // Run initial animations
  initMobileAnimations();
  
  /**
   * Initial animations for mobile view
   */
  function initMobileAnimations() {
    // Enhance the loading overlay
    enhanceLoadingOverlay();
    
    // Enhance toast notifications
    enhanceToastNotifications();
    
    // Add model load animation
    addModelLoadAnimation();
  }
  
  /**
   * Enhance the loading overlay with Anime.js
   */
  function enhanceLoadingOverlay() {
    if (!overlay) return;
    
    // Replace the simple spinner with an animated one
    const spinner = overlay.querySelector('.spinner');
    if (spinner) {
      spinner.innerHTML = `
        <div class="loading-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      `;
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .loading-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }
        
        .dot {
          width: 15px;
          height: 15px;
          background-color: white;
          border-radius: 50%;
        }
      `;
      document.head.appendChild(style);
      
      // Animate dots
      const dots = overlay.querySelectorAll('.dot');
      animate(dots, {
        scale: [0, 1, 0],
        opacity: [0.5, 1, 0.5],
        delay: utils.stagger(150),
        duration: 1200,
        loop: true,
        easing: 'easeInOutSine'
      });
    }
    
    // Add fade in/out animations to overlay
    const originalShowOverlay = window.mobileView?.modelIsLoaded;
    if (window.mobileView && originalShowOverlay) {
      window.mobileView.modelIsLoaded = function() {
        // Call original function
        originalShowOverlay.call(this);
        
        // Animate overlay fade out
        animate(overlay, {
          opacity: [1, 0],
          duration: 500,
          easing: 'outQuad',
          complete: () => {
            overlay.style.display = 'none';
          }
        });
      };
    }
  }
  
  /**
   * Enhance toast notifications with Anime.js
   */
  function enhanceToastNotifications() {
    if (!toast) return;
    
    // Override the showToast method in the MobileView class
    if (window.mobileView) {
      const originalShowToast = window.mobileView.showToast;
      
      window.mobileView.showToast = function(message) {
        toast.textContent = message;
        toast.style.opacity = 0;
        toast.style.transform = 'translateY(20px)';
        toast.style.display = 'block';
        toast.style.visibility = 'visible';
        toast.className = '';
        
        // Create a timeline for toast animation
        const timeline = createTimeline();
        
        // Show animation
        timeline.add(toast, {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 500,
          easing: 'outQuad'
        });
        
        // Add a delay
        timeline.add({}, {
          duration: 2500
        });
        
        // Hide animation
        timeline.add(toast, {
          opacity: [1, 0],
          translateY: [0, 20],
          duration: 500,
          easing: 'outQuad',
          complete: () => {
            toast.style.visibility = 'hidden';
          }
        });
      };
    }
  }
  
  /**
   * Add animation for model loading
   */
  function addModelLoadAnimation() {
    if (!modelViewer) return;
    
    // Add load event listener
    modelViewer.addEventListener('load', () => {
      // Scale and fade in animation for the model
      animate(modelViewer, {
        opacity: [0.5, 1],
        scale: [0.9, 1],
        duration: 800,
        easing: 'outQuad'
      });
    });
    
    // Add animation for auto-rotation
    if (modelViewer.hasAttribute('auto-rotate')) {
      // This only adds a slight speed-up/slow-down effect to the auto-rotation
      setInterval(() => {
        // Check if model viewer exists and is defined
        if (modelViewer && modelViewer.getAttribute) {
          // Get current rotation speed
          const currentSpeed = modelViewer.getAttribute('rotation-per-second') || '30deg';
          const speedValue = parseFloat(currentSpeed);
          
          // Animate between speeds for a more organic feel
          if (speedValue <= 20) {
            modelViewer.setAttribute('rotation-per-second', '40deg');
          } else {
            modelViewer.setAttribute('rotation-per-second', '20deg');
          }
        }
      }, 3000);
    }
  }
  
  // Create AR button pulse animation
  setTimeout(() => {
    // Try to access the AR button in the shadow DOM
    if (modelViewer && modelViewer.shadowRoot) {
      const arButton = modelViewer.shadowRoot.querySelector('button[slot="ar-button"]');
      
      if (arButton) {
        // Create subtle pulsing effect
        animate(arButton, {
          scale: [1, 1.05],
          boxShadow: [
            '0 2px 4px rgba(0, 0, 0, 0.2)',
            '0 4px 8px rgba(0, 0, 0, 0.3)'
          ],
          duration: 1500,
          direction: 'alternate',
          loop: true,
          easing: 'easeInOutQuad'
        });
      }
    }
  }, 2000); // Delay to ensure shadow DOM is ready
});
