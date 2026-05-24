import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
  { cat: 'solar',    name: '3D Sun-Path',       native: 'sunpath',     desc: 'Live 3D sun-path dome with lat/lon/date/time controls' },
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
  { cat: 'geometry', name: 'Supershapes',        native: 'supershapes',                                                    desc: 'Parametric 3D superform — Gielis formula with live controls' },
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

// ── Build sidebar ───────────────────────────────────────────────────────────
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

// ── Sidebar toggle ─────────────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
document.getElementById('btn-sidebar-toggle').addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// ── Tool overlay (iframe) ──────────────────────────────────────────────────
const toolOverlay  = document.getElementById('tool-overlay');
const toolFrame    = document.getElementById('tool-frame');
const toolTitle    = document.getElementById('tool-overlay-title');
const toolBlocked  = document.getElementById('tool-blocked');
const btnNewTab    = document.getElementById('btn-newtab');
const btnClose     = document.getElementById('btn-overlay-close');
const btnBlockedNT = document.getElementById('btn-blocked-newtab');

function openTool(tool) {
    closeNativePanel();
    currentToolUrl = tool.url;
    toolTitle.textContent = tool.name;
    toolBlocked.classList.add('hidden');
    toolFrame.src = tool.url;
    toolOverlay.classList.remove('hidden');

    toolFrame.onload = () => {
        try {
            const loc = toolFrame.contentWindow.location.href;
            if (!loc || loc === 'about:blank') toolBlocked.classList.remove('hidden');
        } catch { toolBlocked.classList.remove('hidden'); }
    };
}

btnNewTab.addEventListener('click',    () => window.open(currentToolUrl, '_blank'));
btnBlockedNT.addEventListener('click', () => window.open(currentToolUrl, '_blank'));
btnClose.addEventListener('click', () => {
    toolOverlay.classList.add('hidden');
    toolFrame.src = 'about:blank';
    if (activeToolBtn) { activeToolBtn.classList.remove('active'); activeToolBtn = null; }
});

