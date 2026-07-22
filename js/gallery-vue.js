const GalleryApp = {
  data() {
    return {
      models: window.modelsConfig,
      activeIndex: null,
      cardZIndices: [],
      zCounter: 0,
      // Loading state per card, replacing model-viewer's default progress
      // bar: each model renders blurred and sharpens into focus once its
      // GLB is actually ready (see loadCards() below -- driven by
      // ModelCache resolving, not model-viewer's own `progress` event,
      // since model-viewer no longer does its own fetch at all now).
      loadBlur: (window.modelsConfig || []).map(() => 16),
      loaded: (window.modelsConfig || []).map(() => false),
      loading: (window.modelsConfig || []).map(() => false),
      cardRefs: [],
    };
  },
  methods: {
    setCardRef(el, i) {
      if (el) this.cardRefs[i] = el;
    },
    // Loading is user-triggered per tile (click anywhere on the card)
    // instead of every card firing its GLB fetch on page mount -- the
    // queued window.ModelCache loader (js/model-cache.js) already fixed
    // the worst of the ~20-simultaneous-fetch bandwidth contention, but
    // still meant every visitor downloaded all 10 models whether they
    // looked at them or not. Idempotent: a second click on an
    // already-loaded/loading card is a no-op.
    loadCard(i) {
      if (this.loaded[i] || this.loading[i]) return;
      const mv = this.cardRefs[i];
      if (!mv || !window.ModelCache) return;
      this.loading[i] = true;
      window.ModelCache.loadInto(mv, this.getModelUrl(this.cards[i].model)).then(() => {
        this.loadBlur[i] = 0;
        this.loaded[i] = true;
        this.loading[i] = false;
      });
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
    // No auto-load here -- see loadCard(i), triggered by clicking a tile.
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
        @click="loadCard(i)"
      >
        <model-viewer
          :ref="el => setCardRef(el, i)"
          :poster="getPosterUrl(card.model)"
          :alt="card.model.alt"
          :style="{ filter: 'blur(' + loadBlur[i] + 'px)', transition: 'filter 250ms ease' }"
          shadow-intensity="1"
          camera-controls
        ></model-viewer>
        <div v-if="!loaded[i]" class="model-card-tap-hint" :class="{ 'is-loading': loading[i] }">
          {{ loading[i] ? 'Loading…' : 'Tap to load' }}
        </div>
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
          @click.stop
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
