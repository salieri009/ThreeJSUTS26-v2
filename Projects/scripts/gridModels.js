import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scene, camera } from './sceneManager.js';

export let clips, highlight, tree, cow, grass, sheep, cloud, barn, fence, chicken, pig, hay, rock, carrot, potato, tomato, wheat, soil, stonePath, pebble, pSoil, tSoil, wSoil, path, pine, loader, windmill;
let placingMesh, mixer = null;
let carrotField;
//======================
export let grasses = [];
//======================
export let grid = new THREE.GridHelper(10, 5);
const gridSize = 2;
export let selectedObject ;
export let isPlacing = false;
export let selectedSize = { width: 1, height: 1 };

const textureLoad = new THREE.TextureLoader();

export const modelData = {  
    //wdith = x , height = z
    "Cow": { width: 2, height: 1},
    "Pig": { width: 2, height: 1}, 
    "Sheep": { width: 2, height: 1}, 
    "Chicken": { width: 1, height: 1},

    "Barn": { width: 5, height: 3},
    "Fence": { width: 2, height: 1},
    "SRock": { width: 1, height: 1}, 
    "Rock": { width: 2, height: 2}, 

    "Hay": { width: 1, height: 1}, 
    "Carrot": { width: 3, height: 1}, 
    "Potato": { width: 3, height: 1},
    "Tomato": { width: 3, height: 1},
    "Wheat": { width: 3, height: 1},

    "Tree": { width: 1, height: 1}, 
    "Pine": { width: 1, height: 1}, 

    "Path": { width: 1, height: 1},
    "Windmill": { width: 2, height: 2},
}

//==========================================
export function loadScene() {
    const dirt = new THREE.Mesh(
        new THREE.BoxGeometry(10, 8, 10),
        new THREE.MeshPhongMaterial({ color: 0x964B00 })
    );
    scene.add(dirt);

    grass = new THREE.Mesh(
        new THREE.BoxGeometry(10, 2, 10),
        new THREE.MeshPhongMaterial({ color: 0x3E5C3A })
    );
    grass.receiveShadow  = true;
    grass.position.set(0, 5, 0);
    scene.add(grass);
    grasses.push(grass);
    
    loadModels();
    setupGridInteractions();
    // Ensure animation loop for mixers starts even if app loop is separate
    // This guarantees animated models (e.g., windmill fallback) update immediately
    animate();
}

