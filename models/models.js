// models/models.js
// 3D Models Configuration for the Gallery
// This file contains all model data and utility functions for model management

// Main models configuration array
window.modelsConfig = [
  {
    url: "./models/31_10_2024.glb",
    title: "My Model",
    description: "Original 3D model",
    alt: "Original 3D model"
  },
  {
    url: "./models/20230204temple-transformed.glb",
    title: "Temple",
    description: "Example 3D model",
    alt: "Temple"
  },
  {
    url: "./models/hibiscus.glb",
    title: "Hibiscus",
    description: "Example 3D model",
    alt: "hibiscus"
  },
  {
    url: "./models/momos.glb",
    title: "Momos",
    description: "Example 3D model",
    alt: "momos"
  },
  {
    url: "https://cdn.glitch.me/4c662056-04bf-42dd-b4d5-784347afb99c/saraswati_flower.glb",
    title: "Idol",
    description: "Saraswati 3D model",
    alt: "Idol"
  },
  {
    url: "./models/bycycle.glb",
    title: "Bicycle",
    description: "3D bicycle model",
    alt: "Bicycle"
  },
  {
    url: "https://cdn.glitch.global/e71dfee6-422f-4ea9-a2a1-7c360807106f/bhatura_VegBiryani_EggNoodles_ChickenStrips.glb",
    title: "bhatura VegBiryani EggNoodles ChickenStrips",
    description: "bhatura_VegBiryani_EggNoodles_ChickenStrips",
    alt: "bhatura VegBiryani EggNoodles ChickenStrips"
  },
  {
    url: "https://cdn.glitch.me/9d76da57-eb76-4c61-91f6-1b93ba1db597/paneer_sabji.glb",
    title: "paneer sabji",
    description: "paneer_sabji",
    alt: "paneer sabji"
  },
  {
    url: "https://cdn.glitch.global/90420b71-7768-417c-ac4f-4e017ad907f4/untitled-transformed.glb",
    title: "Kaiser Roy",
    description: "Kaiser_Roy",
    alt: "Kaiser Roy"
  },
  {
    url: "./models/Chicken_Biryani.glb",
    title: "chicken biryani",
    description: "chicken biryani with eggs and potatoes",
    alt: "chicken biryani with eggs and potatoes"
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
window.createModelCard = function(modelData, index) {
  const cardHtml = `
    <div class="model-card" data-model="${modelData.url}" data-title="${modelData.title}" data-desc="${modelData.description}">
      <div class="model-container">
        <model-viewer
          src="${modelData.url}"
          alt="${modelData.alt}"
          auto-rotate
          camera-controls
          shadow-intensity="1">
        </model-viewer>
      </div>
      <div class="model-info">
        <h2>${modelData.title}</h2>
        <p>${modelData.description}</p>
        <a href="${modelData.url}" download class="download-btn">Download</a>
      </div>
    </div>
  `;
  return cardHtml;
};

// Initialize the gallery (moved from index.html)
window.initializeGallery = function() {
  const gallery = document.getElementById('modelGallery');
  
  if (!gallery) {
    console.error('Gallery element not found');
    return;
  }
  
  // Generate HTML for all model cards
  const cardsHtml = window.modelsConfig.map((model, index) => 
    window.createModelCard(model, index)
  ).join('');
  
  // Insert all cards into the gallery
  gallery.innerHTML = cardsHtml;
  
  console.log(`Gallery initialized with ${window.modelsConfig.length} models`);
};

// Auto-initialize when DOM is ready (if gallery element exists)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('modelGallery')) {
      window.initializeGallery();
    }
  });
} else {
  // DOM is already ready
  if (document.getElementById('modelGallery')) {
    window.initializeGallery();
  }
}

console.log('Models configuration loaded:', window.modelsConfig.length, 'models available');
