import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// ── Tool & Category Registry ───────────────────────────────────────────────
const CATS = {
  solar:    { label: 'Solar Analysis', color: '#FFB300', rgb: '255,179,0' },
  shading:  { label: 'Shading',        color: '#FF7043', rgb: '255,112,67' },
  daylight: { label: 'Daylighting',    color: '#29B6F6', rgb: '41,182,246' },
  building: { label: 'Building Perf',  color: '#66BB6A', rgb: '102,187,106' },
  weather:  { label: 'Weather & Data', color: '#AB47BC', rgb: '171,71,188' },
  geometry: { label: '3D Geometry',    color: '#26C6DA', rgb: '38,198,218' },
  compute:  { label: 'JAX-JS ML',      color: '#EF5350', rgb: '239,83,80' },
  utility:  { label: 'Utility',        color: '#90A4AE', rgb: '144,164,174' },
};

const TOOLS = [
  { cat: 'solar',    name: '3D Sun-Path',       native: 'sunpath',     desc: 'Live 3D sun-path dome with lat/lon/date/time controls & real shadows' },
  { cat: 'solar',    name: '2D Sun-Path',        url: 'https://andrewmarsh.com/apps/releases/sunpath2d.html',              desc: 'Interactive 2D sun-path diagrams' },
  { cat: 'solar',    name: 'Sun-Path Map',       url: 'https://andrewmarsh.com/apps/releases/sunpath-on-map.html',         desc: 'Sun-path arc on Google Maps' },
  { cat: 'solar',    name: 'Earth & Sun',        url: 'https://andrewmarsh.com/apps/releases/earthsun.html',               desc: 'Full Earth-Sun orbital model' },
  { cat: 'shading',  name: 'Shading Box',        url: 'https://drajmarsh.bitbucket.io/shading-box.html',                  desc: 'Dynamic overshadowing analysis' },
  { cat: 'shading',  name: '3D Shading',         url: 'https://drajmarsh.bitbucket.io/shading3d.html',                    desc: '3D shading simulation' },
  { cat: 'shading',  name: '3D Shadows',         url: 'https://drajmarsh.bitbucket.io/shadows3d.html',                    desc: '3D shadow geometry analysis' },
  { cat: 'daylight', name: 'Daylight Box',       url: 'https://drajmarsh.bitbucket.io/daylight-box.html',                 desc: 'Real-time dynamic daylight in a room' },
  { cat: 'daylight', name: 'Daylight Room',      url: 'https://drajmarsh.bitbucket.io/daylight-room.html',                desc: 'Room daylight simulation' },
  { cat: 'daylight', name: 'CIE Sky',            url: 'https://drajmarsh.bitbucket.io/cie-sky.html',                      desc: 'CIE sky distribution generator' },
  { cat: 'building', name: 'Heat Balance',       url: 'https://drajmarsh.bitbucket.io/heat-balance.html',                 desc: 'Interactive heat balance calculator' },
  { cat: 'building', name: 'Thermal Analysis',   url: 'https://drajmarsh.bitbucket.io/thermal-analysis.html',             desc: 'Building thermal performance' },
  { cat: 'building', name: 'Psychrometric',      url: 'https://drajmarsh.bitbucket.io/psychro-chart2d.html',              desc: 'Comfort & weather data chart' },
  { cat: 'building', name: 'Heatmap Daily',      url: 'https://drajmarsh.bitbucket.io/heatmap-daily.html',                desc: 'Annual daily heatmap' },
  { cat: 'weather',  name: 'Weather Data',       url: 'https://drajmarsh.bitbucket.io/weather-data.html',                 desc: '3D EnergyPlus weather visualisation' },
  { cat: 'weather',  name: 'Data View 2D',       url: 'https://drajmarsh.bitbucket.io/data-view2d.html',                  desc: '2D weather and data charting' },
  { cat: 'weather',  name: 'Data View 3D',       url: 'https://drajmarsh.bitbucket.io/data-view3d.html',                  desc: '3D data surface visualisation' },
  { cat: 'weather',  name: 'Schedule Editor',    url: 'https://drajmarsh.bitbucket.io/schedule-editor.html',              desc: 'Annual hourly schedule editor' },
  { cat: 'geometry', name: 'Supershapes',        native: 'supershapes',                                                    desc: 'Parametric 3D superform — Gielis formula with GLB export' },
  { cat: 'geometry', name: 'Polyhedra 2.0',      url: 'https://drajmarsh.bitbucket.io/apps/2025/polyhedra/index.html',    desc: 'Mathematical polyhedra operations (2025)' },
  { cat: 'geometry', name: 'Shape Script',       url: 'https://drajmarsh.bitbucket.io/apps/2025/shape-script/index.html', desc: 'OpenCascade JS geometry (2025)' },
  { cat: 'geometry', name: 'Tree Generator',     url: 'https://drajmarsh.bitbucket.io/tree3d.html',                       desc: 'Procedural 3D tree generator' },
  { cat: 'geometry', name: 'Poly 3D',            url: 'https://drajmarsh.bitbucket.io/poly3d.html',                       desc: '3D polygon viewer' },
  { cat: 'geometry', name: '3D Text',            url: 'https://drajmarsh.bitbucket.io/text3d.html',                       desc: 'Parametric 3D text renderer' },
  { cat: 'compute',  name: 'MNIST Training',     url: 'https://jax-js.com/mnist',                                          desc: 'Train a neural net in-browser (jax-js + WebGPU)' },
  { cat: 'compute',  name: 'Fluid Sim',          url: 'https://jax-js.com/fluid-sim',                                      desc: 'Navier-Stokes fluid sim via WebGPU (jax-js)' },
  { cat: 'compute',  name: 'Mandelbrot',         url: 'https://jax-js.com/mandelbrot',                                     desc: 'GPU-accelerated Mandelbrot (jax-js)' },
  { cat: 'compute',  name: 'Voice Cloning TTS',  url: 'https://jax-js.com/tts',                                            desc: 'Pocket TTS in-browser (jax-js)' },
  { cat: 'compute',  name: 'CLIP Embeddings',    url: 'https://jax-js.com/mobileclip',                                     desc: 'MobileCLIP embeddings in-browser (jax-js)' },
  { cat: 'compute',  name: 'JAX-JS REPL',        url: 'https://jax-js.com/repl',                                           desc: 'Interactive jax-js playground' },
  { cat: 'utility',  name: 'Meeting Planner',    url: 'https://drajmarsh.bitbucket.io/meeting-planner.html',              desc: 'World map + timezone meeting scheduler' },
  { cat: 'utility',  name: 'Annotations',        url: 'https://drajmarsh.bitbucket.io/annotations.html',                  desc: '3D annotation tool' },
];