document.getElementById('btn-models').addEventListener('click', () => {
    window.open('../index.html', '_blank');
});

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
    closeNativePanel();

    const panel = document.createElement('div');
    panel.id = 'native-panel';
    document.body.appendChild(panel);
    nativePanel = panel;

    panel.innerHTML = `
        <div id="native-panel-bar">
            <span id="native-panel-title">${tool.name}</span>
            <button id="btn-native-close">×</button>
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
scene.fog = new THREE.Fog(0x080812, 18, 45);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 5, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;
controls.target.set(0, 1.5, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0x334455, 1.5);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 6);
dirLight.castShadow = true;
scene.add(dirLight);
[ [-6,6,-6,0xFFB300,0.5], [6,6,-6,0x29B6F6,0.5] ].forEach(([x,y,z,c,i]) => {
    const pl = new THREE.PointLight(c, i, 18);
    pl.position.set(x, y, z);
    scene.add(pl);
});

// Room
const floorMat = new THREE.MeshStandardMaterial({ color: 0x0e0e1a, roughness: 0.9 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

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

// GLB model
if (window.modelsConfig?.length > 0) {
    const loader = new GLTFLoader();
    loader.load(`../${window.modelsConfig[0].url}`, (gltf) => {
        const model = gltf.scene;
        model.position.set(4, 0, 0);
        model.scale.set(0.4, 0.4, 0.4);
        model.traverse(c => { if (c.isMesh) c.castShadow = true; });
        scene.add(model);
    }, undefined, (e) => console.warn('GLB load failed:', e));
}

// ── Solar position math (standard astronomical algorithms) ─────────────────
function solarPosition(lat, lon, doy, hour) {
    const latR = lat * Math.PI / 180;
    // Declination (Spencer formula)
    const B = (2 * Math.PI / 365) * (doy - 1);
    const decl = (180 / Math.PI) * (0.006918 - 0.399912 * Math.cos(B) + 0.070257 * Math.sin(B)
        - 0.006758 * Math.cos(2*B) + 0.000907 * Math.sin(2*B)
        - 0.002697 * Math.cos(3*B) + 0.00148 * Math.sin(3*B));
    const declR = decl * Math.PI / 180;

    // Equation of time (minutes)
    const EoT = 229.18 * (0.000075 + 0.001868 * Math.cos(B) - 0.032077 * Math.sin(B)
        - 0.014615 * Math.cos(2*B) - 0.04089 * Math.sin(2*B));

    // Hour angle
    const solarNoon = 12 - lon / 15; // naive (no timezone offset)
    const TC = EoT / 60 + lon / 15 - lon / 15; // time correction already in solarNoon
    const ha = (hour - solarNoon) * 15 * Math.PI / 180;

    // Altitude
    const sinAlt = Math.sin(latR) * Math.sin(declR) + Math.cos(latR) * Math.cos(declR) * Math.cos(ha);
    const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

    // Azimuth (from south, clockwise = west)
    const cosAz = (Math.sin(declR) - Math.sin(latR) * sinAlt) / (Math.cos(latR) * Math.cos(altitude));
    let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
    if (Math.sin(ha) > 0) azimuth = 2 * Math.PI - azimuth;

    return { altitude, azimuth, declination: declR };
}

function sunXYZ(altitude, azimuth, radius) {
    // azimuth from north clockwise; Three.js: x=east, y=up, z=south
    const x = radius * Math.cos(altitude) * Math.sin(azimuth);
    const y = radius * Math.sin(altitude);
    const z = -radius * Math.cos(altitude) * Math.cos(azimuth);
    return new THREE.Vector3(x, y, z);
}

// ── Native: Sun-Path ───────────────────────────────────────────────────────
const sunPathGroup = new THREE.Group();
scene.add(sunPathGroup);
let sunLight = null;

function initSunPath(container) {
    const DOME_R = 7;

    // Build controls HTML
    container.innerHTML = `
        <div class="np-row">
            <label>Latitude <span class="np-val" id="sp-lat-val">51.5°</span></label>
            <input type="range" id="sp-lat" min="-90" max="90" step="0.5" value="51.5">
        </div>
        <div class="np-row">
            <label>Longitude <span class="np-val" id="sp-lon-val">0.0°</span></label>
            <input type="range" id="sp-lon" min="-180" max="180" step="0.5" value="0">
        </div>
        <div class="np-row">
            <label>Day of Year <span class="np-val" id="sp-doy-val">172</span></label>
            <input type="range" id="sp-doy" min="1" max="365" step="1" value="172">
        </div>
        <div class="np-row">
            <label>Hour <span class="np-val" id="sp-hour-val">12:00</span></label>
            <input type="range" id="sp-hour" min="0" max="24" step="0.25" value="12">
        </div>
        <div class="np-section">Solar Position</div>
        <div class="np-info" id="sp-info">—</div>
        <div class="np-row">
            <label>Path Density <span class="np-val" id="sp-res-val">96</span></label>
            <input type="range" id="sp-res" min="24" max="288" step="24" value="96">
        </div>
        <div class="np-row np-check-row">
            <label><input type="checkbox" id="sp-dome" checked> Show dome</label>
            <label><input type="checkbox" id="sp-yearpath"> Full-year paths</label>
        </div>
    `;

    // Three.js objects
    const domeGeo = new THREE.SphereGeometry(DOME_R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshBasicMaterial({ color: 0x0d1a2e, side: THREE.BackSide, transparent: true, opacity: 0.4 });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.position.y = 0;
    sunPathGroup.add(domeMesh);

    // Horizon ring
    const hRing = new THREE.Mesh(
        new THREE.TorusGeometry(DOME_R, 0.04, 8, 64),
        new THREE.MeshBasicMaterial({ color: 0xFFB300 })
    );
    hRing.rotation.x = Math.PI / 2;
    sunPathGroup.add(hRing);

    // Cardinal labels (N/S/E/W as spheres)
    [['N', 0, 0, -DOME_R], ['S', 0, 0, DOME_R], ['E', DOME_R, 0, 0], ['W', -DOME_R, 0, 0]].forEach(([, x, y, z]) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0x7dd3fc }));
        m.position.set(x, y, z);
        sunPathGroup.add(m);
    });

    // Sun sphere
    const sunGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFE066 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunPathGroup.add(sunMesh);

    // Sun glow (point light)
    sunLight = new THREE.PointLight(0xFFE066, 2, 20);
    sunPathGroup.add(sunLight);

    // Path line
    let pathLine = null;

    function rebuild() {
        const lat  = parseFloat(document.getElementById('sp-lat').value);
        const lon  = parseFloat(document.getElementById('sp-lon').value);
        const doy  = parseInt(document.getElementById('sp-doy').value);
        const hour = parseFloat(document.getElementById('sp-hour').value);
        const res  = parseInt(document.getElementById('sp-res').value);
        const showDome = document.getElementById('sp-dome').checked;
        const yearPaths = document.getElementById('sp-yearpath').checked;

        document.getElementById('sp-lat-val').textContent  = lat.toFixed(1) + '°';
        document.getElementById('sp-lon-val').textContent  = lon.toFixed(1) + '°';
        document.getElementById('sp-doy-val').textContent  = doy;
        document.getElementById('sp-hour-val').textContent = Math.floor(hour).toString().padStart(2,'0') + ':' + String(Math.round((hour % 1) * 60)).padStart(2,'0');
        document.getElementById('sp-res-val').textContent  = res;

        domeMesh.visible = showDome;

        // Sun position
        const pos = solarPosition(lat, lon, doy, hour);
        const altDeg = (pos.altitude * 180 / Math.PI).toFixed(1);
        const azDeg  = (pos.azimuth  * 180 / Math.PI).toFixed(1);
        document.getElementById('sp-info').textContent =
            pos.altitude > 0
                ? `Alt: ${altDeg}°  Az: ${azDeg}°  (above horizon)`
                : `Alt: ${altDeg}°  (below horizon)`;

        const sunPos = sunXYZ(pos.altitude, pos.azimuth, DOME_R * 0.92);
        sunMesh.position.copy(sunPos);
        sunLight.position.copy(sunPos);
        sunMesh.visible = pos.altitude > 0;
        sunLight.visible = pos.altitude > 0;

        // Day path
        if (pathLine) { sunPathGroup.remove(pathLine); pathLine.geometry.dispose(); }
        const pts = [];
        for (let h = 0; h <= res; h++) {
            const t = h / res * 24;
            const p = solarPosition(lat, lon, doy, t);
            if (p.altitude > 0) pts.push(sunXYZ(p.altitude, p.azimuth, DOME_R * 0.9));
        }
        if (pts.length > 1) {
            pathLine = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({ color: 0xFFB300, linewidth: 2 })
            );
            sunPathGroup.add(pathLine);
        }

        // Optional: solstice/equinox year paths
        sunPathGroup.children.filter(c => c.userData.yearPath).forEach(c => sunPathGroup.remove(c));
        if (yearPaths) {
            [1, 80, 172, 264, 355].forEach(d => {
                const ypts = [];
                for (let h = 0; h <= res; h++) {
                    const t = h / res * 24;
                    const p = solarPosition(lat, lon, d, t);
                    if (p.altitude > 0) ypts.push(sunXYZ(p.altitude, p.azimuth, DOME_R * 0.88));
                }
                if (ypts.length > 1) {
                    const yl = new THREE.Line(
                        new THREE.BufferGeometry().setFromPoints(ypts),
                        new THREE.LineBasicMaterial({ color: 0x556677, linewidth: 1 })
                    );
                    yl.userData.yearPath = true;
                    sunPathGroup.add(yl);
                }
            });
        }
    }

    container.querySelectorAll('input').forEach(el => el.addEventListener('input', rebuild));
    rebuild();

    return {
        cleanup() {
            // remove scene objects
            while (sunPathGroup.children.length) {
                const c = sunPathGroup.children[0];
                sunPathGroup.remove(c);
                c.geometry?.dispose();
                c.material?.dispose();
            }
            if (sunLight) { sunLight = null; }
        }
    };
}

// ── Native: Supershapes (Gielis superformula) ──────────────────────────────
const superGroup = new THREE.Group();
scene.add(superGroup);

function gielis(phi, m, a, b, n1, n2, n3) {
    const t1 = Math.abs(Math.cos(m * phi / 4) / a);
    const t2 = Math.abs(Math.sin(m * phi / 4) / b);
    const r = Math.pow(Math.pow(t1, n2) + Math.pow(t2, n3), -1 / n1);
    return isFinite(r) ? r : 0;
}

function buildSuperMesh(m1, a1, b1, n11, n21, n31, m2, a2, b2, n12, n22, n32, segs) {
    const positions = [];
    const indices = [];

    const uCount = segs * 2;
    const vCount = segs;

    for (let vi = 0; vi <= vCount; vi++) {
        const theta = -Math.PI / 2 + Math.PI * vi / vCount;
        const r2 = gielis(theta, m2, a2, b2, n12, n22, n32);
        for (let ui = 0; ui <= uCount; ui++) {
            const phi = -Math.PI + 2 * Math.PI * ui / uCount;
            const r1 = gielis(phi, m1, a1, b1, n11, n21, n31);
            const x = r1 * Math.cos(phi) * r2 * Math.cos(theta);
            const y = r1 * Math.sin(phi) * r2 * Math.cos(theta);
            const z = r2 * Math.sin(theta);
            positions.push(x, z, y); // swap y/z for Three.js
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
        <div class="np-row"><label>Scale <span class="np-val" id="ss-scale-val">2.0</span></label>
            <input type="range" id="ss-scale" min="0.5" max="5" step="0.1" value="2"></div>
        <div class="np-row"><label>Resolution <span class="np-val" id="ss-res-val">48</span></label>
            <input type="range" id="ss-res" min="16" max="96" step="8" value="48"></div>
        <div class="np-row np-check-row">
            <label><input type="checkbox" id="ss-wire" checked> Wireframe</label>
            <label><input type="checkbox" id="ss-solid" checked> Solid</label>
        </div>
        <div class="np-section-presets">Presets</div>
        <div class="np-presets"></div>
    `;

    const presets = [
        { name: 'Cube',      p: [4,1,1,2,2,2,  4,1,1,2,2,2] },
        { name: 'Sphere',    p: [0,1,1,2,2,2,  0,1,1,2,2,2] },
        { name: 'Star',      p: [5,1,1,0.3,1.7,1.7,  5,1,1,0.3,1.7,1.7] },
        { name: 'Cactus',    p: [13,1,1,0.4,0.5,8,  13,1,1,0.4,0.5,8] },
        { name: 'Torus-ish', p: [4,1,1,4,1,1,  2,1,1,8,1,1] },
        { name: 'Flower',    p: [6,1,1,0.5,1,1,  6,1,1,0.5,1,1] },
    ];

    const presetsEl = container.querySelector('.np-presets');
    presets.forEach(pr => {
        const btn = document.createElement('button');
        btn.className = 'np-preset-btn';
        btn.textContent = pr.name;
        btn.addEventListener('click', () => {
            const ids = ['ss-m1','ss-n1','ss-n2','ss-n3','ss-m2','ss-n1b','ss-n2b','ss-n3b'];
            // map preset array: [m1,n11,n21,n31, m2,n12,n22,n32] — note a,b=1 always
            const vals = [pr.p[0],pr.p[2],pr.p[3],pr.p[4], pr.p[6],pr.p[8],pr.p[9],pr.p[10]];
            ids.forEach((id, i) => {
                const el = document.getElementById(id);
                el.value = vals[i];
            });
            rebuild();
        });
        presetsEl.appendChild(btn);
    });

    let solidMesh = null, wireMesh = null;

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
        const res   = parseInt(document.getElementById('ss-res').value);
        const showWire  = document.getElementById('ss-wire').checked;
        const showSolid = document.getElementById('ss-solid').checked;

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

        const geo = buildSuperMesh(m1,1,1,n11,n21,n31, m2,1,1,n12,n22,n32, res);

        if (solidMesh) { superGroup.remove(solidMesh); solidMesh.geometry.dispose(); }
        if (wireMesh)  { superGroup.remove(wireMesh);  wireMesh.geometry.dispose(); }

        if (showSolid) {
            solidMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
                color: 0x26C6DA, metalness: 0.3, roughness: 0.5,
                transparent: true, opacity: 0.85,
            }));
            solidMesh.scale.setScalar(scale);
            solidMesh.position.set(-3, scale + 0.5, -2);
            superGroup.add(solidMesh);
        }
        if (showWire) {
            wireMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
                color: 0x7dd3fc, wireframe: true,
            }));
            wireMesh.scale.setScalar(scale);
            wireMesh.position.set(-3, scale + 0.5, -2);
            superGroup.add(wireMesh);
        }
    }

    container.querySelectorAll('input').forEach(el => el.addEventListener('input', rebuild));
    rebuild();

    // Slow rotation
    let rot = true;
    const rotBtn = document.createElement('button');
    rotBtn.className = 'np-preset-btn';
    rotBtn.textContent = 'Toggle Rotate';
    rotBtn.addEventListener('click', () => { rot = !rot; });
    presetsEl.appendChild(rotBtn);

    return {
        rotate() {
            if (rot && (solidMesh || wireMesh)) {
                if (solidMesh) solidMesh.rotation.y += 0.006;
                if (wireMesh)  wireMesh.rotation.y  += 0.006;
            }
        },
        cleanup() {
            if (solidMesh) { superGroup.remove(solidMesh); solidMesh.geometry.dispose(); solidMesh = null; }
            if (wireMesh)  { superGroup.remove(wireMesh);  wireMesh.geometry.dispose();  wireMesh  = null; }
        }
    };
}

// ── Animate ────────────────────────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    activeNative?.rotate?.();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
