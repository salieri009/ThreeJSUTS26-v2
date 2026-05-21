# ThreeJSUTS26 — Farm Simulator

Three.js + React 19 + TypeScript + Vite 기반 3D 농장 시뮬레이터.
UTS 2025-01 Graphic Design Assignment 2.

## Quick Start

```bash
cd Projects
npm install
npm run dev          # localhost:5173
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Layer (App.tsx)                  │
│  State: currentWeather, currentSeason, timeMode, time    │
│  Buttons: ☀️ ☁️ 🌧️ 🌙 | 🌸 🌻 🍂 ❄️ | ANIMALS NATURE…  │
│  Events: on('weather:change') on('season:change')         │
└────────────────────┬────────────────────────────────────┘
                     │ calls
┌────────────────────▼────────────────────────────────────┐
│               Three.js Entry (main.ts)                   │
│  init() → app.start() → registerSystems()               │
│  setupEventListeners() → keyboard shortcuts (1-4, q-t)  │
└──────┬──────────────────────────────────────────────────┘
       │
       ├─────────────────────────────────────────────────┐
       │                                                  │
┌──────▼──────────────┐     ┌────────────────────────────▼──┐
│   UpdateBus loop    │     │   Manager Singletons           │
│  (RAF, ~60fps)      │     │                                │
│  ┌───────────────┐  │     │  environmentManager            │
│  │  SkySystem    │──┼────▶│    sky / clouds / moon         │
│  │  update(dt)   │  │     │    aurora (GLSL shader)        │
│  └───────────────┘  │     │    rain / snow / storm         │
│  ┌───────────────┐  │     │    seasonal particles          │
│  │ WeatherSystem │──┼────▶│                                │
│  │  update(dt)   │  │     │  modelManager                  │
│  └───────────────┘  │     │    GLTF models (GLTFLoader)    │
│  ┌───────────────┐  │     │    terrain (Dirt+Grass blocks) │
│  │PlacementSystem│──┼────▶│    grass colour (eventBus)     │
│  │  update(dt)   │  │     │                                │
│  └───────────────┘  │     │  interactionManager            │
└─────────────────────┘     │    spawn / delete / expand     │
                             └────────────────────────────────┘
                                          │ emit()
                             ┌────────────▼───────────────────┐
                             │   EventBus (core/eventBus.ts)  │
                             │  'weather:change' → React UI   │
                             │  'season:change'  → React UI   │
                             │                  → grass color │
                             │  'time:change'   → React UI   │
                             └────────────────────────────────┘
```

---

## Concept Flow

### Season → Visual Effect Chain

```
User clicks 🌸 / 🌻 / 🍂 / ❄️  (or presses 1 / 2 / 3 / 4)
          │
          ▼
  environmentManager.setSeason(season)
          │
          ├─ sky colour   ──▶ skyMaterial.color  (spring=light blue, summer=dodger, autumn=gold, winter=gray)
          ├─ remove old season particles
          ├─ create new particles:
          │    spring ──▶ THREE.Points  (15 pink petals, sine drift, AdditiveBlending)
          │    summer ──▶ THREE.Points  (70 fireflies, orbital motion, opacity pulse)
          │    autumn ──▶ THREE.Points  (100 coloured leaves, gravity + wind, NormalBlending)
          │    winter ──▶ THREE.ShaderMaterial (5 aurora layers, Simplex-noise GLSL)
          │               ↑ only visible in Night mode
          └─ emit('season:change') ──▶ React highlights active button
                                  ──▶ modelManager updates grass colour
```

### Weather → Visual Effect Chain

```
User clicks ☀️ / ☁️ / 🌧️ / 🌙  (or presses q / w / e / r / t / n)
          │
          ▼
  environmentManager.setWeather(type)  /  setNightMode() / setDayMode()
          │
          ├─ sunny  ──▶ cloud visibility ON,  sky = 0x87CEEB
          ├─ cloudy ──▶ cloud visibility ON,  sky = 0x778899
          ├─ rainy  ──▶ THREE.Points rain (400-600 drops, wind-drift)
          ├─ snowy  ──▶ THREE.Points snow (300-500 flakes, sine drift)
          ├─ stormy ──▶ rain + PointLight + lightning Lines (random flicker)
          └─ 🌙 night ─▶ sky = 0x0A0A2E, createMoon() (Rodrigues orbit),
                         if winter → createAurora() (GLSL shader, 5 layers)
```

### Object Placement Flow