// ── Unified Asset Catalog (Gallery GLBs + Pi3X Scans from ../models/models.js)
function resolveAsset(path) {
  if (typeof window.resolveSiteAssetUrl === 'function') {
    return window.resolveSiteAssetUrl(path, '../');
  }
  if (!path) return '';
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  return '../' + (path.startsWith('./') ? path.slice(2) : path);
}

const FALLBACK_SCANS = [
  { dir: 'VID20230408092322',   file: 'VID20230408092322', pts: 566905,  label: 'VID20230408092322 · 566,905 pts' },
  { dir: 'VID20230408092500',   file: 'VID20230408092500', pts: 906245,  label: 'VID20230408092500 · 906,245 pts' },
  { dir: 'VID20230408095210',   file: 'VID20230408095210', pts: 140899,  label: 'VID20230408095210 · 140,899 pts' },
  { dir: 'VID20230408100423',   file: 'VID20230408100423', pts: 117726,  label: 'VID20230408100423 · 117,726 pts' },
  { dir: 'VID20230408111201',   file: 'VID20230408111201', pts: 77622,   label: 'VID20230408111201 · 77,622 pts' },
  { dir: 'VID20230408113045_1', file: 'VID20230408113045', pts: 28408,   label: 'VID20230408113045 · 28,408 pts' },
  { dir: 'VID20230408152015',   file: 'VID20230408152015', pts: 1192779, label: 'VID20230408152015 · 1,192,779 pts' },
  { dir: 'VID20230408163443_2', file: 'VID20230408163443', pts: 871261,  label: 'VID20230408163443 · 871,261 pts' },
];

const PI3X_HF_BASE = window.PI3X_HF_BASE || 'https://huggingface.co/datasets/1kaiser/models/resolve/main/';
const RAW_SCANS = (window.PI3X_SCANS && window.PI3X_SCANS.length) ? window.PI3X_SCANS : FALLBACK_SCANS;
const RAW_MODELS = Array.isArray(window.modelsConfig) ? window.modelsConfig : [];

const SCAN_ASSETS = RAW_SCANS.map((s) => ({
  key: `scan:${s.dir}`,
  kind: 'scan',
  id: s.dir,
  dir: s.dir,
  title: s.file,
  label: s.label,
  url: s.glbUrl || (PI3X_HF_BASE + s.file + '_pi3x.glb'),
  poster: resolveAsset(s.poster || `./models/bg_scans/${s.file}.png`),
  pts: s.pts || 0,
}));

const MODEL_ASSETS = RAW_MODELS.map((m, idx) => {
  const slug = m.id || String(idx);
  return {
    key: `model:${slug}`,
    kind: 'model',
    id: slug,
    index: idx,
    title: m.title || `Model ${idx + 1}`,
    label: m.title || `Model ${idx + 1}`,
    url: resolveAsset(m.url),
    poster: resolveAsset(m.poster),
    subtitle: m.description || '',
  };
});

const ALL_ASSETS = [...SCAN_ASSETS, ...MODEL_ASSETS];

// ── Build sidebar ──────────────────────────────────────────────────────────
const sidebarCats = document.getElementById('sidebar-cats');
const searchInput = document.getElementById('sidebar-search');
let activeToolBtn = null;
let currentToolUrl = '';

function buildSidebar(filter = '') {
  sidebarCats.innerHTML = '';
  const q = filter.toLowerCase();

  for (const [catKey, cat] of Object.entries(CATS)) {
    const tools = TOOLS.filter(t =>
      t.cat === catKey &&
      (!q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q))
    );
    if (!tools.length) continue;

    const box = document.createElement('div');
    box.className = 'cat-box' + (filter ? ' open' : '');
    box.style.setProperty('--cat-color', cat.color);
    box.style.setProperty('--cat-rgb', cat.rgb);

    const toggle = document.createElement('button');
    toggle.className = 'cat-toggle';
    toggle.innerHTML = `
      <span class="cat-dot"></span>
      <span class="cat-label">${cat.label}</span>
      <span class="cat-count">${tools.length}</span>
      <span class="cat-chevron">▶</span>
    `;
    toggle.addEventListener('click', () => box.classList.toggle('open'));
    box.appendChild(toggle);

    const toolList = document.createElement('div');
    toolList.className = 'cat-tools';

    tools.forEach(tool => {
      const btn = document.createElement('button');
      btn.className = 'tool-btn' + (tool.native ? ' tool-btn-native' : '');
      btn.dataset.toolName = tool.name;
      btn.style.setProperty('--cat-color', cat.color);
      btn.style.setProperty('--cat-rgb', cat.rgb);
      btn.innerHTML = `<span class="tool-btn-dot"></span>${tool.name}${tool.native ? '<span class="tool-native-badge">3D</span>' : ''}`;
      btn.title = tool.desc;
      btn.addEventListener('click', () => {
        if (activeToolBtn) activeToolBtn.classList.remove('active');
        btn.classList.add('active');
        activeToolBtn = btn;
        if (tool.native) {
          openNativeTool(tool);
        } else {
          openTool(tool);
        }
      });
      toolList.appendChild(btn);
    });

    box.appendChild(toolList);
    sidebarCats.appendChild(box);
  }
}

buildSidebar();
searchInput.addEventListener('input', () => buildSidebar(searchInput.value));

// ── Sidebar & References Modal ─────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
document.getElementById('btn-sidebar-toggle').addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

const refsModal = document.getElementById('references-modal');
const btnRefs = document.getElementById('btn-references');
const btnRefsClose = document.getElementById('btn-references-close');
function closeRefsModal() {
  if (!refsModal) return;
  refsModal.hidden = true;
  refsModal.style.display = 'none';
}
if (btnRefs && refsModal) {
  btnRefs.addEventListener('click', () => {
    refsModal.hidden = false;
    refsModal.style.display = 'flex';
  });
  btnRefsClose?.addEventListener('click', closeRefsModal);
  refsModal.addEventListener('click', (e) => { if (e.target === refsModal) closeRefsModal(); });
}

