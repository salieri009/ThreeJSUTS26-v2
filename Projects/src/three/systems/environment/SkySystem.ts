// @ts-nocheck
import { environmentManager } from '../../environment';

export class SkySystem {
  init(): void {
    environmentManager.setBackground();
    environmentManager.loadClouds();
  }

  update(dt: number): void {
    environmentManager.cloudMove();
    environmentManager.updateMoon(dt);
    environmentManager.updateAurora();
    // Season particle updates (safe no-ops if effect not created)
    environmentManager.updateSpringEffect();
    environmentManager.updateSummerEffect(dt);
    environmentManager.updateAutumnEffect();
  }

  dispose(): void {
    environmentManager.removeAuroraEffect?.();
  }
}
