// @ts-nocheck
/**
 * =============================================
 * InteractionManager Class - 블록/오브젝트 상호작용
 * =============================================
 * 지형 확장, 오브젝트 삭제, 스폰 기능
 */

import * as THREE from 'three';
import { sceneManager } from './core/sceneManager';
import { CONFIG } from './core/CONFIG';
import { modelManager } from './gridModels';
import { environmentManager } from './environment';

export class InteractionManager {
    // ═══════════════════════════════════════════════════════════════
    // 재사용 객체 풀 (GC Pressure 제거)
    // ═══════════════════════════════════════════════════════════════
    private _mouse = new THREE.Vector2();
    private _raycaster = new THREE.Raycaster();

    // ═══════════════════════════════════════════════════════════════
    // 모듈 상태
    // ═══════════════════════════════════════════════════════════════
    private level = 1;
    private isRemoving = false;
    private existingBlocks = new Set<string>();

    /** 보호 대상 오브젝트 이름 목록 */
    private readonly PROTECTED_OBJECTS = new Set(["Sky", "Highlight", "Grid", "Dirt", "Grass"]);

    /** 모델-스폰 설정 매핑 */
    private readonly SPAWN_CONFIG: Record<string, { getModel: () => THREE.Object3D | null; rotation?: THREE.Euler }> = {};

    constructor() {
        this.initSpawnConfig();
    }

    private initSpawnConfig(): void {
        this.SPAWN_CONFIG['Hay'] = { getModel: () => modelManager.hay?.clone() };
        this.SPAWN_CONFIG['Carrot'] = { getModel: () => modelManager.soil?.clone(), rotation: new THREE.Euler(-Math.PI / 2, 0, 0) };
        this.SPAWN_CONFIG['Potato'] = { getModel: () => modelManager.pSoil?.clone(), rotation: new THREE.Euler(-Math.PI / 2, 0, 0) };
        this.SPAWN_CONFIG['Tomato'] = { getModel: () => modelManager.tSoil?.clone(), rotation: new THREE.Euler(-Math.PI / 2, 0, 0) };
        this.SPAWN_CONFIG['Wheat'] = { getModel: () => modelManager.wSoil?.clone(), rotation: new THREE.Euler(-Math.PI / 2, 0, 0) };
        this.SPAWN_CONFIG['Path'] = { getModel: () => modelManager.path?.clone() };
        this.SPAWN_CONFIG['Rock'] = { getModel: () => modelManager.rock?.clone() };
        this.SPAWN_CONFIG['SRock'] = { getModel: () => modelManager.pebble?.clone() };
        this.SPAWN_CONFIG['Tree'] = { getModel: () => modelManager.tree?.clone(), rotation: new THREE.Euler(0, 0, 0) };
        this.SPAWN_CONFIG['Pine'] = { getModel: () => modelManager.pine?.clone() };
        this.SPAWN_CONFIG['Cow'] = { getModel: () => modelManager.cow?.clone(true) };
        this.SPAWN_CONFIG['Pig'] = { getModel: () => modelManager.pig?.clone(), rotation: new THREE.Euler(0, Math.PI / 2, 0) };
        this.SPAWN_CONFIG['Sheep'] = { getModel: () => modelManager.sheep?.clone(), rotation: new THREE.Euler(0, -Math.PI, 0) };
        this.SPAWN_CONFIG['Chicken'] = { getModel: () => modelManager.chicken?.clone() };
        this.SPAWN_CONFIG['Fence'] = { getModel: () => modelManager.fence?.clone(), rotation: new THREE.Euler(0, Math.PI / 2, 0) };
        this.SPAWN_CONFIG['Barn'] = { getModel: () => modelManager.barn?.clone() };
    }

    // ═══════════════════════════════════════════════════════════════
    // 지형 확장
    // ═══════════════════════════════════════════════════════════════

