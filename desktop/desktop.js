import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1. Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// 2. Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 5); // Position the camera

// 3. Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// 4a. Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;


// 5. Create the Room
const room = new THREE.Group();

// Floor
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
room.add(floor);

// Walls
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xaaddff });
const wallGeometry = new THREE.PlaneGeometry(20, 8);

const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
backWall.position.set(0, 4, -10);
room.add(backWall);

const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
leftWall.position.set(-10, 4, 0);
leftWall.rotation.y = Math.PI / 2;
room.add(leftWall);

const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
rightWall.position.set(10, 4, 0);
rightWall.rotation.y = -Math.PI / 2;
room.add(rightWall);

scene.add(room);

// 6. Load a Model
if (window.modelsConfig && window.modelsConfig.length > 0) {
    const loader = new GLTFLoader();
    const modelToLoad = window.modelsConfig[0]; // Load the first model

    loader.load(`../${modelToLoad.url}`, (gltf) => {
        const model = gltf.scene;
        model.position.set(0, 0, 0); // Place it at the origin of the room
        model.scale.set(1, 1, 1); // Adjust scale if needed
        scene.add(model);
    }, undefined, (error) => {
        console.error(`An error happened while loading the model: ${error}`);
    });
}


// Animation loop
function animate() {
    requestAnimationFrame(animate);

    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

    renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
