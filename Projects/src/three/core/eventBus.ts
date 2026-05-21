// Typed pub/sub event bus for Three.js ↔ React communication

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeType = 'day' | 'night';

interface EventPayloadMap {
    'weather:change': WeatherType;
    'season:change': SeasonType;
    'time:change': TimeType;
}

type EventKey = keyof EventPayloadMap;
type Handler<K extends EventKey> = (payload: EventPayloadMap[K]) => void;

const typeToHandlers = new Map<string, Array<(p: any) => void>>();

export function on<K extends EventKey>(type: K, handler: Handler<K>): () => void {
    const arr = typeToHandlers.get(type) ?? [];
    arr.push(handler);
    typeToHandlers.set(type, arr);
    return () => off(type, handler);
}

export function off<K extends EventKey>(type: K, handler: Handler<K>): void {
    const arr = typeToHandlers.get(type);
    if (!arr) return;
    const idx = arr.indexOf(handler);
    if (idx >= 0) arr.splice(idx, 1);
}

export function emit<K extends EventKey>(type: K, payload: EventPayloadMap[K]): void {
    const arr = typeToHandlers.get(type) ?? [];
    for (const h of arr) h?.(payload);
}
