// @ts-nocheck
import * as env from '../../environment';

export class WeatherSystem {
  init() {
    // no-op: environment module owns allocations
  }

  update() {
    // Drive environment sub-updates that are weather dependent
    env.updateSky();
    env.updateRain();
    env.updateSnow();
    env.updateStorm();
    env.updateFog();
    env.updateWind();
    env.updateGustSystem();
  }

  dispose() {
    // Ensure transient effects are removed
    env.removeRain?.();
    env.removeSnow?.();
    env.removeStorm?.();
    env.removeFog?.();
  }
}



