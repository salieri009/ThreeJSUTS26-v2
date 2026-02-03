import * as THREE from 'three';
import { scene, camera } from './sceneManager.js';
import { grasses, clips, grid , setGrid, modelData, setModel, cow, hay, soil, rock, tree, fence, barn, pSoil, tSoil, wSoil, wheat, sheep, path, chicken, pig, pine, pebble, windmill} from './gridModels.js';
import { weather,  updateSky } from './environment.js';

let level = 1;
let isRemoving = false;

export function addBlock() {
    if (grid) scene.remove(grid);

    let size = level * 10;
    const newGrid = new THREE.GridHelper(size, size / 2);
    newGrid.position.set(-size / 2 + 5, 6, -size / 2 + 5);
    scene.add(newGrid);
    setGrid(newGrid);

    for (let i = 0; i < level; i++) {
        for (let j = 0; j < level; j++) {
            let dirt = new THREE.Mesh(
                new THREE.BoxGeometry(10, 8, 10),
                new THREE.MeshPhongMaterial({ color: 0x964B00 })
            );
            dirt.position.set(-i * 10, 0, -j * 10);
            scene.add(dirt);
            dirt.name = "Grid";
            let newGrass = new THREE.Mesh(
                new THREE.BoxGeometry(10, 2, 10),
                new THREE.MeshLambertMaterial({ color: 0x3E5C3A })
            );
            newGrass.position.set(-i * 10, 5, -j * 10);
            newGrass.receiveShadow = true;
            scene.add(newGrass);
            grasses.push(newGrass);
            newGrass.name = "Grass";

            let highlight = new THREE.Mesh(
                new THREE.PlaneGeometry(1, 1),
                new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
            );
            highlight.rotation.x = -Math.PI / 2;
            highlight.position.set(-i * 10, 5.05, -j * 10);
            scene.add(highlight);
        }
    }
    level++;
}

export function deleteModel() {
    isRemoving = true;
    window.addEventListener("mousedown", (event) => {
        if (!camera || !scene) return;

        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            let root = intersects[0].object;
            while (root.parent && root.parent.type !== "Scene")  root = root.parent;
            if (isRemoving) {
                if(root.name !== "Sky" && root.name !== "Highlight" && root.name !== "Grid" && root.name !== "Dirt" && root.name !== "Grass") {
                    scene.remove(root);
                    isRemoving = false;
                }
            }
        }
    });
}

document.querySelector('[data-category="terrain expansion"]').addEventListener('click', () => { if(level < 8) addBlock(); });
document.querySelector('[data-category="remove"]').addEventListener('click', () => { deleteModel(); });

//props
document.querySelector('[data-category="props"] .draggable-item:nth-child(1)').addEventListener('click', () => { 
    const nhay = hay.clone();
    nhay.position.set(0, 6, 0);
    scene.add(nhay);
    setModel(nhay, { width: modelData["Hay"].width, height: modelData["Hay"].height}, true);
});

document.querySelector('[data-category="props"] .draggable-item:nth-child(2)').addEventListener('click', () => { 
    const carrotF = soil.clone(); 
    carrotF.position.set(0, 6, 0); 
    carrotF.rotation.set(-Math.PI / 2, 0, 0); 
    scene.add(carrotF);
    setModel(carrotF, { width: modelData["Carrot"].width, height: modelData["Carrot"].height }, true);
});

document.querySelector('[data-category="props"] .draggable-item:nth-child(3)').addEventListener('click', () => { 
    const potatoF = pSoil.clone();
    potatoF.position.set(0, 6, 0);
    potatoF.rotation.set(-Math.PI/2, 0, 0);
    scene.add(potatoF);
    setModel(potatoF, { width: modelData["Potato"].width, height: modelData["Potato"].height }, true);
});

document.querySelector('[data-category="props"] .draggable-item:nth-child(4)').addEventListener('click', () => { 
    const tomatoF = tSoil.clone();
    tomatoF.position.set(0, 6, 0);
    tomatoF.rotation.set(-Math.PI/2, 0, 0);
    scene.add(tomatoF);
    setModel(tomatoF,  { width: modelData["Tomato"].width, height: modelData["Tomato"].height}, true);
});

