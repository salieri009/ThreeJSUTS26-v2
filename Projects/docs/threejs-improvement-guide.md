## Three.js Improvement Guide (Expert Review)

This document outlines concrete, high-impact improvements for this codebase. Each item includes rationale, the recommended change, and quick checks to verify success.

### 1) Rendering Architecture
- Problem: Multiple animation loops, implicit globals; risk of double-renders and state drift.
- Status: Centralized loop in `scripts/main.js` — good.
- Improve
  - Expose a single `renderFrame()` (already `controlCamera`) and ensure all update calls are idempotent.
  - Add time-step clamp: avoid huge deltas on tab restore.
    ```js
    const dt = Math.min(env.clock?.getDelta() ?? 0, 1/20);
    ```
  - Consider `renderer.setAnimationLoop(animate)` for future WebXR compatibility.

### 2) Color Management & Tone Mapping
- Why: Physically-correct look and consistent color.
- Do
  - After renderer creation:
    ```js
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = true;
    ```
  - Use `MeshStandardMaterial`/`MeshPhysicalMaterial` where possible (already used for puddles).

### 3) Camera & Controls
- Current: Orthographic top-ish view with OrbitControls.
- Options
  - Provide user toggle: Orthographic ↔ Perspective (UI switch) to improve depth perception for general users.
  - Tighten controls: limit zoom range and panning bounds to the play area.
    ```js
    controls.minDistance = 10; controls.maxDistance = 120;
    controls.enablePan = true; // with bounds in update
    ```

### 4) Scene Graph & Memory Management
- Issues: Frequent cloning (clouds), weather transitions may leak cloned materials.
- Do
  - Standardize disposal in every remove*: call `geometry.dispose()` and dispose single or array materials.
  - Maintain a `disposables` registry per system; on transition, iterate and dispose deterministically.
  - Reuse materials where color is only per-instance via `onBeforeRender`/uniforms, or duplicate once and cache.

### 5) Asset Loading & UX
- Improve
  - Add `THREE.LoadingManager` to aggregate GLTF/texture progress, show a loading overlay.
  - Add `try/catch` around loaders, and a fallback model/primitive on failure.
  - Consolidate model scale/origin normalization upon load (set `node.castShadow`, `receiveShadow`).

### 6) Particles, Weather, and Performance
- Clouds: many GLTF clones are heavy.
  - Option A: Convert dominant cloud meshes to `THREE.InstancedMesh` where feasible.
  - Option B: Use sprite-based volumetric impostors for distant clouds.
- Rain/Snow: attribute updates each frame are fine but expensive large-scale.
  - Use fixed-size buffers; avoid reallocation.
  - Consider GPU-based animation via custom shaders for very large counts.
- LOD
  - Tie `lodQuality` to device DPR and frame time. Lower counts when frame time > 22ms.
  - Skip expensive updates when offscreen (e.g., `document.hidden`).

### 7) Lighting & Shadows
- Improve visual depth and performance.
  - Add `HemisphereLight` for ambient sky/ground balance.
  - Use `PMREMGenerator` and an HDRI skybox for more realistic reflections (optional).
  - Make shadow-map size adaptive (desktop vs mobile): `1024`/`2048`.

### 8) Time & Weather System
- State: Good modularity.
- Improve
  - Debounce `setWeather` calls; ignore if type unchanged within 300ms.
  - Night/Day: crossfade lights with lerp over 0.3–0.6s for smoothness.
  - Aurora: gate updates to night only (already) and throttle when far from view.

### 9) Input & Raycaster
- Current: listeners added inside actions can duplicate.
- Do
  - Register pointer listeners once. Use a finite-state (placing/removing/idle) and branch behavior.
  - Throttle `mousemove` raycasts (e.g., 30–60Hz) using `requestAnimationFrame` guard.

### 10) Resize, DPR & Container Sizing
- Good: DPR cap and resize logic exist.
- Improve
  - Render to container size, not full window if layout changes.
  - Guard high-DPR mobiles: cap to `1.5` for battery.

### 11) Postprocessing (Optional)
- Add `EffectComposer` with lightweight passes:
  - FXAA on low DPR (or SMAA) to smooth edges.
  - Subtle Bloom for night/aurora only (toggle by scene state).

### 12) Structure & Build
- Now: Import maps + static hosting; fine for coursework.
- Next
  - Add Vite (dev) + import maps fallback (prod). Benefit: fast HMR, bundling, asset hashing.
  - Split systems under `scripts/` into folders by domain: `systems/`, `ui/`, `models/` for cohesion.

### 13) Data & Security
- Weather API
  - Keep API keys out of source; read via `?apikey=` param in dev or env-injected config at build.
  - Normalize units to metric; handle rate-limits (cache last response for 5–10 min).

### 14) Diagnostics & Profiling
- Integrate optional toggles:
  - Stats.js (fps/panel), Spector.js for GPU capture (dev only).
  - A debug UI (e.g., `lil-gui`) for LOD, particle counts, wind parameters.

### 15) Accessibility & UX
- Ensure overlay buttons have `aria-label` and focus styles.
- Keyboard navigation for category panel.
- Pause updates when tab hidden to save battery (`document.visibilityState`).

---

## Quick Win Checklist
- [ ] Move `renderer` color/tone config to `sceneManager.js`.
- [ ] Add LoadingManager overlay and progress bar.
- [ ] Single pointer/mouse listeners with state machine.
- [ ] Debounce identical `setWeather` calls.
- [ ] Clamp delta time; pause updates when hidden.
- [ ] Shadow map size by device type; cap DPR on mobile.
- [ ] Dispose all materials/geometries on transitions via helper.

## Example Snippets

### Loading Manager (progress overlay)
```js
const manager = new THREE.LoadingManager();
manager.onProgress = (url, loaded, total) => updateLoadingUI(loaded/total);
manager.onLoad = hideLoadingUI;
const textureLoader = new THREE.TextureLoader(manager);
const gltfLoader = new GLTFLoader(manager);
```

### Disposal Helper
```js
function disposeObject3D(object) {
  object.traverse(node => {
    if (node.isMesh) {
      node.geometry?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach(m => m?.dispose?.());
      else node.material?.dispose?.();
    }
  });
}
```

### Visibility Pause
```js
let paused = false;
document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
});
function animate() {
  requestAnimationFrame(animate);
  if (paused) return;
  // updates + render
}
```

---

## Roadmap (Suggested Order)
1) Loading UX + disposal helper + delta clamp
2) Color/tone mapping + shadow/DPR tuning
3) Pointer state machine + raycast throttle
4) Weather debounce + light crossfades
5) Cloud instancing or impostors (perf)
6) Postprocessing (FXAA/Bloom) night-only
7) Vite dev build + env-configured API key

Definition of Done: steady 60fps on desktop; >30fps on mid-tier mobile; no WebGL errors; no material/geometry leaks on 5+ weather/season transitions.

