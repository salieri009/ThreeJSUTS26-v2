# Branch Analysis Index

이 디렉토리는 프로젝트의 모든 브랜치에 대한 상세 분석 문서를 포함합니다. 각 브랜치의 목적, 구조, 기능, 그리고 다른 브랜치와의 차이점을 소프트웨어 엔지니어가 이해할 수 있도록 작성되었습니다.

## 브랜치 목록

### 메인 브랜치
1. **[master](./01_master.md)** - 기본 프로젝트 구조
2. **[dev](./02_dev.md)** - 메인 개발 브랜치 (가장 발전된 브랜치)
3. **[version-2](./03_version-2.md)** - Vue3 + TypeScript 재구현

### 버그 수정 브랜치
4. **[cloudbugfix](./04_cloudbugfix.md)** - 클라우드 관련 버그 수정

### 개발 개선 브랜치
5. **[dev-codeRefinement](./05_dev-codeRefinement.md)** - 코드 품질 개선
6. **[dev-game-manager](./06_dev-game-manager.md)** - 게임 관리자 시스템
7. **[dev-ui](./07_dev-ui.md)** - UI 개선
8. **[dev3](./08_dev3.md)** - 개발 변형 브랜치

### 기능 브랜치
9. **[feature/Jungwook-plain](./09_feature-Jungwook-plain.md)** - 날씨 및 환경 기능 (원본)
10. **[feature/UIControls](./10_feature-UIControls.md)** - UI 컨트롤 기능
11. **[feature/season-weather](./11_feature-season-weather.md)** - 고급 계절/날씨 시스템
12. **[feature/tempUi](./12_feature-tempUi.md)** - 임시 UI 실험
13. **[feture/UIControls2](./13_feture-UIControls2.md)** - UI 컨트롤 v2 (이름 오타)
14. **[weather-control](./14_weather-control.md)** - 날씨 제어 시스템

## 브랜치 분류

### 개발 상태별
- **활성 개발**: `dev` (가장 권장)
- **안정 버전**: `master` (기준선)
- **대안 구현**: `version-2` (Vue3 + TypeScript)

### 기능별
- **날씨/환경**: `feature/Jungwook-plain`, `feature/season-weather`, `weather-control`
- **UI**: `dev-ui`, `feature/UIControls`, `feture/UIControls2`, `feature/tempUi`
- **게임 로직**: `dev-game-manager`
- **코드 품질**: `dev-codeRefinement`

### 버그 수정
- **클라우드**: `cloudbugfix`

## 주요 브랜치 비교

### dev vs version-2
- **dev**: Vanilla JavaScript, SOLID 원칙, 클래스 기반
- **version-2**: Vue3 + TypeScript, SPA 아키텍처

### dev vs feature/Jungwook-plain
- **dev**: 리팩토링된 클래스 기반 구조
- **feature/Jungwook-plain**: 원본 스크립트 기반 구조

### feature/season-weather vs feature/Jungwook-plain
- **feature/season-weather**: 고급 계절 시스템, Aurora 효과
- **feature/Jungwook-plain**: 기본 날씨 시스템

## 권장 사항

### 개발용 브랜치
- **주 개발**: `dev` 브랜치 사용 권장
- **최신 기능**: `dev` 브랜치에 통합된 기능들
- **아키텍처**: SOLID 원칙 적용, 잘 구조화됨

### 참고용 브랜치
- **원본 구현**: `feature/Jungwook-plain` (리팩토링 전)
- **고급 기능**: `feature/season-weather` (계절 시스템)
- **대안 접근**: `version-2` (Vue3 + TypeScript)

### 통합 고려
- **cloudbugfix**: 검증 후 `dev`에 병합 고려
- **dev-codeRefinement**: 코드 품질 개선을 `dev`에 병합 고려
- **feature/season-weather**: 계절 기능을 `dev`에 통합 고려

## 분석 문서 구조

각 분석 문서는 다음 섹션을 포함합니다:

1. **Overview**: 브랜치 개요 및 목적
2. **Branch Information**: 커밋 정보 및 상태
3. **Project Structure**: 파일 구조
4. **Key Features**: 주요 기능
5. **Technical Stack**: 기술 스택
6. **Code Characteristics**: 코드 특성
7. **Differences from Other Branches**: 다른 브랜치와의 차이점
8. **Use Cases**: 사용 사례
9. **Recommendations**: 권장 사항
10. **Notes**: 추가 참고 사항

## 업데이트

이 분석 문서들은 프로젝트의 현재 상태를 반영합니다. 브랜치가 업데이트되면 해당 분석 문서도 업데이트해야 합니다.

## 문의

브랜치 분석에 대한 질문이나 추가 정보가 필요한 경우, 각 브랜치의 분석 문서를 참조하거나 프로젝트 관리자에게 문의하세요.

