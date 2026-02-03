// @ts-nocheck
/**
 * =============================================
 * ModelManager Class - 오브젝트 배치 및 상호작용
 * =============================================
 * Three.js GLTF 모델 로드 및 그리드 기반 배치 시스템
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sceneManager } from './core/sceneManager';
import { CONFIG } from './core/CONFIG';

export class ModelManager {
    // ═══════════════════════════════════════════════════════════════
    // 재사용 객체 풀 (GC Pressure 제거)
    // ═══════════════════════════════════════════════════════════════
    private _mouse = new THREE.Vector2();
    private _raycaster = new THREE.Raycaster();

    // ═══════════════════════════════════════════════════════════════
    // 모델 데이터 정의 (width = x축, height = z축)
    // ═══════════════════════════════════════════════════════════════
    readonly modelData: Record<string, { width: number; height: number }> = {
        // Animals
        "Cow": { width: 2, height: 1 },
        "Pig": { width: 2, height: 1 },
        "Sheep": { width: 2, height: 1 },
        "Chicken": { width: 1, height: 1 },
        // Buildings
        "Barn": { width: 5, height: 3 },
        "Fence": { width: 2, height: 1 },
        "Windmill": { width: 2, height: 2 },
        // Decorations
        "SRock": { width: 1, height: 1 },
        "Rock": { width: 2, height: 2 },
        "Hay": { width: 1, height: 1 },
        "Path": { width: 1, height: 1 },
        // Crops
        "Carrot": { width: 3, height: 1 },
        "Potato": { width: 3, height: 1 },
        "Tomato": { width: 3, height: 1 },
        "Wheat": { width: 3, height: 1 },
        // Nature
        "Tree": { width: 1, height: 1 },
        "Pine": { width: 1, height: 1 },
    };

    // ═══════════════════════════════════════════════════════════════
    // 모듈 상태 변수
    // ═══════════════════════════════════════════════════════════════
    clips: THREE.AnimationClip[] = [];
    highlight!: THREE.Mesh;
    grasses: THREE.Mesh[] = [];
    grid!: THREE.GridHelper;
    selectedObject: THREE.Object3D | null = null;
    isPlacing = false;
    selectedSize = { width: 1, height: 1 };

    // 모델 참조
    tree: THREE.Object3D | null = null;
    cow: THREE.Object3D | null = null;
    grass!: THREE.Mesh;
    sheep: THREE.Object3D | null = null;
    barn: THREE.Object3D | null = null;
    fence: THREE.Object3D | null = null;
    chicken: THREE.Object3D | null = null;
    pig: THREE.Object3D | null = null;
    hay: THREE.Object3D | null = null;
    rock: THREE.Object3D | null = null;
    pebble: THREE.Object3D | null = null;
    pine: THREE.Object3D | null = null;
    windmill: THREE.Object3D | null = null;
    path!: THREE.Mesh;
    soil: THREE.Mesh | null = null;
    pSoil: THREE.Mesh | null = null;
    tSoil: THREE.Mesh | null = null;
    wSoil: THREE.Mesh | null = null;
    loader!: GLTFLoader;

    // 내부 상태
    private placingMesh!: THREE.MeshBasicMaterial;
    private textureLoad = new THREE.TextureLoader();
    private mixers: THREE.AnimationMixer[] = [];
    private clock = new THREE.Clock();

    // ═══════════════════════════════════════════════════════════════
    // 초기화 함수
    // ═══════════════════════════════════════════════════════════════

    /**
     * 씬 로드 - Procedural Generation으로 기본 지형 생성 및 모델 로드
     */
    loadScene(): void {
        const scene = sceneManager.scene;
        const { getTerrainHeight } = require('./utils/noise');

        // 초기 3x3 그리드 생성
        const initialSize = 3;
        for (let i = 0; i < initialSize; i++) {
            for (let j = 0; j < initialSize; j++) {
                // Procedural height 계산
                const heightOffset = getTerrainHeight(i, j, 0.2, 5);
                const baseY = heightOffset * 2;
                
                // Dirt 블록들 (높이에 따라 여러 개 쌓기)
                for (let h = 0; h <= heightOffset; h++) {
                    const dirt = new THREE.Mesh(
                        new THREE.BoxGeometry(CONFIG.BLOCK_SIZE, CONFIG.HEIGHTS.DIRT_BOX_HEIGHT, CONFIG.BLOCK_SIZE),
                        new THREE.MeshPhongMaterial({ color: CONFIG.COLORS.DIRT })
                    );
                    dirt.position.set(
                        -i * CONFIG.BLOCK_SIZE,
                        h * 2 - 4,
                        -j * CONFIG.BLOCK_SIZE
                    );
                    dirt.name = "Dirt";
                    dirt.castShadow = true;
                    dirt.receiveShadow = true;
                    scene.add(dirt);
                }

                // 잔디 레이어 (맨 위)
                const grass = new THREE.Mesh(
                    new THREE.BoxGeometry(CONFIG.BLOCK_SIZE, CONFIG.HEIGHTS.GRASS_BOX_HEIGHT, CONFIG.BLOCK_SIZE),
                    new THREE.MeshPhongMaterial({ color: CONFIG.COLORS.GRASS })
                );
                grass.receiveShadow = true;
                grass.castShadow = true;
                grass.position.set(
                    -i * CONFIG.BLOCK_SIZE,
                    baseY + CONFIG.HEIGHTS.GRASS_TOP - 1,
                    -j * CONFIG.BLOCK_SIZE
                );
                grass.name = "Grass";
                scene.add(grass);
                this.grasses.push(grass);
            }
        }

        // 그리드 헬퍼 생성
        const gridSize = initialSize * CONFIG.BLOCK_SIZE;
        this.grid = new THREE.GridHelper(gridSize, gridSize / CONFIG.GRID_SIZE);
        this.grid.position.set(-gridSize / 2 + 5, CONFIG.HEIGHTS.GRASS_TOP + 4, -gridSize / 2 + 5);
        this.grid.name = "Grid";
        scene.add(this.grid);

        // 모델 로드
        this.loadModels();
        this.setupGridInteractions();
        
        console.log('[ModelManager] Procedural terrain generated');
    }

    /**
     * GLTF 모델 로드
     */
    private loadModels(): void {
        this.loader = new GLTFLoader();
        const scene = sceneManager.scene;

        // Tree
        this.loader.load("models/tree/scene.gltf", (gltf) => {
            this.tree = gltf.scene;
            this.tree.scale.set(0.01, 0.01, 0.01);
            this.tree.position.set(-3, CONFIG.HEIGHTS.GRASS_TOP, 0);
            this.tree.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) (node as THREE.Mesh).castShadow = true;
            });
            this.tree.name = 'Tree';
            this.createBoundingBox(this.tree, 200, 2000, 200);
        });

        // Pine
        const pineTexture = this.textureLoad.load("models/tree/textures/Material.001_baseColor.png");
        this.loader.load("models/tree/scene.gltf", (gltf) => {
            this.pine = gltf.scene;
            this.pine.scale.set(0.4, 0.4, 0.4);
            this.pine.position.set(0, CONFIG.HEIGHTS.GRASS_TOP, 0);
            this.pine.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                    (node as THREE.Mesh).castShadow = true;
                    if (node.name === "Object_2") {
                        (node as THREE.Mesh).material.map = pineTexture;
                    }
                }
            });
            this.pine.name = 'Pine';
            this.createBoundingBox(this.pine, 5, 30, 5);
        });

        // Cow
        this.loader.load("models/cow/scene.gltf", (gltf) => {
            this.cow = gltf.scene;
            this.cow.scale.set(1.25, 1.25, 1.25);
            this.cow.position.set(0.5, CONFIG.HEIGHTS.GRASS_TOP, 0);
            this.cow.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) (node as THREE.Mesh).castShadow = true;
            });
            this.cow.name = 'Cow';
            this.createBoundingBox(this.cow, 2, 3, 1.3);
        });

        // Sheep
        const sheepTexture = this.textureLoad.load("models/cow/textures/material_baseColor.png");
        this.loader.load("models/cow/scene.gltf", (gltf) => {
            this.sheep = gltf.scene;
            this.sheep.scale.set(2.7, 2.5, 2.5);
            this.sheep.position.set(0, CONFIG.HEIGHTS.GRASS_TOP, 0);
            this.sheep.rotation.set(0, -Math.PI, 0);
            this.sheep.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                    (node as THREE.Mesh).castShadow = true;
                    (node as THREE.Mesh).material.map = sheepTexture;
                }
            });
            this.sheep.name = "Sheep";
            this.createBoundingBox(this.sheep, 1, 1, 1);
        });

        // Pig
        this.loader.load("models/pig/scene.gltf", (gltf) => {
            this.pig = gltf.scene;
            this.pig.scale.set(0.7, 0.8, 1.2);
            this.pig.position.set(0, CONFIG.HEIGHTS.GRASS_TOP, 0);
            this.pig.rotation.set(0, Math.PI / 2, 0);
            this.pig.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) (node as THREE.Mesh).castShadow = true;
            });
            this.pig.name = "Pig";
            this.createBoundingBox(this.pig, 3, 3, 3);
        });

        // Fence
        const fenceTexture = this.textureLoad.load('models/pebbles/textures/Wood_diffuse.png');
        this.loader.load("models/pebbles/scene.gltf", (gltf) => {
            this.fence = gltf.scene;
            this.fence.scale.set(0.8, 0.9, 0.6);
            this.fence.position.set(0, CONFIG.HEIGHTS.FENCE, 0);
            this.fence.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                    (node as THREE.Mesh).material.map = fenceTexture;
                    (node as THREE.Mesh).castShadow = true;
                }
            });
            this.fence.name = 'Fence';
            this.createBoundingBox(this.fence, 5.1, 4, 2.9);
        });

        // Chicken
        this.loader.load("models/chicken/scene.gltf", (gltf) => {
            this.chicken = gltf.scene;
            this.chicken.scale.set(0.4, 0.4, 0.4);
            this.chicken.position.set(0, CONFIG.HEIGHTS.GRASS_TOP, 0);
            this.chicken.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) (node as THREE.Mesh).castShadow = true;
            });
            this.chicken.name = "Chicken";
            this.createBoundingBox(this.chicken, 3, 5, 3);
        });

        // Barn
        this.loader.load("models/barn/scene.gltf", (gltf) => {
            this.barn = gltf.scene;
            this.barn.scale.set(0.45, 0.45, 0.5);
            this.barn.position.set(0.5, CONFIG.HEIGHTS.BARN, 0);
            this.barn.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) (node as THREE.Mesh).castShadow = true;
            });
            this.barn.name = 'Barn';
            this.createBoundingBox(this.barn, 20, 12, 12);
        });

        // Hay
        const hayTexture = this.textureLoad.load('models/grass/textures/lambert1_baseColor.jpeg');
        const hayTexture2 = this.textureLoad.load('models/grass/textures/lambert2_baseColor.png');
        this.loader.load("models/grass/scene.gltf", (gltf) => {
            this.hay = gltf.scene;
            this.hay.scale.set(0.2, 0.2, 0.15);
            this.hay.position.set(0, CONFIG.HEIGHTS.GRASS_TOP, 0);
            this.hay.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                    (node as THREE.Mesh).castShadow = true;
                    if (node.name === "pCube1_lambert1_0") {
                        (node as THREE.Mesh).material.map = hayTexture;
                    } else if (node.name === "pPlane46_lambert2_0" || node.name === "pPlane47_lambert2_0") {
                        (node as THREE.Mesh).material.map = hayTexture2;
                    }
                }
            });
            this.hay.name = 'Hay';
            this.createBoundingBox(this.hay, 20, 20, 20);
        });

        // Rock
        const rockTexture = this.textureLoad.load('models/pebbles/textures/Material.010_baseColor.png');
        this.loader.load("models/pebbles/scene.gltf", (gltf) => {
            this.rock = gltf.scene;
            this.rock.scale.set(1, 1, 1);
            this.rock.position.set(0, CONFIG.HEIGHTS.GRASS_TOP, 0);
            this.rock.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                    (node as THREE.Mesh).material.map = rockTexture;
                    (node as THREE.Mesh).castShadow = true;
                }
            });
            this.rock.name = 'Rock';
            this.createBoundingBox(this.rock, 5, 5, 5);
        });

        // Pebble
        this.loader.load("models/pebbles/scene.gltf", (gltf) => {
            this.pebble = gltf.scene;
            this.pebble.scale.set(1, 1, 1);
            this.pebble.position.set(0, CONFIG.HEIGHTS.GRASS_TOP, 0);
            this.pebble.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) (node as THREE.Mesh).castShadow = true;
            });
            this.pebble.name = "SRock";
            this.createBoundingBox(this.pebble, 1, 2, 1);
        });

        // Path
        const pathGeo = new THREE.BoxGeometry(CONFIG.GRID_SIZE, CONFIG.GRID_SIZE, CONFIG.GRID_SIZE);
        this.path = new THREE.Mesh(pathGeo, new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.PATH }));
        this.path.rotation.set(-Math.PI / 2, 0, 0);
        this.path.name = "Path";

        // Windmill
        this.loader.load("models/windmill/scene.gltf", (gltf) => {
            this.windmill = gltf.scene;
            this.windmill.scale.set(1.5, 2, 1.5);
            this.windmill.position.set(0, CONFIG.HEIGHTS.GRASS_TOP, 0);
            this.windmill.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) (node as THREE.Mesh).castShadow = true;
            });
            this.windmill.rotation.set(0, -Math.PI, 0);
            this.windmill.name = "Windmill";
            this.createBoundingBox(this.windmill, 1, 1, 1);
            this.clips = gltf.animations;
        });

        // Crop models
        this.loadCropModels();

        // Random Grass decoration
        this.loader.load("models/grass/scene.gltf", (gltf) => {
            const grassRandom = gltf.scene;
            grassRandom.scale.set(0.045, 0.045, 0.05);
            grassRandom.position.set(0.5, CONFIG.HEIGHTS.BARN, 0);
            scene.add(grassRandom);
        });
    }

    /**
     * 작물 모델 로드
     */
    private loadCropModels(): void {
        // Carrot
        this.loader.load("models/grass/scene.gltf", (gltf) => {
            let tempSoil: THREE.Mesh | null = null;
            let tempCarrot: THREE.Mesh | null = null;

            gltf.scene.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                    (node as THREE.Mesh).castShadow = true;
                    if (node.name === "Soil003_Dirt_0") tempSoil = (node as THREE.Mesh).clone();
                    else if (node.name === "Carrot_F3_Carrot_0") tempCarrot = (node as THREE.Mesh).clone();
                }
            });

            if (tempSoil && tempCarrot) {
                this.soil = tempSoil;
                this.setupCropSoil(this.soil, tempCarrot, "Carrot");
            }
        });

        // Potato
        this.loader.load("models/grass/scene.gltf", (gltf) => {
            let tempSoil: THREE.Mesh | null = null;
            let tempPotato: THREE.Mesh | null = null;

            gltf.scene.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                    (node as THREE.Mesh).castShadow = true;
                    if (node.name === "Soil003_Dirt_0") tempSoil = (node as THREE.Mesh).clone();
                    else if (node.name === "Potatoe_F3_Potatoe_0") tempPotato = (node as THREE.Mesh).clone();
                }
            });

            if (tempSoil && tempPotato) {
                this.pSoil = tempSoil;
                this.setupCropSoil(this.pSoil, tempPotato, "Potato");
            }
        });

        // Tomato
        this.loader.load("models/grass/scene.gltf", (gltf) => {
            let tempSoil: THREE.Mesh | null = null;
            let tempTomato: THREE.Mesh | null = null;

            gltf.scene.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                    (node as THREE.Mesh).castShadow = true;
                    if (node.name === "Soil003_Dirt_0") tempSoil = (node as THREE.Mesh).clone();
                    else if (node.name === "Tomatoe_F3_Tomatoe_0") tempTomato = (node as THREE.Mesh).clone();
                }
            });

            if (tempSoil && tempTomato) {
                this.tSoil = tempSoil;
                this.setupCropSoil(this.tSoil, tempTomato, "Tomato");
            }
        });

        // Wheat
        this.loader.load("models/grass/scene.gltf", (gltf) => {
            let tempSoil: THREE.Mesh | null = null;
            let wheat1: THREE.Mesh | null = null;
            let wheat2: THREE.Mesh | null = null;

            gltf.scene.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                    (node as THREE.Mesh).castShadow = true;
                    if (node.name === "Soil003_Dirt_0") tempSoil = (node as THREE.Mesh).clone();
                    else if (node.name === "Wheat_F3_Wheat_0") wheat1 = (node as THREE.Mesh).clone();
                    else if (node.name === "Wheat_F3_Wheat_0_1") wheat2 = (node as THREE.Mesh).clone();
                }
            });

            if (tempSoil && wheat1 && wheat2) {
                this.wSoil = tempSoil;
                this.setupWheatSoil(this.wSoil, wheat1, wheat2);
            }
        });
    }

    private setupCropSoil(soilMesh: THREE.Mesh, cropMesh: THREE.Mesh, name: string): void {
        soilMesh.scale.set(1, 1, 1);
        soilMesh.rotation.set(-Math.PI / 2, 0, 0);
        soilMesh.position.set(0, CONFIG.HEIGHTS.GRASS_TOP, 0);

        cropMesh.scale.set(1, 1, 1);
        cropMesh.position.set(0, 0, 0);
        soilMesh.add(cropMesh);

        const leftCrop = cropMesh.clone();
        leftCrop.position.set(-2, 0, 0);
        soilMesh.add(leftCrop);

        const rightCrop = cropMesh.clone();
        rightCrop.position.set(2, 0, 0);
        soilMesh.add(rightCrop);

        this.createBoundingBox(soilMesh, 4, 3, 2);
        soilMesh.name = name;
    }

    private setupWheatSoil(soilMesh: THREE.Mesh, wheat1: THREE.Mesh, wheat2: THREE.Mesh): void {
        soilMesh.scale.set(1, 1, 1);
        soilMesh.rotation.set(-Math.PI / 2, 0, 0);
        soilMesh.position.set(0, CONFIG.HEIGHTS.GRASS_TOP, 0);

        wheat1.scale.set(1, 1, 1);
        wheat1.position.set(0, 0, 0);
        wheat2.scale.set(1, 1, 1);
        wheat2.position.set(0, 0, 0);

        soilMesh.add(wheat1);
        soilMesh.add(wheat2);

        const left1 = wheat1.clone();
        left1.position.set(-2, 0, 0);
        const left2 = wheat2.clone();
        left2.position.set(-2, 0, 0);
        const right1 = wheat1.clone();
        right1.position.set(2, 0, 0);
        const right2 = wheat2.clone();
        right2.position.set(2, 0, 0);

        soilMesh.add(left1, left2, right1, right2);
        this.createBoundingBox(soilMesh, 4, 3, 2);
        soilMesh.name = "Wheat";
    }

    // ═══════════════════════════════════════════════════════════════
    // 그리드 상호작용
    // ═══════════════════════════════════════════════════════════════

    private setupGridInteractions(): void {
        this.placingMesh = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
        this.highlight = new THREE.Mesh(
            new THREE.PlaneGeometry(CONFIG.GRID_SIZE, CONFIG.GRID_SIZE),
            this.placingMesh
        );
        this.highlight.rotation.x = -Math.PI / 2;
        this.highlight.position.set(0, CONFIG.HEIGHTS.HIGHLIGHT, 0);
        this.highlight.name = "Highlight";
        sceneManager.scene.add(this.highlight);

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mousedown', this.handleMouseDown);
    }

    private handleKeyDown = (event: KeyboardEvent): void => {
        if ((event.key === 'r' || event.key === 'R') && this.selectedObject) {
            if (this.selectedObject.name === "Carrot") {
                this.selectedObject.rotation.z += Math.PI / 2;
            } else {
                this.selectedObject.rotation.y += Math.PI / 2;
            }
            this.highlight.rotation.z += Math.PI / 2;

            const temp = this.selectedSize.width;
            this.selectedSize.width = this.selectedSize.height;
            this.selectedSize.height = temp;

            const gridSize = CONFIG.GRID_SIZE;
            this.selectedObject.position.x = Math.round(this.selectedObject.position.x / gridSize) * gridSize;
            this.selectedObject.position.z = Math.round(this.selectedObject.position.z / gridSize) * gridSize;
            this.highlight.position.x = this.selectedObject.position.x;
            this.highlight.position.z = this.selectedObject.position.z;
        }
    };

    private handleMouseMove = (event: MouseEvent): void => {
        const camera = sceneManager.camera;
        if (!camera || !this.grass || !this.highlight) return;

        this._mouse.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        this._raycaster.setFromCamera(this._mouse, camera);

        const intersects = this._raycaster.intersectObjects(this.grasses);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            const gridSize = CONFIG.GRID_SIZE;
            const gridX = Math.round(point.x / gridSize) * gridSize;
            const gridZ = Math.round(point.z / gridSize) * gridSize;

            const offsetX = this.selectedSize.width % 2 === 0 ? -1 : 0;
            const offsetZ = this.selectedSize.height % 2 === 0 ? -1 : 0;
            this.highlight.position.set(gridX + offsetX, CONFIG.HEIGHTS.HIGHLIGHT, gridZ + offsetZ);
        }
    };

    private handleMouseDown = (event: MouseEvent): void => {
        const camera = sceneManager.camera;
        const scene = sceneManager.scene;
        if (!camera || !scene || !this.grasses || !this.highlight) return;

        this._mouse.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        this._raycaster.setFromCamera(this._mouse, camera);

        if (!this.isPlacing) {
            const intersects = this._raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                let root = intersects[0].object;
                while (root.parent && root.parent.type !== "Scene") {
                    root = root.parent;
                }

                if (this.modelData[root.name]) {
                    this.selectedObject = root;
                    this.selectedSize = {
                        width: this.modelData[root.name].width,
                        height: this.modelData[root.name].height
                    };
                    this.isPlacing = true;

                    this.highlight.material.color.set(CONFIG.COLORS.HIGHLIGHT_PLACING);
                    this.highlight.geometry.dispose();
                    this.highlight.geometry = new THREE.PlaneGeometry(
                        this.selectedSize.width * CONFIG.GRID_SIZE,
                        this.selectedSize.height * CONFIG.GRID_SIZE
                    );
                    this.highlight.name = "Highlight";
                    this.highlight.rotation.z = -this.selectedObject.rotation.y;

                    const rotY = this.selectedObject.rotation.y % (2 * Math.PI);
                    if (Math.abs(rotY - Math.PI / 2) < 0.01 || Math.abs(rotY - 3 * Math.PI / 2) < 0.01) {
                        const temp = this.selectedSize.width;
                        this.selectedSize.width = this.selectedSize.height;
                        this.selectedSize.height = temp;
                        this.highlight.geometry.dispose();
                        this.highlight.geometry = new THREE.PlaneGeometry(
                            this.selectedSize.width * CONFIG.GRID_SIZE,
                            this.selectedSize.height * CONFIG.GRID_SIZE
                        );
                    }
                }
            }
        } else {
            const intersects = this._raycaster.intersectObjects(this.grasses);
            if (intersects.length > 0 && this.selectedObject) {
                const point = intersects[0].point;
                const gridSize = CONFIG.GRID_SIZE;
                const gridX = Math.round(point.x / gridSize) * gridSize;
                const gridZ = Math.round(point.z / gridSize) * gridSize;

                let y = CONFIG.HEIGHTS.GRASS_TOP;
                if (this.selectedObject.name === "Fence" || this.selectedObject.name === "Barn") {
                    y = CONFIG.HEIGHTS.FENCE;
                } else if (this.selectedObject.name === "Path") {
                    y = CONFIG.HEIGHTS.PATH;
                }

                const offsetX = this.selectedSize.width === 2 ? -0.5 : 0;
                this.selectedObject.position.set(gridX + offsetX, y, gridZ);
                this.selectedObject.visible = true;

                this.highlight.material.color.set(CONFIG.COLORS.HIGHLIGHT);
                this.isPlacing = false;
                this.selectedObject = null;
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // 유틸리티 함수
    // ═══════════════════════════════════════════════════════════════

    private createBoundingBox(model: THREE.Object3D, width: number, height: number, depth: number): THREE.Mesh {
        const boxGeometry = new THREE.BoxGeometry(width, height, depth);
        const boxMaterial = new THREE.MeshBasicMaterial({
            wireframe: true,
            transparent: true,
            visible: false
        });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);

        const yOffset = model === this.soil ? -6 : -5;
        box.position.set(model.position.x, model.position.y + yOffset, model.position.z);
        box.rotation.copy(model.rotation);
        model.add(box);

        return box;
    }

    setGrid(newGrid: THREE.GridHelper): void {
        this.grid = newGrid;
        this.grid.name = "Grid";
    }

    setModel(object: THREE.Object3D, size: { width: number; height: number }, placing = true): void {
        this.selectedObject = object;
        this.selectedSize = size;
        this.isPlacing = placing;
        object.visible = false;

        this.highlight.geometry.dispose();
        this.highlight.geometry = new THREE.PlaneGeometry(this.selectedSize.width * 2, this.selectedSize.height * 2);
    }

    // ═══════════════════════════════════════════════════════════════
    // Animation
    // ═══════════════════════════════════════════════════════════════

    updateAnimations(delta: number): void {
        this.mixers.forEach(m => m.update(delta));
    }

    animate(): void {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();
        this.mixers.forEach(m => m.update(delta));
        sceneManager.controls?.update();
        sceneManager.renderer?.render(sceneManager.scene, sceneManager.camera);
    }

    createWindmill(): THREE.Object3D | null {
        if (!this.windmill || !this.clips) return null;

        const nWindmill = this.windmill.clone();
        nWindmill.position.set(0, CONFIG.HEIGHTS.GRASS_TOP, 0);
        sceneManager.scene.add(nWindmill);

        const nMixer = new THREE.AnimationMixer(nWindmill);
        this.mixers.push(nMixer);

        const clip = THREE.AnimationClip.findByName(this.clips, 'Action');
        if (clip) {
            const action = nMixer.clipAction(clip);
            action.play();
        }

        this.setModel(nWindmill, { width: this.modelData["Windmill"].width, height: this.modelData["Windmill"].height }, true);
        return nWindmill;
    }

    // ═══════════════════════════════════════════════════════════════
    // Cleanup & Dispose
    // ═══════════════════════════════════════════════════════════════

    dispose(): void {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mousedown', this.handleMouseDown);

        this.mixers.forEach(m => m.stopAllAction());
        this.mixers.length = 0;

        sceneManager.scene?.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
                obj.geometry?.dispose();
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => {
                        mat.map?.dispose();
                        mat.dispose();
                    });
                } else if (obj.material) {
                    obj.material.map?.dispose();
                    obj.material.dispose();
                }
            }
        });

        this.grasses.length = 0;
        console.log('[ModelManager] Disposed');
    }
}

