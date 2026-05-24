// @ts-nocheck
import * as THREE from 'three';
import { sceneManager } from './core/sceneManager';
import { modelManager } from './gridModels';
import { CONFIG } from './core/CONFIG';
import { emit } from './core/eventBus';

// ──────────────────────────────────────────────
// Aurora shaders (ported from scripts/environment.js)
// ──────────────────────────────────────────────
const SNOISE_GLSL = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const auroraVertexShader = SNOISE_GLSL + `
varying vec3 vWorldPos;
varying float vIntensity;
varying float vNormalY;
uniform vec3 auroraParams;  // x=noiseScale, y=speed, z=amplitude
uniform float time;
uniform float randSeed;
void main(){
  vec3 pos=position;
  // Plane is 400 wide x 200 tall, centered at origin
  float normalY=clamp((pos.y+100.0)/200.0,0.0,1.0);
  // Bell-curve height envelope — peak in lower-middle, tapers at edges
  float hEnv=smoothstep(0.0,0.22,normalY)*(1.0-smoothstep(0.5,1.0,normalY));
  hEnv=hEnv*hEnv*1.6;
  float t=time*auroraParams.y+randSeed;
  // 4 octaves: broad waves → medium ripples → fine detail → micro shimmer
  vec3 nc1=pos*auroraParams.x          +vec3(t*0.14,0.0,0.0);
  vec3 nc2=pos*(auroraParams.x*3.2)    +vec3(0.0,t*0.55,t*0.08);
  vec3 nc3=pos*(auroraParams.x*8.5)    +vec3(t*0.85,t*0.38,0.0);
  vec3 nc4=pos*(auroraParams.x*20.0)   +vec3(t*2.2,t*1.6,t*0.5);
  float n1=snoise(nc1)*0.62;
  float n2=snoise(nc2)*0.28;
  float n3=snoise(nc3)*0.12;
  float n4=snoise(nc4)*0.05;
  float totalN=n1+n2+n3+n4;
  // Curtain displacement (Z-axis)
  pos.z+=totalN*auroraParams.z*hEnv;
  // Fold/drape — adds vertical streaks
  pos.x+=sin(totalN*4.0+t*1.1)*auroraParams.z*0.055*hEnv;
  // Subtle Y waviness for organic look
  pos.y+=sin(pos.x*0.007+t*0.7)*5.0*hEnv;
  vWorldPos=(modelMatrix*vec4(pos,1.0)).xyz;
  vNormalY=normalY;
  float nMag=abs(n1)*0.5+abs(n2)*0.3+abs(n3)*0.15+abs(n4)*0.05;
  vIntensity=hEnv*nMag*2.5;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);
}`;

const auroraFragmentShader = `
varying vec3 vWorldPos;
varying float vIntensity;
varying float vNormalY;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform vec3 color4;
uniform float time;
void main(){
  vec3 col=color1;
  col=mix(col,color2,smoothstep(0.1,0.4,vNormalY));
  col=mix(col,color3,smoothstep(0.4,0.7,vNormalY));
  col=mix(col,color4,smoothstep(0.7,1.0,vNormalY));
  float core=pow(vIntensity,2.0)*1.8;
  col+=vec3(0.3,0.6,0.4)*core;
  float xFade=1.0-smoothstep(0.55,1.0,abs(vWorldPos.x)/200.0);
  float hFade=smoothstep(0.0,0.1,vNormalY)*(1.0-smoothstep(0.85,1.0,vNormalY));
  float alpha=vIntensity*hFade*xFade*1.4;
  alpha=clamp(alpha,0.0,0.85);
  gl_FragColor=vec4(col,alpha);
}`;

export class EnvironmentManager {
    // ── sky / lighting ──────────────────────────────────────────────
    private skyMaterial: THREE.MeshBasicMaterial | null = null;
    private skyDome: THREE.Mesh | null = null;
    private sunLight: THREE.DirectionalLight | null = null;
    private moonLight: THREE.DirectionalLight | null = null;
    private clouds: THREE.Object3D[] = [];
    private legacyClock = new THREE.Clock();
    private cloudSpawnTimer = 0;

    weather = { cloudy: false, night: false };

    // ── moon ────────────────────────────────────────────────────────
    private moon: THREE.Mesh | null = null;
    private moonOrbitAngle = 0;
    private moonCenter = new THREE.Vector3(0, 0, 0);
    private moonOrbitVec = new THREE.Vector3(-170, 30, 20);
    private moonOrbitNormal: THREE.Vector3 | null = null;

