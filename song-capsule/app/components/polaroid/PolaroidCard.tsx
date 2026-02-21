'use client';

/**
 * PolaroidCard.tsx
 * Canvas-rendered preview — identical to export. Preview = Download.
 */

import { useEffect, useRef, useState } from 'react';
import { renderPolaroidToCanvas, EXPORT_WIDTH, FORMAT_HEIGHTS, type ExportFormat } from '@/app/lib/canvasRenderer';

interface PolaroidCardProps {
    croppedImageCanvas: HTMLCanvasElement | null;
    trackName: string;
    artistName: string;
    albumArtUrl?: string;
    message: string;
    receiverName?: string;
    format?: ExportFormat;
}

function makePlaceholderCanvas(size: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#d8cfc4';
    ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const cx = size / 2, cy = size / 2;
    ctx.strokeRect(cx - 26, cy - 18, 52, 36);
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return c;
}

const PREVIEW_W = 300;

function makePreviewPng(sourceCanvas: HTMLCanvasElement, previewW: number, previewH: number) {
    const dpr = Math.max(2, Math.min(window.devicePixelRatio || 1, 3));
    const targetW = Math.max(1, Math.round(previewW * dpr));
    const targetH = Math.max(1, Math.round(previewH * dpr));

    // Progressive downscaling reduces iOS Safari edge wobble on slightly rotated shapes.
    let currentCanvas: HTMLCanvasElement = sourceCanvas;
    let currentW = sourceCanvas.width;
    let currentH = sourceCanvas.height;

    while (currentW / 2 > targetW && currentH / 2 > targetH) {
        const stepCanvas = document.createElement('canvas');
        stepCanvas.width = Math.max(targetW, Math.round(currentW / 2));
        stepCanvas.height = Math.max(targetH, Math.round(currentH / 2));

        const stepCtx = stepCanvas.getContext('2d');
        if (!stepCtx) break;
        stepCtx.imageSmoothingEnabled = true;
        stepCtx.imageSmoothingQuality = 'high';
        stepCtx.drawImage(currentCanvas, 0, 0, stepCanvas.width, stepCanvas.height);

        currentCanvas = stepCanvas;
        currentW = stepCanvas.width;
        currentH = stepCanvas.height;
    }

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = targetW;
    outputCanvas.height = targetH;

    const outCtx = outputCanvas.getContext('2d');
    if (!outCtx) return sourceCanvas.toDataURL('image/png');
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(currentCanvas, 0, 0, targetW, targetH);
    return outputCanvas.toDataURL('image/png');
}

export default function PolaroidCard({
    croppedImageCanvas,
    trackName,
    artistName,
    albumArtUrl,
    message,
    receiverName,
    format = 'ig',
}: PolaroidCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const [rendering, setRendering] = useState(false);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [previewWidth, setPreviewWidth] = useState(PREVIEW_W);

    const exportH = FORMAT_HEIGHTS[format];
    const previewH = exportH * (previewWidth / EXPORT_WIDTH);

    useEffect(() => {
        const frame = frameRef.current;
        if (!frame || typeof ResizeObserver === 'undefined') return;

        const syncWidth = () => {
            const next = Math.max(1, Math.round(Math.min(frame.getBoundingClientRect().width, PREVIEW_W)));
            setPreviewWidth((prev) => (prev === next ? prev : next));
        };

        syncWidth();
        const observer = new ResizeObserver(syncWidth);
        observer.observe(frame);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!canvasRef.current) return;
        let cancelled = false;
        setRendering(true);
        const img = croppedImageCanvas ?? makePlaceholderCanvas(724);

        renderPolaroidToCanvas(canvasRef.current, {
            croppedImageCanvas: img,
            trackName: trackName || '—',
            artistName: artistName || '—',
            albumArtUrl: albumArtUrl ?? '',
            message: message || '',
            receiverName,
            format,
        }).then(() => {
            if (!cancelled && canvasRef.current) {
                // Generate the preview at the exact displayed size × DPR to avoid extra iOS Safari resampling.
                setImgSrc(makePreviewPng(canvasRef.current, previewWidth, previewH));
                setRendering(false);
            }
        })
            .catch(() => { if (!cancelled) setRendering(false); });

        return () => { cancelled = true; };
    }, [croppedImageCanvas, trackName, artistName, albumArtUrl, message, receiverName, format, previewWidth, previewH]);

    return (
        <div className="flex flex-col items-center gap-2">
            <div ref={frameRef} style={{ position: 'relative', width: '100%', maxWidth: PREVIEW_W, aspectRatio: `${EXPORT_WIDTH} / ${exportH}` }}>
                <canvas
                    ref={canvasRef}
                    width={EXPORT_WIDTH}
                    height={exportH}
                    style={{
                        display: 'none'
                    }}
                />

                {imgSrc && (
                    <img
                        src={imgSrc}
                        alt="Polaroid Preview"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: 10,
                            display: 'block',
                            imageRendering: 'auto',
                        }}
                    />
                )}
                {rendering && (
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: 10,
                        background: 'rgba(245,240,232,0.55)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(2px)',
                    }}>
                        <p style={{ fontSize: 11, color: '#8c7a64', fontFamily: 'var(--font-gloria), cursive' }}>
                            rendering…
                        </p>
                    </div>
                )}
            </div>
            <p style={{ fontSize: 11, color: '#b0a090', fontFamily: 'var(--font-gloria), cursive' }}>
                preview · {format === 'ig' ? '1080 × 1350' : '1080 × 1920'}
            </p>
        </div>
    );
}
