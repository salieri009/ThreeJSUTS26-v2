## 🐾 Animal Simulator (Projects)

Three.js 기반 3D 농장·생태 시뮬레이터. 실시간 계절/날씨/바람/일야 변화와 상호작용 UI를 제공합니다.

### 🚀 Run
```bash
python -m http.server 8000
# or
npx http-server
```
브라우저에서 `http://localhost:8000/Projects/` 열기.

### 🎯 Controls
- 1~4: 계절, Q/W/E/R/T: 맑음/흐림/비/눈/폭풍, N/D: 야간/주간, Space: 지형 확장

### 🧩 Tech
- three@0.160 (import maps), OrbitControls, GLTFLoader, custom shaders (Aurora)

### 🛠 Notes
- 단일 애니메이션 루프에서 모든 업데이트 처리.
- 전역 바인딩 최소화, 모듈 간 명시적 export/import.

### ⚠️ Known
- 일부 텍스처 경로 미정(`stonePath`)은 무시 처리됨.

MIT License