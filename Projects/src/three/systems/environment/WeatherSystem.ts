// @ts-nocheck
import { environmentManager } from '../../environment';

export class WeatherSystem {
  init(): void {
    // no-op: environment module owns allocations
  }

  update(): void {
    // Drive environment sub-updates that are weather dependent
    environmentManager.updateSky();
    environmentManager.updateRain();
    environmentManager.updateSnow();
    environmentManager.updateStorm();
    environmentManager.updateFog();
    environmentManager.updateWind();
    environmentManager.updateGustSystem();
  }

  dispose(): void {
    // Ensure transient effects are removed
    environmentManager.removeRain?.();
    environmentManager.removeSnow?.();
    environmentManager.removeStorm?.();
    environmentManager.removeFog?.();
  }
}
