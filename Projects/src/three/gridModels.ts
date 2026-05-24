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
import { on, type SeasonType } from './core/eventBus';
import { getTerrainHeight } from './utils/noise';

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
        // Animals — 1×1 each (2×2 world units)
        "Cow":     { width: 1, height: 1 },
        "Pig":     { width: 1, height: 1 },
        "Sheep":   { width: 1, height: 1 },
        "Chicken": { width: 1, height: 1 },
        // Buildings
        "Barn":     { width: 3, height: 2 },  // was 5×3 — now 6×4 world units
        "Fence":    { width: 2, height: 1 },
        "Windmill": { width: 2, height: 2 },
        // Decorations
        "SRock": { width: 1, height: 1 },
        "Rock":  { width: 2, height: 2 },
        "Hay":   { width: 1, height: 1 },
        "Path":  { width: 1, height: 1 },
        // Crops — 2×1 (was 3×1)
        "Carrot": { width: 2, height: 1 },
        "Potato": { width: 2, height: 1 },
        "Tomato": { width: 2, height: 1 },
        "Wheat":  { width: 2, height: 1 },
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

    // ── Collision grid ──────────────────────────────────────────────
    // Maps "cx,cz" grid-cell key → the object occupying that cell.
    private occupiedCells = new Map<string, THREE.Object3D>();
    private _canPlace = true;

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

    constructor() {
        on('season:change', (season: SeasonType) => this.updateGrassColors(season));
    }

    private updateGrassColors(season: SeasonType): void {
        const grassColors: Record<SeasonType, number> = {
            spring: CONFIG.COLORS.GRASS_SPRING,
            summer: CONFIG.COLORS.GRASS_SUMMER,
            autumn: CONFIG.COLORS.GRASS_AUTUMN,
            winter: CONFIG.COLORS.GRASS_WINTER,
        };
        const color = grassColors[season] ?? CONFIG.COLORS.GRASS;
        this.grasses.forEach((grass) => {
            const mat = grass.material as THREE.MeshPhongMaterial;
            if (mat?.color) { mat.color.setHex(color); mat.needsUpdate = true; }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 초기화 함수
    // ═══════════════════════════════════════════════════════════════

    /**
     * 씬 로드 - Procedural Generation으로 기본 지형 생성 및 모델 로드
     */
    loadScene(): void {
        const scene = sceneManager.scene;

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
                        h * 2,
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
            this.tree.scale.set(0.005, 0.005, 0.005);
            this.tree.position.set(-3, CONFIG.HEIGHTS.GRASS_TOP, 0);
            this.tree.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) (node as THREE.Mesh).castShadow = true;
            });
            this.tree.name = 'Tree';
            this.createBoundingBox(this.tree, 400, 2000, 400);
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
        const soilGeo = new THREE.BoxGeometry(6, 3, 0.4);
        const soilMat = new THREE.MeshLambertMaterial({ color: 0x5C3D1E });

        const makeSoil = (name: string): THREE.Mesh => {
            const mesh = new THREE.Mesh(soilGeo, soilMat.clone());
            mesh.name = name;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.rotation.set(-Math.PI / 2, 0, 0);
            mesh.position.set(0, CONFIG.HEIGHTS.GRASS_TOP, 0);
            return mesh;
        };

        // Carrot — orange cones pointing up
        this.soil = makeSoil('Carrot');
        const carrotMat = new THREE.MeshLambertMaterial({ color: 0xFF7020 });
        const leafMat   = new THREE.MeshLambertMaterial({ color: 0x2E8B2E });
        for (const x of [-2, 0, 2]) {
            const body = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.1, 7), carrotMat);
            body.rotation.set(Math.PI, 0, 0);
            body.position.set(x, 0.55, 0);
            const top = new THREE.Mesh(new THREE.SphereGeometry(0.12, 5, 4), leafMat);
            top.position.set(x, 0.1, 0);
            this.soil.add(body, top);
        }

        // Potato — beige lumps with sprouts
        this.pSoil = makeSoil('Potato');
        const potatoMat = new THREE.MeshLambertMaterial({ color: 0xC8A060 });
        const sproutMat = new THREE.MeshLambertMaterial({ color: 0x5AAF5A });
        for (const x of [-2, 0, 2]) {
            const lump = new THREE.Mesh(new THREE.SphereGeometry(0.28, 7, 5), potatoMat);
            lump.scale.set(1, 0.75, 1);
            lump.position.set(x, 0.22, 0);
            const sprout = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 5), sproutMat);
            sprout.position.set(x, 0.6, 0);
            this.pSoil.add(lump, sprout);
        }

        // Tomato — red spheres on green stakes
        this.tSoil = makeSoil('Tomato');
        const tomatoMat = new THREE.MeshLambertMaterial({ color: 0xDD2020 });
        const stakeMat  = new THREE.MeshLambertMaterial({ color: 0x3A6B2F });
        for (const x of [-2, 0, 2]) {
            const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.3, 5), stakeMat);
            stake.position.set(x, 0.65, 0);
            const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), tomatoMat);
            fruit.position.set(x, 1.35, 0);
            this.tSoil.add(stake, fruit);
        }

        // Wheat — golden stalks with grain heads
        this.wSoil = makeSoil('Wheat');
        const stalkMat = new THREE.MeshLambertMaterial({ color: 0xC8963C });
        const headMat  = new THREE.MeshLambertMaterial({ color: 0xE8B840 });
        for (const x of [-2.2, -1.1, 0, 1.1, 2.2]) {
            const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 1.5, 5), stalkMat);
            stalk.position.set(x, 0.75, 0);
            const head = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.55, 5), headMat);
            head.position.set(x, 1.68, 0);
            this.wSoil.add(stalk, head);
        }
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

            // Collision check — colour highlight red when blocked
            const fp = this.getFootprint(gridX, gridZ, this.selectedSize.width, this.selectedSize.height);
            const blocked = fp.some(k => {
                const o = this.occupiedCells.get(k);
                return o !== undefined && o !== this.selectedObject;
            });
            this._canPlace = !blocked;
            this.highlight.material.color.set(blocked ? 0xFF3333 : CONFIG.COLORS.HIGHLIGHT_PLACING);
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

                // Block placement if any cell in the footprint is already occupied.
                const fp = this.getFootprint(gridX, gridZ, this.selectedSize.width, this.selectedSize.height);
                const blocked = fp.some(k => {
                    const o = this.occupiedCells.get(k);
                    return o !== undefined && o !== this.selectedObject;
                });
                if (blocked) return;

                // Use raycaster hit Y as the actual surface — works on both flat and raised tiles.
                const surfaceY = point.y;
                let y: number;
                if (this.selectedObject.name === "Barn") {
                    y = surfaceY + (CONFIG.HEIGHTS.BARN  - CONFIG.HEIGHTS.GRASS_TOP);  // +2.5
                } else if (this.selectedObject.name === "Fence") {
                    y = surfaceY + (CONFIG.HEIGHTS.FENCE - CONFIG.HEIGHTS.GRASS_TOP);  // +1.0
                } else if (this.selectedObject.name === "Path") {
                    y = surfaceY + (CONFIG.HEIGHTS.PATH  - CONFIG.HEIGHTS.GRASS_TOP);  // -0.9
                } else {
                    y = surfaceY;
                }

                const offsetX = this.selectedSize.width % 2 === 0 ? -0.5 : 0;
                const placed = this.selectedObject;
                placed.position.set(gridX + offsetX, y, gridZ);
                placed.visible = true;

                // Register all cells as occupied by this object.
                fp.forEach(k => this.occupiedCells.set(k, placed));

                this.highlight.material.color.set(CONFIG.COLORS.HIGHLIGHT);
                this.isPlacing = false;
                this.selectedObject = null;
                this._canPlace = true;
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

    // ── Collision helpers ────────────────────────────────────────────

    /**
     * Returns the list of cell keys covered by an object placed at (gridX, gridZ)
     * with the given footprint (in grid-cell units).
     * Cell key format: "cx,cz" where cx = worldX / GRID_SIZE (snapped).
     */
    private getFootprint(gridX: number, gridZ: number, width: number, height: number): string[] {
        const gs = CONFIG.GRID_SIZE;
        const cx = Math.round(gridX / gs);
        const cz = Math.round(gridZ / gs);
        const hw = Math.floor(width / 2);
        const hh = Math.floor(height / 2);
        const cells: string[] = [];
        for (let dx = -hw; dx < width - hw; dx++) {
            for (let dz = -hh; dz < height - hh; dz++) {
                cells.push(`${cx + dx},${cz + dz}`);
            }
        }
        return cells;
    }

    /** Called by InteractionManager when an object is deleted. */
    freeObjectCells(obj: THREE.Object3D): void {
        for (const [key, o] of this.occupiedCells) {
            if (o === obj) this.occupiedCells.delete(key);
        }
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
