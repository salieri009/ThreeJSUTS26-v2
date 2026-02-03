/**
 * =============================================
 * CONFIG - 중앙 설정 객체
 * =============================================
 * 모든 magic number와 상수를 이곳에서 관리합니다.
 * 값 변경 시 이 파일만 수정하면 됩니다.
 */

export const CONFIG = {
    // ─────────────────────────────────────────
    // Grid & Block 설정
    // ─────────────────────────────────────────
    GRID_SIZE: 2,
    BLOCK_SIZE: 10,
    INITIAL_GRID_DIVISIONS: 5,

    // ─────────────────────────────────────────
    // Camera 설정
    // ─────────────────────────────────────────
    CAMERA: {
        ORTHO_SIZE: 20,
        POSITION: { x: 20, y: 20, z: 20 },
        NEAR: 0.1,
        FAR: 1000,
    },

    // ─────────────────────────────────────────
    // 색상 팔레트
    // ─────────────────────────────────────────
    COLORS: {
        DIRT: 0x964B00,
        GRASS: 0x3E5C3A,
        PATH: 0xC4A484,
        HIGHLIGHT: 0xFFFFFF,
        HIGHLIGHT_PLACING: 0x66FF00,

        // Sky colors
        SKY_SUNNY: 0x87CEEB,
        SKY_CLOUDY: 0x778899,
        SKY_NIGHT: 0x0A0A2E,

        // Season grass colors
        GRASS_SPRING: 0x7CFC00, // Bright green
        GRASS_SUMMER: 0x228B22, // Forest green
        GRASS_AUTUMN: 0xCD853F, // Peru/tan
        GRASS_WINTER: 0xF5F5F5, // Snow white

        // Season sky colors
        SKY_SPRING: 0x87CEEB, // Light sky blue
        SKY_SUMMER: 0x1E90FF, // Dodger blue
        SKY_AUTUMN: 0xB8860B, // Dark golden
        SKY_WINTER: 0xDCDCDC, // Gainsboro/gray
    },

    // ─────────────────────────────────────────
    // Lighting 설정
    // ─────────────────────────────────────────
    LIGHT: {
        AMBIENT_INTENSITY: 0.5,
        SUN_INTENSITY: 1.0,
        SUN_POSITION: { x: 50, y: 30, z: 0 },
        SHADOW_MAP_SIZE: 2048,
    },

    // ─────────────────────────────────────────
    // Terrain 레벨 높이
    // ─────────────────────────────────────────
    HEIGHTS: {
        GRASS_TOP: 6,
        HIGHLIGHT: 6.05,
        FENCE: 7,
        BARN: 8.5,
        PATH: 5.1,
        DIRT_BOX_HEIGHT: 8,
        GRASS_BOX_HEIGHT: 2,
    },

    // ─────────────────────────────────────────
    // 환경 설정
    // ─────────────────────────────────────────
    ENVIRONMENT: {
        CLOUD_COUNT: 11,
        CLOUD_MIN_SCALE: 0.1,
        CLOUD_MAX_SCALE: 0.25,
        CLOUD_MIN_SPEED: 1.4,
        CLOUD_MAX_SPEED: 2.4,
        CLOUD_RESET_X: -100,
        CLOUD_MAX_X: 60,
        SKY_RADIUS: 200,
    },

    // ─────────────────────────────────────────
    // Renderer 설정
    // ─────────────────────────────────────────
    RENDERER: {
        MAX_PIXEL_RATIO: 2,
        ANTIALIAS: true,
    },

    // ─────────────────────────────────────────
    // Controls 설정
    // ─────────────────────────────────────────
    CONTROLS: {
        DAMPING_FACTOR: 0.05,
        ENABLE_ROTATE: false,
        ENABLE_ZOOM: true,
    },
} as const;

// 타입 헬퍼
export type ConfigType = typeof CONFIG;