    // ── aurora ──────────────────────────────────────────────────────
    private auroraLayers: THREE.Group[] = [];
    private auroraClock = new THREE.Clock();

    // ── weather particles ───────────────────────────────────────────
    private rainParticles: THREE.Points | null = null;
    private snowParticles: THREE.Points | null = null;
    private stormLight: THREE.PointLight | null = null;
    private lightningLines: THREE.Line[] = [];
    private lightningTimer = 0;
    private fogMesh: THREE.Mesh | null = null;

    // ── wind ────────────────────────────────────────────────────────
    private windParticles: THREE.Points | null = null;
    private windDirection = { x: 1, y: 0, z: 0.3 };
    private windStrength = 0.5;
    private windTurbulence = 0.5;
    private isGusty = false;
    private windGustTimer = 0;

    // ── seasonal particles ──────────────────────────────────────────
    private springEffect: THREE.Points | null = null;
    private summerEffect: THREE.Points | null = null;
    private summerOrigins: {x:number,y:number,z:number}[] = [];
    private summerOffsets: {x:number,y:number,z:number}[] = [];
    private summerSpeeds: {x:number,y:number,z:number}[] = [];
    private autumnEffect: THREE.Points | null = null;

    private currentSeason: string = 'summer';

    // ──────────────────────────────────────────────────────────────
    // Initialisation
    // ──────────────────────────────────────────────────────────────
    setBackground(): void {
        if (!sceneManager.scene) return;
        this.skyMaterial = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.SKY_SUNNY, side: THREE.BackSide });
        const skyGeometry = new THREE.SphereGeometry(CONFIG.ENVIRONMENT.SKY_RADIUS, 8, 6);
        this.skyDome = new THREE.Mesh(skyGeometry, this.skyMaterial);
        this.skyDome.name = 'Sky';
        sceneManager.scene.add(this.skyDome);
    }

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
        if (this.sunLight) this.sunLight.intensity = lightIntensity;
    }

    loadClouds(): void {
        const { CLOUD_COUNT, CLOUD_SPAWN_START_X } = CONFIG.ENVIRONMENT;
        for (let i = 0; i < CLOUD_COUNT; i++) {
            const startX = Math.random() * 300 + CLOUD_SPAWN_START_X;
            this.spawnNewCloud(startX);
        }
    }

    private spawnNewCloud(startX: number): void {
        const loader = modelManager?.loader;
        if (!loader) return;
        const { CLOUD_MIN_SCALE, CLOUD_MAX_SCALE, CLOUD_MIN_SPEED, CLOUD_MAX_SPEED } = CONFIG.ENVIRONMENT;
        loader.load('models/cloud/scene.gltf', (gltf) => {
            const cloud = gltf.scene.clone();
            const s = Math.random() * (CLOUD_MAX_SCALE - CLOUD_MIN_SCALE) + CLOUD_MIN_SCALE;
            cloud.scale.set(s, s, s);
            cloud.position.set(startX, Math.random() * 10 + 10, Math.random() * 80 - 40);
            cloud.rotation.y = Math.random() * Math.PI * 2;
            cloud.userData.speed = Math.random() * (CLOUD_MAX_SPEED - CLOUD_MIN_SPEED) + CLOUD_MIN_SPEED;
            cloud.frustumCulled = false;
            cloud.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                    node.frustumCulled = false;
                    (node as THREE.Mesh).castShadow = false;
                    (node as THREE.Mesh).receiveShadow = false;
                }
            });
            this.clouds.push(cloud);
            sceneManager.scene.add(cloud);
        });
    }

    updateClouds(delta: number): void {
        const { CLOUD_MAX_X, CLOUD_SPAWN_INTERVAL, CLOUD_SPAWN_START_X } = CONFIG.ENVIRONMENT;
        this.cloudSpawnTimer += delta;

        for (const c of this.clouds) {
            c.position.x += delta * c.userData.speed;
        }

        for (let i = this.clouds.length - 1; i >= 0; i--) {
            if (this.clouds[i].position.x > CLOUD_MAX_X) {
                sceneManager.scene.remove(this.clouds[i]);
                this.clouds.splice(i, 1);
            }
        }

        if (this.cloudSpawnTimer >= CLOUD_SPAWN_INTERVAL) {
            this.cloudSpawnTimer = 0;
            this.spawnNewCloud(CLOUD_SPAWN_START_X);
        }
    }

    cloudMove(): void {
        const delta = this.legacyClock.getDelta();
        this.updateClouds(delta);
    }

    sun(): void {
        if (!sceneManager.scene) return;
        const { SUN_INTENSITY, SUN_POSITION, SHADOW_MAP_SIZE } = CONFIG.LIGHT;
        this.sunLight = new THREE.DirectionalLight(0xffffff, SUN_INTENSITY);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
        this.sunLight.shadow.camera.top = 50;
        this.sunLight.position.set(SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z);
        sceneManager.scene.add(this.sunLight);
    }

    // ──────────────────────────────────────────────────────────────
    // Weather / time API
    // ──────────────────────────────────────────────────────────────
    setWeather(type: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy'): void {
        // remove current weather particles
        this.removeRain();
        this.removeSnow();
        this.removeStorm();
        this.removeFog();

        switch (type) {
            case 'sunny':
                this.weather.cloudy = false;
                break;
            case 'cloudy':
                this.weather.cloudy = true;
                break;
            case 'rainy':
                this.weather.cloudy = true;
                this.createRain();
                break;
            case 'snowy':
                this.weather.cloudy = true;
                this.createSnow();
                break;
            case 'stormy':
                this.weather.cloudy = true;
                this.createStorm();
                break;
        }
        this.updateSky();
        emit('weather:change', type);
    }

    setSeason(season: 'spring' | 'summer' | 'autumn' | 'winter'): void {
        this.currentSeason = season;

        const skyColors: Record<string, number> = {
            spring: CONFIG.COLORS.SKY_SPRING,
            summer: CONFIG.COLORS.SKY_SUMMER,
            autumn: CONFIG.COLORS.SKY_AUTUMN,
            winter: CONFIG.COLORS.SKY_WINTER,
        };
        if (!this.weather.night && this.skyMaterial) {
            this.skyMaterial.color.setHex(skyColors[season] ?? CONFIG.COLORS.SKY_SUNNY);
            this.skyMaterial.needsUpdate = true;
        }

        // remove all seasonal effects then start the right one
        this.removeSpringEffect();
        this.removeSummerEffect();
        this.removeAutumnEffect();
        if (!this.weather.night) this.removeAuroraEffect();

        switch (season) {
            case 'spring': this.createSpringEffect(); break;
            case 'summer': this.createSummerEffect(); break;
            case 'autumn': this.createAutumnEffect(); break;
            case 'winter':
                if (this.weather.night) this.createAurora();
                break;
        }

        // grass colours are handled by modelManager via eventBus
        emit('season:change', season);
    }

    setNightMode(): void {
        this.weather.night = true;
        this.updateSky();
        this.createMoon();
        if (this.currentSeason === 'winter') this.createAurora();
        emit('time:change', 'night');
    }

    setDayMode(): void {
        this.weather.night = false;
        this.updateSky();
        this.removeMoon();
        this.removeAuroraEffect();
        emit('time:change', 'day');
    }

    // ──────────────────────────────────────────────────────────────
    // Moon
    // ──────────────────────────────────────────────────────────────
    private createMoon(): void {
        if (this.moon) return;
        const geometry = new THREE.SphereGeometry(5, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            emissive: 0xFFF5E6, emissiveIntensity: 0.4,
            metalness: 0.05, roughness: 0.4,
        });
        this.moon = new THREE.Mesh(geometry, material);
        this.moon.position.copy(this.moonOrbitVec);
        sceneManager.scene.add(this.moon);

        // moonlight
        this.moonLight = new THREE.DirectionalLight(0xddeeff, 0.6);
        this.moonLight.position.set(0, 100, -80);
        sceneManager.scene.add(this.moonLight);

        // compute orbit normal once
        const axis = new THREE.Vector3(0, 1, 0);
        this.moonOrbitNormal = axis.cross(this.moonOrbitVec.clone().normalize()).normalize();
    }

    private removeMoon(): void {
        if (this.moon) {
            sceneManager.scene.remove(this.moon);
            this.moon.geometry.dispose();
            (this.moon.material as THREE.Material).dispose();
            this.moon = null;
        }
        if (this.moonLight) {
            sceneManager.scene.remove(this.moonLight);
            this.moonLight.dispose();
            this.moonLight = null;
        }
    }

    updateMoon(dt: number): void {
        if (!this.moon || !this.moonOrbitNormal) return;
        this.moonOrbitAngle += dt * 0.3;
        // Rodrigues rotation
        const v = this.moonOrbitVec.clone();
        const k = this.moonOrbitNormal;
        const cos = Math.cos(this.moonOrbitAngle);
        const sin = Math.sin(this.moonOrbitAngle);
        const rotated = v.clone().multiplyScalar(cos)
            .add(k.clone().cross(v).multiplyScalar(sin))
            .add(k.clone().multiplyScalar(k.dot(v) * (1 - cos)));
        this.moon.position.copy(this.moonCenter.clone().add(rotated));
        this.moon.rotation.y += dt * 2;
    }

    // ──────────────────────────────────────────────────────────────
    // Aurora
    // ──────────────────────────────────────────────────────────────
    private createAurora(): void {
        if (!this.weather.night) return;
        this.removeAuroraEffect();
        const PALETTE = [
            { h: 0.33, s: 1.0, l: 0.55 },
            { h: 0.49, s: 0.9, l: 0.60 },
            { h: 0.67, s: 0.8, l: 0.65 },
            { h: 0.75, s: 0.9, l: 0.65 },
            { h: 0.88, s: 0.8, l: 0.70 },
        ];
        const layerSettings = Array.from({ length: 7 }, (_, i) => {
            const base = i % (PALETTE.length - 1);
            const c = (idx: number) => new THREE.Color().setHSL(PALETTE[idx].h, PALETTE[idx].s, PALETTE[idx].l);
            return {
                speed: THREE.MathUtils.randFloat(0.008, 0.025),
                color1: c(base),
                color2: c(base + 1),
                color3: c(Math.min(base + 2, PALETTE.length - 1)),
                color4: new THREE.Color().setHSL(0.88, 0.6, 0.85),
            };
        });
        layerSettings.forEach((s, i) => {
            const layer = this.createAuroraLayer(s, i);
            this.auroraLayers.push(layer);
            sceneManager.scene.add(layer);
        });
    }

    private createAuroraLayer(s: any, idx: number): THREE.Group {
        const geometry = new THREE.PlaneGeometry(400, 200, 128, 64);
        const pivot = new THREE.Group();
        pivot.rotation.set(
            THREE.MathUtils.randFloatSpread(Math.PI / 8),
            THREE.MathUtils.randFloatSpread(Math.PI / 4),
            THREE.MathUtils.randFloatSpread(Math.PI / 8),
        );
        pivot.position.set(
            THREE.MathUtils.randFloatSpread(80),
            THREE.MathUtils.randFloat(60, 90),
            THREE.MathUtils.randFloatSpread(80),
        );
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                auroraParams: { value: new THREE.Vector3() },
                color1: { value: s.color1 },
                color2: { value: s.color2 },
                color3: { value: s.color3 },
                color4: { value: s.color4 },
                randSeed: { value: Math.random() * 100 },
            },
            vertexShader: auroraVertexShader,
            fragmentShader: auroraFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `AuroraLayer_${idx}`;
        pivot.add(mesh);
        return pivot;
    }

    updateAurora(): void {
        if (this.auroraLayers.length === 0) return;
        const t = this.auroraClock.getElapsedTime();
        this.auroraLayers.forEach((pivot, i) => {
            const mesh = pivot.children[0] as THREE.Mesh;
            const mat = mesh.material as THREE.ShaderMaterial;
            mat.uniforms.time.value = t;
            mat.uniforms.auroraParams.value.set(
                0.1 + Math.sin(t * 0.1) * 0.1,
                0.28 + i * 0.04,
                20 + Math.sin(t * 0.15 + i * 0.8) * 10,
            );
        });
    }

    removeAuroraEffect(): void {
        this.auroraLayers.forEach(layer => {
            layer.traverse(child => {
                if ((child as THREE.Mesh).isMesh) {
                    const m = child as THREE.Mesh;
                    m.geometry?.dispose();
                    if (Array.isArray(m.material)) m.material.forEach(x => x.dispose());
                    else m.material?.dispose();
                }
            });
            if (layer.parent) sceneManager.scene.remove(layer);
        });
        this.auroraLayers = [];
    }

    // ──────────────────────────────────────────────────────────────
    // Rain
    // ──────────────────────────────────────────────────────────────
    private createRain(): void {
        this.removeRain();
        const count = Math.max(this.clouds.length, 5) * 80;
        const positions = new Float32Array(count * 3);
        const speeds = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            positions[i * 3]     = (Math.random() - 0.5) * 150;
            positions[i * 3 + 1] = Math.random() * 30 + 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
            speeds[i] = Math.random() * 0.4 + 0.25;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        this.rainParticles = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x88bbff, size: 5.0, transparent: true, opacity: 0.2, depthWrite: false,
        }));
        sceneManager.scene.add(this.rainParticles);
    }

    updateRain(): void {
        if (!this.rainParticles?.geometry) return;
        const pos = this.rainParticles.geometry.attributes.position.array as Float32Array;
        const spd = this.rainParticles.geometry.attributes.speed.array as Float32Array;
        const BX = 75, BZ = 120;
        for (let i = 0; i < spd.length; i++) {
            const idx = i * 3;
            pos[idx + 1] -= spd[i] * 3.8 * 0.016;
            pos[idx]     += (this.windDirection.x * this.windStrength * 0.3);
            pos[idx + 2] += (this.windDirection.z * this.windStrength * 0.3);
            if (pos[idx + 1] < -15 || Math.abs(pos[idx]) > BX || Math.abs(pos[idx + 2]) > BZ) {
                pos[idx]     = (Math.random() - 0.5) * BX * 1.8;
                pos[idx + 1] = Math.random() * 20 + 10;
                pos[idx + 2] = (Math.random() - 0.5) * BZ * 1.8;
            }
        }
        this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    removeRain(): void {
        if (this.rainParticles) {
            sceneManager.scene.remove(this.rainParticles);
            this.rainParticles.geometry.dispose();
            (this.rainParticles.material as THREE.Material).dispose();
            this.rainParticles = null;
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Snow
    // ──────────────────────────────────────────────────────────────
    private createSnow(): void {
        this.removeSnow();
        const count = Math.max(this.clouds.length, 5) * 60;
        const positions = new Float32Array(count * 3);
        const speeds = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            positions[i * 3]     = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = Math.random() * 30 + 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
            speeds[i] = Math.random() * 0.13 + 0.07;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        this.snowParticles = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0xffffff, size: 5, transparent: true, opacity: 0.9, depthWrite: false,
        }));
        sceneManager.scene.add(this.snowParticles);
    }

    updateSnow(): void {
        if (!this.snowParticles?.geometry) return;
        const pos = this.snowParticles.geometry.attributes.position.array as Float32Array;
        const spd = this.snowParticles.geometry.attributes.speed.array as Float32Array;
        const t = performance.now() * 0.001;
        for (let i = 0; i < spd.length; i++) {
            const idx = i * 3;
            pos[idx + 1] -= spd[i] * 0.8;
            pos[idx]     += Math.cos(t * 0.3 + i) * 0.015;
            pos[idx + 2] += Math.sin(t * 0.35 + i) * 0.015;
            if (pos[idx + 1] < -10 || Math.abs(pos[idx]) > 50 || Math.abs(pos[idx + 2]) > 50) {
                pos[idx]     = (Math.random() - 0.5) * 100;
                pos[idx + 1] = Math.random() * 15 + 35;
                pos[idx + 2] = (Math.random() - 0.5) * 100;
            }
        }
        this.snowParticles.geometry.attributes.position.needsUpdate = true;
    }

    removeSnow(): void {
        if (this.snowParticles) {
            sceneManager.scene.remove(this.snowParticles);
            this.snowParticles.geometry.dispose();
            (this.snowParticles.material as THREE.Material).dispose();
            this.snowParticles = null;
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Storm (rain + lightning)
    // ──────────────────────────────────────────────────────────────
    private createStorm(): void {
        this.removeStorm();
        this.createRain();
        this.stormLight = new THREE.PointLight(0xffffff, 2, 500);
        this.stormLight.position.set(0, 100, 0);
        sceneManager.scene.add(this.stormLight);
    }

    updateStorm(): void {
        this.updateRain();
        if (!this.stormLight) return;
        if (Math.random() > 0.98 && this.lightningTimer <= 0) {
            this.stormLight.intensity = 8;
            this.stormLight.position.set(Math.random() * 80 - 40, 80 + Math.random() * 40, Math.random() * 60 - 30);
            this.createLightningLine();
            this.lightningTimer = 0.1 + Math.random() * 0.1;
        } else if (this.lightningTimer > 0) {
            this.lightningTimer -= 1 / 60;
            if (this.lightningTimer <= 0) this.stormLight.intensity = 2;
        }
        for (let i = this.lightningLines.length - 1; i >= 0; i--) {
            const line = this.lightningLines[i];
            const age = (performance.now() * 0.001) - line.userData.birth;
            if (age > 0.2) {
                sceneManager.scene.remove(line);
                this.lightningLines.splice(i, 1);
            } else {
                (line.material as THREE.LineBasicMaterial).opacity = 1 - (age / 0.2);
            }
        }
    }

    private createLightningLine(): void {
        const points: THREE.Vector3[] = [];
        let x = Math.random() * 80 - 40, y = 80 + Math.random() * 40, z = Math.random() * 60 - 30;
        points.push(new THREE.Vector3(x, y, z));
        for (let i = 0; i < 10; i++) {
            x += (Math.random() - 0.5) * 5; y -= Math.random() * 10; z += (Math.random() - 0.5) * 5;
            points.push(new THREE.Vector3(x, y, z));
        }
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 }),
        );
        line.userData.birth = performance.now() * 0.001;
        sceneManager.scene.add(line);
        this.lightningLines.push(line);
    }

    removeStorm(): void {
        this.removeRain();
        if (this.stormLight) {
            sceneManager.scene.remove(this.stormLight);
            this.stormLight.dispose();
            this.stormLight = null;
        }
        this.lightningLines.forEach(l => sceneManager.scene.remove(l));
        this.lightningLines = [];
    }

    // ──────────────────────────────────────────────────────────────
    // Fog
    // ──────────────────────────────────────────────────────────────
    private createFog(): void {
        this.removeFog();
        sceneManager.scene.fog = new THREE.Fog(0xcccccc, 15, 50);
        const geo = new THREE.BoxGeometry(500, 500, 500, 30, 30, 30);
        this.fogMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
            color: 0xcccccc, transparent: true, opacity: 0.12,
        }));
        this.fogMesh.rotation.x = -Math.PI / 2;
        this.fogMesh.position.y = 2.5;
        sceneManager.scene.add(this.fogMesh);
    }

    updateFog(): void {
        if (this.fogMesh) {
            (this.fogMesh.material as THREE.MeshBasicMaterial).opacity =
                0.12 + Math.abs(Math.sin(this.legacyClock.elapsedTime * 0.1)) * 0.05;
        }
    }

    removeFog(): void {
        if (this.fogMesh) {
            sceneManager.scene.remove(this.fogMesh);
            this.fogMesh.geometry.dispose();
            (this.fogMesh.material as THREE.Material).dispose();
            this.fogMesh = null;
        }
        if (sceneManager.scene) sceneManager.scene.fog = null;
    }

    // ──────────────────────────────────────────────────────────────
    // Wind
    // ──────────────────────────────────────────────────────────────
    private createWind(): void {
        this.removeWind();
        const count = 400;
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            positions[idx]     = Math.random() * 100 - 50;
            positions[idx + 1] = Math.random() * 30 + 5;
            positions[idx + 2] = Math.random() * 80 - 40;
            velocities[idx]     = (Math.random() - 0.5) * 0.1;
            velocities[idx + 1] = (Math.random() - 0.5) * 0.05;
            velocities[idx + 2] = (Math.random() - 0.5) * 0.1;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        this.windParticles = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0xeeeeee, size: 1.2, transparent: true, opacity: 0.15,
        }));
        sceneManager.scene.add(this.windParticles);
    }

    updateWind(): void {
        if (!this.windParticles?.geometry) return;
        const pos = this.windParticles.geometry.attributes.position.array as Float32Array;
        const vel = this.windParticles.geometry.attributes.velocity.array as Float32Array;
        const t = Date.now() * 0.001;
        for (let i = 0; i < pos.length / 3; i++) {
            const idx = i * 3;
            const wf = this.windStrength * 0.2;
            const turb = Math.sin(t * 2 + i * 0.1) * this.windTurbulence * 0.05;
            pos[idx]     += this.windDirection.x * wf + vel[idx] + turb;
            pos[idx + 1] += this.windDirection.y * wf * 0.3 + vel[idx + 1];
            pos[idx + 2] += this.windDirection.z * wf + vel[idx + 2] + turb;
            if (pos[idx] > 160) pos[idx] = -160;
            if (pos[idx] < -160) pos[idx] = 160;
            if (pos[idx + 2] > 80) pos[idx + 2] = -80;
            if (pos[idx + 2] < -80) pos[idx + 2] = 80;
            if (pos[idx + 1] > 35) pos[idx + 1] = 5;
            if (pos[idx + 1] < 5) pos[idx + 1] = 35;
        }
        this.windParticles.geometry.attributes.position.needsUpdate = true;
    }

    updateGustSystem(): void {
        this.windGustTimer += 1 / 60;
        if (!this.isGusty && this.windGustTimer > 10 + Math.random() * 20) {
            this.isGusty = true;
            this.windGustTimer = 0;
            this.windStrength = Math.min(this.windStrength * 2.5, 3.0);
        } else if (this.isGusty && this.windGustTimer > 2 + Math.random() * 3) {
            this.isGusty = false;
            this.windGustTimer = 0;
            this.windStrength = Math.max(this.windStrength / 2.5, 0.3);
        }
    }

    removeWind(): void {
        if (this.windParticles) {
            sceneManager.scene.remove(this.windParticles);
            this.windParticles.geometry.dispose();
            (this.windParticles.material as THREE.Material).dispose();
            this.windParticles = null;
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Spring — cherry blossom petals
    // ──────────────────────────────────────────────────────────────
    private createSpringEffect(): void {
        this.removeSpringEffect();
        const count = 80;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const palette = [0xFFB3D9, 0xFF99C8, 0xFF80B7, 0xFF66A6].map(h => new THREE.Color(h));
        for (let i = 0; i < count; i++) {
            positions[i * 3]     = (Math.random() - 0.5) * 80;
            positions[i * 3 + 1] = Math.random() * 25 + 15;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
            const c = palette[Math.floor(Math.random() * palette.length)];
            colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.springEffect = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 3.5, transparent: true, opacity: 0.9, depthWrite: false,
            blending: THREE.AdditiveBlending, vertexColors: true,
        }));
        sceneManager.scene.add(this.springEffect);
    }

    updateSpringEffect(): void {
        if (!this.springEffect?.geometry) return;
        const pos = this.springEffect.geometry.attributes.position.array as Float32Array;
        const t = Date.now() * 0.001;
        for (let i = 0; i < pos.length / 3; i++) {
            const idx = i * 3;
            pos[idx + 1] -= 0.08 + Math.sin(t + i) * 0.02;
            pos[idx]     += Math.sin(t * 0.5 + i) * 0.03 + Math.sin(t * 0.5 + i) * 0.02;
            pos[idx + 2] += Math.cos(t * 0.6 + i) * 0.02;
            if (pos[idx + 1] < -5) {
                pos[idx]     = (Math.random() - 0.5) * 80;
                pos[idx + 1] = Math.random() * 25 + 25;
                pos[idx + 2] = (Math.random() - 0.5) * 60;
            }
        }
        this.springEffect.geometry.attributes.position.needsUpdate = true;
        (this.springEffect.material as THREE.PointsMaterial).size = 3.2 + Math.sin(t * 3) * 0.3;
    }

    removeSpringEffect(): void {
        if (this.springEffect) {
            sceneManager.scene.remove(this.springEffect);
            this.springEffect.geometry.dispose();
            (this.springEffect.material as THREE.Material).dispose();
            this.springEffect = null;
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Summer — fireflies
    // ──────────────────────────────────────────────────────────────
    private createSummerEffect(): void {
        this.removeSummerEffect();
        const count = 70;
        const positions = new Float32Array(count * 3);
        this.summerOrigins = [];
        this.summerOffsets = [];
        this.summerSpeeds = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * 90 - 30, y = Math.random() * 50 + 6, z = Math.random() * 90 - 15;
            positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
            this.summerOrigins.push({ x, y, z });
            this.summerOffsets.push({ x: Math.random() * Math.PI * 2, y: Math.random() * Math.PI * 2, z: Math.random() * Math.PI * 2 });
            this.summerSpeeds.push({ x: 0.5 + Math.random() * 0.5, y: 0.5 + Math.random() * 0.5, z: 0.5 + Math.random() * 0.5 });
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.summerEffect = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0xffffcc, size: 4.5, transparent: true, opacity: 1.0,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        sceneManager.scene.add(this.summerEffect);
    }

    updateSummerEffect(dt: number): void {
        if (!this.summerEffect?.geometry) return;
        const pos = this.summerEffect.geometry.attributes.position.array as Float32Array;
        const t = performance.now() * 0.001;
        for (let i = 0; i < this.summerOrigins.length; i++) {
            const idx = i * 3, o = this.summerOrigins[i], off = this.summerOffsets[i], sp = this.summerSpeeds[i];
            const r = 3;
            pos[idx]     = o.x + Math.sin(t * sp.x + off.x) * r;
            pos[idx + 1] = o.y + Math.sin(t * sp.y + off.y) * r;
            pos[idx + 2] = o.z + Math.cos(t * sp.z + off.z) * r;
        }
        this.summerEffect.geometry.attributes.position.needsUpdate = true;
        (this.summerEffect.material as THREE.PointsMaterial).opacity = 0.6 + Math.sin(t * 3) * 0.3;
    }

    private removeSummerEffect(): void {
        if (this.summerEffect) {
            sceneManager.scene.remove(this.summerEffect);
            this.summerEffect.geometry.dispose();
            (this.summerEffect.material as THREE.Material).dispose();
            this.summerEffect = null;
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Autumn — falling leaves
    // ──────────────────────────────────────────────────────────────
    private createAutumnEffect(): void {
        this.removeAutumnEffect();
        const count = 100;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const rotations = new Float32Array(count);
        const leafColors = [0xffa94d, 0xff7f50, 0xff6347, 0x8b4513, 0xffd700].map(h => new THREE.Color(h));
        for (let i = 0; i < count; i++) {
            positions[i * 3]     = Math.random() * 60 - 30;
            positions[i * 3 + 1] = Math.random() * 14 + 8;
            positions[i * 3 + 2] = Math.random() * 30 - 15;
            const c = leafColors[Math.floor(Math.random() * leafColors.length)];
            colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
            rotations[i] = Math.random() * Math.PI * 2;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.setAttribute('rotation', new THREE.BufferAttribute(rotations, 1));
        this.autumnEffect = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 5, transparent: true, opacity: 0.8, vertexColors: true, depthWrite: false,
        }));
        sceneManager.scene.add(this.autumnEffect);
    }

    updateAutumnEffect(): void {
        if (!this.autumnEffect?.geometry) return;
        const pos = this.autumnEffect.geometry.attributes.position.array as Float32Array;
        const rot = this.autumnEffect.geometry.attributes.rotation.array as Float32Array;
        const t = performance.now() * 0.001;
        for (let i = 0; i < pos.length / 3; i++) {
            const idx = i * 3;
            pos[idx + 1] -= 0.02 + Math.random() * 0.01;
            pos[idx]     += Math.sin(t * 0.8 + rot[i]) * 0.02;
            pos[idx + 2] += Math.cos(t * 0.9 + rot[i]) * 0.02;
            rot[i] += 0.01 + Math.random() * 0.02;
            if (pos[idx + 1] < 0) {
                pos[idx]     = Math.random() * 60 - 30;
                pos[idx + 1] = Math.random() * 10 + 8;
                pos[idx + 2] = Math.random() * 30 - 15;
                rot[i]       = Math.random() * Math.PI * 2;
            }
        }
        this.autumnEffect.geometry.attributes.position.needsUpdate = true;
        this.autumnEffect.geometry.attributes.rotation.needsUpdate = true;
    }

    removeAutumnEffect(): void {
        if (this.autumnEffect) {
            sceneManager.scene.remove(this.autumnEffect);
            this.autumnEffect.geometry.dispose();
            (this.autumnEffect.material as THREE.Material).dispose();
            this.autumnEffect = null;
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Dispose
    // ──────────────────────────────────────────────────────────────
    dispose(): void {
        if (this.skyDome) {
            this.skyDome.geometry?.dispose();
            this.skyMaterial?.dispose();
            sceneManager.scene.remove(this.skyDome);
            this.skyDome = null; this.skyMaterial = null;
        }
        if (this.sunLight) { sceneManager.scene.remove(this.sunLight); this.sunLight.dispose(); this.sunLight = null; }
        this.clouds.forEach(c => {
            c.traverse(node => {
                if ((node as THREE.Mesh).isMesh) {
                    const m = node as THREE.Mesh;
                    m.geometry?.dispose();
                    if (Array.isArray(m.material)) m.material.forEach(x => x.dispose());
                    else m.material?.dispose();
                }
            });
            sceneManager.scene.remove(c);
        });
        this.clouds.length = 0;
        this.removeRain(); this.removeSnow(); this.removeStorm(); this.removeFog(); this.removeWind();
        this.removeMoon(); this.removeAuroraEffect();
        this.removeSpringEffect(); this.removeSummerEffect(); this.removeAutumnEffect();
    }
}

// ── Singleton ────────────────────────────────────────────────────
export const environmentManager = new EnvironmentManager();

// ── Legacy exports ───────────────────────────────────────────────
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
