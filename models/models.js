// models/models.js
// 3D Models Configuration for the Gallery
// This file contains all model data and utility functions for model management

// Function to check for WebGPU support
async function supportsWebGPU() {
  if (!navigator.gpu) {
    return false;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter !== null;
  } catch (e) {
    return false;
  }
}

// Main models configuration array
window.modelsConfig = [
  {
    url: "./models/31_10_2024.glb",
    title: "My Model",
    description: "Original 3D model",
    alt: "Original 3D model",
    poster: "https://place-hold.it/300x400"
  },
  {
    url: "./models/20230204temple-transformed.glb",
    title: "Temple",
    description: "Example 3D model",
    alt: "Temple",
    poster: "https://place-hold.it/300x400"
  },
  {
    url: "./models/hibiscus.glb",
    title: "Hibiscus",
    description: "Example 3D model",
    alt: "hibiscus",
    poster: "https://place-hold.it/300x400"
  },
  {
    url: "./models/momos.glb",
    title: "Momos",
    description: "Example 3D model",
    alt: "momos",
    poster: "https://place-hold.it/300x400"
  },
  {
    url: "https://cdn.glitch.me/4c662056-04bf-42dd-b4d5-784347afb99c/saraswati_flower.glb",
    title: "Idol",
    description: "Saraswati 3D model",
    alt: "Idol",
    poster: "https://place-hold.it/300x400"
  },
  {
    url: "./models/bycycle.glb",
    title: "Bicycle",
    description: "3D bicycle model",
    alt: "Bicycle",
    poster: "https://place-hold.it/300x400"
  },
  {
    url: "https://cdn.glitch.global/e71dfee6-422f-4ea9-a2a1-7c360807106f/bhatura_VegBiryani_EggNoodles_ChickenStrips.glb",
    title: "bhatura VegBiryani EggNoodles ChickenStrips",
    description: "bhatura_VegBiryani_EggNoodles_ChickenStrips",
    alt: "bhatura VegBiryani EggNoodles ChickenStrips",
    poster: "https://place-hold.it/300x400"
  },
  {
    url: "https://cdn.glitch.me/9d76da57-eb76-4c61-91f6-1b93ba1db597/paneer_sabji.glb",
    title: "paneer sabji",
    description: "paneer_sabji",
    alt: "paneer sabji",
    poster: "https://place-hold.it/300x400"
  },
  {
    url: "https://cdn.glitch.global/90420b71-7768-417c-ac4f-4e017ad907f4/untitled-transformed.glb",
    title: "Kaiser Roy",
    description: "Kaiser_Roy",
    alt: "Kaiser Roy",
    poster: "https://place-hold.it/300x400"
  },
  {
    url: "./models/Chicken_Biryani.glb",
    title: "chicken biryani",
    description: "chicken biryani with eggs and potatoes",
    alt: "chicken biryani with eggs and potatoes",
    poster: "https://place-hold.it/300x400"
  }
];

// Utility functions for model management
window.ModelManager = {
  
  // Get all models
  getAllModels: function() {
    return window.modelsConfig;
  },
  
  // Get a specific model by index
  getModel: function(index) {
    if (index >= 0 && index < window.modelsConfig.length) {
      return window.modelsConfig[index];
    }
    return null;
  },
  
  // Add a new model to the configuration
  addModel: function(url, title, description, alt) {
    const newModel = {
      url: url,
      title: title,
      description: description,
      alt: alt || title
    };
    
    window.modelsConfig.push(newModel);
    
    // Trigger gallery refresh if the gallery is already initialized
    if (window.initializeGallery) {
      window.initializeGallery();
    }
    
    return window.modelsConfig.length - 1; // Return index of new model
  },
  
  // Update an existing model by index
  updateModel: function(index, newModelData) {
    if (index >= 0 && index < window.modelsConfig.length) {
      window.modelsConfig[index] = { ...window.modelsConfig[index], ...newModelData };
      
      // Trigger gallery refresh if the gallery is already initialized
      if (window.initializeGallery) {
        window.initializeGallery();
      }
      
      return true;
    }
    return false;
  },
  
  // Remove a model by index
  removeModel: function(index) {
    if (index >= 0 && index < window.modelsConfig.length) {
      const removedModel = window.modelsConfig.splice(index, 1)[0];
      
      // Trigger gallery refresh if the gallery is already initialized
      if (window.initializeGallery) {
        window.initializeGallery();
      }
      
      return removedModel;
    }
    return null;
  },
  
  // Find models by title (case-insensitive search)
  findModelsByTitle: function(searchTitle) {
    return window.modelsConfig.filter(model => 
      model.title.toLowerCase().includes(searchTitle.toLowerCase())
    );
  },
  
  // Get models by type (local vs remote)
  getLocalModels: function() {
    return window.modelsConfig.filter(model => 
      model.url.startsWith('./') || !model.url.includes('http')
    );
  },
  
  getRemoteModels: function() {
    return window.modelsConfig.filter(model => 
      model.url.startsWith('http')
    );
  },
  
  // Get total count
  getCount: function() {
    return window.modelsConfig.length;
  },
  
  // Validate model data
  validateModel: function(modelData) {
    const required = ['url', 'title', 'description', 'alt'];
    return required.every(field => modelData.hasOwnProperty(field) && modelData[field]);
  },
  
  // Import models from JSON
  importModels: function(jsonData) {
    try {
      const importedModels = JSON.parse(jsonData);
      if (Array.isArray(importedModels)) {
        // Validate all models before importing
        const validModels = importedModels.filter(model => this.validateModel(model));
        
        if (validModels.length > 0) {
          window.modelsConfig = validModels;
          
          // Trigger gallery refresh if the gallery is already initialized
          if (window.initializeGallery) {
            window.initializeGallery();
          }
          
          return validModels.length;
        }
      }
    } catch (error) {
      console.error('Error importing models:', error);
    }
    return 0;
  },
  
  // Export models to JSON
  exportModels: function() {
    return JSON.stringify(window.modelsConfig, null, 2);
  }
};