    /**
     * 지형 확장 - Procedural Generation으로 높낮이 있는 블록 추가
     */
    addBlock(): void {
        const scene = sceneManager.scene;
        const { getTerrainHeight } = require('./utils/noise');
        
        // 기존 그리드 제거
        if (modelManager.grid) scene.remove(modelManager.grid);

        // 새 그리드 생성
        const size = this.level * CONFIG.BLOCK_SIZE;
        const newGrid = new THREE.GridHelper(size, size / CONFIG.GRID_SIZE);
        newGrid.position.set(-size / 2 + 5, CONFIG.HEIGHTS.GRASS_TOP + 4, -size / 2 + 5);
        scene.add(newGrid);
        modelManager.setGrid(newGrid);

        // 새 블록만 생성 (기존 블록 스킵)
        for (let i = 0; i < this.level; i++) {
            for (let j = 0; j < this.level; j++) {
                const blockKey = `${i},${j}`;

                // 이미 존재하는 블록 스킵
                if (this.existingBlocks.has(blockKey)) continue;
                this.existingBlocks.add(blockKey);

                // Procedural height 계산
                const heightOffset = getTerrainHeight(i, j, 0.2, 5);
                const baseY = heightOffset * 2; // 각 레벨당 2 유닛
                
                // Dirt 블록 (높이에 따라 여러 개 쌓기)
                for (let h = 0; h <= heightOffset; h++) {
                    const dirt = new THREE.Mesh(
                        new THREE.BoxGeometry(CONFIG.BLOCK_SIZE, CONFIG.HEIGHTS.DIRT_BOX_HEIGHT, CONFIG.BLOCK_SIZE),
                        new THREE.MeshPhongMaterial({ color: CONFIG.COLORS.DIRT })
                    );
                    dirt.position.set(
                        -i * CONFIG.BLOCK_SIZE, 
                        h * 2 - 4, // 블록 높이
                        -j * CONFIG.BLOCK_SIZE
                    );
                    dirt.name = "Dirt";
                    dirt.castShadow = true;
                    dirt.receiveShadow = true;
                    scene.add(dirt);
                }

                // Grass 블록 (맨 위)
                const newGrass = new THREE.Mesh(
                    new THREE.BoxGeometry(CONFIG.BLOCK_SIZE, CONFIG.HEIGHTS.GRASS_BOX_HEIGHT, CONFIG.BLOCK_SIZE),
                    new THREE.MeshPhongMaterial({ color: CONFIG.COLORS.GRASS })
                );
                newGrass.position.set(
                    -i * CONFIG.BLOCK_SIZE, 
                    baseY + CONFIG.HEIGHTS.GRASS_TOP - 1, 
                    -j * CONFIG.BLOCK_SIZE
                );
                newGrass.receiveShadow = true;
                newGrass.castShadow = true;
                newGrass.name = "Grass";
                scene.add(newGrass);
                modelManager.grasses.push(newGrass);
            }
        }

        this.level++;
        console.log(`[InteractionManager] Terrain expanded to level ${this.level}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 오브젝트 삭제
    // ═══════════════════════════════════════════════════════════════

    /**
     * 삭제 모드 활성화
     */
    deleteModel(): void {
        this.isRemoving = true;
        window.addEventListener("mousedown", this.onRemoveMouseDown);
    }

    /**
     * 삭제 클릭 핸들러
     */
    private onRemoveMouseDown = (event: MouseEvent): void => {
        const camera = sceneManager.camera;
        const scene = sceneManager.scene;
        
        if (!camera || !scene || !this.isRemoving) return;

        this._mouse.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        this._raycaster.setFromCamera(this._mouse, camera);

        const intersects = this._raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            let root: THREE.Object3D = intersects[0].object;

            // 루트 오브젝트 찾기
            while (root.parent && root.parent.type !== "Scene") {
                root = root.parent;
            }

            // 보호 대상이 아니면 삭제
            if (!this.PROTECTED_OBJECTS.has(root.name)) {
                this.disposeObject(root);
                scene.remove(root);
                this.isRemoving = false;
                window.removeEventListener("mousedown", this.onRemoveMouseDown);
            }
        }
    };

    /**
     * 오브젝트 리소스 해제
     */
    private disposeObject(obj: THREE.Object3D): void {
        obj.traverse((node) => {
            if ((node as THREE.Mesh).isMesh) {
                const mesh = node as THREE.Mesh;
                mesh.geometry?.dispose();
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => {
                        m.map?.dispose();
                        m.dispose();
                    });
                } else if (mesh.material) {
                    mesh.material.map?.dispose();
                    mesh.material.dispose();
                }
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 오브젝트 스폰
    // ═══════════════════════════════════════════════════════════════

    /**
     * 오브젝트 스폰
     */
    spawnObject(type: string): void {
        // Windmill 특수 처리 (애니메이션)
        if (type === 'Windmill') {
            modelManager.createWindmill();
            return;
        }

        const config = this.SPAWN_CONFIG[type];
        if (!config) {
            console.warn(`[InteractionManager] Unknown type: ${type}`);
            return;
        }

        const model = config.getModel();
        const data = modelManager.modelData[type];

        if (!model || !data) {
            console.warn(`[InteractionManager] Model '${type}' is not loaded yet.`);
            return;
        }

        model.name = type;
        model.position.set(0, CONFIG.HEIGHTS.GRASS_TOP, 0);

        if (config.rotation) {
            model.rotation.copy(config.rotation);
        }

        // Cow 스케일 보정
        if (type === 'Cow') {
            model.scale.set(1.25, 1.25, 1.25);
        }

        // Sheep 위치 보정
        if (type === 'Sheep') {
            model.position.set(0, 5, -3);
        }

        sceneManager.scene.add(model);
        modelManager.setModel(model, { width: data.width, height: data.height }, true);
    }

    // ═══════════════════════════════════════════════════════════════
    // 날씨 제어 (레거시 호환)
    // ═══════════════════════════════════════════════════════════════

    /**
     * 날씨 설정
     * @deprecated environmentManager.setWeather() 사용 권장
     */
    setWeather(type: string): void {
        switch (type) {
            case 'sunny':
                environmentManager.weather.cloudy = false;
                environmentManager.weather.night = false;
                break;
            case 'cloudy':
                environmentManager.weather.cloudy = true;
                environmentManager.weather.night = false;
                break;
            case 'rainy':
                environmentManager.weather.cloudy = true;
                environmentManager.weather.night = false;
                break;
            case 'night':
                environmentManager.weather.cloudy = false;
                environmentManager.weather.night = true;
                break;
        }
        environmentManager.updateSky();
    }

    // ═══════════════════════════════════════════════════════════════
    // Cleanup & Dispose
    // ═══════════════════════════════════════════════════════════════

    /**
     * 모듈 정리
     */
    dispose(): void {
        window.removeEventListener("mousedown", this.onRemoveMouseDown);
        this.existingBlocks.clear();
        this.level = 1;
        this.isRemoving = false;

        console.log('[InteractionManager] Disposed');
    }
}

// ═══════════════════════════════════════════════════════════════
// Singleton Instance
// ═══════════════════════════════════════════════════════════════
export const interactionManager = new InteractionManager();

// ═══════════════════════════════════════════════════════════════
// Legacy Exports (호환성 유지)
// ═══════════════════════════════════════════════════════════════
export const addBlock = () => interactionManager.addBlock();
export const deleteModel = () => interactionManager.deleteModel();
export const spawnObject = (type: string) => interactionManager.spawnObject(type);
export const setWeather = (type: string) => interactionManager.setWeather(type);
export const dispose = () => interactionManager.dispose();
