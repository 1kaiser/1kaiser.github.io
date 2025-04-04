// mobile-animations.js - Animation functions for the mobile view

import {
  animate,
  createTimeline,
  utils,
  eases
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
    
    // Animate the loading dots
    const dots = overlay.querySelectorAll('.dot');
    if (dots.length) {
      animate(dots, {
        scale: [0, 1, 0],
        opacity: [0.5, 1, 0.5],
        delay: utils.stagger(150),
        duration: 1200,
        loop: true,
        easing: 'easeInOutSine'
      });
    }
    
    // Override the original modelIsLoaded function to add fade out animation
    if (window.mobileView && window.mobileView.modelIsLoaded) {
      const originalModelIsLoaded = window.mobileView.modelIsLoaded;
      
      window.mobileView.modelIsLoaded = async function() {
        // Call original function first (for actual loading logic)
        await originalModelIsLoaded.call(this);
        
        // Animate overlay fade out
        animate(overlay, {
          opacity: [1, 0],
          duration: 500,
          easing: 'outQuad',
          complete: () => {
            overlay.style.display = 'none';
          }
        });
        
        // Animate model viewer appearance
        animate(modelViewer, {
          opacity: [0.5, 1],
          scale: [0.9, 1],
          duration: 800,
          easing: 'outQuad'
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
            toast.style.display = 'none';
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
    
    // Add load event listener if not already handled
    if (!window.mobileView || !window.mobileView.modelIsLoaded) {
      modelViewer.addEventListener('load', () => {
        // Scale and fade in animation for the model
        animate(modelViewer, {
          opacity: [0.5, 1],
          scale: [0.9, 1],
          duration: 800,
          easing: 'outQuad'
        });
      });
    }
    
    // Add animation for auto-rotation
    if (modelViewer.hasAttribute('auto-rotate')) {
      // This only adds a slight speed-up/slow-down effect to the auto-rotation
      let currentRotationSpeed = 30;
      
      setInterval(() => {
        // Check if model viewer exists and is defined
        if (modelViewer && modelViewer.getAttribute) {
          // Get current rotation speed or use default
          const currentSpeed = modelViewer.getAttribute('rotation-per-second') || '30deg';
          currentRotationSpeed = parseFloat(currentSpeed) || 30;
          
          // Animate between speeds for a more organic feel
          const newSpeed = currentRotationSpeed <= 20 ? 40 : 20;
          
          // Apply with animation
          animate({
            speed: currentRotationSpeed
          }, {
            speed: newSpeed,
            duration: 2000,
            easing: 'easeInOutSine',
            update: function(anim) {
              const speed = anim.animations[0].currentValue;
              modelViewer.setAttribute('rotation-per-second', `${speed}deg`);
            }
          });
        }
      }, 5000);
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
  
  /**
   * Enhance updateModelViewer function with animations
   */
  function enhanceUpdateModelViewer() {
    if (!window.mobileView || !window.mobileView.updateModelViewer) return;
    
    const originalUpdateModelViewer = window.mobileView.updateModelViewer;
    
    window.mobileView.updateModelViewer = function(json) {
      // Show loading state
      if (overlay) {
        overlay.style.display = 'flex';
        animate(overlay, {
          opacity: [0, 1],
          duration: 300,
          easing: 'outQuad'
        });
      }
      
      // Animate current model out if exists
      if (modelViewer.src) {
        animate(modelViewer, {
          opacity: [1, 0.5],
          scale: [1, 0.9],
          duration: 300,
          easing: 'outQuad',
          complete: () => {
            // Call original function after fade out
            originalUpdateModelViewer.call(this, json);
          }
        });
      } else {
        // Call original function directly if no existing model
        originalUpdateModelViewer.call(this, json);
      }
    };
  }
  
  // Call enhancement functions with a slight delay to ensure window.mobileView is ready
  setTimeout(() => {
    enhanceUpdateModelViewer();
  }, 500);
});
