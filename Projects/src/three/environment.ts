// @ts-nocheck
/**
 * =============================================
 * EnvironmentManager Class - 하늘, 날씨, 구름 시스템
 * =============================================
 * 배경 환경 요소 관리 (SkyDome, Clouds, Lighting)
 */

import * as THREE from 'three';
import { sceneManager } from './core/sceneManager';
import { modelManager } from './gridModels';
import { CONFIG } from './core/CONFIG';

export class EnvironmentManager {
    // ═══════════════════════════════════════════════════════════════
    // 상태
    // ═══════════════════════════════════════════════════════════════
    private skyMaterial: THREE.MeshBasicMaterial | null = null;
    private skyDome: THREE.Mesh | null = null;
    private sunLight: THREE.DirectionalLight | null = null;
    private clouds: THREE.Object3D[] = [];
    private legacyClock = new THREE.Clock();

    // 날씨 상태 (외부에서 참조 가능)
    weather = {
        cloudy: false,
        night: false,
    };

    // ═══════════════════════════════════════════════════════════════
    // 초기화 함수
    // ═══════════════════════════════════════════════════════════════

    /**
     * 하늘 배경 생성
     */
    setBackground(): void {
        console.log('[EnvironmentManager] setBackground() called, scene:', sceneManager.scene);
        
        if (!sceneManager.scene) {
            console.error('[EnvironmentManager] Scene not available!');
            return;
        }
        
        this.skyMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.SKY_SUNNY,
            side: THREE.BackSide
        });

        const skyGeometry = new THREE.SphereGeometry(CONFIG.ENVIRONMENT.SKY_RADIUS, 8, 6);
        this.skyDome = new THREE.Mesh(skyGeometry, this.skyMaterial);
        this.skyDome.name = "Sky";
        sceneManager.scene.add(this.skyDome);
        console.log('[EnvironmentManager] Sky dome added to scene');
    }

    /**
     * 하늘 색상 업데이트 (날씨/시간에 따라)
     */
    updateSky(): void {
        if (!this.skyMaterial) return;

        let newColor: number;
        let lightIntensity: number;

        if (this.weather.night) {
            newColor = CONFIG.COLORS.SKY_NIGHT;
            lightIntensity = 0.2;
        } else if (this.weather.cloudy) {
            newColor = CONFIG.COLORS.SKY_CLOUDY;
            lightIntensity = 0.5;
        } else {
            newColor = CONFIG.COLORS.SKY_SUNNY;
            lightIntensity = CONFIG.LIGHT.SUN_INTENSITY;
        }

        this.skyMaterial.color.setHex(newColor);
        if (this.sunLight) {
            this.sunLight.intensity = lightIntensity;
        }
    }

    /**
     * 구름 로드
     */
    loadClouds(): void {
        const loader = modelManager?.loader;
        if (!loader) {
            console.warn('[EnvironmentManager] Loader not ready, skipping cloud load');
            return;
        }

        loader.load("models/cloud/scene.gltf", (gltf) => {
            const { CLOUD_COUNT, CLOUD_MIN_SCALE, CLOUD_MAX_SCALE, CLOUD_MIN_SPEED, CLOUD_MAX_SPEED } = CONFIG.ENVIRONMENT;

            for (let i = 0; i < CLOUD_COUNT; i++) {
                const cloud = gltf.scene.clone();
                const randomScale = Math.random() * (CLOUD_MAX_SCALE - CLOUD_MIN_SCALE) + CLOUD_MIN_SCALE;

                cloud.scale.set(randomScale, randomScale, randomScale);
                cloud.position.set(
                    Math.random() * 100 - 55,
                    Math.random() * 10 + 10,
                    Math.random() * 50 - 30
                );
                cloud.userData.speed = Math.random() * (CLOUD_MAX_SPEED - CLOUD_MIN_SPEED) + CLOUD_MIN_SPEED;

                this.clouds.push(cloud);
                sceneManager.scene.add(cloud);
            }
        });
    }

    /**
     * 구름 이동 업데이트 (외부 루프에서 호출)
     */
    updateClouds(delta: number): void {
        const { CLOUD_RESET_X, CLOUD_MAX_X } = CONFIG.ENVIRONMENT;

        for (const c of this.clouds) {
            c.position.x += delta * c.userData.speed;
            if (c.position.x > CLOUD_MAX_X) {
                c.position.x = CLOUD_RESET_X;
            }
        }
    }

    /**
     * 레거시 cloudMove 함수 (호환성 유지)
     * @deprecated updateClouds(delta) 사용 권장
     */
    cloudMove(): void {
        requestAnimationFrame(() => this.cloudMove());
        const delta = this.legacyClock.getDelta();
        this.updateClouds(delta);
    }

    /**
     * 태양광 생성
     */
    sun(): void {
        console.log('[EnvironmentManager] sun() called');
        
        if (!sceneManager.scene) {
            console.error('[EnvironmentManager] Scene not available for sun!');
            return;
        }
        
        const { SUN_INTENSITY, SUN_POSITION, SHADOW_MAP_SIZE } = CONFIG.LIGHT;

        this.sunLight = new THREE.DirectionalLight(0xffffff, SUN_INTENSITY);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
        this.sunLight.shadow.camera.top = 50;
        this.sunLight.position.set(SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z);

        sceneManager.scene.add(this.sunLight);
        console.log('[EnvironmentManager] Sun light added, intensity:', SUN_INTENSITY);
    }

    // ═══════════════════════════════════════════════════════════════
    // 날씨/시간 제어 API
    // ═══════════════════════════════════════════════════════════════

    /**
     * 날씨 설정
     */
    setWeather(type: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy'): void {
        switch (type) {
            case 'sunny':
                this.weather.cloudy = false;
                break;
            case 'cloudy':
            case 'rainy':
            case 'stormy':
                this.weather.cloudy = true;
                break;
            case 'snowy':
                this.weather.cloudy = true;
                break;
        }
        this.updateSky();
    }

    /**
     * 계절 설정 - 잔디와 하늘 색상 변경
     */
    setSeason(season: 'spring' | 'summer' | 'autumn' | 'winter'): void {
        console.log(`[EnvironmentManager] Setting season to: ${season}`);

        // 계절별 잔디 색상
        const grassColors: Record<string, number> = {
            spring: CONFIG.COLORS.GRASS_SPRING,
            summer: CONFIG.COLORS.GRASS_SUMMER,
            autumn: CONFIG.COLORS.GRASS_AUTUMN,
            winter: CONFIG.COLORS.GRASS_WINTER,
        };

        // 계절별 하늘 색상
        const skyColors: Record<string, number> = {
            spring: CONFIG.COLORS.SKY_SPRING,
            summer: CONFIG.COLORS.SKY_SUMMER,
            autumn: CONFIG.COLORS.SKY_AUTUMN,
            winter: CONFIG.COLORS.SKY_WINTER,
        };

        // 잔디 색상 변경
        const grassColor = grassColors[season] ?? CONFIG.COLORS.GRASS;
        console.log(`[EnvironmentManager] Grasses count: ${modelManager.grasses?.length ?? 0}`);
        
        if (modelManager.grasses && modelManager.grasses.length > 0) {
            modelManager.grasses.forEach((grass, index) => {
                if (grass.material) {
                    // MeshPhongMaterial 또는 MeshStandardMaterial 또는 MeshLambertMaterial 모두 지원
                    const mat = grass.material as THREE.MeshPhongMaterial;
                    if (mat.color) {
                        mat.color.setHex(grassColor);
                        mat.needsUpdate = true;
                        console.log(`[EnvironmentManager] Updated grass ${index} color to ${grassColor.toString(16)}`);
                    }
                }
            });
        } else {
            console.warn('[EnvironmentManager] No grasses found in modelManager.grasses');
        }

        // 하늘 색상 변경 (night 모드가 아닐 때만)
        if (!this.weather.night && this.skyMaterial) {
            const skyColor = skyColors[season] ?? CONFIG.COLORS.SKY_SUNNY;
            this.skyMaterial.color.setHex(skyColor);
            this.skyMaterial.needsUpdate = true;
            console.log(`[EnvironmentManager] Updated sky color to ${skyColor.toString(16)}`);
        } else {
            console.warn('[EnvironmentManager] Sky material not found or night mode active');
        }

        console.log(`[EnvironmentManager] Season changed to ${season}`);
    }

    /**
     * 야간 모드 설정
     */
    setNightMode(): void {
        this.weather.night = true;
        this.updateSky();
    }

    /**
     * 주간 모드 설정
     */
    setDayMode(): void {
        this.weather.night = false;
        this.updateSky();
    }

    // ═══════════════════════════════════════════════════════════════
    // Stub functions for WeatherSystem compatibility
    // ═══════════════════════════════════════════════════════════════
    updateRain(): void {}
    updateSnow(): void {}
    updateStorm(): void {}
    updateFog(): void {}
    updateWind(): void {}
    updateGustSystem(): void {}
    removeRain(): void {}
    removeSnow(): void {}
    removeStorm(): void {}
    removeFog(): void {}
    
    // Stub functions for SkySystem compatibility
    updateMoon(dt: number): void {}
    updateAurora(): void {}
    updateSpringEffect(): void {}
    updateSummerEffect(dt: number): void {}
    updateAutumnEffect(): void {}
    removeAuroraEffect(): void {}

    // ═══════════════════════════════════════════════════════════════
    // Cleanup & Dispose
    // ═══════════════════════════════════════════════════════════════

    /**
     * 환경 리소스 정리
     */
    dispose(): void {
        // Sky dome 정리
        if (this.skyDome) {
            this.skyDome.geometry?.dispose();
            this.skyMaterial?.dispose();
            sceneManager.scene.remove(this.skyDome);
            this.skyDome = null;
            this.skyMaterial = null;
        }

        // Sun light 정리
        if (this.sunLight) {
            sceneManager.scene.remove(this.sunLight);
            this.sunLight.dispose();
            this.sunLight = null;
        }

        // Clouds 정리
        this.clouds.forEach(c => {
            c.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                    const mesh = node as THREE.Mesh;
                    mesh.geometry?.dispose();
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach(m => m.dispose());
                    } else {
                        mesh.material?.dispose();
                    }
                }
            });
            sceneManager.scene.remove(c);
        });
        this.clouds.length = 0;

        console.log('[EnvironmentManager] Disposed all resources');
    }
}