// ═══════════════════════════════════════════════════════════════
// Singleton Instance
// ═══════════════════════════════════════════════════════════════
export const modelManager = new ModelManager();

// ═══════════════════════════════════════════════════════════════
// Legacy Exports (호환성 유지)
// ═══════════════════════════════════════════════════════════════
export const modelData = modelManager.modelData;
export const grasses = modelManager.grasses;
export const clips = modelManager.clips;
export const loader = modelManager.loader;
export const highlight = modelManager.highlight;
export const grid = modelManager.grid;
export const selectedObject = modelManager.selectedObject;
export const isPlacing = modelManager.isPlacing;
export const selectedSize = modelManager.selectedSize;

// Model exports
export const tree = modelManager.tree;
export const cow = modelManager.cow;
export const grass = modelManager.grass;
export const sheep = modelManager.sheep;
export const barn = modelManager.barn;
export const fence = modelManager.fence;
export const chicken = modelManager.chicken;
export const pig = modelManager.pig;
export const hay = modelManager.hay;
export const rock = modelManager.rock;
export const pebble = modelManager.pebble;
export const pine = modelManager.pine;
export const windmill = modelManager.windmill;
export const path = modelManager.path;
export const soil = modelManager.soil;
export const pSoil = modelManager.pSoil;
export const tSoil = modelManager.tSoil;
export const wSoil = modelManager.wSoil;

// Function exports
export const loadScene = () => modelManager.loadScene();
export const setGrid = (g: THREE.GridHelper) => modelManager.setGrid(g);
export const setModel = (obj: THREE.Object3D, size: any, placing?: boolean) => modelManager.setModel(obj, size, placing);
export const animate = () => modelManager.animate();
export const updateAnimations = (delta: number) => modelManager.updateAnimations(delta);
export const createWindmill = () => modelManager.createWindmill();
export const dispose = () => modelManager.dispose();
