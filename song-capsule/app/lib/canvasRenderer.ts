/**
 * canvasRenderer.ts
 * IG (1080×1350) and TikTok (1080×1920) polaroid export.
 * Smooth warm cream background · Gloria Hallelujah font · clean minimal aesthetic.
 */

import { applyVintageFilter, DEFAULT_FILTER_CONFIG, type FilterConfig } from './imageFilters';
import { drawGrainTexture } from './grainTexture';

export type ExportFormat = 'ig' | 'tiktok';
export const EXPORT_WIDTH = 1080;
export const FORMAT_HEIGHTS: Record<ExportFormat, number> = {
    ig: 1350,
    tiktok: 1920,
};

// ─── Card dimensions ──────────────────────────────────────────────────────────
const CARD_W = 800;
const CARD_H = 1080;
const CARD_RADIUS = 14;
const CARD_ROT = 0.007;
const SIDE_PAD = 38;
const PHOTO_SIZE = CARD_W - SIDE_PAD * 2;  // 724px
const BOTTOM_H = CARD_H - SIDE_PAD - PHOTO_SIZE;  // ~318px

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RenderOptions {
    croppedImageCanvas: HTMLCanvasElement;
    trackName: string;
    artistName: string;
    albumArtUrl: string;
    message: string;
    receiverName?: string;
    filterConfig?: FilterConfig;
    format?: ExportFormat;
}

// ─── Font preloading ──────────────────────────────────────────────────────────
export async function preloadFonts(): Promise<void> {
    if (typeof document === 'undefined') return;
    await Promise.allSettled([
        document.fonts.load('48px "Gloria Hallelujah"'),
        document.fonts.load('36px "Gloria Hallelujah"'),
        document.fonts.load('28px "Gloria Hallelujah"'),
        document.fonts.load('20px "Gloria Hallelujah"'),
        document.fonts.load('14px "Gloria Hallelujah"'),
    ]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
    const lines: string[] = [];
    for (const para of text.split('\n')) {
        if (!para.trim()) { lines.push(''); continue; }
        let cur = '';
        for (const word of para.split(' ')) {
            const test = cur ? `${cur} ${word}` : word;
            if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = word; }
            else { cur = test; }
        }
        if (cur) lines.push(cur);
    }
    return lines;
}

async function loadBitmap(url: string): Promise<ImageBitmap | null> {
    try {
        const res = await fetch(url, { mode: 'cors' });
        return await createImageBitmap(await res.blob());
    } catch { return null; }
}

// ─── Background — very smooth warm cream (like the reference photo) ───────────
function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Near-flat warm cream — barely-there radial so it's smooth, not banded
    const cx = w / 2, cy = h * 0.45;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.85);
    g.addColorStop(0, '#f9f4ea');   // soft warm white centre
    g.addColorStop(0.7, '#f4ece0');   // gentle linen
    g.addColorStop(1, '#ede4d4');   // warm parchment edge
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Very faint paper grain — just enough to feel like physical paper
    drawGrainTexture(ctx, 0, 0, w, h, 0.012, 0.14);
}

// ─── TikTok header ────────────────────────────────────────────────────────────
function drawTikTokHeader(ctx: CanvasRenderingContext2D, w: number, topH: number, receiverName?: string, format: ExportFormat = 'tiktok') {
    const cx = w / 2;
    const label = receiverName
        ? `Hey ${receiverName}, this one's for you ✦`
        : `hey, this one's for you ✦`;

    if (format === 'ig') {
        // IG: compact single line centred in the small top space
        ctx.save();
        ctx.fillStyle = '#4a3426';
        ctx.font = '30px "Gloria Hallelujah", cursive';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(74,52,38,0.10)';
        ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
        ctx.fillText(label, cx, topH * 0.52);
        ctx.restore();
        return;
    }

    // TikTok: full decorated version
    // Soft floating notes
    ctx.save();
    ctx.font = '40px "Gloria Hallelujah", cursive';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const noteData: [string, number, number, number][] = [
        ['♪', cx - 280, topH * 0.38, 0.15],
        ['♫', cx + 265, topH * 0.50, 0.13],
        ['♩', cx - 175, topH * 0.70, 0.10],
        ['♬', cx + 185, topH * 0.24, 0.12],
    ];
    for (const [note, x, y, alpha] of noteData) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#6b4c35';
        ctx.fillText(note, x, y);
    }
    ctx.restore();

    // Main label — warm deep brown, handwritten feel
    ctx.save();
    ctx.fillStyle = '#4a3426';
    ctx.font = '52px "Gloria Hallelujah", cursive';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(74,52,38,0.12)';
    ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
    ctx.fillText(label, cx, topH * 0.52);
    ctx.restore();

    // Dotted underline
    ctx.save();
    ctx.strokeStyle = 'rgba(120,90,65,0.28)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 8]);
    ctx.beginPath();
    ctx.moveTo(cx - 210, topH * 0.68);
    ctx.lineTo(cx + 210, topH * 0.68);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
}