// ── Tool overlay (iframe) ──────────────────────────────────────────────────
const toolOverlay  = document.getElementById('tool-overlay');
const toolFrame    = document.getElementById('tool-frame');
const toolTitle    = document.getElementById('tool-overlay-title');
const toolHint     = document.getElementById('tool-overlay-hint');
const toolBlocked  = document.getElementById('tool-blocked');
const btnNewTab    = document.getElementById('btn-newtab');
const btnClose     = document.getElementById('btn-overlay-close');
const btnBlockedNT = document.getElementById('btn-blocked-newtab');

function closeIframeOverlay() {
  toolOverlay.classList.add('hidden');
  toolFrame.src = 'about:blank';
  toolHint?.classList.add('hidden');
  if (activeToolBtn) { activeToolBtn.classList.remove('active'); activeToolBtn = null; }
}

function openTool(tool) {
  closeNativePanel();
  closeModelsDrawer();
  currentToolUrl = tool.url;
  toolTitle.textContent = tool.name;
  if (toolHint) {
    if (tool.cat === 'compute') {
      toolHint.textContent = 'Tip: Open in New Tab for full COOP/COEP WebGPU & SharedArrayBuffer isolation';
      toolHint.classList.remove('hidden');
    } else {
      toolHint.textContent = '';
      toolHint.classList.add('hidden');
    }
  }
  toolBlocked.classList.add('hidden');
  toolFrame.src = tool.url;
  toolOverlay.classList.remove('hidden');

  toolFrame.onload = () => {
    try {
      const loc = toolFrame.contentWindow.location.href;
      if (!loc || loc === 'about:blank') toolBlocked.classList.remove('hidden');
    } catch {
      toolBlocked.classList.add('hidden');
    }
  };
}

btnNewTab.addEventListener('click',    () => window.open(currentToolUrl, '_blank'));
btnBlockedNT.addEventListener('click', () => window.open(currentToolUrl, '_blank'));
btnClose.addEventListener('click', closeIframeOverlay);

// ── Models & Scans Drawer ──────────────────────────────────────────────────
const modelsDrawer = document.getElementById('models-drawer');
const drawerGrid = document.getElementById('models-drawer-grid');
const drawerSearch = document.getElementById('models-drawer-search');
const btnModels = document.getElementById('btn-models');

function closeModelsDrawer() {
  modelsDrawer?.classList.add('hidden');
  btnModels?.classList.remove('active');
}

function renderDrawer(filter = '') {
  if (!drawerGrid) return;
  drawerGrid.innerHTML = '';
  const q = filter.trim().toLowerCase();
  const filtered = ALL_ASSETS.filter(a =>
    !q || a.title.toLowerCase().includes(q) || a.kind.includes(q) || (a.subtitle || '').toLowerCase().includes(q)
  );
  filtered.forEach(asset => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'drawer-item' + (activeAssetKey === asset.key ? ' active' : '');
    btn.dataset.assetKey = asset.key;
    btn.innerHTML = `
      ${asset.poster ? `<img class="drawer-thumb" src="${asset.poster}" alt="${asset.title}" loading="lazy">` : `<div class="drawer-thumb"></div>`}
      <div class="drawer-info">
        <span class="drawer-kind ${asset.kind === 'model' ? 'is-mesh' : ''}">${asset.kind === 'model' ? 'Gallery Mesh' : 'Pi3X Scan'}</span>
        <div class="drawer-title" title="${asset.title}">${asset.title}</div>
      </div>
    `;
    btn.addEventListener('click', () => {
      loadStageAsset(asset.key);
      closeModelsDrawer();
    });
    drawerGrid.appendChild(btn);
  });
}

btnModels?.addEventListener('click', () => {
  const willOpen = modelsDrawer?.classList.contains('hidden');
  if (willOpen) {
    closeNativePanel();
    modelsDrawer.classList.remove('hidden');
    btnModels.classList.add('active');
    renderDrawer(drawerSearch?.value || '');
  } else {
    closeModelsDrawer();
  }
});
document.getElementById('btn-drawer-close')?.addEventListener('click', closeModelsDrawer);
drawerSearch?.addEventListener('input', () => renderDrawer(drawerSearch.value));

// ── Native panel ───────────────────────────────────────────────────────────
let nativePanel = null;
let activeNative = null;

function closeNativePanel() {
  if (nativePanel) {
    nativePanel.remove();
    nativePanel = null;
  }
  if (activeNative) {
    activeNative.cleanup?.();
    activeNative = null;
  }
}

function openNativeTool(tool) {
  toolOverlay.classList.add('hidden');
  toolFrame.src = 'about:blank';
  closeModelsDrawer();
  closeNativePanel();

  const panel = document.createElement('div');
  panel.id = 'native-panel';
  document.body.appendChild(panel);
  nativePanel = panel;

  panel.innerHTML = `
    <div id="native-panel-bar">
      <span id="native-panel-title">${tool.name}</span>
      <button id="btn-native-close" title="Close tool (Esc)">&times;</button>
    </div>
    <div id="native-panel-body"></div>
  `;
  panel.querySelector('#btn-native-close').addEventListener('click', () => {
    closeNativePanel();
    if (activeToolBtn) { activeToolBtn.classList.remove('active'); activeToolBtn = null; }
  });

  const body = panel.querySelector('#native-panel-body');
  if (tool.native === 'sunpath') {
    activeNative = initSunPath(body);
  } else if (tool.native === 'supershapes') {
    activeNative = initSupershapes(body);
  }
}

// ── Three.js scene ─────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080812);
scene.fog = new THREE.Fog(0x080812, 20, 48);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 4.4, 10.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.target.set(0, 1.3, 0);

let needsRender = true;
let lastFrameRenderMs = 0;
function requestRender() {
  needsRender = true;
}
controls.addEventListener('change', requestRender);

// Base Room Lighting
const ambientLight = new THREE.AmbientLight(0x445566, 1.35);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
dirLight.position.set(5, 10, 6);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.left = -7;
dirLight.shadow.camera.right = 7;
dirLight.shadow.camera.top = 7;
dirLight.shadow.camera.bottom = -7;
dirLight.shadow.bias = -0.0005;
scene.add(dirLight);
[[-6, 6, -6, 0xFFB300, 0.45], [6, 6, -6, 0x29B6F6, 0.45]].forEach(([x, y, z, c, i]) => {
  const pl = new THREE.PointLight(c, i, 20);
  pl.position.set(x, y, z);
  scene.add(pl);
});

