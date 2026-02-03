// @ts-nocheck
import { setScene, controlCamera } from "./sceneManager";
import { animate, loadScene } from "./gridModels";
import { cloudMove, loadClouds, setBackground, sun } from "./environment";
import { addBlock, deleteModel } from "./buttonInteract";

export function initWorld() {
    setScene();
    controlCamera();
    loadScene();
    animate();

    setBackground();
    sun();
    loadClouds();
    cloudMove();

    // Initial setup
    // addBlock(); // This was called in main.js
    // deleteModel(); // This setups the raycaster for deletion
}
