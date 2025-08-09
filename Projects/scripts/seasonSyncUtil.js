import * as env from './environment.js';

// API 키 설정
const API_KEY = '345a78d07f57356c5ddf8042e295cfc2';

// 샘플 날씨 데이터 (참고용)
const sydneyWeather = {
    city: "Sydney",
    lat: -33.8688,
    lon: 151.2093,
    temperature: 22.3,
    clouds: 25,
    weatherMain: "Clear",
    rain: null,
    snow: null
};

const melbourneWeather = {
    city: "Melbourne",
    lat: -37.8136,
    lon: 144.9631,
    temperature: 16.8,
    clouds: 60,
    weatherMain: "Clouds",
    rain: { "1h": 0.3 },
    snow: null
};

const tokyoWeather = {
    city: "Tokyo",
    lat: 35.6895,
    lon: 139.6917,
    temperature: 27.1,
    clouds: 10,
    weatherMain: "Clear",
    rain: null,
    snow: null
};

const seoulWeather = {
    city: "Seoul",
    lat: 37.5665,
    lon: 126.978,
    temperature: 24.5,
    clouds: 40,
    weatherMain: "Clouds",
    rain: { "1h": 0.2 },
    snow: null
};

// 현재 날짜 및 계절 상태 전역 변수
let currentDate = new Date();
let currentSeason = null;

// 위치 정보 가져오기 (성공시 getWeather 호출)
// 브라우저 지원 확인 후 실행
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, fail);
} else {
    console.warn('Geolocation이 지원되지 않는 브라우저입니다.');
    // 기본 날씨 데이터로 폴백
    setRandomWeatherUI();
}

//현재 위치 가져오기
function success(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    getWeather(lat, lon);
}

function fail() {
    alert('위치 정보를 가져올 수 없습니다. Failed to get location data');
}

// Get the weather data
async function getWeather(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`
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

        console.log("🌤️ 현재 날씨 정보:", weatherData);

        // UI 업데이트 함수 호출 예시
        updateWeatherUI(weatherData);

    } catch (error) {
        alert('날씨 정보를 불러오는 중 오류 발생: ' + error.message);
    }
}

// 날짜로부터 계절 계산 (북반구/남반구 고려)
export function getSeasonByDate(date, latitude = 37) {
    const month = date.getMonth() + 1;
    const isNorth = latitude >= 0;
    if (isNorth) {
        if ([3,4,5].includes(month)) return 'spring';
        if ([6,7,8].includes(month)) return 'summer';
        if ([9,10,11].includes(month)) return 'autumn';
        return 'winter';
    } else {
        if ([9,10,11].includes(month)) return 'spring';
        if ([12,1,2].includes(month)) return 'summer';
        if ([3,4,5].includes(month)) return 'autumn';
        return 'winter';
    }
}


function syncWeatherToScene(weatherMain) {
    switch (weatherMain) {
        case 'Clear':
            env.setWeather('sunny');
            break;
        case 'Clouds':
            env.setWeather('cloudy');
            break;
        case 'Rain':
        case 'Drizzle':
            env.setWeather('rainy');
            break;
        case 'Snow':
            env.setWeather('snowy');
            break;
        case 'Thunderstorm':
        case 'Squall':
        case 'Tornado':
            env.setWeather('stormy');
            break;
        case 'Mist':
        case 'Fog':
        case 'Haze':
        case 'Smoke':
        case 'Dust':
        case 'Sand':
        case 'Ash':
            env.setWeather('foggy');
            break;
        default:
            // If undefined at boot, delay once after scene is ready
            try { env.setWeather('sunny'); } catch(e) {
                setTimeout(()=> env.setWeather('sunny'), 100);
            }
    }
}

// ===================== 시계/날짜 UI =====================
export function updateClock() {
    const now = new Date();
    const timeElement = document.getElementById('time');
    const dateElement = document.getElementById('date');
    if (timeElement)
        timeElement.textContent = now.toLocaleTimeString('en', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    if (dateElement)
        dateElement.textContent = now.toLocaleDateString('en', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
        });
}

// ===================== 계절 UI =====================

export function updateSeason(latitude) {

    if (typeof latitude !== 'number') {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => updateSeason(pos.coords.latitude),
                () => updateSeason(-37.8136)
            );
            return;
        } else {
            latitude = -37.8136;
        }
    }
    const now = new Date();
    const seasonName = getSeasonByDate(now, latitude);
    const seasons = document.querySelectorAll('.season-mark');
    const seasonIndexMap = { spring: 0, summer: 1, autumn: 2, winter: 3 };
    const currentSeasonIndex = seasonIndexMap[seasonName];

    seasons.forEach((season, index) => {
        season.classList.toggle('current-season', index === currentSeasonIndex);
        // 마커 관리
        let marker = season.querySelector('.season-marker');
        if (marker) marker.remove();
        if (index === currentSeasonIndex) {
            marker = document.createElement('div');
            marker.className = 'season-marker';
            season.appendChild(marker);
        }
    });
}

// ===================== 날씨 데이터 fetch 및 UI =====================
async function fetchWeather(lat, lon) {
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`
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

function setRandomWeatherUI() {
    document.getElementById('temperature').textContent = `${Math.floor(Math.random() * 35) + 10}°C`;
    document.getElementById('condition').textContent = ['Sunny','Cloudy','Rainy','Snow'][Math.floor(Math.random()*4)];
    document.getElementById('humidity').textContent = `${Math.floor(Math.random() * 100)}%`;
    document.getElementById('wind').textContent = `${Math.floor(Math.random() * 30)} km/h`;
    if (document.getElementById('location'))
        document.getElementById('location').textContent = '-';
}

// 날씨 UI 동기화
export function updateWeatherUI() {
    if (!navigator.geolocation) {
        setRandomWeatherUI();
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
            const weather = await fetchWeather(lat, lon);
            document.getElementById('temperature').textContent = weather.temperature !== null ? `${Math.round(weather.temperature)}°C` : '-';
            document.getElementById('condition').textContent = weather.condition || '-';
            document.getElementById('humidity').textContent = weather.humidity !== null ? `${weather.humidity}%` : '-';
            document.getElementById('wind').textContent = weather.wind !== null ? `${Math.round(weather.wind)} km/h` : '-';
            if (document.getElementById('location'))
                document.getElementById('location').textContent = weather.city || '-';
        } catch (e) {
            setRandomWeatherUI();
        }
    }, () => setRandomWeatherUI());
}

// ===================== Forecast UI // Random Generation ====================
export function updateForecast() {
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
            <div class="forecast-condition">${['Sunny','Cloudy','Rain','Snow'][Math.floor(Math.random()*4)]}</div>
        `;
        forecastContainer.appendChild(item);
        const mark = document.createElement('div');
        mark.className = `time-mark${i === 0 ? ' today' : ''}`;
        mark.innerHTML = `<span class="time-label">${dateStr}</span>`;
        timeRuler.appendChild(mark);
    }
}

// ===================== 초기화 =====================
export function initSeasonSyncUtil() {
    updateClock();
    updateSeason();
    updateWeatherUI();
    updateForecast();
    syncWeatherToScene();

    setInterval(updateClock, 1000);
    setInterval(() => updateSeason(), 60000);
    setInterval(updateWeatherUI, 600000); // 10분마다 날씨 갱신
}