// Room + Floor Grid
const floorMat = new THREE.MeshStandardMaterial({ color: 0x0e0e1a, roughness: 0.9 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const floorGrid = new THREE.GridHelper(24, 24, 0x243046, 0x161c2c);
floorGrid.position.y = 0.005;
scene.add(floorGrid);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x090912, roughness: 0.95 });
[
  [0, 5, -14, 0],
  [-14, 5, 0, Math.PI / 2],
  [14, 5, 0, -Math.PI / 2],
].forEach(([x, y, z, ry]) => {
  const w = new THREE.Mesh(new THREE.PlaneGeometry(28, 10), wallMat);
  w.position.set(x, y, z);
  w.rotation.y = ry;
  scene.add(w);
});

// ── Stage Loader (Gallery GLBs with Draco + Pi3X Scans via ModelCache) ─────
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const stageGroup = new THREE.Group();
scene.add(stageGroup);

let activeAssetKey = SCAN_ASSETS[0]?.key || '';
let bgScanDir = SCAN_ASSETS[0]?.dir || 'VID20230408092322';
let stageLoadId = 0;

function disposeMaterial(mat) {
  if (!mat) return;
  ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap'].forEach(k => {
    if (mat[k]?.dispose) mat[k].dispose();
  });
  mat.dispose?.();
}

function clearStageGroup() {
  while (stageGroup.children.length) {
    const child = stageGroup.children[0];
    stageGroup.remove(child);
    child.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(disposeMaterial);
        else disposeMaterial(obj.material);
      }
    });
  }
}

const hudBadge = document.getElementById('stage-hud-badge');
const hudTitle = document.getElementById('stage-hud-title');
const hudMeta = document.getElementById('stage-hud-meta');
const bgScanSelect = document.getElementById('bg-scan-select');
const btnMeasurePotree = document.getElementById('btn-measure-potree');

function setHud(badge, title, meta) {
  if (hudBadge) hudBadge.textContent = badge;
  if (hudTitle) hudTitle.textContent = title;
  if (hudMeta) hudMeta.textContent = meta;
}

function resetStageCamera() {
  camera.position.set(0, 4.2, 10.2);
  controls.target.set(0, 1.3, 0);
  controls.update();
}
document.getElementById('btn-stage-reset')?.addEventListener('click', resetStageCamera);

function syncQueryUrl(asset) {
  const params = new URLSearchParams(location.search);
  params.delete('scan');
  params.delete('model');
  if (asset.kind === 'scan') params.set('scan', asset.dir);
  else params.set('model', asset.id);
  const qs = params.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

async function loadStageAsset(key, pushUrl = true) {
  const asset = ALL_ASSETS.find(a => a.key === key) || SCAN_ASSETS[0];
  if (!asset) return;

  activeAssetKey = asset.key;
  if (bgScanSelect && bgScanSelect.value !== asset.key) bgScanSelect.value = asset.key;
  if (asset.kind === 'scan') {
    bgScanDir = asset.dir;
    btnMeasurePotree.title = `Open ${asset.dir} in Potree 2.0 point-cloud measurement`;
  } else {
    btnMeasurePotree.title = `Measure Pi3X scan ${bgScanDir} in Potree 2.0`;
  }

  document.querySelectorAll('.drawer-item').forEach(el => {
    el.classList.toggle('active', el.dataset.assetKey === asset.key);
  });
  if (pushUrl) syncQueryUrl(asset);

  const reqId = ++stageLoadId;
  setHud(asset.kind === 'model' ? 'GALLERY MESH' : 'PI3X SCAN', asset.title, 'Loading…');

  try {
    const resolvedUrl = window.ModelCache
      ? await window.ModelCache.getBlobUrl(asset.url, true)
      : asset.url;
    if (reqId !== stageLoadId) return;

    const gltf = await gltfLoader.loadAsync(resolvedUrl);
    if (reqId !== stageLoadId) return;

    clearStageGroup();
    const model = gltf.scene;

    // Normalize bounding box cleanly inside the DOME_R = 7 arena, centered & floor-grounded
    model.updateMatrixWorld(true);
    const rawBox = new THREE.Box3().setFromObject(model);
    if (!rawBox.isEmpty()) {
      const size = new THREE.Vector3();
      rawBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z, 0.001);
      const scale = 4.2 / maxDim;
      model.scale.setScalar(scale);
      model.updateMatrixWorld(true);

      const scaledBox = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      scaledBox.getCenter(center);
      model.position.set(-center.x, -scaledBox.min.y + 0.02, -center.z);
    }

    let meshCount = 0;
    let pointCount = 0;
    model.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        meshCount++;
      } else if (c.isPoints && c.geometry?.attributes?.position) {
        pointCount += c.geometry.attributes.position.count;
      }
    });

    stageGroup.add(model);
    renderer.shadowMap.needsUpdate = true;
    requestRender();
    const meta = asset.kind === 'scan'
      ? `${(asset.pts || pointCount).toLocaleString('en-US')} pts`
      : `${meshCount} mesh${meshCount === 1 ? '' : 'es'} · Draco/GLB`;
    setHud(asset.kind === 'model' ? 'GALLERY MESH' : 'PI3X SCAN', asset.title, meta);
  } catch (err) {
    if (reqId !== stageLoadId) return;
    console.warn('Stage asset load failed:', asset.title, err);
    setHud('ERROR', asset.title, 'Load failed');
  }
}

// Populate grouped selector (#bg-scan-select)
if (bgScanSelect) {
  const scanGroup = document.createElement('optgroup');
  scanGroup.label = `Pi3X Scans (${SCAN_ASSETS.length})`;
  SCAN_ASSETS.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.key;
    opt.textContent = a.label;
    scanGroup.appendChild(opt);
  });
  bgScanSelect.appendChild(scanGroup);

  if (MODEL_ASSETS.length) {
    const modelGroup = document.createElement('optgroup');
    modelGroup.label = `Gallery 3D Models (${MODEL_ASSETS.length})`;
    MODEL_ASSETS.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.key;
      opt.textContent = a.title;
      modelGroup.appendChild(opt);
    });
    bgScanSelect.appendChild(modelGroup);
  }

  bgScanSelect.addEventListener('change', () => loadStageAsset(bgScanSelect.value));
}

