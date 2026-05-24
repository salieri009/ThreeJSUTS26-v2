<div align="center">

# 🐮 Animal Farm Simulator

**An interactive 3D farm ecosystem with real-time seasons, weather, and object placement**  
*UTS 2025-01 Graphic Design — Group 26*

[![Three.js](https://img.shields.io/badge/Three.js-r182-000000?logo=threedotjs&logoColor=white)](https://threejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](LICENSE)

![Hero Screenshot](docs/screenshots/hero.png)

[Features](#-features) · [Quick Start](#-quick-start) · [Controls](#%EF%B8%8F-controls) · [Architecture](#-architecture)

</div>

---

## ✨ Features

| Category | Details |
|----------|---------|
| 🌸 **Seasons** | Spring cherry blossoms · Summer fireflies · Autumn falling leaves · Winter aurora borealis |
| ☀️ **Weather** | Sunny · Cloudy · Rain (wind-drift particles) · Snow · Storm with lightning flicker |
| 🌙 **Night Sky** | Moon orbit via Rodrigues rotation · Aurora Borealis GLSL shader (Simplex noise, 5 layers) |
| 🏗️ **Placement** | Mouse raycast grid-snap · GLTF model spawn & delete · Procedural terrain expansion |
| 🎨 **UI** | Glassmorphism control panels · Real-time React ↔ Three.js sync via typed EventBus |
| 🌐 **Weather API** | Optional OpenWeatherMap sync — auto-overrides every 10 min, suppressed 30 min on manual input |

<details>
<summary><strong>Season effect details</strong></summary>

| Season | Effect | Technique | Count |
|--------|--------|-----------|-------|
| 🌸 Spring | Cherry blossom petals | `THREE.Points` AdditiveBlending | 15 |
| 🌻 Summer | Fireflies | `THREE.Points` orbital motion, opacity pulse | 70 |
| 🍂 Autumn | Falling leaves | `THREE.Points` NormalBlending, gravity + wind | 100 |
| ❄️ Winter | Aurora Borealis | `THREE.ShaderMaterial` GLSL Simplex noise | 5 layers |

</details>

---

## 🖼 Screenshots

| Spring · Day | Winter · Night |
|:---:|:---:|
| ![Spring day](docs/screenshots/hero.png) | ![Winter aurora](docs/screenshots/night-aurora.png) |

| Autumn · Leaves | Storm · Lightning |
|:---:|:---:|
| ![Autumn](docs/screenshots/autumn.png) | ![Storm](docs/screenshots/storm.png) |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **3D Renderer** | [Three.js r182](https://threejs.org) — WebGL, OrbitControls, GLTFLoader |
| **UI Framework** | [React 19](https://react.dev) + [TypeScript 5](https://www.typescriptlang.org) |
| **Build Tool** | [Vite 7](https://vitejs.dev) |
| **Shaders** | Custom GLSL — Aurora Borealis (4-octave Simplex noise, curtain displacement) |
| **3D Models** | GLTF / GLB — Barn, Cow, Pig, Chicken, Tree, Windmill, Pebbles |
| **State Sync** | Custom typed `EventBus` — pub/sub across React and Three.js boundaries |
| **Game Loop** | `UpdateBus` — RAF (~60 fps), composable system registry |
| **Noise** | Perlin / FBM — procedural terrain height (`getTerrainHeight()`) |
| **Weather API** | [OpenWeatherMap](https://openweathermap.org/api) (optional) |

---

## 🚀 Quick Start

**Prerequisites:** Node.js 18+

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/ThreeJSUTS26.git
cd ThreeJSUTS26/Projects

# 2. Install dependencies
npm install

# 3. (Optional) Add your OpenWeather API key
echo "VITE_OPENWEATHER_KEY=your_api_key_here" > .env

# 4. Start the dev server
npm run dev
# → http://localhost:5173
```

**Build for production:**

```bash
npm run build     # outputs to Projects/dist/
npm run preview   # preview the production build locally
```

---

## ⌨️ Controls

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | 🌸 Spring |
| `2` | 🌻 Summer |
| `3` | 🍂 Autumn |
| `4` | ❄️ Winter |
| `Q` | ☀️ Sunny |
| `W` | ☁️ Cloudy |
| `E` | 🌧️ Rainy |
| `R` | 🌨️ Snowy |
| `T` | ⛈️ Stormy |
| `N` | 🌙 Night mode |
| `D` | 🌤 Day mode |
| `Space` | Expand terrain |

### UI Panels

- **Weather / Season / Time** — top-left glassmorphism panel
- **Object Placement** — click any model tile (Animals · Nature · Props · Buildings) to enter placement mode, then click on the terrain to place
- **Delete mode** — enable in the settings panel, then click any placed model to remove it

---

## 📁 Project Structure

```
ThreeJSUTS26/
├── README.md                   ← you are here
├── docs/
│   └── screenshots/            ← app screenshots for README
└── Projects/                   ← Vite app root
    ├── index.html
    ├── vite.config.ts
    ├── public/
    │   └── models/             ← GLTF models (barn, cow, pig, chicken…)
    └── src/
        ├── App.tsx             ← React UI — buttons, glassmorphism panels
        ├── index.css
        └── three/
            ├── main.ts         ← Entry — init, keyboard shortcuts
            ├── environment.ts  ← Sky / weather / seasons / aurora
            ├── gridModels.ts   ← GLTF loader, terrain, placement system
            ├── buttonInteract.ts  ← Spawn / delete / expand logic
            ├── seasonSyncUtil.ts  ← OpenWeatherMap API sync
            ├── core/
            │   ├── CONFIG.ts       ← All magic numbers (heights, colours, sizes)
            │   ├── eventBus.ts     ← Typed pub/sub (WeatherType, SeasonType, TimeType)
            │   ├── updateBus.ts    ← RAF game loop, system registry
            │   ├── app.ts          ← Renderer + OrbitControls init
            │   └── sceneManager.ts ← Scene / camera / renderer singletons
            ├── systems/
            │   ├── environment/
            │   │   ├── SkySystem.ts
            │   │   └── WeatherSystem.ts
            │   └── placement/
            │       └── PlacementSystem.ts
            └── utils/
                └── noise.ts    ← Perlin / FBM → getTerrainHeight()
```

---

## 🏛 Architecture

```
React (App.tsx)  ←──────────────────────────────────────────────┐
  │ state: weather, season, time                                  │
  │ calls: environmentManager.*                                   │ EventBus
  ▼                                                               │ emit()
Three.js Entry (main.ts)                                          │
  │ init() → registerSystems() → setupKeyboardListeners()         │
  ▼                                                               │
UpdateBus (RAF ~60 fps)                                           │
  ├── SkySystem.update(dt)    ──▶  environmentManager (sky/light) │
  ├── WeatherSystem.update(dt)──▶  rain / snow / storm particles  │
  └── PlacementSystem.update()──▶  mouse raycast, grid snap       │
                                         │                         │
                                   EventBus ──────────────────────┘
                                   'weather:change'
                                   'season:change'
                                   'time:change'
```

> See [`CLAUDE.md`](CLAUDE.md) for full architectural diagrams and effect reference tables.

---

## 🔑 Environment Variables

Create `Projects/.env` (never commit this file):

```bash
VITE_OPENWEATHER_KEY=your_api_key_here
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_OPENWEATHER_KEY` | Optional | Enables live weather sync from [OpenWeatherMap](https://openweathermap.org/api). Without this key the simulator defaults to manual controls only. |

---

## 📜 License

[MIT](LICENSE) — Group 26, UTS 2025-01 Graphic Design
