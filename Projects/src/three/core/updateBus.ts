// @ts-nocheck
// Simple update bus to orchestrate per-frame updates for registered systems

const systems = [];

export function register(systemInstance) {
  if (!systemInstance || typeof systemInstance.update !== 'function') return;
  systems.push(systemInstance);
  systemInstance.init?.();
}

export function unregister(systemInstance) {
  const idx = systems.indexOf(systemInstance);
  if (idx >= 0) {
    systems.splice(idx, 1);
    systemInstance.dispose?.();
  }
}

export function updateAll(deltaTimeSeconds) {
  for (const system of systems) {
    system.update(deltaTimeSeconds);
  }
}