document.getElementById('btn-measure-potree').addEventListener('click', () => {
  window.open(`potree/index.html?scan=${encodeURIComponent(bgScanDir)}`, '_blank');
});

// ── Solar position math (shared with js/sun-lighting.js; Spencer 1971 + EoT)
function computeSolar(lat, lon, doy, hour) {
  if (window.SunLighting?.solarPosition) {
    return window.SunLighting.solarPosition(lat, lon, doy, hour, { isUTC: false });
  }
  const latR = lat * Math.PI / 180;
  const B = (2 * Math.PI / 365) * (doy - 1);
  const decl = (180 / Math.PI) * (0.006918 - 0.399912 * Math.cos(B) + 0.070257 * Math.sin(B)
    - 0.006758 * Math.cos(2 * B) + 0.000907 * Math.sin(2 * B)
    - 0.002697 * Math.cos(3 * B) + 0.00148 * Math.sin(3 * B));
  const declR = decl * Math.PI / 180;
  const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(B) - 0.032077 * Math.sin(B)
    - 0.014615 * Math.cos(2 * B) - 0.04089 * Math.sin(2 * B));
  const tz = Math.round(lon / 15);
  const ha = ((hour + (lon / 15 - tz) + eot / 60 - 12) * 15) * Math.PI / 180;
  const sinAlt = Math.sin(latR) * Math.sin(declR) + Math.cos(latR) * Math.cos(declR) * Math.cos(ha);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const denom = Math.cos(latR) * Math.cos(altitude);
  const cosAz = Math.abs(denom) > 1e-6 ? (Math.sin(declR) - Math.sin(latR) * sinAlt) / denom : 1;
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (Math.sin(ha) > 0) azimuth = 2 * Math.PI - azimuth;
  return { altitude, azimuth, declination: declR, eotMinutes: eot };
}

function sunXYZ(altitude, azimuth, radius) {
  const x = radius * Math.cos(altitude) * Math.sin(azimuth);
  const y = radius * Math.sin(altitude);
  const z = -radius * Math.cos(altitude) * Math.cos(azimuth);
  return new THREE.Vector3(x, y, z);
}

function makeCompassSprite(letter, color = '#7dd3fc') {
  const cvs = document.createElement('canvas');
  cvs.width = 64;
  cvs.height = 64;
  const ctx = cvs.getContext('2d');
  ctx.beginPath();
  ctx.arc(32, 32, 26, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8, 12, 24, 0.86)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(letter, 32, 33);
  const tex = new THREE.CanvasTexture(cvs);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.68, 0.68, 1);
  return { sprite, tex };
}

// ── Native: 3D Sun-Path ────────────────────────────────────────────────────
const sunPathGroup = new THREE.Group();
scene.add(sunPathGroup);

