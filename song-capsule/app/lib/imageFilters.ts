/**
 * imageFilters.ts
 * Instax / Polaroid aesthetic — bright, lifted shadows, neutral-cool tone.
 * Matches the reference Instax Mini photo style.
 */

export interface FilterConfig {
    /** How much to lift shadow values (0–60). Higher = more faded/bright look */
    shadowLift: number;
    /** 0–1 desaturation amount (0 = keep colour, 1 = full grey) */
    desaturation: number;
    /** Contrast scale around midpoint (1 = unchanged, 0.9 = softer) */
    contrastFactor: number;
    /** 0–1 opacity of grain overlay */
    grainAmount: number;
    /** 0–1 strength of the corner vignette */
    vignetteStrength: number;
    /** RGBA tint to mix in (for very subtle cool or warm push) */
    tint: { r: number; g: number; b: number; strength: number };
}

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
    shadowLift: 20,        // slightly lifted blacks for vintage B&W
    desaturation: 1.0,     // full B&W
    contrastFactor: 1.08,  // good contrast
    grainAmount: 0.15,     // visible grain
    vignetteStrength: 0.30,// classic vignette
    tint: { r: 240, g: 240, b: 240, strength: 0.0 }, // neutral
};

export function applyVintageFilter(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number,
    config: FilterConfig = DEFAULT_FILTER_CONFIG
): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const mid = 128;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 1. Shadow lift — pull dark pixels up to a minimum
        r = config.shadowLift + r * ((255 - config.shadowLift) / 255);
        g = config.shadowLift + g * ((255 - config.shadowLift) / 255);
        b = config.shadowLift + b * ((255 - config.shadowLift) / 255);

        // 2. Soft contrast (pull toward midpoint)
        r = mid + (r - mid) * config.contrastFactor;
        g = mid + (g - mid) * config.contrastFactor;
        b = mid + (b - mid) * config.contrastFactor;

        // 3. Slight desaturation
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        r = r + (lum - r) * config.desaturation;
        g = g + (lum - g) * config.desaturation;
        b = b + (lum - b) * config.desaturation;

        // 4. Cool-neutral tint (very light)
        const { r: tr, g: tg, b: tb, strength: ts } = config.tint;
        r = r + (tr - r) * ts;
        g = g + (tg - g) * ts;
        b = b + (tb - b) * ts;

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imageData, 0, 0);

    // 5. Corner vignette
    applyVignette(ctx, width, height, config.vignetteStrength);
}

function applyVignette(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number,
    strength: number
): void {
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.max(width, height) * 0.78;
    const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}
