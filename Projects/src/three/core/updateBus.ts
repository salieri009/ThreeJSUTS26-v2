// @ts-nocheck
/**
 * =============================================
 * UpdateBus Class - 시스템 업데이트 관리
 * =============================================
 * 프레임별 시스템 업데이트 오케스트레이션
 */

export interface ISystem {
    init?(): void;
    update(dt: number): void;
    dispose?(): void;
}

export class UpdateBus {
    private systems: ISystem[] = [];

    /**
     * 시스템 등록
     */
    register(system: ISystem): void {
        if (!system || typeof system.update !== 'function') return;
        this.systems.push(system);
        system.init?.();
    }

    /**
     * 시스템 해제
     */
    unregister(system: ISystem): void {
        const idx = this.systems.indexOf(system);
        if (idx >= 0) {
            this.systems.splice(idx, 1);
            system.dispose?.();
        }
    }

    /**
     * 모든 시스템 업데이트
     */
    updateAll(dt: number): void {
        for (const system of this.systems) {
            system.update(dt);
        }
    }

    /**
     * 모든 시스템 정리
     */
    disposeAll(): void {
        for (const system of this.systems) {
            system.dispose?.();
        }
        this.systems.length = 0;
        console.log('[UpdateBus] Disposed all systems');
    }
}

// ═══════════════════════════════════════════════════════════════
// Singleton Instance
// ═══════════════════════════════════════════════════════════════
export const updateBus = new UpdateBus();

// Legacy exports
export const register = (system: ISystem) => updateBus.register(system);
export const unregister = (system: ISystem) => updateBus.unregister(system);
export const updateAll = (dt: number) => updateBus.updateAll(dt);