function initSunPath(container) {
  const DOME_R = 7;

  container.innerHTML = `
    <div class="np-presets" style="margin-bottom:10px;">
      <button type="button" class="np-preset-btn" id="sp-preset-delhi">Delhi 28.5°N</button>
      <button type="button" class="np-preset-btn" id="sp-preset-london">London 51.5°N</button>
      <button type="button" class="np-preset-btn" id="sp-preset-now">Sync Now</button>
    </div>
    <div class="np-row">
      <label>Latitude <span class="np-val" id="sp-lat-val">28.5°</span></label>
      <input type="range" id="sp-lat" min="-90" max="90" step="0.5" value="28.5">
    </div>
    <div class="np-row">
      <label>Longitude <span class="np-val" id="sp-lon-val">77.0°</span></label>
      <input type="range" id="sp-lon" min="-180" max="180" step="0.5" value="77">
    </div>
    <div class="np-row">
      <label>Day of Year <span class="np-val" id="sp-doy-val">172</span></label>
      <input type="range" id="sp-doy" min="1" max="365" step="1" value="172">
    </div>
    <div class="np-row">
      <label>Local Solar Hour <span class="np-val" id="sp-hour-val">10:30</span></label>
      <input type="range" id="sp-hour" min="0" max="24" step="0.25" value="10.5">
    </div>
    <div class="np-section">Solar Position (Spencer 1971 + EoT)</div>
    <div class="np-info" id="sp-info">—</div>
    <div class="np-row">
      <label>Path Density <span class="np-val" id="sp-res-val">96</span></label>
      <input type="range" id="sp-res" min="24" max="288" step="24" value="96">
    </div>
    <div class="np-row np-check-row">
      <label><input type="checkbox" id="sp-dome" checked> Show dome</label>
      <label><input type="checkbox" id="sp-yearpath" checked> Full-year paths</label>
    </div>
  `;

  // Dim static studio light so the real Sun DirectionalLight casts crisp moving shadows
  dirLight.intensity = 0.2;

  const domeGeo = new THREE.SphereGeometry(DOME_R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshBasicMaterial({ color: 0x0d1a2e, side: THREE.BackSide, transparent: true, opacity: 0.38 });
  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  sunPathGroup.add(domeMesh);

  const hRing = new THREE.Mesh(
    new THREE.TorusGeometry(DOME_R, 0.04, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0xFFB300 })
  );
  hRing.rotation.x = Math.PI / 2;
  sunPathGroup.add(hRing);

  const textures = [];
  const labelR = 4.5;
  [['N', 0, 0.22, -labelR], ['S', 0, 0.22, labelR], ['E', labelR, 0.22, 0], ['W', -labelR, 0.22, 0]].forEach(([lbl, x, y, z]) => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), new THREE.MeshBasicMaterial({ color: lbl === 'N' ? 0xf87171 : 0x7dd3fc }));
    dot.position.set(Math.sign(x) * DOME_R, 0, Math.sign(z) * DOME_R);
    sunPathGroup.add(dot);
    const { sprite, tex } = makeCompassSprite(lbl, lbl === 'N' ? '#f87171' : '#7dd3fc');
    sprite.position.set(x, y, z);
    sunPathGroup.add(sprite);
    textures.push(tex);
  });

  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xFFE066 })
  );
  sunPathGroup.add(sunMesh);

  // Real shadow-casting DirectionalLight matching solar azimuth & altitude
  const solarDirLight = new THREE.DirectionalLight(0xFFE699, 2.2);
  solarDirLight.castShadow = true;
  solarDirLight.shadow.mapSize.set(1024, 1024);
  solarDirLight.shadow.camera.left = -7;
  solarDirLight.shadow.camera.right = 7;
  solarDirLight.shadow.camera.top = 7;
  solarDirLight.shadow.camera.bottom = -7;
  solarDirLight.shadow.camera.near = 0.5;
  solarDirLight.shadow.camera.far = 26;
  solarDirLight.shadow.bias = -0.0005;
  sunPathGroup.add(solarDirLight);
  sunPathGroup.add(solarDirLight.target);
  solarDirLight.target.position.set(0, 0, 0);

  let pathLine = null;

  function rebuild() {
    const lat  = parseFloat(document.getElementById('sp-lat').value);
    const lon  = parseFloat(document.getElementById('sp-lon').value);
    const doy  = parseInt(document.getElementById('sp-doy').value, 10);
    const hour = parseFloat(document.getElementById('sp-hour').value);
    const res  = parseInt(document.getElementById('sp-res').value, 10);
    const showDome  = document.getElementById('sp-dome').checked;
    const yearPaths = document.getElementById('sp-yearpath').checked;

    document.getElementById('sp-lat-val').textContent  = lat.toFixed(1) + '°';
    document.getElementById('sp-lon-val').textContent  = lon.toFixed(1) + '°';
    document.getElementById('sp-doy-val').textContent  = doy;
    document.getElementById('sp-hour-val').textContent = Math.floor(hour).toString().padStart(2, '0') + ':' + String(Math.round((hour % 1) * 60)).padStart(2, '0');
    document.getElementById('sp-res-val').textContent  = res;

    domeMesh.visible = showDome;

    const pos = computeSolar(lat, lon, doy, hour);
    const altDeg = (pos.altitude * 180 / Math.PI).toFixed(1);
    const azDeg  = (pos.azimuth  * 180 / Math.PI).toFixed(1);
    const eotStr = (pos.eotMinutes >= 0 ? '+' : '') + pos.eotMinutes.toFixed(1);
    document.getElementById('sp-info').textContent =
      pos.altitude > 0
        ? `Alt: ${altDeg}°  Az: ${azDeg}°  (above horizon)\nEoT: ${eotStr} min`
        : `Alt: ${altDeg}°  (below horizon)\nEoT: ${eotStr} min`;

    const sunPos = sunXYZ(pos.altitude, pos.azimuth, DOME_R * 0.92);
    sunMesh.position.copy(sunPos);
    solarDirLight.position.copy(sunPos).multiplyScalar(1.8);
    sunMesh.visible = pos.altitude > 0;
    solarDirLight.visible = pos.altitude > 0;
    renderer.shadowMap.needsUpdate = true;
    requestRender();

    if (pathLine) { sunPathGroup.remove(pathLine); pathLine.geometry.dispose(); pathLine = null; }
    const pts = [];
    for (let h = 0; h <= res; h++) {
      const t = (h / res) * 24;
      const p = computeSolar(lat, lon, doy, t);
      if (p.altitude > 0) pts.push(sunXYZ(p.altitude, p.azimuth, DOME_R * 0.9));
    }
    if (pts.length > 1) {
      pathLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0xFFB300 })
      );
      sunPathGroup.add(pathLine);
    }

    sunPathGroup.children.filter(c => c.userData.yearPath).forEach(c => {
      sunPathGroup.remove(c);
      c.geometry?.dispose();
    });
    if (yearPaths) {
      [80, 172, 355].forEach(d => {
        const ypts = [];
        for (let h = 0; h <= res; h++) {
          const t = (h / res) * 24;
          const p = computeSolar(lat, lon, d, t);
          if (p.altitude > 0) ypts.push(sunXYZ(p.altitude, p.azimuth, DOME_R * 0.88));
        }
        if (ypts.length > 1) {
          const yl = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(ypts),
            new THREE.LineBasicMaterial({ color: 0x475569 })
          );
          yl.userData.yearPath = true;
          sunPathGroup.add(yl);
        }
      });
    }
  }

  document.getElementById('sp-preset-delhi').addEventListener('click', () => {
    document.getElementById('sp-lat').value = '28.5';
    document.getElementById('sp-lon').value = '77';
    document.getElementById('sp-doy').value = '172';
    document.getElementById('sp-hour').value = '12';
    rebuild();
  });
  document.getElementById('sp-preset-london').addEventListener('click', () => {
    document.getElementById('sp-lat').value = '51.5';
    document.getElementById('sp-lon').value = '0';
    document.getElementById('sp-doy').value = '172';
    document.getElementById('sp-hour').value = '12';
    rebuild();
  });
  document.getElementById('sp-preset-now').addEventListener('click', () => {
    const now = new Date();
    const doy = window.SunLighting?.dayOfYear ? window.SunLighting.dayOfYear(now) : 172;
    const h = now.getHours() + Math.round((now.getMinutes() / 60) * 4) / 4;
    document.getElementById('sp-doy').value = String(doy);
    document.getElementById('sp-hour').value = String(Math.min(24, h));
    rebuild();
  });

  container.querySelectorAll('input').forEach(el => el.addEventListener('input', rebuild));
  rebuild();

  return {
    cleanup() {
      dirLight.intensity = 1.25;
      while (sunPathGroup.children.length) {
        const c = sunPathGroup.children[0];
        sunPathGroup.remove(c);
        c.geometry?.dispose();
        c.material?.dispose();
      }
      textures.forEach(t => t.dispose());
      renderer.shadowMap.needsUpdate = true;
      requestRender();
    }
  };
}

// ── Native: Supershapes (Gielis superformula + GLB export) ─────────────────
const superGroup = new THREE.Group();
scene.add(superGroup);

function gielis(phi, m, a, b, n1, n2, n3) {
  const t1 = Math.abs(Math.cos((m * phi) / 4) / a);
  const t2 = Math.abs(Math.sin((m * phi) / 4) / b);
  const r = Math.pow(Math.pow(t1, n2) + Math.pow(t2, n3), -1 / n1);
  return isFinite(r) ? r : 0;
}

