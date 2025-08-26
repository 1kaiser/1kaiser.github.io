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

// FFmpeg.wasm video processing logic
window.addEventListener('load', () => {
    const { FFmpeg } = window.FFmpeg;
    const { fetchFile, toBlobURL } = window.FFmpegUtil;

    const ffmpeg = new FFmpeg();

    const uploader = document.getElementById('uploader');
    const video = document.getElementById('output-video');
    const message = document.getElementById('message');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const durationInput = document.getElementById('duration');
    const applyClipButton = document.getElementById('apply-clip-button');
    let inputFile = null;

    const formatTime = (timeInSeconds) => {
        const hh = Math.floor(timeInSeconds / 3600).toString().padStart(2, '0');
        const mm = Math.floor((timeInSeconds % 3600) / 60).toString().padStart(2, '0');
        const ss = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    };

    const load = async () => {
        if (!ffmpeg.loaded) {
            message.textContent = 'Loading ffmpeg-core.js (multi-threaded)...';
            const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd'
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
            });
            message.textContent = 'FFmpeg (multi-threaded) loaded. Please upload a video file.';
            ffmpeg.on('log', ({ message: msg }) => {
                const el = document.getElementById('message');
                el.innerHTML = msg;
                console.log(msg);
            });
            ffmpeg.on('progress', ({ progress, time }) => {
                const el = document.getElementById('message');
                if (progress < 1) {
                    el.innerHTML = `${Math.round(progress * 100)}% (transcoded time: ${time / 1000000}s)`;
                }
            });
        }
    };

    const getDuration = (file) => {
        return new Promise((resolve) => {
            const tempVideo = document.createElement('video');
            tempVideo.preload = 'metadata';
            tempVideo.onloadedmetadata = () => {
                window.URL.revokeObjectURL(tempVideo.src);
                resolve(tempVideo.duration);
            };
            tempVideo.src = window.URL.createObjectURL(file);
        });
    };

    const processVideo = async (args, outputFilename) => {
        if (!inputFile) {
            alert('Please upload a video file first.');
            return;
        }
        await load();
        message.textContent = 'Processing...';
        const inputFilename = inputFile.name;
        await ffmpeg.writeFile(inputFilename, await fetchFile(inputFile));

        const command = ['-i', inputFilename, ...args, outputFilename];
        await ffmpeg.exec(command);

        const data = await ffmpeg.readFile(outputFilename);
        video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
        message.textContent = 'Processing complete.';
        await ffmpeg.deleteFile(inputFilename);
        await ffmpeg.deleteFile(outputFilename);
    };

    uploader.addEventListener('change', async (e) => {
        inputFile = e.target.files[0];
        if (inputFile) {
            message.textContent = `File "${inputFile.name}" selected.`;
            const duration = await getDuration(inputFile);
            startTimeInput.value = '00:00:00';
            endTimeInput.value = formatTime(duration);
            durationInput.value = ''; // Clear duration field
        }
    });

    applyClipButton.addEventListener('click', async () => {
        const startTime = startTimeInput.value.trim();
        const endTime = endTimeInput.value.trim();
        const duration = durationInput.value.trim();

        if (!inputFile) {
            alert('Please upload a video file first.');
            return;
        }

        if (!startTime) {
            alert('A start time is required for clipping.');
            return;
        }

        if (!endTime && !duration) {
            alert('Please specify either an end time or a duration.');
            return;
        }

        const args = ['-ss', startTime];
        // New logic: Prioritize duration over end time
        if (duration) {
            args.push('-t', duration);
        } else if (endTime) {
            args.push('-to', endTime);
        }

        const outputFilename = 'clipped.mp4';
        await processVideo(args, outputFilename);
    });


    // Lazy load ffmpeg on first interaction
    uploader.addEventListener('focus', load, { once: true });
    applyClipButton.addEventListener('focus', load, { once: true });
});
