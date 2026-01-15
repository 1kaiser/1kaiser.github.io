const GalleryApp = {
  data() {
    return {
      models: window.modelsConfig,
      activeIndex: null,
      cardZIndices: [],
      zCounter: 0,
      loadingMode: 'single', // 'single' | 'parallel'
      loadingIndex: 0,
    };
  },
  methods: {
    handleMouseEnter(i) {
      this.activeIndex = i;
      const newZIndices = [...this.cardZIndices];
      newZIndices[i] = this.zCounter;
      this.cardZIndices = newZIndices;
      this.zCounter++;
    },
    handleMouseLeave() {
      this.activeIndex = null;
    },
    getPosterUrl(model) {
      if (model.poster.startsWith('http')) {
        return model.poster;
      }
      return model.poster.startsWith('./') ? model.poster.substring(2) : model.poster;
    },
    getModelUrl(model) {
       // Helper to resolve URL
       if (model.url.startsWith('http')) return model.url;
       return model.url.startsWith('./') ? model.url.substring(2) : model.url;
    },
    onModelLoad(index) {
        console.log(`Model ${index} loaded`);
        if (this.loadingMode === 'single' && index === this.loadingIndex) {
            this.loadingIndex++;
        }
    },
    onModelError(index, event) {
        console.warn(`Model ${index} failed to load`, event);
        if (this.loadingMode === 'single' && index === this.loadingIndex) {
            this.loadingIndex++;
        }
    },
    toggleLoadingMode() {
        this.loadingMode = this.loadingMode === 'single' ? 'parallel' : 'single';
        if (this.loadingMode === 'parallel') {
            this.loadingIndex = this.models.length;
        } else {
            this.loadingIndex = 0;
        }
    }
  },
  computed: {
    cards() {
      return this.models.map((model, i) => {
        const numCards = this.models.length;
        const isHovered = this.activeIndex === i;
        const random_rotate_z = (model.initialRotation = model.initialRotation || (Math.random() * 16) - 8);
        const spread = 147; // 30% overlap
        const offset = (i - (numCards - 1) / 2) * spread;
        const translateY = Math.abs(i - (numCards - 1) / 2) * -35 + 35; // Less pronounced arc
        let transform = `translate(-50%, -50%) translateX(${offset}px) translateY(${translateY}px) rotateZ(${random_rotate_z}deg)`;
        if (isHovered) {
          transform = `translate(-50%, -50%) translateX(${offset}px) translateY(${translateY - 20}px) rotateZ(0deg) scale(1.1)`;
        }

        // Calculate src based on loading state
        // Resolving URL logic here
        let url = model.url.startsWith('http') ? model.url : (model.url.startsWith('./') ? model.url.substring(2) : model.url);
        let src = '';
        if (this.loadingMode === 'parallel') {
            src = url;
        } else if (i <= this.loadingIndex) {
            src = url;
        }

        return {
          style: {
            transform: transform,
            zIndex: this.cardZIndices[i],
            transition: 'transform 0.5s ease, z-index 0.5s ease',
          },
          model: model,
          isHovered: isHovered,
          src: src
        };
      });
    },
  },
  mounted() {
    if (this.models) {
      const initialZIndices = this.models.map((_, i) => i);
      this.cardZIndices = initialZIndices;
      this.zCounter = this.models.length;
    }
  },
  template: `
    <div class="gallery-container">
      <div style="position: absolute; top: 80px; left: 20px; z-index: 1000; background: rgba(255,255,255,0.8); padding: 10px; border-radius: 8px;">
        <button @click="toggleLoadingMode" style="padding: 5px 10px; cursor: pointer; font-size: 14px;">
            Switch to {{ loadingMode === 'single' ? 'Parallel' : 'Single' }} Mode
        </button>
        <div style="margin-top: 5px; font-size: 12px;">
            Loading: {{ Math.min(loadingIndex + 1, models.length) }} / {{ models.length }}
            <span v-if="loadingMode === 'single'">(Sequential)</span>
            <span v-else>(Parallel)</span>
        </div>
      </div>

      <div
        v-for="(card, i) in cards"
        :key="i"
        class="model-card"
        :style="card.style"
        @mouseenter="handleMouseEnter(i)"
        @mouseleave="handleMouseLeave"
      >
        <model-viewer
          :src="card.src"
          :poster="getPosterUrl(card.model)"
          :alt="card.model.alt"
          shadow-intensity="1"
          camera-controls
          auto-rotate
          @load="onModelLoad(i)"
          @error="onModelError(i, $event)"
        ></model-viewer>
        <div class="model-info-overlay">
          <h2>{{ card.model.title }}</h2>
          <p>{{ card.model.description }}</p>
        </div>
        <a
          v-if="card.isHovered"
          :href="card.src"
          download
          class="download-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24px" height="24px">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </a>
      </div>
    </div>
  `
};

const app = Vue.createApp(GalleryApp);
app.config.compilerOptions.isCustomElement = tag => tag === 'model-viewer';
app.mount('#gallery-root');
