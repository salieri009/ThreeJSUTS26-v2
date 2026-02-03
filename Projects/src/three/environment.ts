// @ts-nocheck
import * as THREE from 'three';
import { scene } from './sceneManager';
import { loader } from './gridModels';

let skyMaterial, skyDome, sunLight;

export const weather = {
    cloudy: false,
    night: false,
}

export function setBackground() {
    skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide
    });
    const skyGeometry = new THREE.SphereGeometry(200, 8, 6);
    skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    skyDome.name = "Sky";
    scene.add(skyDome);
}

export function updateSky() {
    if (!skyMaterial) return;
    
    let newColor: number;
    let lightIntensity: number;
    
    if (weather.night) {
        newColor = 0x0a0a2e; // Dark blue night sky
        lightIntensity = 0.2;
    } else if (weather.cloudy) {
        newColor = 0x778899; // Cloudy gray
        lightIntensity = 0.5;
    } else {
        newColor = 0x87CEEB; // Sunny blue
        lightIntensity = 1;
    }
    
    skyMaterial.color.setHex(newColor);
    if (sunLight) {
        sunLight.intensity = lightIntensity;
    }
}

let cloud
let clouds = [] ;
let clock = new THREE.Clock();
export function loadClouds() {
    loader.load("models/cloud/scene.gltf", (gltf) => {
        for (let i = 0; i < 11; i++) {
            cloud = gltf.scene.clone();
            let randomScale = Math.random() * 0.15 + 0.1;
            
            cloud.scale.set(randomScale, randomScale, randomScale);
            cloud.position.set(Math.random() * 100 - 55, Math.random() * 10 + 10, Math.random() * 50 - 30);
            cloud.userData.speed = Math.random() * 1 + 1.4;

            clouds.push(cloud);
            scene.add(cloud);
        }
    });
}

export function cloudMove() {
    requestAnimationFrame(cloudMove);
    const delta = clock.getDelta();
    for (cloud of clouds) {
        cloud.position.x += delta * cloud.userData.speed;
        if (cloud.position.x > 60) {
            cloud.position.x = -100;
        }
    }
}

export function sun() {
    sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.castShadow = true;

    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.top = 50;

    sunLight.position.set(50, 30, 0); 
    scene.add(sunLight);

    //const helper = new THREE.CameraHelper(sunLight.shadow.camera);
    //scene.add(helper);
}
/*
    cloud.traverse((node) => {
        if (node.isMesh && node.material && node.material.color) {
            node.material = node.material.clone();
            let cloudColour = weather.cloudy ? 0xAAAAAA : 0xffffff;
            node.material.color.set(cloudColour); 
        }
    });
*/
