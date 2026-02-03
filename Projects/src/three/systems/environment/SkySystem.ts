// @ts-nocheck
import * as env from '../../environment';

export class SkySystem {
  init() {
    env.setBackground();
    env.loadClouds?.(1);
  }

  update(dt) {
    env.cloudMove();
    env.updateMoon(dt);
    env.updateAurora();
    // Season particle updates (safe no-ops if effect not created)
    env.updateSpringEffect();
    env.updateSummerEffect(dt);
    env.updateAutumnEffect();
  }

  dispose() {
    env.removeAuroraEffect?.();
  }
}