// ─── TikTok footer ────────────────────────────────────────────────────────────
function drawTikTokFooter(ctx: CanvasRenderingContext2D, w: number, startY: number, bottomH: number) {
    const cx = w / 2;
    const midY = startY + bottomH * 0.42;

    // Big SlowJam wordmark — deep warm brown
    ctx.save();
    ctx.fillStyle = '#4a3426';
    ctx.font = '68px "Gloria Hallelujah", cursive';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(74,52,38,0.14)';
    ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
    ctx.fillText('SlowJam', cx, midY);
    ctx.restore();

    // Tagline
    ctx.save();
    ctx.fillStyle = 'rgba(100,75,55,0.50)';
    ctx.font = '22px "Gloria Hallelujah", cursive';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('songs speak louder than words  ✦', cx, midY + 56);
    ctx.restore();

    // Thin double rule below tagline
    ctx.save();
    ctx.strokeStyle = 'rgba(120,90,65,0.20)';
    ctx.lineWidth = 1;
    for (const off of [-8, 8]) {
        ctx.beginPath();
        ctx.moveTo(cx - 120, midY + 96 + off);
        ctx.lineTo(cx + 120, midY + 96 + off);
        ctx.stroke();
    }
    ctx.restore();
}

// ─── Song section (no Spotify pill) ──────────────────────────────────────────
async function drawSongSection(
    ctx: CanvasRenderingContext2D,
    cx: number, y: number,
    trackName: string, artistName: string, albumArtUrl: string
) {
    let curY = y + 6;

    // Dotted divider
    ctx.save();
    ctx.strokeStyle = 'rgba(160,135,110,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 7]);
    ctx.beginPath();
    ctx.moveTo(cx - 90, curY); ctx.lineTo(cx + 90, curY);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    curY += 18;

    // Album art circle
    const TR = 24;
    const thumb = await loadBitmap(albumArtUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, curY + TR, TR, 0, Math.PI * 2);
    ctx.clip();
    if (thumb) { ctx.drawImage(thumb, cx - TR, curY, TR * 2, TR * 2); thumb.close(); }
    else { ctx.fillStyle = '#d4c4b0'; ctx.fill(); }
    ctx.restore();
    // Thin ring
    ctx.save();
    ctx.strokeStyle = 'rgba(160,135,110,0.40)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, curY + TR, TR + 2, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    curY += TR * 2 + 12;

    // Track name — dark brown
    ctx.save();
    ctx.fillStyle = '#3e3028';
    ctx.font = '20px "Gloria Hallelujah", cursive';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    let name = trackName;
    while (ctx.measureText(name).width > 360 && name.length > 2) name = name.slice(0, -1);
    if (name !== trackName) name += '…';
    ctx.fillText(name, cx, curY);
    curY += 28;

    // Artist — muted
    ctx.fillStyle = 'rgba(80,62,44,0.50)';
    ctx.font = '15px "Gloria Hallelujah", cursive';
    let artist = artistName;
    while (ctx.measureText(artist).width > 300 && artist.length > 2) artist = artist.slice(0, -1);
    if (artist !== artistName) artist += '…';
    ctx.fillText(artist, cx, curY);
    ctx.restore();
    // No Spotify pill — clean finish
}

