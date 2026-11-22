const PORTFOLIO_ITEMS = [
  {
    title: 'Gemma Chat (WebGPU)',
    category: 'ai',
    description: 'In-browser chat supporting Gemma 3 (270M, 1B), Gemma 4 E2B, and IBM Granite 4.0 via Transformers.js & WebGPU.',
    tags: ['Transformers.js', 'WebGPU', 'ONNX'],
    demoUrl: '/gemma-chat-app/',
    altUrl: 'chat-app.html',
    altLabel: 'Standalone Fallback',
    repoUrl: 'https://github.com/1kaiser/gemma-chat-app'
  },
  {
    title: 'TextGraph (Attention & Embeddings)',
    category: 'ai',
    description: 'Interactive Graph Attention (GAT) visualization paired with client-side EmbeddingGemma similarity & projections.',
    tags: ['Vue 3', 'D3.js', 'EmbeddingGemma'],
    demoUrl: '/TextGraph/',
    altUrl: 'TextGraph.html',
    altLabel: 'Local Snapshot',
    repoUrl: 'https://github.com/1kaiser/TextGraph'
  },
  {
    title: 'LLM Wordgraph Exact',
    category: 'ai',
    description: 'Prompt variation word-graph explorer combining Emily Reif word graphs with browser-generated embeddings.',
    tags: ['TypeScript', 'Vite', 'Transformers.js'],
    demoUrl: '/llm-wordgraph-exact/',
    repoUrl: 'https://github.com/1kaiser/llm-wordgraph-exact'
  },
  {
    title: 'LLM Consistency Vis',
    category: 'ai',
    description: 'Interactive prompt variation word-graph and output-consistency viewer adapted for 1kaiser.github.io.',
    tags: ['React', 'Wordgraph', 'Attribution'],
    demoUrl: '/llm-consistency-vis/',
    repoUrl: 'https://github.com/1kaiser/llm-consistency-vis'
  },
  {
    title: 'Wordy (WordNet, MUVERA & RAG)',
    category: 'ai',
    description: '3-mode lexical graph, MUVERA multi-vector retrieval visualizer, and client-side Transformer RAG explorer.',
    tags: ['WordNet 3.1', 'MUVERA', 'RAG'],
    demoUrl: '/wordy/',
    altUrl: '/wordy/muvera.html',
    altLabel: 'MUVERA Demo',
    repoUrl: 'https://github.com/1kaiser/wordy'
  },
  {
    title: 'Layerflow EmbeddingGemma UMAP',
    category: 'ai',
    description: 'Client-side EmbeddingGemma-300M sentence embeddings projected in 3D via UMAP and Scatter-GL.',
    tags: ['EmbeddingGemma-300M', 'UMAP', 'Scatter-GL'],
    demoUrl: 'layerflow-BERT.html',
    repoUrl: 'https://github.com/1kaiser/1kaiser.github.io/blob/main/cv/layerflow-BERT.html'
  },
  {
    title: 'Ecco Neuron Factors (NMF)',
    category: 'ai',
    description: 'Client-side transformer hidden-state inspection with Non-Negative Matrix Factorization & D3 sparklines.',
    tags: ['NMF', 'Ecco', 'D3.js'],
    demoUrl: 'Neuron_Factors.html',
    repoUrl: 'https://github.com/1kaiser/1kaiser.github.io/blob/main/cv/Neuron_Factors.html'
  },
  {
    title: 'DEM to GLB Terrain Converter',
    category: 'spatial',
    description: 'Client-side GeoTIFF elevation + ortho-imagery to textured 3D GLB mesh converter using GDAL/Loam, Proj4js & Three.js.',
    tags: ['GDAL-WASM', 'Proj4js', 'Three.js'],
    demoUrl: 'dem-to-glb.html',
    repoUrl: 'https://github.com/1kaiser/1kaiser.github.io/blob/main/cv/dem-to-glb.html'
  },
  {
    title: '3D Desktop & Potree Point Clouds',
    category: 'spatial',
    description: 'Three.js workspace integrating Pi3X reconstructions, Potree WebGL viewer, Andrew Marsh tools, and jax-js kernels.',
    tags: ['Three.js', 'Potree', 'jax-js'],
    demoUrl: '../desktop/desktop.html',
    altUrl: '../desktop/potree/index.html',
    altLabel: 'Potree Viewer',
    repoUrl: 'https://github.com/1kaiser/1kaiser.github.io/tree/main/desktop'
  },
  {
    title: 'Graph Queen (3D Graph & OCR)',
    category: 'spatial',
    description: 'Force-directed 3D knowledge graphs with PDF.js text extraction, Tesseract/Scribe OCR, and JSON Canvas export.',
    tags: ['3d-force-graph', 'OCR', 'PDF.js'],
    demoUrl: '/graph-queen/',
    repoUrl: 'https://github.com/1kaiser/graph-queen'
  },
  {
    title: 'International Glossary of Hydrology',
    category: 'spatial',
    description: 'Interactive D3 + Fuse.js semantic explorer for WMO-No. 385 (WMO & UNESCO, 2012) hydrology terms.',
    tags: ['WMO-No. 385', 'D3.js', 'Fuse.js'],
    demoUrl: 'WMO_2012.html',
    repoUrl: 'https://github.com/1kaiser/1kaiser.github.io/blob/main/cv/WMO_2012.html'
  },
  {
    title: 'Space 3D Gallery',
    category: 'spatial',
    description: 'Main landing page featuring Draco-compressed GLBs, click-to-measure distances, Piping QR mobile view, and solar lighting.',
    tags: ['<model-viewer>', 'Draco', 'Piping'],
    demoUrl: '../index.html',
    repoUrl: 'https://github.com/1kaiser/1kaiser.github.io'
  },
  {
    title: 'GPhotosUI Local & Manifest Grid',
    category: 'tools',
    description: 'Google Photos-inspired justified lightbox grid backed by repo manifests or local folder uploads.',
    tags: ['Vanilla JS', 'Justified Grid', 'Lightbox'],
    demoUrl: 'googlephotos.html',
    repoUrl: 'https://github.com/1kaiser/1kaiser.github.io/blob/main/cv/googlephotos.html'
  },
  {
    title: 'SoundCloud Playback Rewind',
    category: 'tools',
    description: 'Archived SoundCloud playback history gallery populated from Playwright JSON captures.',
    tags: ['SoundCloud CDN', 'Playwright'],
    demoUrl: '../soundcloud/index.html',
    repoUrl: 'https://github.com/1kaiser/1kaiser.github.io/tree/main/soundcloud'
  },
  {
    title: 'Repository Timeline & Experiments',
    category: 'tools',
    description: 'Chronological GitHub activity milestone visualization paired with featured interactive experiment cards.',
    tags: ['d3-milestones', 'GitHub API'],
    demoUrl: '../experiments.html',
    repoUrl: 'https://github.com/1kaiser/1kaiser.github.io/blob/main/experiments.html'
  }
];

