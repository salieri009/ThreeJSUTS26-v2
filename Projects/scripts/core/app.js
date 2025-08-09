import { setScene, controlCamera } from './sceneManager.js';
import * as UpdateBus from './updateBus.js';

let paused = false;
let lastMs = 0;

export function startApp(registerSystems) {
  const ctx = setScene(); // keep existing sceneManager side-effects

  // Allow caller to register systems onto the update bus
  registerSystems?.(UpdateBus, ctx);

  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
  });

  function loop(nowMs) {
    requestAnimationFrame(loop);
    if (!lastMs) lastMs = nowMs;
    if (paused) return;
    const dt = Math.min((nowMs - lastMs) / 1000, 1 / 20);
    lastMs = nowMs;

    // Systems update
    UpdateBus.updateAll(dt);

    // Render one frame
    controlCamera();
  }

  requestAnimationFrame(loop);
}


