// @ts-nocheck
/**
 * =============================================
 * Main Entry Point - 애플리케이션 진입점
 * =============================================
 */

import { sceneManager } from './core/sceneManager';
import { uiManager } from './UIManager';
import { seasonSyncManager } from './seasonSyncUtil';
import { environmentManager } from './environment';
import { app } from './core/app';
import { updateBus } from './core/updateBus';
import { interactionManager } from './buttonInteract';
import { WeatherSystem } from './systems/environment/WeatherSystem';
import { SkySystem } from './systems/environment/SkySystem';
import { PlacementSystem } from './systems/placement/PlacementSystem';
import { modelManager } from './gridModels';

// 전역 상태
let isInitialized = false;

/**
 * 애플리케이션 초기화
 */
async function init(): Promise<void> {
    try {
        console.log('🚀 Animal Simulator 초기화 시작...');
        
        // 1. 시스템 등록 및 앱 시작
        app.start((bus, ctx) => {
            // 기본 씬 및 모델 로드
            modelManager.loadScene();
            
            // 시스템 등록
            bus.register(new SkySystem());
            bus.register(new WeatherSystem());
            bus.register(new PlacementSystem());
        });

        // 2. UI 시스템 초기화
        uiManager.init();
        
        // 3. 계절/날씨 시스템 초기화
        seasonSyncManager.init();

        // 4. 기타 이벤트 리스너 설정
        setupEventListeners();
        
        isInitialized = true;
        console.log('✅ Animal Simulator 초기화 완료!');
        
    } catch (error) {
        console.error('❌ 초기화 중 오류 발생:', error);
    }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners(): void {
    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', () => sceneManager.onResize());
    
    // 키보드 이벤트
    document.addEventListener('keydown', onKeyDown);
}

/**
 * 키보드 이벤트 핸들러
 */
function onKeyDown(event: KeyboardEvent): void {
    switch(event.key.toLowerCase()) {
        // 계절 변경
        case '1':
            environmentManager.setSeason('spring');
            break;
        case '2':
            environmentManager.setSeason('summer');
            break;
        case '3':
            environmentManager.setSeason('autumn');
            break;
        case '4':
            environmentManager.setSeason('winter');
            break;
        // 날씨 변경
        case 'q':
            environmentManager.setWeather('sunny');
            break;
        case 'w':
            environmentManager.setWeather('cloudy');
            break;
        case 'e':
            environmentManager.setWeather('rainy');
            break;
        case 'r':
            environmentManager.setWeather('snowy');
            break;
        case 't':
            environmentManager.setWeather('stormy');
            break;
        // 시간 변경
        case 'n':
            environmentManager.setNightMode();
            break;
        case 'd':
            environmentManager.setDayMode();
            break;
        // 지형 확장
        case ' ':
            event.preventDefault();
            interactionManager.addBlock();
            break;
    }
}

// 애플리케이션 시작
document.addEventListener('DOMContentLoaded', init);
