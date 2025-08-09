// main.js - 애플리케이션 메인 진입점
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { camera, renderer } from './core/sceneManager.js';
import { init as initUI } from './UIManager.js';
import { initSeasonSyncUtil } from './seasonSyncUtil.js';
import * as env from './environment.js';
import { startApp } from './core/app.js';
import * as UpdateBus from './core/updateBus.js';
import { addBlock, deleteModel } from './buttonInteract.js';
import { WeatherSystem } from './systems/environment/WeatherSystem.js';
import { SkySystem } from './systems/environment/SkySystem.js';
import { PlacementSystem } from './systems/placement/PlacementSystem.js';
import { loadScene } from './gridModels.js';

// 전역 변수
let isInitialized = false;

// 애플리케이션 초기화
async function init() {
    try {
        console.log('🚀 Animal Simulator 초기화 시작...');
        
        // 1. 시스템 등록 및 앱 시작 (씬 생성 선행)
        startApp((bus, ctx)=>{
            // 기본 타일/잔디 및 모델 로더 초기화
            loadScene();
            bus.register(new SkySystem());
            bus.register(new WeatherSystem());
            bus.register(new PlacementSystem());
        });

        // 2. UI 시스템 초기화 (씬/캔버스가 준비된 후)
        initUI();
        
        // 3. 계절/날씨 동기화 시스템 초기화 (scene 의존)
        initSeasonSyncUtil();

        // 4. 기타 이벤트 리스너 설정
        setupEventListeners();
        
        isInitialized = true;
        console.log('✅ Animal Simulator 초기화 완료!');
        
    } catch (error) {
        console.error('❌ 초기화 중 오류 발생:', error);
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', onWindowResize);
    
    // 키보드 이벤트
    document.addEventListener('keydown', onKeyDown);
    
    // 버튼 이벤트는 PlacementSystem에서 바인딩됨
}

// 윈도우 리사이즈 핸들러
function onWindowResize() {
    if (camera && renderer) {
        const container = document.getElementById('scene-container');
        const width = container?.clientWidth || window.innerWidth;
        const height = container?.clientHeight || window.innerHeight;
        const aspect = width / height;
        const ortho = 20;
        
        camera.left = -ortho * aspect;
        camera.right = ortho * aspect;
        camera.top = ortho;
        camera.bottom = -ortho;
        
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
}

// 키보드 이벤트 핸들러
function onKeyDown(event) {
    switch(event.key.toLowerCase()) {
        case '1':
            env.setSeason('spring');
            break;
        case '2':
            env.setSeason('summer');
            break;
        case '3':
            env.setSeason('autumn');
            break;
        case '4':
            env.setSeason('winter');
            break;
        case 'q':
            env.setWeather('sunny');
            break;
        case 'w':
            env.setWeather('cloudy');
            break;
        case 'e':
            env.setWeather('rainy');
            break;
        case 'r':
            env.setWeather('snowy');
            break;
        case 't':
            env.setWeather('stormy');
            break;
        case 'n':
            env.setNightMode();
            break;
        case 'd':
            env.setDayMode();
            break;
        case ' ':
            event.preventDefault();
            addBlock();
            break;
    }
}

// 메인 루프는 core/app.js로 이관됨

// 애플리케이션 시작
document.addEventListener('DOMContentLoaded', init);