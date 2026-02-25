/**
 * letterRenderer.ts
 * IG (1080×1350) and TikTok (1080×1920) Letter export.
 * Draws text over a selected aesthetic background using the Gloria Hallelujah font.
 */

export type ExportFormat = 'ig' | 'tiktok';
export const EXPORT_WIDTH = 1080;
export const FORMAT_HEIGHTS: Record<ExportFormat, number> = {
    ig: 1350,
    tiktok: 1920,
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LetterRenderOptions {
    bgImageSrc: string;
    message: string;
    trackName: string;
    artistName: string;
    albumArtUrl?: string;
    receiverName?: string;
    signOff?: string;
    senderName?: string;
    format?: ExportFormat; // Deprecated, all use IG to keep 4:5 letter aspect
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Utility to parse markdown-like bold strings
// Returns an array of segments: { text: "hello", bold: false }, { text: "world", bold: true }
function parseBoldSegments(text: string) {
    const segments: { text: string; bold: boolean }[] = [];
    const parts = text.split(/(\*\*.*?\*\*)/g);
    for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            segments.push({ text: part.slice(2, -2), bold: true });
        } else if (part.length > 0) {
            segments.push({ text: part, bold: false });
        }
    }
    return segments;
}

// Measures width of a text composed of mixed bold/normal segments
function measureMixedText(ctx: CanvasRenderingContext2D, baseFont: string, segments: { text: string; bold: boolean }[]) {
    ctx.save();
    let totalW = 0;
    for (const seg of segments) {
        ctx.font = seg.bold ? `bold ${baseFont}` : baseFont;
        totalW += ctx.measureText(seg.text).width;
    }
    ctx.restore();
    return totalW;
}

function wrapTextWithBold(ctx: CanvasRenderingContext2D, text: string, maxW: number, baseFont: string): string[] {
    const lines: string[] = [];
    // Collapse all newlines and multiple spaces into a single space
    const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return [];

    let curLineWords: string[] = [];
    let curLineText = '';

    for (const word of cleanText.split(' ')) {
        const testText = curLineText ? `${curLineText} ${word}` : word;
        const testSegments = parseBoldSegments(testText);

        if (measureMixedText(ctx, baseFont, testSegments) > maxW && curLineText) {
            lines.push(curLineText);
            curLineText = word;
            curLineWords = [word];
        } else {
            curLineText = testText;
            curLineWords.push(word);
        }
    }
    if (curLineText) lines.push(curLineText);

    return lines;
}

function drawTextWithBold(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, baseFont: string, align: 'left' | 'center' = 'left') {
    const segments = parseBoldSegments(text);

    ctx.save();

    // Calculate starting X if center aligned
    let drawX = x;
    if (align === 'center') {
        const totalW = measureMixedText(ctx, baseFont, segments);
        drawX = x - (totalW / 2);
    }

    ctx.textAlign = 'left'; // Always draw left-to-right when combining segments

    for (const seg of segments) {
        ctx.font = seg.bold ? `bold ${baseFont}` : baseFont;
        ctx.fillText(seg.text, drawX, y);
        drawX += ctx.measureText(seg.text).width;
    }

    ctx.restore();
}

// Total rendered height, counting blank lines at full height for better spacing
function totalTextHeight(lines: string[], lineH: number): number {
    return lines.reduce((sum, l) => sum + (l === '' ? lineH : lineH), 0);
}

// ─── Background Drawing ───────────────────────────────────────────────────────
async function loadAndDrawBackground(ctx: CanvasRenderingContext2D, url: string, targetW: number, targetH: number): Promise<boolean> {
    // If it's a hex code, fill solid color and return early
    if (url.startsWith('#')) {
        ctx.fillStyle = url;
        ctx.fillRect(0, 0, targetW, targetH);
        return true;
    }

    try {
        const res = await fetch(url, { mode: 'no-cors' });
        const blob = await res.blob();
        const img = await createImageBitmap(blob);

        // Draw image covering the entire target area (object-fit: cover equivalent)
        const imgAspect = img.width / img.height;
        const targetAspect = targetW / targetH;

        let drawW, drawH, drawX, drawY;

        if (imgAspect > targetAspect) {
            // Image is wider than target
            drawH = targetH;
            drawW = img.height * targetAspect;
            drawX = (img.width - drawW) / 2;
            drawY = 0;
        } else {
            // Image is taller than or equal to target
            drawW = img.width;
            drawH = img.width / targetAspect;
            drawX = 0;
            drawY = (img.height - drawH) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH, 0, 0, targetW, targetH);
        return true;
    } catch {
        return false;
    }
}

