// @ts-nocheck
/**
 * =============================================
 * SceneManager Class - Three.js 핵심 설정
 * =============================================
 * Scene, Camera, Renderer, Controls 초기화 및 관리
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from './CONFIG';

// ═══════════════════════════════════════════════════════════════
// SceneManager Class
// ═══════════════════════════════════════════════════════════════

export class SceneManager {
    camera!: THREE.OrthographicCamera;
    controls!: OrbitControls;
    renderer!: THREE.WebGLRenderer;
    scene!: THREE.Scene;

    private container: HTMLElement | null = null;

    /**
     * Scene 셋업 - Three.js 핵심 객체 생성
     * @param containerId - DOM 컨테이너 ID (기본값: 'scene-container')
     */
    init(containerId: string = 'scene-container'): { 
        scene: THREE.Scene; 
        camera: THREE.OrthographicCamera; 
        renderer: THREE.WebGLRenderer; 
        controls: OrbitControls 
    } {
        this.scene = new THREE.Scene();

        // ─────────────────────────────────────────
        // Container 및 크기 계산
        // ─────────────────────────────────────────
        this.container = document.getElementById(containerId);
        const width = this.container?.clientWidth || window.innerWidth;
        const height = this.container?.clientHeight || window.innerHeight;
        const aspect = width / height;

        // ─────────────────────────────────────────
        // Orthographic Camera
        // ─────────────────────────────────────────
        const { ORTHO_SIZE, POSITION, NEAR, FAR } = CONFIG.CAMERA;
        this.camera = new THREE.OrthographicCamera(
            -ORTHO_SIZE * aspect,
            ORTHO_SIZE * aspect,
            ORTHO_SIZE,
            -ORTHO_SIZE,
            NEAR,
            FAR
        );
        this.camera.position.set(POSITION.x, POSITION.y, POSITION.z);
        this.camera.lookAt(0, 0, 0);

        // ─────────────────────────────────────────
        // WebGL Renderer (성능 최적화)
        // ─────────────────────────────────────────
        this.renderer = new THREE.WebGLRenderer({
            antialias: CONFIG.RENDERER.ANTIALIAS,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CONFIG.RENDERER.MAX_PIXEL_RATIO));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container?.appendChild(this.renderer.domElement);

        // ─────────────────────────────────────────
        // Orbit Controls
        // ─────────────────────────────────────────
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = CONFIG.CONTROLS.DAMPING_FACTOR;
        this.controls.enableRotate = CONFIG.CONTROLS.ENABLE_ROTATE;
        this.controls.enableZoom = CONFIG.CONTROLS.ENABLE_ZOOM;

        // ─────────────────────────────────────────
        // Ambient Light
        // ─────────────────────────────────────────
        const ambientLight = new THREE.AmbientLight(0xffffff, CONFIG.LIGHT.AMBIENT_INTENSITY);
        this.scene.add(ambientLight);

        return { scene: this.scene, camera: this.camera, renderer: this.renderer, controls: this.controls };
    }

    /**
     * 카메라 컨트롤 업데이트 및 렌더링
     */
    update(): void {
        this.controls?.update();
        this.renderer?.render(this.scene, this.camera);
    }

    /**
     * 윈도우 리사이즈 핸들러
     */
    onResize(): void {
        if (!this.camera || !this.renderer) return;
        
        const width = this.container?.clientWidth || window.innerWidth;
        const height = this.container?.clientHeight || window.innerHeight;
        const aspect = width / height;
        const ortho = CONFIG.CAMERA.ORTHO_SIZE;

        this.camera.left = -ortho * aspect;
        this.camera.right = ortho * aspect;
        this.camera.top = ortho;
        this.camera.bottom = -ortho;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * Scene Manager 정리
     */
    dispose(): void {
        this.controls?.dispose();
        this.renderer?.dispose();

        // Scene의 모든 객체 정리
        while (this.scene?.children.length > 0) {
            const child = this.scene.children[0];
            this.scene.remove(child);
        }

        console.log('[SceneManager] Disposed');
    }
}

// ═══════════════════════════════════════════════════════════════
// Singleton Instance
// ═══════════════════════════════════════════════════════════════
export const sceneManager = new SceneManager();

// ═══════════════════════════════════════════════════════════════
// Legacy Exports (호환성 유지)
// ═══════════════════════════════════════════════════════════════
export const getCamera = () => sceneManager.camera;
export const getScene = () => sceneManager.scene;
export const getRenderer = () => sceneManager.renderer;
export const getControls = () => sceneManager.controls;

// Legacy function aliases
export const setScene = () => sceneManager.init();
export const controlCamera = () => sceneManager.update();
export const dispose = () => sceneManager.dispose();

// Direct property access for backward compatibility
export { 
    sceneManager as camera,
    sceneManager as scene, 
    sceneManager as renderer,
    sceneManager as controls 
};