function buildSuperMesh(m1, a1, b1, n11, n21, n31, m2, a2, b2, n12, n22, n32, segs) {
  const positions = [];
  const indices = [];
  const uCount = segs * 2;
  const vCount = segs;

  for (let vi = 0; vi <= vCount; vi++) {
    const theta = -Math.PI / 2 + (Math.PI * vi) / vCount;
    const r2 = gielis(theta, m2, a2, b2, n12, n22, n32);
    for (let ui = 0; ui <= uCount; ui++) {
      const phi = -Math.PI + (2 * Math.PI * ui) / uCount;
      const r1 = gielis(phi, m1, a1, b1, n11, n21, n31);
      const x = r1 * Math.cos(phi) * r2 * Math.cos(theta);
      const y = r1 * Math.sin(phi) * r2 * Math.cos(theta);
      const z = r2 * Math.sin(theta);
      positions.push(x, z, y);
    }
  }

  for (let vi = 0; vi < vCount; vi++) {
    for (let ui = 0; ui < uCount; ui++) {
      const a = vi * (uCount + 1) + ui;
      const b = a + 1;
      const c = a + (uCount + 1);
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function initSupershapes(container) {
  container.innerHTML = `
    <div class="np-section">Shape 1 (longitude)</div>
    <div class="np-row"><label>m <span class="np-val" id="ss-m1-val">4</span></label>
      <input type="range" id="ss-m1" min="0" max="20" step="0.5" value="4"></div>
    <div class="np-row"><label>n1 <span class="np-val" id="ss-n1-val">5</span></label>
      <input type="range" id="ss-n1" min="0.1" max="20" step="0.1" value="5"></div>
    <div class="np-row"><label>n2 <span class="np-val" id="ss-n2-val">18</span></label>
      <input type="range" id="ss-n2" min="0.1" max="20" step="0.1" value="18"></div>
    <div class="np-row"><label>n3 <span class="np-val" id="ss-n3-val">18</span></label>
      <input type="range" id="ss-n3" min="0.1" max="20" step="0.1" value="18"></div>
    <div class="np-section">Shape 2 (latitude)</div>
    <div class="np-row"><label>m <span class="np-val" id="ss-m2-val">4</span></label>
      <input type="range" id="ss-m2" min="0" max="20" step="0.5" value="4"></div>
    <div class="np-row"><label>n1 <span class="np-val" id="ss-n1b-val">5</span></label>
      <input type="range" id="ss-n1b" min="0.1" max="20" step="0.1" value="5"></div>
    <div class="np-row"><label>n2 <span class="np-val" id="ss-n2b-val">18</span></label>
      <input type="range" id="ss-n2b" min="0.1" max="20" step="0.1" value="18"></div>
    <div class="np-row"><label>n3 <span class="np-val" id="ss-n3b-val">18</span></label>
      <input type="range" id="ss-n3b" min="0.1" max="20" step="0.1" value="18"></div>
    <div class="np-section">Display</div>
    <div class="np-row"><label>Scale <span class="np-val" id="ss-scale-val">1.6</span></label>
      <input type="range" id="ss-scale" min="0.5" max="4" step="0.1" value="1.6"></div>
    <div class="np-row"><label>Resolution <span class="np-val" id="ss-res-val">48</span></label>
      <input type="range" id="ss-res" min="16" max="96" step="8" value="48"></div>
    <div class="np-row np-check-row">
      <label><input type="checkbox" id="ss-wire" checked> Wire</label>
      <label><input type="checkbox" id="ss-solid" checked> Solid</label>
      <label><input type="checkbox" id="ss-solo"> Solo</label>
    </div>
    <div class="np-section-presets">Presets</div>
    <div class="np-presets"></div>
  `;

  // [m1, a1, b1, n11, n21, n31,   m2, a2, b2, n12, n22, n32]
  const presets = [
    { name: 'Cube',      p: [4, 1, 1, 12, 12, 12,   4, 1, 1, 12, 12, 12] },
    { name: 'Sphere',    p: [0, 1, 1, 2, 2, 2,      0, 1, 1, 2, 2, 2] },
    { name: 'Star',      p: [5, 1, 1, 0.3, 1.7, 1.7, 5, 1, 1, 0.3, 1.7, 1.7] },
    { name: 'Cactus',    p: [13, 1, 1, 0.4, 0.5, 8, 13, 1, 1, 0.4, 0.5, 8] },
    { name: 'Torus-ish', p: [4, 1, 1, 4, 1, 1,      2, 1, 1, 8, 1, 1] },
    { name: 'Flower',    p: [6, 1, 1, 0.5, 1, 1,    6, 1, 1, 0.5, 1, 1] },
  ];

  const presetsEl = container.querySelector('.np-presets');
  presets.forEach(pr => {
    const btn = document.createElement('button');
    btn.className = 'np-preset-btn';
    btn.textContent = pr.name;
    btn.addEventListener('click', () => {
      const ids = ['ss-m1', 'ss-n1', 'ss-n2', 'ss-n3', 'ss-m2', 'ss-n1b', 'ss-n2b', 'ss-n3b'];
      const vals = [pr.p[0], pr.p[3], pr.p[4], pr.p[5], pr.p[6], pr.p[9], pr.p[10], pr.p[11]];
      ids.forEach((id, i) => { document.getElementById(id).value = vals[i]; });
      rebuild();
    });
    presetsEl.appendChild(btn);
  });

  let solidMesh = null;
  let wireMesh = null;

  function rebuild() {
    const m1  = parseFloat(document.getElementById('ss-m1').value);
    const n11 = parseFloat(document.getElementById('ss-n1').value);
    const n21 = parseFloat(document.getElementById('ss-n2').value);
    const n31 = parseFloat(document.getElementById('ss-n3').value);
    const m2  = parseFloat(document.getElementById('ss-m2').value);
    const n12 = parseFloat(document.getElementById('ss-n1b').value);
    const n22 = parseFloat(document.getElementById('ss-n2b').value);
    const n32 = parseFloat(document.getElementById('ss-n3b').value);
    const scale = parseFloat(document.getElementById('ss-scale').value);
    const res   = parseInt(document.getElementById('ss-res').value, 10);
    const showWire  = document.getElementById('ss-wire').checked;
    const showSolid = document.getElementById('ss-solid').checked;
    const solo      = document.getElementById('ss-solo').checked;

    stageGroup.visible = !solo;

    document.getElementById('ss-m1-val').textContent  = m1;
    document.getElementById('ss-n1-val').textContent  = n11;
    document.getElementById('ss-n2-val').textContent  = n21;
    document.getElementById('ss-n3-val').textContent  = n31;
    document.getElementById('ss-m2-val').textContent  = m2;
    document.getElementById('ss-n1b-val').textContent = n12;
    document.getElementById('ss-n2b-val').textContent = n22;
    document.getElementById('ss-n3b-val').textContent = n32;
    document.getElementById('ss-scale-val').textContent = scale.toFixed(1);
    document.getElementById('ss-res-val').textContent   = res;

    const geo = buildSuperMesh(m1, 1, 1, n11, n21, n31, m2, 1, 1, n12, n22, n32, res);
    geo.computeBoundingSphere();
    const yPos = Math.max(scale * 1.15, 1.3);
    const xPos = solo ? 0 : -3.4;
    const zPos = solo ? 0 : -1.2;

    if (solidMesh) { superGroup.remove(solidMesh); solidMesh.geometry.dispose(); solidMesh = null; }
    if (wireMesh)  { superGroup.remove(wireMesh);  wireMesh.geometry.dispose();  wireMesh  = null; }

    if (showSolid) {
      solidMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: 0x26C6DA, metalness: 0.3, roughness: 0.45,
        transparent: true, opacity: 0.88, side: THREE.DoubleSide
      }));
      solidMesh.castShadow = true;
      solidMesh.receiveShadow = true;
      solidMesh.scale.setScalar(scale);
      solidMesh.position.set(xPos, yPos, zPos);
      superGroup.add(solidMesh);
    }
    if (showWire) {
      wireMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: 0x7dd3fc, wireframe: true
      }));
      wireMesh.scale.setScalar(scale);
      wireMesh.position.set(xPos, yPos, zPos);
      superGroup.add(wireMesh);
    }
    renderer.shadowMap.needsUpdate = true;
    requestRender();
  }

  container.querySelectorAll('input').forEach(el => el.addEventListener('input', rebuild));
  rebuild();

  let rot = true;
  const rotBtn = document.createElement('button');
  rotBtn.className = 'np-preset-btn';
  rotBtn.textContent = 'Toggle Rotate';
  rotBtn.addEventListener('click', () => { rot = !rot; requestRender(); });
  presetsEl.appendChild(rotBtn);

  const exportBtn = document.createElement('button');
  exportBtn.id = 'btn-ss-export';
  exportBtn.className = 'np-preset-btn';
  exportBtn.textContent = 'Export .GLB';
  exportBtn.addEventListener('click', () => {
    const target = solidMesh || wireMesh;
    if (!target) return;
    const exporter = new GLTFExporter();
    exporter.parse(target, (bin) => {
      const blob = new Blob([bin], { type: 'model/gltf-binary' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `supershape_m${document.getElementById('ss-m1').value}.glb`;
      a.click();
    }, (err) => console.warn('GLB export failed:', err), { binary: true });
  });
  presetsEl.appendChild(exportBtn);

  return {
    rotate() {
      // Auto-pause idle spin on slow software renderers (>120ms/frame) so UI stays snappy
      if (rot && lastFrameRenderMs < 120 && (solidMesh || wireMesh)) {
        if (solidMesh) solidMesh.rotation.y += 0.006;
        if (wireMesh)  wireMesh.rotation.y  += 0.006;
        return true;
      }
      return false;
    },
    cleanup() {
      stageGroup.visible = true;
      if (solidMesh) { superGroup.remove(solidMesh); solidMesh.geometry.dispose(); solidMesh = null; }
      if (wireMesh)  { superGroup.remove(wireMesh);  wireMesh.geometry.dispose();  wireMesh  = null; }
      renderer.shadowMap.needsUpdate = true;
      requestRender();
    }
  };
}

// ── Global Escape Handler ──────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (refsModal && !refsModal.hidden) { closeRefsModal(); return; }
  if (!toolOverlay.classList.contains('hidden')) { closeIframeOverlay(); return; }
  if (modelsDrawer && !modelsDrawer.classList.contains('hidden')) { closeModelsDrawer(); return; }
  if (nativePanel) {
    closeNativePanel();
    if (activeToolBtn) { activeToolBtn.classList.remove('active'); activeToolBtn = null; }
  }
});