// Create a model card element (moved from index.html)
window.createModelCard = async function(modelData, index) {
  const webGPUSupported = await supportsWebGPU();
  const rendererPreference = webGPUSupported ? 'webgpu' : 'webgl';

  const cardHtml = `
    <div class="model-card" data-title="${modelData.title}" data-desc="${modelData.description}" data-model-url="${modelData.url}">
      <div class="model-container">
        <model-viewer
          renderer-preference="${rendererPreference}"
          src="${modelData.url}"
          poster="${modelData.poster}"
          alt="${modelData.alt}"
          auto-rotate
          camera-controls
          shadow-intensity="1">
        </model-viewer>
      </div>
      <div class="model-info">
        <h2>${modelData.title}</h2>
        <a href="${modelData.url}" download class="download-btn">Download</a>
      </div>
    </div>
  `;
  return cardHtml;
};

// Initialize the gallery (moved from index.html)
window.initializeGallery = async function() {
  const gallery = document.getElementById('modelGallery');
  
  if (!gallery) {
    console.error('Gallery element not found');
    return;
  }
  
  // Generate HTML for all model cards
  const cardsHtmlPromises = window.modelsConfig.map((model, index) =>
    window.createModelCard(model, index)
  );

  const cardsHtml = await Promise.all(cardsHtmlPromises);
  
  // Insert all cards into the gallery
  gallery.innerHTML = cardsHtml.join('');
  
  console.log(`Gallery initialized with ${window.modelsConfig.length} models`);
};

// Add this to your models/models.js or create a new file: js/model-viewer-config.js

// Enhanced model viewer configuration
window.ModelViewerConfig = {
  // Global model-viewer settings
  setupModelViewer: function(modelViewer) {
    // Handle loading errors gracefully
    modelViewer.addEventListener('error', (event) => {
      console.warn('Model viewer error:', event.detail);
      // Try to recover by reloading
      if (modelViewer.src) {
        setTimeout(() => {
          const originalSrc = modelViewer.src;
          modelViewer.src = '';
          modelViewer.src = originalSrc;
        }, 1000);
      }
    });

    // Enhanced loading feedback
    modelViewer.addEventListener('load', () => {
      console.log('✅ Model loaded successfully');
    });

    modelViewer.addEventListener('progress', (event) => {
      const progress = event.detail.totalProgress;
      console.log(`📊 Loading progress: ${(progress * 100).toFixed(1)}%`);
    });
  },

  // Fix common GLB loading issues
  fixGLBUrl: function(url) {
    // Handle blob URLs and GitHub URLs
    if (url.startsWith('blob:')) {
      return url;
    }
    
    // Ensure GitHub URLs are raw content
    if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
      return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    
    // Add cache busting for problematic URLs
    if (url.includes('1kaiser.github.io')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}_t=${Date.now()}`;
    }
    
    return url;
  }
};

// Auto-setup for all model viewers on page
document.addEventListener('DOMContentLoaded', () => {
  // Setup existing model viewers
  document.querySelectorAll('model-viewer').forEach(mv => {
    window.ModelViewerConfig.setupModelViewer(mv);
  });

  // Setup observer for dynamically added model viewers
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          if (node.tagName === 'MODEL-VIEWER') {
            window.ModelViewerConfig.setupModelViewer(node);
          }
          // Check children too
          node.querySelectorAll?.('model-viewer').forEach(mv => {
            window.ModelViewerConfig.setupModelViewer(mv);
          });
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
});

console.log('Models configuration loaded:', window.modelsConfig.length, 'models available');