// ═══════════════════════════════════════════════════════════════
// Singleton Instance
// ═══════════════════════════════════════════════════════════════
export const environmentManager = new EnvironmentManager();

// ═══════════════════════════════════════════════════════════════
// Legacy Exports (호환성 유지)
// ═══════════════════════════════════════════════════════════════
export const weather = environmentManager.weather;
export const setBackground = () => environmentManager.setBackground();
export const updateSky = () => environmentManager.updateSky();
export const loadClouds = () => environmentManager.loadClouds();
export const updateClouds = (delta: number) => environmentManager.updateClouds(delta);
export const cloudMove = () => environmentManager.cloudMove();
export const sun = () => environmentManager.sun();
export const setWeather = (type: any) => environmentManager.setWeather(type);
export const setSeason = (season: any) => environmentManager.setSeason(season);
export const setNightMode = () => environmentManager.setNightMode();
export const setDayMode = () => environmentManager.setDayMode();
export const dispose = () => environmentManager.dispose();

// Stub exports for system compatibility
export const updateRain = () => {};
export const updateSnow = () => {};
export const updateStorm = () => {};
export const updateFog = () => {};
export const updateWind = () => {};
export const updateGustSystem = () => {};
export const removeRain = () => {};
export const removeSnow = () => {};
export const removeStorm = () => {};
export const removeFog = () => {};
export const updateMoon = (dt: number) => {};
export const updateAurora = () => {};
export const updateSpringEffect = () => {};
export const updateSummerEffect = (dt: number) => {};
export const updateAutumnEffect = () => {};
export const removeAuroraEffect = () => {};
