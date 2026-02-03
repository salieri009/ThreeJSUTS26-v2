// @ts-nocheck
// main.js - ?좏뵆由ъ??댁뀡 硫붿씤 吏꾩엯??
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { camera, renderer } from './core/sceneManager';
import { init as initUI } from './UIManager';
import { initSeasonSyncUtil } from './seasonSyncUtil';
import * as env from './environment';
import { startApp } from './core/app';
import * as UpdateBus from './core/updateBus';
import { addBlock, deleteModel } from './buttonInteract';
import { WeatherSystem } from './systems/environment/WeatherSystem';
import { SkySystem } from './systems/environment/SkySystem';
import { PlacementSystem } from './systems/placement/PlacementSystem';
import { loadScene } from './gridModels';

// ?꾩뿭 蹂??
let isInitialized = false;

// ?좏뵆由ъ??댁뀡 珥덇린??
async function init() {
    try {
        console.log('?? Animal Simulator 珥덇린???쒖옉...');
        
        // 1. ?쒖뒪???깅줉 諛????쒖옉 (???앹꽦 ?좏뻾)
        startApp((bus, ctx)=>{
            // 湲곕낯 ????붾뵒 諛?紐⑤뜽 濡쒕뜑 珥덇린??
            loadScene();
            bus.register(new SkySystem());
            bus.register(new WeatherSystem());
            bus.register(new PlacementSystem());
        });

        // 2. UI ?쒖뒪??珥덇린??(??罹붾쾭?ㅺ? 以鍮꾨맂 ??
        initUI();
        
        // 3. 怨꾩젅/?좎뵪 ?숆린???쒖뒪??珥덇린??(scene ?섏〈)
        initSeasonSyncUtil();

        // 4. 湲고? ?대깽??由ъ뒪???ㅼ젙
        setupEventListeners();
        
        isInitialized = true;
        console.log('??Animal Simulator 珥덇린???꾨즺!');
        
    } catch (error) {
        console.error('??珥덇린??以??ㅻ쪟 諛쒖깮:', error);
    }
}

// ?대깽??由ъ뒪???ㅼ젙
function setupEventListeners() {
    // ?덈룄??由ъ궗?댁쫰 ?대깽??
    window.addEventListener('resize', onWindowResize);
    
    // ?ㅻ낫???대깽??
    document.addEventListener('keydown', onKeyDown);
    
    // 踰꾪듉 ?대깽?몃뒗 PlacementSystem?먯꽌 諛붿씤?⑸맖
}

// ?덈룄??由ъ궗?댁쫰 ?몃뱾??
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

// ?ㅻ낫???대깽???몃뱾??
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

// 硫붿씤 猷⑦봽??core/app.js濡??닿???

// ?좏뵆由ъ??댁뀡 ?쒖옉
document.addEventListener('DOMContentLoaded', init);