async function loadBitmap(url: string): Promise<ImageBitmap | null> {
    try {
        const res = await fetch(url, { mode: 'cors' });
        return await createImageBitmap(await res.blob());
    } catch { return null; }
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ─── Letter Rendering ─────────────────────────────────────────────────────────
export async function renderLetterToCanvas(
    canvas: HTMLCanvasElement,
    options: LetterRenderOptions
): Promise<void> {
    const { bgImageSrc, message, trackName, artistName, albumArtUrl, receiverName, signOff, senderName, format = 'ig' } = options;

    const W = EXPORT_WIDTH;
    const H = FORMAT_HEIGHTS['ig']; // Always use IG (1080x1350) for letter, to keep correct line spacing bounds for text
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Draw Background
    const bgSuccess = await loadAndDrawBackground(ctx, bgImageSrc, W, H);
    if (!bgSuccess) {
        // Fallback color if background fails to load
        ctx.fillStyle = '#f9f4ea';
        ctx.fillRect(0, 0, W, H);
    }

    // Add a slight darkened overlay to ensure text readability against diverse backgrounds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(0, 0, W, H);

    // 2. Padding and Layout limits
    const PADDING_X = 120;
    const TOP_PADDING = 220;          // extra breathing room at top
    const BOTTOM_PADDING = 300;       // extra breathing room at bottom for song info
    const contentW = W - PADDING_X * 2;

    const cx = W / 2;
    let curY = TOP_PADDING;

    ctx.save();

    // Deep warm grey/brown for ink color
    ctx.fillStyle = 'rgba(50, 40, 35, 0.92)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.shadowColor = 'rgba(255, 255, 255, 0.15)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0.5;
    ctx.shadowOffsetY = 0.5;

    // 3. Sender / Receiver Greeting — smaller, elegant
    if (receiverName) {
        ctx.font = '38px "Gloria Hallelujah", cursive';
        ctx.fillText(`Dear ${receiverName},`, PADDING_X, curY);
        curY += 90;  // gap between greeting and body
    }

    // 4. Message Content
    let fontSize = message.length > 300 ? 32 : message.length > 150 ? 40 : 48;
    let baseFont = `${fontSize}px "Gloria Hallelujah", cursive`;
    ctx.font = baseFont;
    let lines = wrapTextWithBold(ctx, message, contentW, baseFont);
    let lineH = fontSize * 1.65;

    // Evaluate total height including sign-off
    const signOffText = signOff || 'With love,';
    const senderText = senderName || 'Someone';
    const signOffLines = ['', signOffText, senderText];
    let totalMH = totalTextHeight(lines.concat(signOffLines), lineH);

    // Dynamic scaling so it always fits
    const availableMessageHeight = H - BOTTOM_PADDING - curY;

    while (totalMH > availableMessageHeight && fontSize > 20) {
        fontSize -= 2;
        baseFont = `${fontSize}px "Gloria Hallelujah", cursive`;
        ctx.font = baseFont;
        lines = wrapTextWithBold(ctx, message, contentW, baseFont);
        lineH = fontSize * 1.65;
        totalMH = totalTextHeight(lines.concat(signOffLines), lineH);
    }

    // Start drawing top-down for realistic letter feel
    let ty = curY;
    for (const line of lines) {
        drawTextWithBold(ctx, line, PADDING_X, ty, baseFont, 'left');
        ty += lineH;
    }

    // Gap before sign-off — equal to one line height
    ty += lineH;

    // Sign-off in bold
    ctx.font = `bold ${fontSize}px "Gloria Hallelujah", cursive`;
    ctx.fillText(signOffText, PADDING_X, ty);
    ty += lineH * 0.85;

    // Sender name slightly smaller
    ctx.font = `${Math.round(fontSize * 0.9)}px "Gloria Hallelujah", cursive`;
    ctx.fillText(senderText, PADDING_X, ty);

    ctx.restore();

    // 5. Footer / Song Info
    const footerY = H - BOTTOM_PADDING + 100;

    ctx.save();
    ctx.fillStyle = '#3a2b22';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 4;

    // Soft dashed separator line
    ctx.strokeStyle = 'rgba(58, 43, 34, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 8]);
    ctx.beginPath();
    ctx.moveTo(PADDING_X, footerY - 50);
    ctx.lineTo(W - PADDING_X, footerY - 50);
    ctx.stroke();

    const songInfoStartX = PADDING_X;

    // Draw Album Art
    if (albumArtUrl) {
        const artSize = 100;
        const artLoader = await loadBitmap(albumArtUrl);
        if (artLoader) {
            ctx.save();
            rrect(ctx, songInfoStartX, footerY, artSize, artSize, 12);
            ctx.clip();
            ctx.drawImage(artLoader, songInfoStartX, footerY, artSize, artSize);
            ctx.restore();

            // Draw song text next to album cover
            let textY = footerY + 25;
            const textX = songInfoStartX + artSize + 25;

            ctx.font = '20px "Gloria Hallelujah", cursive';
            ctx.fillText(`Sent with`, textX, textY);

            textY += 30;
            ctx.font = 'bold 28px "Gloria Hallelujah", cursive';
            ctx.fillText(`${trackName}`, textX, textY);

            textY += 30;
            ctx.font = '18px "Gloria Hallelujah", cursive';
            ctx.fillStyle = 'rgba(58, 43, 34, 0.7)';
            ctx.fillText(`by ${artistName}`, textX, textY);
        }
    } else {
        // Fallback without album art, center aligned
        ctx.textAlign = 'center';
        let textY = footerY + 25;

        ctx.font = '24px "Gloria Hallelujah", cursive';
        ctx.fillText(`Sent with`, cx, textY);
        textY += 36;

        ctx.font = 'bold 32px "Gloria Hallelujah", cursive';
        ctx.fillText(`${trackName}`, cx, textY);
        textY += 36;

        ctx.font = '20px "Gloria Hallelujah", cursive';
        ctx.fillStyle = 'rgba(58, 43, 34, 0.7)';
        ctx.fillText(`by ${artistName}`, cx, textY);
    }

    ctx.restore();

    // 6. Watermark at the very bottom
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '18px "Gloria Hallelujah", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.fillText('Created via slowjam.xyz ✦', W / 2, H - 24);
    ctx.restore();
}