```
User clicks spawn button (e.g. Barn)
          │
          ▼
  interactionManager.spawnObject('Barn')
          │  clones GLTF model from modelManager
          │  places at (0, GRASS_TOP, 0) as staging
          │
          ▼
  modelManager.setModel(model, size, placing=true)
          │  hides model, sets highlight geometry
          │
  User moves mouse ──▶ handleMouseMove:
          │  raycasts onto this.grasses[] meshes
          │  snaps to GRID_SIZE grid
          │  moves highlight plane to cursor
          │
  User clicks terrain ──▶ handleMouseDown:
          │  surfaceY = intersects[0].point.y   ← actual terrain elevation
          │  y = surfaceY + (MODEL_HEIGHT - GRASS_TOP)  ← per-model offset
          │  model.position.set(gridX, y, gridZ)
          └─ model made visible, placement ends
```

---

## Key Files

| File | Role |
|------|------|
| `src/App.tsx` | React UI — buttons, state, eventBus subscriptions |
| `src/three/main.ts` | Entry point — init, keyboard shortcuts |
| `src/three/environment.ts` | All sky/weather/season/moon/aurora effects |
| `src/three/gridModels.ts` | GLTF loader, terrain generation, placement system |
| `src/three/buttonInteract.ts` | Spawn / delete / expand terrain |
| `src/three/core/CONFIG.ts` | All magic numbers (heights, colours, sizes) |
| `src/three/core/eventBus.ts` | Typed pub/sub: WeatherType, SeasonType, TimeType |
| `src/three/core/updateBus.ts` | RAF game loop, system registry |
| `src/three/core/app.ts` | Renderer + controls initialisation |
| `src/three/core/sceneManager.ts` | Scene, camera, renderer singletons |
| `src/three/utils/noise.ts` | Perlin/FBM noise → `getTerrainHeight()` |
| `src/three/seasonSyncUtil.ts` | OpenWeather API sync (30-min manual override) |

---

## Season Effects Reference

| Season | Effect | Technique | Count | Key param |
|--------|--------|-----------|-------|-----------|
| 🌸 Spring | Cherry blossom petals | `THREE.Points` AdditiveBlending | 15 | sine drift, respawn at y < -5 |
| 🌻 Summer | Fireflies | `THREE.Points` AdditiveBlending | 70 | spherical orbit r=3, opacity pulse |
| 🍂 Autumn | Falling leaves | `THREE.Points` NormalBlending | 100 | gravity + wind + rotation attr |
| ❄️ Winter | Aurora Borealis | `THREE.ShaderMaterial` (GLSL Simplex noise) | 5 layers | 256×256 PlaneGeometry, night only |

---

## Weather Effects Reference

| Weather | Effect | Technique |
|---------|--------|-----------|
| ☀️ Sunny | Clear sky | `skyMaterial.color = 0x87CEEB` |
| ☁️ Cloudy | Dark sky | `skyMaterial.color = 0x778899` |
| 🌧️ Rainy | Rain drops + wind drift | `THREE.Points`, 400-600 particles |
| 🌨️ Snowy | Slow snowflakes | `THREE.Points`, sine-wave drift |
| ⛈️ Stormy | Rain + lightning flicker | `THREE.PointLight` + `THREE.Line` |
| 🌙 Night | Moon orbit + optional aurora | `THREE.SphereGeometry`, Rodrigues rotation |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Spring |
| `2` | Summer |
| `3` | Autumn |
| `4` | Winter |
| `q` | Sunny |
| `w` | Cloudy |
| `e` | Rainy |
| `r` | Snowy |
| `t` | Stormy |
| `n` | Night mode |
| `d` | Day mode |
| `Space` | Expand terrain |

---

## CONFIG Heights (terrain Y coordinate system)

```
y = 8       ───── (grass top on heightOffset=2 tile)
y = 6       ───── GRASS_TOP  ← flat ground surface, object spawn default
y = 5.1     ───── PATH height (recessed stone path)
y = 7       ───── FENCE height  (+1 above ground)
y = 8.5     ───── BARN height   (+2.5 above ground)

Terrain stack (heightOffset=0):
  y = 4–6   ███  Grass block  (GRASS_BOX_HEIGHT=2)
  y = -4–4  ███  Dirt block   (DIRT_BOX_HEIGHT=8, center y=0)
```

---

## Environment Variables

```bash
# Projects/.env
VITE_OPENWEATHER_KEY=your_api_key_here
```

OpenWeather API syncs weather every 10 min. Manual button/key input suppresses API for 30 min.
