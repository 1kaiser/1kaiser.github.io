// Ensure the script runs after the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {

    // --- Basic Three.js setup ---
    const container = document.getElementById('container');

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 10); // Adjust camera position

    // Renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 500;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);


    // --- Three-Geo setup ---
    async function setupThreeGeo() {
        try {
            const tgeo = new ThreeGeo({
                // IMPORTANT: User must replace this with a valid Mapbox token
                tokenMapbox: 'YOUR_MAPBOX_TOKEN_HERE',
            });

            // Example coordinates (Eiger, Switzerland) and parameters from the docs
            const terrain = await tgeo.getTerrainRgb(
                [46.5763, 7.9904], // [lat, lng]
                5.0,               // radius of bounding circle (km)
                12);               // zoom resolution

            scene.add(terrain);

            // Adjust camera to look at the terrain
            // This is a rough adjustment and might need tweaking
            const center = new THREE.Vector3();
            new THREE.Box3().setFromObject(terrain).getCenter(center);
            camera.lookAt(center);

            console.log('Three-Geo terrain loaded successfully.');

        } catch (error) {
            console.error('An error occurred with Three-Geo:', error);
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'absolute';
            errorDiv.style.top = '10px';
            errorDiv.style.left = '10px';
            errorDiv.style.padding = '10px';
            errorDiv.style.background = 'rgba(255, 0, 0, 0.7)';
            errorDiv.style.color = 'white';
            errorDiv.style.fontFamily = 'monospace';
            errorDiv.innerHTML = `
                <h2>Error loading Geo-Viewer</h2>
                <p>Could not load map terrain. This is likely because a valid Mapbox API token has not been set in <strong>geo-viewer.js</strong>.</p>
                <p>Error details: ${error.message}</p>
            `;
            container.appendChild(errorDiv);
        }
    }

    setupThreeGeo();


    // --- Animation loop ---
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    // --- Handle window resizing ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

});
