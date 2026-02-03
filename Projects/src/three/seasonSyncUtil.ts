// @ts-nocheck
/**
 * =============================================
 * SeasonSyncManager Class - 계절/날씨 동기화 UI
 * =============================================
 * API 연동, 시간/날씨 UI 관리
 */

import { environmentManager } from './environment';

export class SeasonSyncManager {
    // API 설정
    private readonly API_KEY = '345a78d07f356c5ddf8042e295cfc2';

    // 현재 상태
    private currentDate = new Date();
    private currentSeason: string | null = null;
    private clockInterval: ReturnType<typeof setInterval> | null = null;
    private seasonInterval: ReturnType<typeof setInterval> | null = null;
    private weatherInterval: ReturnType<typeof setInterval> | null = null;

    // ═══════════════════════════════════════════════════════════════
    // 초기화
    // ═══════════════════════════════════════════════════════════════

    init(): void {
        // 위치 정보 가져오기
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => this.getWeather(pos.coords.latitude, pos.coords.longitude),
                () => this.setRandomWeatherUI()
            );
        } else {
            console.warn('Geolocation이 지원되지 않는 브라우저입니다');
            this.setRandomWeatherUI();
        }

        this.updateClock();
        this.updateSeason();
        this.updateWeatherUI();
        this.updateForecast();
        this.syncWeatherToScene();

        // 주기적 업데이트
        this.clockInterval = setInterval(() => this.updateClock(), 1000);
        this.seasonInterval = setInterval(() => this.updateSeason(), 60000);
        this.weatherInterval = setInterval(() => this.updateWeatherUI(), 600000);
    }

    // ═══════════════════════════════════════════════════════════════
    // 날씨 API
    // ═══════════════════════════════════════════════════════════════

    private async getWeather(lat: number, lon: number): Promise<void> {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric&lang=en`
            );
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const json = await response.json();
            const weatherData = {
                city: json.name || "Unknown",
                lat: lat,
                lon: lon,
                temperature: json.main?.temp ?? null,
                clouds: json.clouds?.all ?? null,
                weatherMain: json.weather?.[0]?.main ?? null,
                rain: json.rain ?? null,
                snow: json.snow ?? null
            };

            console.log("🌦️ 현재 날씨 정보:", weatherData);
            this.updateWeatherUIWithData(weatherData);

        } catch (error) {
            console.warn('날씨 정보를 불러오는 중 오류 발생:', error);
            this.setRandomWeatherUI();
        }
    }

    private async fetchWeather(lat: number, lon: number): Promise<any> {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric&lang=en`
        );
        if (!response.ok) throw new Error('날씨 API 오류');
        const json = await response.json();
        return {
            temperature: json.main?.temp ?? null,
            condition: json.weather?.[0]?.description ?? null,
            humidity: json.main?.humidity ?? null,
            wind: json.wind?.speed ?? null,
            city: json.name ?? '-'
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 계절 계산
    // ═══════════════════════════════════════════════════════════════

    getSeasonByDate(date: Date, latitude: number = 37): string {
        const month = date.getMonth() + 1;
        const isNorth = latitude >= 0;
        
        if (isNorth) {
            if ([3, 4, 5].includes(month)) return 'spring';
            if ([6, 7, 8].includes(month)) return 'summer';
            if ([9, 10, 11].includes(month)) return 'autumn';
            return 'winter';
        } else {
            if ([9, 10, 11].includes(month)) return 'spring';
            if ([12, 1, 2].includes(month)) return 'summer';
            if ([3, 4, 5].includes(month)) return 'autumn';
            return 'winter';
        }
    }

    private syncWeatherToScene(weatherMain?: string): void {
        switch (weatherMain) {
            case 'Clear':
                environmentManager.setWeather('sunny');
                break;
            case 'Clouds':
                environmentManager.setWeather('cloudy');
                break;
            case 'Rain':
            case 'Drizzle':
                environmentManager.setWeather('rainy');
                break;
            case 'Snow':
                environmentManager.setWeather('snowy');
                break;
            case 'Thunderstorm':
            case 'Squall':
            case 'Tornado':
                environmentManager.setWeather('stormy');
                break;
            default:
                try { 
                    environmentManager.setWeather('sunny'); 
                } catch(e) {
                    setTimeout(() => environmentManager.setWeather('sunny'), 100);
                }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // UI 업데이트
    // ═══════════════════════════════════════════════════════════════

    updateClock(): void {
        const now = new Date();
        const timeElement = document.getElementById('time');
        const dateElement = document.getElementById('date');
        
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('en', {
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        }
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('en', {
                year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
            });
        }
    }

    updateSeason(latitude?: number): void {
        if (typeof latitude !== 'number') {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => this.updateSeason(pos.coords.latitude),
                    () => this.updateSeason(-37.8136)
                );
                return;
            } else {
                latitude = -37.8136;
            }
        }

        const now = new Date();
        const seasonName = this.getSeasonByDate(now, latitude);
        const seasons = document.querySelectorAll('.season-mark');
        const seasonIndexMap: Record<string, number> = { spring: 0, summer: 1, autumn: 2, winter: 3 };
        const currentSeasonIndex = seasonIndexMap[seasonName];

        seasons.forEach((season, index) => {
            season.classList.toggle('current-season', index === currentSeasonIndex);
            let marker = season.querySelector('.season-marker');
            if (marker) marker.remove();
            if (index === currentSeasonIndex) {
                marker = document.createElement('div');
                marker.className = 'season-marker';
                season.appendChild(marker);
            }
        });
    }

    private setRandomWeatherUI(): void {
        const temp = document.getElementById('temperature');
        const cond = document.getElementById('condition');
        const hum = document.getElementById('humidity');
        const wind = document.getElementById('wind');
        const loc = document.getElementById('location');

        if (temp) temp.textContent = `${Math.floor(Math.random() * 35) + 10}°C`;
        if (cond) cond.textContent = ['Sunny', 'Cloudy', 'Rainy', 'Snow'][Math.floor(Math.random() * 4)];
        if (hum) hum.textContent = `${Math.floor(Math.random() * 100)}%`;
        if (wind) wind.textContent = `${Math.floor(Math.random() * 30)} km/h`;
        if (loc) loc.textContent = '-';
    }

    private updateWeatherUIWithData(data: any): void {
        const temp = document.getElementById('temperature');
        const cond = document.getElementById('condition');
        const hum = document.getElementById('humidity');
        const wind = document.getElementById('wind');
        const loc = document.getElementById('location');

        if (temp) temp.textContent = data.temperature !== null ? `${Math.round(data.temperature)}°C` : '-';
        if (cond) cond.textContent = data.weatherMain || '-';
        if (loc) loc.textContent = data.city || '-';
    }

    updateWeatherUI(): void {
        if (!navigator.geolocation) {
            this.setRandomWeatherUI();
            return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            try {
                const weather = await this.fetchWeather(lat, lon);
                const temp = document.getElementById('temperature');
                const cond = document.getElementById('condition');
                const hum = document.getElementById('humidity');
                const wind = document.getElementById('wind');
                const loc = document.getElementById('location');

                if (temp) temp.textContent = weather.temperature !== null ? `${Math.round(weather.temperature)}°C` : '-';
                if (cond) cond.textContent = weather.condition || '-';
                if (hum) hum.textContent = weather.humidity !== null ? `${weather.humidity}%` : '-';
                if (wind) wind.textContent = weather.wind !== null ? `${Math.round(weather.wind)} km/h` : '-';
                if (loc) loc.textContent = weather.city || '-';
            } catch (e) {
                this.setRandomWeatherUI();
            }
        }, () => this.setRandomWeatherUI());
    }

    updateForecast(): void {
        const forecastContainer = document.getElementById('forecast');
        const timeRuler = document.getElementById('timeRuler');
        const now = new Date();
        if (!forecastContainer || !timeRuler) return;

        forecastContainer.innerHTML = '';
        timeRuler.innerHTML = '';

        for (let i = -3; i <= 3; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() + i);
            const dateStr = date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
            
            const item = document.createElement('div');
            item.className = `forecast-item${i === 0 ? ' today' : ''}`;
            item.innerHTML = `
                <div class="forecast-date">${dateStr}</div>
                <div class="forecast-temp">${Math.floor(Math.random() * 18) + 5}°C</div>
                <div class="forecast-condition">${['Sunny', 'Cloudy', 'Rain', 'Snow'][Math.floor(Math.random() * 4)]}</div>
            `;
            forecastContainer.appendChild(item);
            
            const mark = document.createElement('div');
            mark.className = `time-mark${i === 0 ? ' today' : ''}`;
            mark.innerHTML = `<span class="time-label">${dateStr}</span>`;
            timeRuler.appendChild(mark);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Cleanup
    // ═══════════════════════════════════════════════════════════════

    dispose(): void {
        if (this.clockInterval) clearInterval(this.clockInterval);
        if (this.seasonInterval) clearInterval(this.seasonInterval);
        if (this.weatherInterval) clearInterval(this.weatherInterval);
        console.log('[SeasonSyncManager] Disposed');
    }
}

// ═══════════════════════════════════════════════════════════════
// Singleton Instance
// ═══════════════════════════════════════════════════════════════
export const seasonSyncManager = new SeasonSyncManager();

// ═══════════════════════════════════════════════════════════════
// Legacy Exports (호환성 유지)
// ═══════════════════════════════════════════════════════════════
export const initSeasonSyncUtil = () => seasonSyncManager.init();
export const updateClock = () => seasonSyncManager.updateClock();
export const updateSeason = (lat?: number) => seasonSyncManager.updateSeason(lat);
export const updateWeatherUI = () => seasonSyncManager.updateWeatherUI();
export const updateForecast = () => seasonSyncManager.updateForecast();
export const getSeasonByDate = (date: Date, lat: number) => seasonSyncManager.getSeasonByDate(date, lat);
