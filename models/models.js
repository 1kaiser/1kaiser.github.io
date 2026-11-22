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
    id: "my-model",
    url: "./models/31_10_2024.glb",
    poster: "./models/31_10_2024.webp",
    title: "My Model",
    description: "Original 3D model",
    alt: "Original 3D model"
  },
  {
    id: "temple",
    url: "https://huggingface.co/datasets/1kaiser/models/resolve/main/20230204temple-transformed.glb",
    poster: "./models/20230204temple-transformed.webp",
    title: "Temple",
    description: "Example 3D model",
    alt: "Temple"
  },
  {
    id: "hibiscus",
    url: "https://huggingface.co/datasets/1kaiser/models/resolve/main/hibiscus.glb",
    poster: "./models/hibiscus.webp",
    title: "Hibiscus",
    description: "Example 3D model",
    alt: "hibiscus"
  },
  {
    id: "momos",
    url: "./models/momos.glb",
    poster: "./models/momos.webp",
    title: "Momos",
    description: "Example 3D model",
    alt: "momos"
  },
  {
    id: "idol",
    url: "https://huggingface.co/datasets/1kaiser/models/resolve/main/saraswati_flower.glb",
    poster: "./models/saraswati_flower.webp",
    title: "Idol",
    description: "Saraswati 3D model",
    alt: "Idol"
  },
  {
    id: "bicycle",
    url: "./models/bycycle.glb",
    poster: "./models/bycycle.webp",
    title: "Bicycle",
    description: "3D bicycle model",
    alt: "Bicycle"
  },
  {
    id: "bhatura-platter",
    url: "https://huggingface.co/datasets/1kaiser/models/resolve/main/bhatura_VegBiryani_EggNoodles_ChickenStrips.glb",
    poster: "./models/bhatura_VegBiryani_EggNoodles_ChickenStrips.webp",
    title: "bhatura VegBiryani EggNoodles ChickenStrips",
    description: "bhatura_VegBiryani_EggNoodles_ChickenStrips",
    alt: "bhatura VegBiryani EggNoodles ChickenStrips"
  },
  {
    id: "paneer-sabji",
    url: "https://huggingface.co/datasets/1kaiser/models/resolve/main/paneer%20sabji.glb",
    poster: "./models/paneer_sabji.webp",
    title: "paneer sabji",
    description: "paneer_sabji",
    alt: "paneer sabji"
  },
  {
    id: "kaiser-roy",
    url: "https://huggingface.co/datasets/1kaiser/models/resolve/main/kaiser03032023.glb",
    poster: "./models/untitled-transformed.webp",
    title: "Kaiser Roy",
    description: "Kaiser_Roy",
    alt: "Kaiser Roy"
  },
  {
    id: "chicken-biryani",
    url: "./models/Chicken_Biryani.glb",
    poster: "./models/Chicken_Biryani.webp",
    title: "chicken biryani",
    description: "chicken biryani with eggs and potatoes",
    alt: "chicken biryani with eggs and potatoes"
  }
];

// Single source of truth for curated Pi3X reconstructions across index.html,
// desktop/desktop.html, and desktop/potree/index.html.
window.PI3X_HF_BASE = "https://huggingface.co/datasets/1kaiser/models/resolve/main/";
window.PI3X_SCANS = [
  { dir: "VID20230408092322",   file: "VID20230408092322", pts: 566905,  label: "VID20230408092322 · 566,905 pts" },
  { dir: "VID20230408092500",   file: "VID20230408092500", pts: 906245,  label: "VID20230408092500 · 906,245 pts" },
  { dir: "VID20230408095210",   file: "VID20230408095210", pts: 140899,  label: "VID20230408095210 · 140,899 pts" },
  { dir: "VID20230408100423",   file: "VID20230408100423", pts: 117726,  label: "VID20230408100423 · 117,726 pts" },
  { dir: "VID20230408111201",   file: "VID20230408111201", pts: 77622,   label: "VID20230408111201 · 77,622 pts" },
  { dir: "VID20230408113045_1", file: "VID20230408113045", pts: 28408,   label: "VID20230408113045 · 28,408 pts" },
  { dir: "VID20230408152015",   file: "VID20230408152015", pts: 1192779, label: "VID20230408152015 · 1,192,779 pts" },
  { dir: "VID20230408163443_2", file: "VID20230408163443", pts: 871261,  label: "VID20230408163443 · 871,261 pts" }
].map(function(s) {
  return Object.assign({}, s, {
    glbUrl: window.PI3X_HF_BASE + s.file + "_pi3x.glb",
    poster: "./models/bg_scans/" + s.file + ".png"
  });
});

window.resolveSiteAssetUrl = function(assetPath, rootPrefix) {
  if (!assetPath) return "";
  if (/^(https?:|blob:|data:)/i.test(assetPath)) return assetPath;
  const clean = assetPath.startsWith("./") ? assetPath.slice(2) : assetPath;
  return (rootPrefix || "") + clean;
};

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
      <model-viewer
        renderer-preference="${rendererPreference}"
        src="${modelData.url}"
        poster="${modelData.poster || ''}"
        alt="${modelData.alt}"
        auto-rotate
        camera-controls
        shadow-intensity="1"
        loading="lazy"
        reveal="manual">
      </model-viewer>
      <div class="model-info-overlay">
        <h2>${modelData.title}</h2>
        <p>${modelData.description}</p>
        <div class="card-buttons">
          <button class="expand-btn">Expand</button>
          <a href="${modelData.url}" download class="download-btn">Download</a>
        </div>
      </div>
    </div>
  `;
  return cardHtml;
};

// Initialize the gallery (moved from index.html)
// This function is now disabled as React handles gallery creation.
window.initializeGallery = async function() {
  console.log('Old gallery initialization skipped.');
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

// Auto-setup for all model viewers on pages that actually render <model-viewer>
document.addEventListener('DOMContentLoaded', () => {
  if (!window.customElements || (!document.querySelector('model-viewer') && !document.getElementById('gallery-root'))) {
    return;
  }
  document.querySelectorAll('model-viewer').forEach(mv => {
    window.ModelViewerConfig.setupModelViewer(mv);
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (node.tagName === 'MODEL-VIEWER') {
            window.ModelViewerConfig.setupModelViewer(node);
          }
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