function loadModels() { 
    loader = new GLTFLoader();

    // Helper: load with CDN fallback when local asset is missing
    const loadWithFallback = (primaryUrl, fallbackUrl, onLoad) => {
        loader.load(
            primaryUrl,
            (gltf) => onLoad(gltf),
            undefined,
            () => {
                if (fallbackUrl) {
                    loader.load(
                        fallbackUrl,
                        (gltf) => onLoad(gltf),
                        undefined,
                        (err) => console.error('GLTF fallback failed:', fallbackUrl, err)
                    );
                } else {
                    console.warn('GLTF load failed and no fallback provided:', primaryUrl);
                }
            }
        );
    };

    loader.load("models/tree/scene.gltf", (gltf) => {
        tree = gltf.scene;
        tree.scale.set(0.01, 0.01, 0.01);
        tree.position.set(-3, 6, 0);
        tree.traverse((node) => {
            if (node.isMesh) node.castShadow = true;
        });
        tree.name = 'Tree';
        createBox(tree, 200, 2000, 200);
    });

    const pineTexture = textureLoad.load("models/pine/textures/Material.001_baseColor.png");
    loader.load("models/pine/scene.gltf", (gltf) => {
        pine = gltf.scene;
        pine.scale.set(0.4, 0.4, 0.4);
        pine.position.set(0, 6, 0);
        pine.traverse((node) => {
            if(node.isMesh) {
                console.log(node.name)
                node.castShadow = true;
                if(node.name === "Object_2"){
                    node.material.map = pineTexture;
                } 
            } 
        });
        pine.name = 'Pine';
        createBox(pine, 5, 30, 5);
    });

    loader.load("models/cow/scene.gltf", (gltf) => {
        cow = gltf.scene;
        cow.scale.set(1.25, 1.25, 1.25);
        cow.position.set(0.5, 6, 0);
        cow.traverse((node) => {
            if (node.isMesh) node.castShadow = true;
        });
        cow.name = 'Cow';
        createBox(cow, 2, 3, 1.3);
    });

    const sheepTexture = textureLoad.load("models/sheep/textures/material_baseColor.png"); //양모델에 문제있음음
    loader.load("models/sheep/scene.gltf", (gltf) => {
        sheep = gltf.scene;
        sheep.scale.set(2.7, 2.5, 2.5);
        sheep.position.set(0, 6, 0);
        sheep.rotation.set(0, -Math.PI, 0);
        sheep.traverse((node) => {
            if(node.isMesh) {
                node.castShadow = true;
                node.material.map = sheepTexture;
            } 
        });
        sheep.name = "Sheep";
        //scene.add(sheep);
        createBox(sheep, 1, 1, 1);
    });

    loader.load("models/pig/scene.gltf", (gltf) => {
        pig = gltf.scene;
        pig.scale.set(0.7, 0.8, 1.2);
        pig.position.set(0, 6, 0);
        pig.rotation.set(0, Math.PI/2, 0);
        pig.traverse((node) => {
            if(node.isMesh) {
                node.castShadow = true;
            } 
        });
        pig.name = "Pig";
        //scene.add(pig);
        createBox(pig, 3, 3, 3);
    });

    const fenceTexture = textureLoad.load('models/fence/textures/Wood_diffuse.png') 
    loader.load("models/fence/scene.gltf", (gltf) => {
        fence = gltf.scene;
        fence.scale.set(0.8, 0.9, 0.6);
        fence.position.set(0, 7, 0);
        fence.traverse(node => {
            if (node.isMesh) {
                node.material.map = fenceTexture;
                node.castShadow = true;
            }
        });
        fence.name = 'Fence';
        createBox(fence, 5.1, 4, 2.9);
    });

    loader.load("models/chicken/scene.gltf", (gltf) => { 
        chicken = gltf.scene;
        chicken.scale.set(0.4, 0.4, 0.4);
        chicken.position.set(0, 6 , 0);
        chicken.traverse(node => {
            if (node.isMesh) node.castShadow = true;
        });
        chicken.name = "Chicken";
        createBox(chicken, 3, 5, 3); //temp
        //scene.add(chicken);
    });

    loader.load("models/barn/scene.gltf", (gltf) => {
        barn = gltf.scene;
        barn.scale.set(0.45, 0.45, 0.5);
        barn.position.set(0.5, 8.5, 0);
        barn.traverse((node) => {
            if (node.isMesh) node.castShadow = true;
        });
        barn.name = 'Barn';
        createBox(barn, 20, 12, 12);
    });

    const hayTexture = textureLoad.load('models/hay/textures/lambert1_baseColor.jpeg');
    const hayTexture2 = textureLoad.load('models/hay/textures/lambert2_baseColor.png');
    loader.load("models/hay/scene.gltf", (gltf) => {
        hay = gltf.scene;
        hay.scale.set(0.2, 0.2, 0.15);
        hay.position.set(0, 6, 0);
        hay.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                if (node.name === "pCube1_lambert1_0") {
                    node.material.map = hayTexture;
                } else if (node.name === "pPlane46_lambert2_0" ||node.name === "pPlane47_lambert2_0") {
                    node.material.map = hayTexture2;
                }
            }
        });
        //scene.add(hay);
        hay.name = 'Hay';
        createBox(hay, 20, 20, 20);
    });

    const rockTexture = textureLoad.load('models/rock/textures/Material.010_baseColor.png');
    loader.load("models/rock/scene.gltf", (gltf) => {
        rock = gltf.scene;
        rock.scale.set(1, 1, 1);
        rock.position.set(0, 6, 0);
        rock.traverse(node => {
            if(node.isMesh) {
                node.material.map = rockTexture;
                 node.castShadow = true;
            }
        });
        rock.name = 'Rock';
        createBox(rock, 5, 5, 5);
    });

    loader.load("models/pebbles/scene.gltf", (gltf) => {
        pebble = gltf.scene;
        pebble.scale.set(1, 1, 1);
        pebble.position.set(0, 6, 0);
        pebble.traverse(node => {
            if(node.isMesh) {
                node.castShadow = true;
            }
        });
        pebble.name = "SRock"
        createBox(pebble, 1, 2, 1)
        //scene.add(pebble);
    });

