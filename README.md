# Animal Farm Simulator — Group 26

> UTS 2025-01 Graphic Design · Assignment 2

[![Three.js](https://img.shields.io/badge/Three.js-r182-000?logo=threedotjs&logoColor=white)](https://threejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

A browser-based 3D farm simulator built with Three.js and React. You can place animals, buildings, and props on a grid, and switch between seasons and weather in real time.

![Hero Screenshot](docs/screenshots/hero.png)

---

## Features

- **Seasons** — Spring petals, Summer fireflies, Autumn leaves, Winter aurora (GLSL shader)
- **Weather** — Sunny, Cloudy, Rain, Snow, Storm with lightning
- **Night mode** — Moon orbit + Aurora Borealis (winter only)
- **Object placement** — Click to place/delete models on a snapping grid
- **Terrain expansion** — Grow the map with Space

---

## Getting Started

```bash
cd Projects
npm install
npm run dev   # → http://localhost:5173
```

---

## Controls

| Key | Action |
|-----|--------|
| `1 2 3 4` | Spring / Summer / Autumn / Winter |
| `Q W E R T` | Sunny / Cloudy / Rain / Snow / Storm |
| `N` / `D` | Night / Day |
| `Space` | Expand terrain |

---

## Stack

Three.js r182 · React 19 · TypeScript 5 · Vite 7 · Custom GLSL shaders

---

## Environment (optional)

```bash
# Projects/.env
VITE_OPENWEATHER_KEY=your_key
```

Enables live weather sync via OpenWeatherMap. Works fine without it.
