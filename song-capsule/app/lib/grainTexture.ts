/**
 * grainTexture.ts
 * Generates a film-grain / paper-noise texture onto a canvas region.
 * Uses OffscreenCanvas where available for better performance.
 */

/**
 * Draw subtle noise grain over the entire canvas region.
 * @param ctx   Target rendering context
 * @param x     Left offset of the region
 * @param y     Top offset of the region
 * @param width  Region width
 * @param height Region height
 * @param amount Opacity of grain pixels (0–1)
 * @param density 0–1 fraction of pixels that receive grain
 */
export function drawGrainTexture(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    amount: number = 0.04,
    density: number = 0.35
): void {
    ctx.save();
    ctx.globalAlpha = amount;

    // Build grain on an OffscreenCanvas if possible
    let grainImageData: ImageData;

    try {
        const oc = new OffscreenCanvas(width, height);
        const octx = oc.getContext('2d') as OffscreenCanvasRenderingContext2D;
        grainImageData = buildGrainImageData(octx, width, height, density);
        // Transfer back to main canvas via image bitmap
        const bitmap = oc.transferToImageBitmap();
        ctx.drawImage(bitmap, x, y, width, height);
        bitmap.close();
    } catch {
        // Fallback: build directly on the main context
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d')!;
        grainImageData = buildGrainImageData(tempCtx, width, height, density);
        tempCtx.putImageData(grainImageData, 0, 0);
        ctx.drawImage(tempCanvas, x, y, width, height);
    }

    ctx.restore();
}

function buildGrainImageData(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number,
    density: number
): ImageData {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < density) {
            const v = Math.random() > 0.5 ? 255 : 0; // white or black speck
            data[i] = v;
            data[i + 1] = v;
            data[i + 2] = v;
            data[i + 3] = Math.floor(Math.random() * 60 + 10); // subtle alpha
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return imageData;
}