// NOTE: Placeholder texture path avoided to prevent 404s; keep null unless available
const stonePathTexture = null;
    loader.load("models/stonePath/scene.gltf", (gltf) => { //수정필요
        stonePath = gltf.scene;
        stonePath.scale.set(2, 2, 2);
        stonePath.position.set(0, 5, 0);
        stonePath.traverse(node => {
            if(node.isMesh && stonePathTexture)  {
                node.material.map = stonePathTexture;
            }
        });
        stonePath.name = 'StonePath';
        createBox(stonePath, 1, 1, 1);
        //scene.add(stonePath);
    });

    loader.load("models/crops/scene.gltf", (gltf) => {
        carrotField = gltf.scene;

        carrotField.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                if (node.name === "Soil003_Dirt_0") {
                    soil = node.clone();
                } else if (node.name === "Carrot_F3_Carrot_0") {
                    carrot = node.clone();
                }
            }
        });

        if (soil && carrot) {
            soil.scale.set(1, 1, 1);
            soil.rotation.set(-Math.PI / 2, 0, 0);
            soil.position.set(0, 6, 0);

            carrot.scale.set(1, 1, 1);
            carrot.position.set(0, 0, 0);
            soil.add(carrot);

            const leftCarrot = carrot.clone();
            leftCarrot.position.set(-2, 0, 0);
            soil.add(leftCarrot);

            const rightCarrot = carrot.clone();
            rightCarrot.position.set(2, 0, 0);
            soil.add(rightCarrot);

            createBox(soil, 4, 3, 2);

            soil.name = "Carrot"; 
        }
    });

    loader.load("models/crops/scene.gltf", (gltf) => {
        let potatoField = gltf.scene;

        potatoField.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                if (node.name === "Soil003_Dirt_0") {
                    pSoil = node.clone();
                } else if (node.name === "Potatoe_F3_Potatoe_0") {
                    potato = node.clone();
                }
            }
        });

        if (pSoil && potato) {
            pSoil.scale.set(1, 1, 1);
            pSoil.rotation.set(-Math.PI / 2, 0, 0);
            pSoil.position.set(0, 6, 0);

            potato.scale.set(1, 1, 1);
            potato.position.set(0, 0, 0);
            pSoil.add(potato);

            const left = potato.clone();
            left.position.set(-2, 0, 0);
            pSoil.add(left);

            const right = potato.clone();
            right.position.set(2, 0, 0);
            pSoil.add(right);

            createBox(pSoil, 4, 3, 2);

            pSoil.name = "Potato"; 
        }
    });

    loader.load("models/crops/scene.gltf", (gltf) => {
        let tomatoField = gltf.scene;

        tomatoField.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                if (node.name === "Soil003_Dirt_0") {
                    tSoil = node.clone();
                } else if (node.name === "Tomatoe_F3_Tomatoe_0") {
                    tomato = node.clone();
                }
            }
        });

        if (tSoil && tomato) {
            tSoil.scale.set(1, 1, 1);
            tSoil.rotation.set(-Math.PI / 2, 0, 0);
            tSoil.position.set(0, 6, 0);

            tomato.scale.set(1, 1, 1);
            tomato.position.set(0, 0, 0);
            tSoil.add(tomato);

            const left = tomato.clone();
            left.position.set(-2, 0, 0);
            tSoil.add(left);

            const right = tomato.clone();
            right.position.set(2, 0, 0);
            tSoil.add(right);

            createBox(tSoil, 4, 3, 2);

            tSoil.name = "Tomato"; 
        }
    });

    loader.load("models/crops/scene.gltf", (gltf) => {
        let wheatField = gltf.scene;

        let wheat1 = null;
        let wheat2 = null;

        wheatField.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;

                if (node.name === "Soil003_Dirt_0") {
                    wSoil = node.clone();
                } else if (node.name === "Wheat_F3_Wheat_0") {
                    wheat1 = node.clone();
                } else if (node.name === "Wheat_F3_Wheat_0_1") {
                    wheat2 = node.clone();
                }
            }
        });

        if (wSoil && wheat1 && wheat2) {
            wSoil.scale.set(1, 1, 1);
            wSoil.rotation.set(-Math.PI / 2, 0, 0);
            wSoil.position.set(0, 6, 0);

            wheat1.scale.set(1, 1, 1);
            wheat1.position.set(0, 0, 0);

            wheat2.scale.set(1, 1, 1);
            wheat2.position.set(0, 0, 0); 

            wSoil.add(wheat1);
            wSoil.add(wheat2);

            const left1 = wheat1.clone();
            left1.position.set(-2, 0, 0);

            const left2 = wheat2.clone();
            left2.position.set(-2, 0, 0);

            const right1 = wheat1.clone();
            right1.position.set(2, 0, 0);

            const right2 = wheat2.clone();
            right2.position.set(2, 0, 0);

            wSoil.add(left1, left2, right1, right2);

            createBox(wSoil, 4, 3, 2);

            wSoil.name = "Wheat";
        }
    });

    let pathGeo = new THREE.BoxGeometry(2,2,2);
    path = new THREE.Mesh(pathGeo, new THREE.MeshBasicMaterial({ color: 0xC4A484 }));
    path.rotation.set(-Math.PI/2, 0, 0);
    path.name = "Path";

    // Windmill: local first, fallback to animated GLB so animation works immediately
    loadWithFallback(
        "models/windmill/scene.gltf",
        "https://threejs.org/examples/models/gltf/Fox.glb",
        (gltf) => {
            windmill = gltf.scene;
            windmill.scale.set(1.5, 2, 1.5);
            windmill.position.set(0, 6, 0);
            windmill.traverse(node => { if (node.isMesh) node.castShadow = true; });
            windmill.rotation.set(0, -Math.PI, 0);
            windmill.name = "Windmill";
            createBox(windmill, 1, 1, 1);

            clips = gltf.animations || [];
        }
    );
}