// ── URL Deep-Link Startup (?model=<slug|idx>&scan=<dir>&tool=sunpath|supershapes)
(function bootFromUrl() {
  const params = new URLSearchParams(location.search);
  const reqModel = params.get('model');
  const reqScan = params.get('scan');
  const reqTool = params.get('tool');

  let startKey = SCAN_ASSETS[0]?.key || ALL_ASSETS[0]?.key;
  if (reqModel) {
    const q = reqModel.toLowerCase();
    const match = MODEL_ASSETS.find(a =>
      a.id.toLowerCase() === q || a.title.toLowerCase() === q || String(a.index) === q
    );
    if (match) startKey = match.key;
  } else if (reqScan) {
    const match = SCAN_ASSETS.find(a => a.dir === reqScan || a.title === reqScan);
    if (match) startKey = match.key;
  }

  loadStageAsset(startKey, false);

  if (reqTool === 'sunpath' || reqTool === 'supershapes') {
    const targetName = reqTool === 'sunpath' ? '3D Sun-Path' : 'Supershapes';
    const toolObj = TOOLS.find(t => t.native === reqTool);
    if (toolObj) {
      const catKey = toolObj.cat;
      document.querySelectorAll('.cat-box').forEach(box => {
        if (box.querySelector(`.tool-btn[data-tool-name="${targetName}"]`)) {
          box.classList.add('open');
        }
      });
      const btn = document.querySelector(`.tool-btn[data-tool-name="${targetName}"]`);
      if (btn) {
        if (activeToolBtn) activeToolBtn.classList.remove('active');
        btn.classList.add('active');
        activeToolBtn = btn;
      }
      openNativeTool(toolObj);
    }
  }
})();

// ── Animate (on-demand + adaptive frame budget) ───────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const camChanged = controls.update();
  const rotChanged = activeNative?.rotate?.();
  if (needsRender || camChanged || rotChanged) {
    needsRender = false;
    const t0 = performance.now();
    renderer.render(scene, camera);
    lastFrameRenderMs = performance.now() - t0;
  }
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  requestRender();
});
