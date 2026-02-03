// @ts-nocheck
/**
 * =============================================
 * App Class - 애플리케이션 라이프사이클 관리
 * =============================================
 * 메인 루프, 시스템 등록, pause/resume 관리
 */

import { sceneManager } from './sceneManager';
import { updateBus } from './updateBus';

export class App {
    private paused = false;
    private lastMs = 0;
    private animationId: number | null = null;

    /**
     * 애플리케이션 시작
     * @param registerSystems - 시스템 등록 콜백 함수
     */
    start(registerSystems?: (bus: typeof updateBus, ctx: ReturnType<typeof sceneManager.init>) => void): void {
        const ctx = sceneManager.init();

        // 시스템 등록 콜백 실행
        registerSystems?.(updateBus, ctx);

        // Visibility change 핸들러
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        // 메인 루프 시작
        this.animationId = requestAnimationFrame((ms) => this.loop(ms));
    }

    /**
     * 메인 루프
     */
    private loop = (nowMs: number): void => {
        this.animationId = requestAnimationFrame(this.loop);
        
        if (!this.lastMs) this.lastMs = nowMs;
        if (this.paused) return;

        const dt = Math.min((nowMs - this.lastMs) / 1000, 1 / 20);
        this.lastMs = nowMs;

        // 시스템 업데이트
        updateBus.updateAll(dt);

        // 렌더링
        sceneManager.update();
    };

    /**
     * Visibility change 핸들러
     */
    private handleVisibilityChange = (): void => {
        this.paused = document.hidden;
    };

    /**
     * 일시정지
     */
    pause(): void {
        this.paused = true;
    }

    /**
     * 재개
     */
    resume(): void {
        this.paused = false;
        this.lastMs = 0;
    }

    /**
     * 정리
     */
    dispose(): void {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        updateBus.disposeAll();
        sceneManager.dispose();
        console.log('[App] Disposed');
    }
}

// ═══════════════════════════════════════════════════════════════
// Singleton Instance
// ═══════════════════════════════════════════════════════════════
export const app = new App();

// Legacy export
export const startApp = (registerSystems?: Function) => app.start(registerSystems as any);