const clock = new THREE.Clock();
export function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    mixers.forEach(m => m.update(delta)); 
}

function setupGridInteractions() {
    placingMesh =  new THREE.MeshBasicMaterial({ side: THREE.DoubleSide});
    highlight = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), placingMesh);
    highlight.rotation.x = -Math.PI / 2;
    highlight.position.set(0, 6.05, 0);
    scene.add(highlight);

    grid.position.set(0, 6, 0);
    scene.add(grid);
}

window.addEventListener('keydown', (event) => {
    if ((event.key === 'r' || event.key === 'R') && selectedObject) {
        if(selectedObject.name === "Carrot"){
            selectedObject.rotation.z += Math.PI / 2;
        }else{
            selectedObject.rotation.y += Math.PI / 2;
        }
        highlight.rotation.z += Math.PI / 2;

        let temp = selectedSize.width;
        selectedSize.width = selectedSize.height;
        selectedSize.height = temp;

        selectedObject.position.x = Math.round(selectedObject.position.x / gridSize) * gridSize;
        selectedObject.position.z = Math.round(selectedObject.position.z / gridSize) * gridSize;
        highlight.position.x = selectedObject.position.x;
        highlight.position.z = selectedObject.position.z;

        if (selectedSize.width % 2 === 0) {
            selectedObject.position.x = Math.round(selectedObject.position.x / gridSize) * gridSize;
        } else {
            selectedObject.position.x = Math.round(selectedObject.position.x / gridSize) * gridSize ;
        }

        if (selectedSize.height % 2 === 0) {
            selectedObject.position.z = Math.round(selectedObject.position.z / gridSize) * gridSize;
        } else {
            selectedObject.position.z = Math.round(selectedObject.position.z / gridSize) * gridSize;
        }
        highlight.position.x = selectedObject.position.x;
        highlight.position.z = selectedObject.position.z;   
    }
});

