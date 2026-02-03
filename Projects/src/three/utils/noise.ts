/**
 * =============================================
 * Simplex Noise - Procedural Terrain Generation
 * =============================================
 * Simple 2D noise implementation for terrain height
 */

// Permutation table (shuffled 0-255)
const p = new Uint8Array(512);
const perm = [
    151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,
    142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,
    203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,
    74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,
    220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,
    132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,
    186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,
    59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,
    70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
    178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,
    241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,
    176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,
    128,195,78,66,215,61,156,180
];
for (let i = 0; i < 256; i++) {
    p[i] = p[i + 256] = perm[i];
}

// Gradient vectors
const grad3 = [
    [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
    [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
    [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
];

function dot(g: number[], x: number, y: number): number {
    return g[0] * x + g[1] * y;
}

function fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
}

/**
 * 2D Perlin Noise
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns Noise value between -1 and 1
 */
export function noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = fade(x);
    const v = fade(y);
    
    const A = p[X] + Y;
    const B = p[X + 1] + Y;
    
    const g00 = grad3[p[A] % 12];
    const g10 = grad3[p[B] % 12];
    const g01 = grad3[p[A + 1] % 12];
    const g11 = grad3[p[B + 1] % 12];
    
    const n00 = dot(g00, x, y);
    const n10 = dot(g10, x - 1, y);
    const n01 = dot(g01, x, y - 1);
    const n11 = dot(g11, x - 1, y - 1);
    
    return lerp(
        lerp(n00, n10, u),
        lerp(n01, n11, u),
        v
    );
}

/**
 * Fractal Brownian Motion (fBm) - multiple octaves of noise
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param octaves - Number of noise layers (default: 4)
 * @param lacunarity - Frequency multiplier per octave (default: 2)
 * @param persistence - Amplitude multiplier per octave (default: 0.5)
 * @returns Noise value
 */
export function fbm(
    x: number, 
    y: number, 
    octaves = 4, 
    lacunarity = 2, 
    persistence = 0.5
): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
        value += noise2D(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }
    
    return value / maxValue;
}

/**
 * Get terrain height at grid position
 * @param gridX - Grid X position
 * @param gridZ - Grid Z position
 * @param scale - Noise scale (default: 0.1)
 * @param heightMultiplier - Max height variation (default: 3)
 * @returns Height offset (integer blocks)
 */
export function getTerrainHeight(
    gridX: number, 
    gridZ: number, 
    scale = 0.15, 
    heightMultiplier = 4
): number {
    const noiseValue = fbm(gridX * scale, gridZ * scale, 3);
    // Map from [-1, 1] to [0, 1] then to integer height
    const normalized = (noiseValue + 1) / 2;
    return Math.floor(normalized * heightMultiplier);
}
