import { setScene, controlCamera} from "./scripts/sceneManager.js";
import { animate, loadScene } from "./scripts/gridModels.js";
import {  cloudMove, loadClouds, setBackground, sun } from "./scripts/environment.js";
import { init } from "./scripts/UIManager.js";
import { addBlock, deleteModel } from "./scripts/buttonInteract.js";


setScene();
controlCamera();
loadScene();
animate();

setBackground();
sun();
loadClouds();
cloudMove();

addBlock();
deleteModel();

init();