const GalleryApp = {
  data() {
    return {
      models: window.modelsConfig,
      activeIndex: null,
      cardZIndices: [],
      zCounter: 0,
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
      if (model.url.startsWith('http')) {
        return model.url;
      }
      return model.url.startsWith('./') ? model.url.substring(2) : model.url;
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
        return {
          style: {
            transform: transform,
            zIndex: this.cardZIndices[i],
            transition: 'transform 0.5s ease, z-index 0.5s ease',
          },
          model: model,
          isHovered: isHovered,
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
      <div
        v-for="(card, i) in cards"
        :key="i"
        class="model-card"
        :style="card.style"
        @mouseenter="handleMouseEnter(i)"
        @mouseleave="handleMouseLeave"
      >
        <model-viewer
          :src="getModelUrl(card.model)"
          :poster="getPosterUrl(card.model)"
          :alt="card.model.alt"
          shadow-intensity="1"
          camera-controls
          auto-rotate
        ></model-viewer>
        <div class="model-info-overlay">
          <h2>{{ card.model.title }}</h2>
          <p>{{ card.model.description }}</p>
        </div>
        <a
          v-if="card.isHovered"
          :href="getModelUrl(card.model)"
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
app.mount('#gallery-root');
