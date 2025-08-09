## 🐮 Animal Simulator (Group 26)

Three.js로 구현한 인터랙티브 파밍/생태 시뮬레이터. 계절·날씨·바람·낮/밤을 실시간으로 전환하며, 동물/식물/건물을 배치해 작은 농장을 구성할 수 있습니다.

### ✨ Highlights
- 동적 계절 시스템: 봄/여름/가을/겨울에 맞춘 색감·효과 변화
- 날씨 시뮬레이션: 맑음/흐림/비/눈/폭풍/안개 + 바람 강도·난류
- 밤하늘 연출: 별/달(궤도)/오로라 GLSL 셰이더
- 인터랙션: 카테고리 패널에서 모델 클릭 배치, 지형 확장, 삭제
- 트렌디 UI: 글래스모피즘, 반응형 레이아웃, 오버레이 컨트롤

### 📦 Project Structure
```
Projects/
├─ index.html           # Import maps (three@0.160), UI 오버레이
├─ scripts/
│  ├─ main.js           # 단일 렌더 루프, 이벤트/업데이트 허브
│  ├─ sceneManager.js   # 카메라/렌더러/조명 셋업, OrbitControls
│  ├─ environment.js    # 날씨·계절·바람·야간·오로라 등 효과
│  ├─ gridModels.js     # GLTF 로더, 배치/그리드/하이라이트
│  ├─ buttonInteract.js # UI 버튼 이벤트, 배치/삭제, 풍향 슬라이더
│  ├─ UIManager.js      # 오버레이 토글/드래그, 상태 메시지
│  └─ seasonSyncUtil.js # 위치/시계/예보 UI, OpenWeatherMap 연동
├─ styles/main.css      # 글래스 스타일, 오버레이, 위젯
├─ models/              # GLTF 모델들
└─ texture/             # 텍스처 리소스
```

### 🚀 Run (Local Server 필요)
```bash
# Python
python -m http.server 8000
# or Node
npx http-server
```
브라우저에서 `http://localhost:8000/Projects/` 접속.

### ⌨️ Shortcuts
- 1~4: 계절 전환, Q/W/E/R/T: 날씨 전환, N/D: 야간/주간, Space: 지형 확장

### 🔧 Dev Notes
- Import maps로 three 예제 모듈을 로드합니다.
- 단일 애니메이션 루프에서 모든 업데이트를 수행합니다.
- 전역 `window.*` 의존 제거, 모듈 간 명시적 import 사용.

### ⚠️ Known
- 일부 모델 텍스처 경로 미정(`stonePath`)은 안전 처리됨.
- 모바일 GPU에서 파티클이 과다하면 프레임 저하 가능.

### 📜 License
MIT
