const GalleryApp = {
  data() {
    return {
      models: window.modelsConfig,
      activeIndex: null,
      cardZIndices: [],
      zCounter: 0,
      // Loading state per card, replacing model-viewer's default progress
      // bar: each model renders blurred and sharpens into focus as its
      // GLB streams in, driven by model-viewer's own `progress` event
      // (detail.totalProgress, 0-1) rather than a separate bar UI.
      loadBlur: (window.modelsConfig || []).map(() => 16),
    };
  },
  methods: {
    onModelProgress(e, i) {
      const p = e.detail && typeof e.detail.totalProgress === 'number' ? e.detail.totalProgress : 1;
      this.loadBlur[i] = (1 - p) * 16;
    },
    onModelLoad(i) {
      this.loadBlur[i] = 0;
    },
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
    // Tiles are static by default (no auto-rotate); the expand button
    // opens the site's existing modal (#modelOverlay in index.html --
    // camera-controls, AR, download, blob caching, all already built)
    // with auto-rotate turned on for that one enlarged view. That modal
    // was previously only reachable via a now-inert legacy click handler
    // (see js/app.js) -- exposed as window.openModelModal for this.
    expand(model) {
      if (window.openModelModal) {
        window.openModelModal(this.getModelUrl(model), model.title, true);
      }
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
        const centerIndex = (numCards - 1) / 2;
        const offset = (i - centerIndex) * spread;
        const translateY = Math.abs(i - centerIndex) * -35 + 35; // Less pronounced arc

        // Parallax scale: edge cards larger, center cards smaller.
        const distFromCenter = Math.abs(i - centerIndex);
        const normDist = centerIndex > 0 ? distFromCenter / centerIndex : 0;
        const SCALE_FACTOR = 0.75; // overall tile size, applied on top of the parallax range
        const MIN_SCALE = 0.76 * SCALE_FACTOR; // center-most card
        const MAX_SCALE = 1.2 * SCALE_FACTOR;  // outermost cards
        const baseScale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * normDist;

        let transform = `translate(-50%, -50%) translateX(${offset}px) translateY(${translateY}px) rotateZ(${random_rotate_z}deg) scale(${baseScale.toFixed(3)})`;
        if (isHovered) {
          const hoverScale = (baseScale * 1.15).toFixed(3);
          transform = `translate(-50%, -50%) translateX(${offset}px) translateY(${translateY - 20}px) rotateZ(0deg) scale(${hoverScale})`;
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
          :style="{ filter: 'blur(' + loadBlur[i] + 'px)', transition: 'filter 250ms ease' }"
          shadow-intensity="1"
          camera-controls
          @progress="onModelProgress($event, i)"
          @load="onModelLoad(i)"
        ></model-viewer>
        <button
          type="button"
          class="model-card-expand"
          :aria-label="'Expand ' + card.model.title"
          @click.stop="expand(card.model)"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 3 3 3 3 9"></polyline><polyline points="15 3 21 3 21 9"></polyline><polyline points="3 15 3 21 9 21"></polyline><polyline points="21 15 21 21 15 21"></polyline></svg>
        </button>
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