window.addEventListener("mousemove", (event) => {
    if (!camera || !grass || !highlight) return;

    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(grasses);
    if (intersects.length > 0) {
        const point = intersects[0].point;
        const gridX = Math.round(point.x / gridSize) * gridSize;
        const gridZ = Math.round(point.z / gridSize) * gridSize;

        highlight.position.set(gridX + (selectedSize.width % 2 == 0 ? -1 : 0), 6.05, gridZ + (selectedSize.height % 2 == 0 ? -1 : 0) );
    }
});

window.addEventListener("mousedown", (event) => {
    if (!camera || !scene || !grasses || !highlight) return;

    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    if (!isPlacing) {
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            let root = intersects[0].object;
            while (root.parent && root.parent.type !== "Scene") root = root.parent;
            if (modelData[root.name]) {
                selectedObject = root;
                selectedSize = { 
                    width: modelData[root.name].width, 
                    height: modelData[root.name].height 
                };
                isPlacing = true;
                highlight.material.color.set(0x66FF00);
                highlight.mesh = placingMesh;
                highlight.geometry.dispose();
                highlight.geometry = new THREE.PlaneGeometry(selectedSize.width * gridSize, selectedSize.height * gridSize);


                highlight.rotation.z = -selectedObject.rotation.y;
                const rotY = selectedObject.rotation.y % (2 * Math.PI);
                if (Math.abs(rotY - Math.PI / 2) < 0.01 || Math.abs(rotY - 3 * Math.PI / 2) < 0.01) {
                    const temp = selectedSize.width;
                    selectedSize.width = selectedSize.height;
                    selectedSize.height = temp;

                    highlight.geometry.dispose();
                    highlight.geometry = new THREE.PlaneGeometry(
                        selectedSize.width * gridSize,
                        selectedSize.height * gridSize
                    );
                }
            }
        }
    } else {
        const intersects = raycaster.intersectObjects(grasses);
        if (intersects.length > 0 && selectedObject) {
            const point = intersects[0].point;
            const gridX = Math.round(point.x / gridSize) * gridSize;
            const gridZ = Math.round(point.z / gridSize) * gridSize;

            let y = 6; 
            if (selectedObject.name === "Fence" || selectedObject.name === "Barn" ) y = 7; 
            
            selectedObject.position.set(gridX - (selectedSize.width === 2 ? 0.5 : 0), y, gridZ);
            selectedObject.visible = true;
            highlight.material.color.set(0xffffff);
            isPlacing = false;
            selectedObject = null;
        }
    }
});

function createBox(model, width, height, depth) {
    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
    const boxMaterial = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, visible: false });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);

    if(model == soil) {
        box.position.set(model.position.x, model.position.y - 6, model.position.z );
    }else{
        box.position.set(model.position.x, model.position.y - 5, model.position.z );
    } 

    box.rotation.copy(model.rotation);
    model.add(box);

    return box;
}

export function setGrid(newGrid) {
    grid = newGrid;
}

export function setModel(object, size, placing = true) {
    selectedObject = object;
    selectedSize = size;
    isPlacing = placing;
    object.visible = false;

    highlight.geometry.dispose();
    highlight.geometry = new THREE.PlaneGeometry(selectedSize.width * 2, selectedSize.height * 2);
}

const mixers = [];
document.querySelector('[data-category="buildings"] .draggable-item:nth-child(3)').addEventListener('click', () => {
    const nWindmill = windmill.clone();
    nWindmill.position.set(0, 6, 0);
    scene.add(nWindmill);

    const nMixer = new THREE.AnimationMixer(nWindmill);
    mixers.push(nMixer); // 배열에 추가

    const clip = THREE.AnimationClip.findByName(clips, 'Action') || (clips && clips[0]);
    if (clip) {
        const action = nMixer.clipAction(clip);
        action.play();
    } else {
        console.warn('No animation clip found on windmill; ensure model has animations.');
    }

    setModel(nWindmill, { width: modelData["Windmill"].width, height: modelData["Windmill"].height }, true);
});