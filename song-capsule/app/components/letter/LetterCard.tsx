'use client';

/**
 * LetterCard.tsx
 * Canvas-rendered preview for letters.
 */

import { useEffect, useRef, useState } from 'react';
import { renderLetterToCanvas, EXPORT_WIDTH, FORMAT_HEIGHTS, type ExportFormat } from '@/app/lib/letterRenderer';

interface LetterCardProps {
    bgImageSrc: string;
    message: string;
    trackName: string;
    artistName: string;
    albumArtUrl?: string;
    receiverName?: string;
    signOff?: string;
    senderName?: string;
    format?: ExportFormat;
}

const PREVIEW_W = 300;

function makePreviewPng(sourceCanvas: HTMLCanvasElement, previewW: number, previewH: number) {
    const dpr = Math.max(2, Math.min(window.devicePixelRatio || 1, 3));
    const targetW = Math.max(1, Math.round(previewW * dpr));
    const targetH = Math.max(1, Math.round(previewH * dpr));

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

export default function LetterCard({
    bgImageSrc,
    message,
    trackName,
    artistName,
    albumArtUrl,
    receiverName,
    signOff,
    senderName,
    format = 'ig',
}: LetterCardProps) {
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

        renderLetterToCanvas(canvasRef.current, {
            bgImageSrc,
            message: message || '',
            trackName: trackName || '—',
            artistName: artistName || '—',
            albumArtUrl,
            receiverName,
            signOff,
            senderName,
            format,
        }).then(() => {
            if (!cancelled && canvasRef.current) {
                setImgSrc(makePreviewPng(canvasRef.current, previewWidth, previewH));
                setRendering(false);
            }
        }).catch(() => {
            if (!cancelled) setRendering(false);
        });

        return () => { cancelled = true; };
    }, [bgImageSrc, trackName, artistName, albumArtUrl, message, receiverName, signOff, senderName, format, previewWidth, previewH]);

    return (
        <div className="flex flex-col items-center gap-2 w-full">
            <div ref={frameRef} style={{ position: 'relative', width: '100%', maxWidth: PREVIEW_W, aspectRatio: `${EXPORT_WIDTH} / ${exportH}` }}>
                <canvas
                    ref={canvasRef}
                    width={EXPORT_WIDTH}
                    height={exportH}
                    style={{ display: 'none' }}
                />

                {imgSrc && (
                    <img
                        src={imgSrc}
                        alt="Letter Preview"
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