document.querySelector('[data-category="props"] .draggable-item:nth-child(5)').addEventListener('click', () => { 
    const wheatF = wSoil.clone();
    wheatF.position.set(0, 6, 0);
    wheatF.rotation.set(-Math.PI/2, 0, 0);
    scene.add(wheatF);
    setModel(wheatF, { width: modelData["Wheat"].width, height: modelData["Wheat"].height}, true);
});

document.querySelector('[data-category="props"] .draggable-item:nth-child(6)').addEventListener('click', () => {
    const nPath = path.clone();
    scene.add(nPath);
    setModel(nPath, { width: modelData["Path"].width, height: modelData["Path"].height }, true);
});
//nature
document.querySelector('[data-category="nature"] .draggable-item:nth-child(1)').addEventListener('click', () => { 
    const nRock  = rock.clone(); // 수정필요요
    nRock.position.set(0, 6, 0);
    scene.add(nRock);
    setModel(nRock, { width: modelData["Rock"].width, height: modelData["Rock"].height }, true);
});

document.querySelector('[data-category="nature"] .draggable-item:nth-child(2)').addEventListener('click', () => {
    const sRock = pebble.clone();
    sRock.position.set(0, 6, 0);
    scene.add(sRock);
    setModel(sRock, { width: modelData["SRock"].width, height: modelData["SRock"].height }, true);
});

document.querySelector('[data-category="nature"] .draggable-item:nth-child(3)').addEventListener('click', () => {
    const nTree = tree.clone();
    nTree.position.set(0, 6, 0);
    nTree.rotation.set(0, 0, 0);
    scene.add(nTree);
    setModel(nTree, { width: modelData["Tree"].width, height: modelData["Tree"].height}, true);
});

document.querySelector('[data-category="nature"] .draggable-item:nth-child(4)').addEventListener('click', () => {
    const nPine = pine.clone();
    nPine.position.set(0, 6, 0);
    scene.add(nPine);
    setModel(nPine, { width: modelData["Pine"].width, height: modelData["Pine"].height}, true);
});

//animals
document.querySelector('[data-category="animals"] .draggable-item:nth-child(1)').addEventListener('click', () => {
    const newCow = cow.clone(true);
    newCow.position.set(0, 6, 0);
    newCow.scale.set(1.25, 1.25, 1.25);
    scene.add(newCow);

    setModel(cow, { width: modelData["Cow"].width, height: modelData["Cow"].height }, true);
});

document.querySelector('[data-category="animals"] .draggable-item:nth-child(2)').addEventListener('click', () => {
    const nPig = pig.clone();
    nPig.rotation.set(0, Math.PI/2, 0);
    scene.add(nPig);
    setModel(nPig, { width: modelData["Pig"].width, height: modelData["Pig"].height }, true);
});

document.querySelector('[data-category="animals"] .draggable-item:nth-child(3)').addEventListener('click', () => {
    const nSheep = sheep.clone();
    nSheep.position.set(0, 5, -3);
    nSheep.rotation.set(0, -Math.PI, 0);
    scene.add(nSheep);
    setModel(nSheep, { width: modelData["Sheep"].width, height: modelData["Sheep"].height}, true);
});

document.querySelector('[data-category="animals"] .draggable-item:nth-child(4)').addEventListener('click', () => {
    const nChicken = chicken.clone();
    nChicken.position.set(0, 6, 0);
    scene.add(nChicken);
    setModel(nChicken, { width: modelData["Chicken"].width, height: modelData["Chicken"].height}, true);
});

//buildings
document.querySelector('[data-category="buildings"] .draggable-item:nth-child(1)').addEventListener('click', () => {
    const nFence = fence.clone();
    nFence.position.set(0, 6, 0);
    nFence.rotation.set(0, Math.PI / 2, 0);
    scene.add(nFence);
    setModel(nFence, { width: modelData["Fence"].width, height: modelData["Fence"].height}, true);
});

document.querySelector('[data-category="buildings"] .draggable-item:nth-child(2)').addEventListener('click', () => {
    const nBarn = barn.clone();
    nBarn.position.set(0, 6, 0);
    scene.add(nBarn);
    setModel(nBarn, { width: modelData["Barn"].width, height: modelData["Barn"].height}, true);
});

document.querySelector('[data-category="cloudy"]').addEventListener('click', () => {
     weather.cloudy = true; 
     updateSky();
});

document.querySelector('[data-category="sunny"]').addEventListener('click', () => {
     weather.cloudy = false; 
     updateSky();
});