// @ts-nocheck
/**
 * =============================================
 * World Class - 월드 초기화 오케스트레이션
 * =============================================
 */

import { sceneManager } from "./core/sceneManager";
import { modelManager } from "./gridModels";
import { environmentManager } from "./environment";

export class World {
    /**
     * 월드 초기화
     */
    init(): void {
        // Scene 초기화
        sceneManager.init();
        sceneManager.update();

        // 모델 및 지형 로드
        modelManager.loadScene();
        modelManager.animate();

        // 환경 설정
        environmentManager.setBackground();
        environmentManager.sun();
        environmentManager.loadClouds();
        environmentManager.cloudMove();
    }

    /**
     * 정리
     */
    dispose(): void {
        modelManager.dispose();
        environmentManager.dispose();
        sceneManager.dispose();
        console.log('[World] Disposed');
    }
}

// ═══════════════════════════════════════════════════════════════
// Singleton Instance
// ═══════════════════════════════════════════════════════════════
export const world = new World();

// ═══════════════════════════════════════════════════════════════
// Legacy Exports
// ═══════════════════════════════════════════════════════════════
export const initWorld = () => world.init();