function renderProjects(filter = 'all', query = '') {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  const q = query.trim().toLowerCase();
  const visible = PORTFOLIO_ITEMS.filter((item) => {
    const matchesCategory = filter === 'all' || item.category === filter;
    const matchesQuery = !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });

  if (!visible.length) {
    grid.innerHTML = '<p style="color:#64748b;grid-column:1/-1;">No matching projects found.</p>';
    return;
  }

  grid.innerHTML = visible.map((item) => `
    <article class="project-card">
      <div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="badge-row">
          ${item.tags.map((tag) => `<span class="badge">${tag}</span>`).join('')}
        </div>
      </div>
      <div class="card-links">
        <a href="${item.demoUrl}">Open Demo &rarr;</a>
        ${item.altUrl ? `<a href="${item.altUrl}">${item.altLabel}</a>` : ''}
        <a href="${item.repoUrl}" target="_blank" rel="noopener">GitHub</a>
      </div>
    </article>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  let activeFilter = 'all';
  const searchInput = document.getElementById('project-search');
  const buttons = document.querySelectorAll('.filter-btn');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter || 'all';
      buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
      renderProjects(activeFilter, searchInput ? searchInput.value : '');
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderProjects(activeFilter, searchInput.value);
    });
  }

  renderProjects();
});
