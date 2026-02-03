// @ts-nocheck
import * as THREE from 'three';
import { scene, camera } from './sceneManager';
import { grasses, grid, setGrid, modelData, setModel, cow, hay, soil, rock, tree, fence, barn, pSoil, tSoil, wSoil, sheep, path, chicken, pig, pine, pebble, windmill } from './gridModels';
import { weather, updateSky } from './environment';

let level = 1;
let isRemoving = false;
let existingBlocks: Set<string> = new Set(); // Track created block positions

// Function to expand terrain
export function addBlock() {
    if (grid) scene.remove(grid);

    // Calculate new grid size
    let size = level * 10;
    const newGrid = new THREE.GridHelper(size, size / 2);
    newGrid.position.set(-size / 2 + 5, 6, -size / 2 + 5);
    scene.add(newGrid);
    setGrid(newGrid);

    // Only create blocks that don't exist yet
    for (let i = 0; i < level; i++) {
        for (let j = 0; j < level; j++) {
            const blockKey = `${i},${j}`;
            
            // Skip if this block already exists
            if (existingBlocks.has(blockKey)) continue;
            
            existingBlocks.add(blockKey);
            
            let dirt = new THREE.Mesh(
                new THREE.BoxGeometry(10, 8, 10),
                new THREE.MeshPhongMaterial({ color: 0x964B00 })
            );
            dirt.position.set(-i * 10, 0, -j * 10);
            scene.add(dirt);
            dirt.name = "Dirt";
            
            let newGrass = new THREE.Mesh(
                new THREE.BoxGeometry(10, 2, 10),
                new THREE.MeshLambertMaterial({ color: 0x3E5C3A })
            );
            newGrass.position.set(-i * 10, 5, -j * 10);
            newGrass.receiveShadow = true;
            scene.add(newGrass);
            grasses.push(newGrass);
            newGrass.name = "Grass";
        }
    }
    level++;
}

// Function to enabled delete mode
export function deleteModel() {
    isRemoving = true;
    window.addEventListener("mousedown", onRemoveMouseDown);
}

function onRemoveMouseDown(event: MouseEvent) {
    if (!camera || !scene || !isRemoving) return;

    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        let root: any = intersects[0].object;
        while (root.parent && root.parent.type !== "Scene")  root = root.parent;
        // Check names to avoid deleting environment
        if(root.name !== "Sky" && root.name !== "Highlight" && root.name !== "Grid" && root.name !== "Dirt" && root.name !== "Grass") {
            scene.remove(root);
            isRemoving = false;
            window.removeEventListener("mousedown", onRemoveMouseDown);
        }
    }
}

export function spawnObject(type: string) {
    let model: any;
    let data: any;
    
    switch (type) {
        case 'Hay': model = hay.clone(); data = modelData["Hay"]; break;
        case 'Carrot': model = soil.clone(); model.rotation.set(-Math.PI / 2, 0, 0); data = modelData["Carrot"]; break;
        case 'Potato': model = pSoil.clone(); model.rotation.set(-Math.PI/2, 0, 0); data = modelData["Potato"]; break;
        case 'Tomato': model = tSoil.clone(); model.rotation.set(-Math.PI/2, 0, 0); data = modelData["Tomato"]; break;
        case 'Wheat': model = wSoil.clone(); model.rotation.set(-Math.PI/2, 0, 0); data = modelData["Wheat"]; break;
        case 'Path': model = path.clone(); data = modelData["Path"]; break;
        case 'Rock': model = rock.clone(); data = modelData["Rock"]; break;
        case 'SRock': model = pebble.clone(); data = modelData["SRock"]; break;
        case 'Tree': model = tree.clone(); model.rotation.set(0, 0, 0); data = modelData["Tree"]; break;
        case 'Pine': model = pine.clone(); data = modelData["Pine"]; break;
        case 'Cow': model = cow.clone(true); model.scale.set(1.25, 1.25, 1.25); data = modelData["Cow"]; break;
        case 'Pig': model = pig.clone(); model.rotation.set(0, Math.PI/2, 0); data = modelData["Pig"]; break;
        case 'Sheep': model = sheep.clone(); model.position.set(0, 5, -3); model.rotation.set(0, -Math.PI, 0); data = modelData["Sheep"]; break;
        case 'Chicken': model = chicken.clone(); data = modelData["Chicken"]; break;
        case 'Fence': model = fence.clone(); model.rotation.set(0, Math.PI / 2, 0); data = modelData["Fence"]; break;
        case 'Barn': model = barn.clone(); data = modelData["Barn"]; break;
        case 'Windmill':
            const nWindmill = windmill.clone();
            // Animation logic suppressed for now or needs fix
            model = nWindmill;
            data = modelData["Windmill"];
            break;
    }

    if (model && data) {
         model.name = type;
         model.position.set(0, 6, 0);
         scene.add(model);
         setModel(model, { width: data.width, height: data.height}, true);
    } else {
         console.warn(`[spawnObject] Model '${type}' is not loaded yet or does not exist.`);
    }
}

export function setWeather(type: string) {
    if (type === 'sunny') {
        weather.cloudy = false;
        weather.night = false;
    } else if (type === 'cloudy') {
        weather.cloudy = true;
        weather.night = false;
    } else if (type === 'rainy') {
        weather.cloudy = true;
        weather.night = false;
        // TODO: implement rain visual effect
    } else if (type === 'night') {
        weather.cloudy = false;
        weather.night = true;
    }
    updateSky();
}