// ─── Main render ──────────────────────────────────────────────────────
export async function renderPolaroidToCanvas(
    canvas: HTMLCanvasElement,
    options: RenderOptions
): Promise<void> {
    const { croppedImageCanvas, trackName, artistName, albumArtUrl, message, receiverName, filterConfig, format = 'ig' } = options;
    const fConfig = filterConfig ?? DEFAULT_FILTER_CONFIG;

    const W = EXPORT_WIDTH;
    const H = FORMAT_HEIGHTS[format];
    canvas.width = W; canvas.height = H;

    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Smooth cream background
    drawBackground(ctx, W, H);

    // 2. Card position
    const CARD_X = (W - CARD_W) / 2;
    const CARD_Y = format === 'tiktok' ? 310 : Math.floor((H - CARD_H) / 2) - 20;
    const PHOTO_X = CARD_X + SIDE_PAD;
    const PHOTO_Y = CARD_Y + SIDE_PAD;
    const BOTTOM_Y = PHOTO_Y + PHOTO_SIZE;

    // 3. Header label (both IG and TikTok)
    drawTikTokHeader(ctx, W, CARD_Y, receiverName, format);

    // 4. Polaroid card
    ctx.save();
    const cxC = CARD_X + CARD_W / 2, cyC = CARD_Y + CARD_H / 2;
    ctx.translate(cxC, cyC); ctx.rotate(CARD_ROT); ctx.translate(-cxC, -cyC);

    // Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(80,55,30,0.22)';
    ctx.shadowBlur = 52; ctx.shadowOffsetY = 16;
    rrect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, CARD_RADIUS);
    ctx.fillStyle = '#fefcf9'; ctx.fill();
    ctx.restore();

    // Card body
    rrect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, CARD_RADIUS);
    ctx.fillStyle = '#fefcf9'; ctx.fill();

    // 5. Photo with filter
    const fc = document.createElement('canvas');
    fc.width = fc.height = PHOTO_SIZE;
    const fctx = fc.getContext('2d')!;
    fctx.drawImage(croppedImageCanvas, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
    applyVintageFilter(fctx, PHOTO_SIZE, PHOTO_SIZE, fConfig);

    ctx.save();
    ctx.beginPath(); ctx.rect(PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE); ctx.clip();
    ctx.drawImage(fc, PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE);
    drawGrainTexture(ctx, PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE, 0.02, 0.20);
    ctx.restore();

    // 6. Bottom strip
    const contentCX = CARD_X + CARD_W / 2;
    const SONG_H = 148;   // album art + track + artist (no Spotify pill)
    const MSG_H = BOTTOM_H - SONG_H;

    // "Hey, Name" — black, bold-feeling, with top padding
    let curContentY = BOTTOM_Y + 22;   // +22 top padding
    if (receiverName) {
        ctx.save();
        ctx.fillStyle = '#1a1410';    // near-black
        ctx.font = '34px "Gloria Hallelujah", cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`Hey, ${receiverName}`, contentCX, curContentY);
        ctx.restore();
        curContentY += 52;
    }

    // Message — bigger font, auto-fit so nothing cuts off
    const msgMaxW = CARD_W - SIDE_PAD * 2 - 8;
    const msgAvailH = (BOTTOM_Y + MSG_H) - curContentY - 8;

    ctx.save();
    ctx.fillStyle = '#2e2318';    // deep warm brown (like handwriting)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Bigger starting sizes (+6 across all tiers)
    let fontSize = message.length > 200 ? 26 : message.length > 100 ? 32 : 38;
    ctx.font = `${fontSize}px "Gloria Hallelujah", cursive`;
    let lines = wrapText(ctx, message, msgMaxW);
    let lineH = fontSize * 1.65;
    let totalMH = lines.length * lineH;

    // Shrink until all lines fit
    while (totalMH > msgAvailH && fontSize > 14) {
        fontSize -= 1;
        ctx.font = `${fontSize}px "Gloria Hallelujah", cursive`;
        lines = wrapText(ctx, message, msgMaxW);
        lineH = fontSize * 1.65;
        totalMH = lines.length * lineH;
    }

    // Vertically center in space
    let ty = curContentY + Math.max(0, (msgAvailH - totalMH) / 2);
    for (const line of lines) {
        ctx.fillText(line, contentCX, ty);
        ty += lineH;
    }
    ctx.restore();

    // Song section (no Spotify pill)
    await drawSongSection(ctx, contentCX, BOTTOM_Y + MSG_H, trackName, artistName, albumArtUrl);

    ctx.restore(); // end card rotation

    // 7. TikTok footer
    if (format === 'tiktok') {
        const footerStart = CARD_Y + CARD_H + 18;
        drawTikTokFooter(ctx, W, footerStart, H - footerStart);
    }

    // 8. Watermark — "SlowJam", small, warm muted tone
    ctx.save();
    ctx.fillStyle = 'rgba(120,90,60,0.32)';   // warm muted brown (not terracotta, not black)
    ctx.font = '16px "Gloria Hallelujah", cursive';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('SlowJam ✦', W - 32, H - 24);
    ctx.restore();
}
