import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export let camera, controls, renderer, scene

export function setScene() {
    scene = new THREE.Scene();

    const container = document.getElementById('scene-container');
    const width = container?.clientWidth || window.innerWidth;
    const height = container?.clientHeight || window.innerHeight;
    const aspect = width / height;
    let ortho = 20;
    camera = new THREE.OrthographicCamera(-ortho * aspect, ortho * aspect, ortho, -ortho, 0.1, 1000);

    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableRotate = false; 
    controls.enableZoom = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // renderer config suggestions (commented for compatibility)
    // renderer.outputColorSpace = THREE.SRGBColorSpace;
    // renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1.0;
    // renderer.physicallyCorrectLights = true;

    return { scene, camera, renderer, controls };
}

export function controlCamera() {
    controls.update();
    renderer.render(scene, camera);
}


