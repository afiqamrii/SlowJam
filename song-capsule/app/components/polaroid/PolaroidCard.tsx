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
    const [rendering, setRendering] = useState(false);

    const exportH = FORMAT_HEIGHTS[format];
    const previewH = Math.round(exportH * (PREVIEW_W / EXPORT_WIDTH));

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
        }).then(() => { if (!cancelled) setRendering(false); })
            .catch(() => { if (!cancelled) setRendering(false); });

        return () => { cancelled = true; };
    }, [croppedImageCanvas, trackName, artistName, albumArtUrl, message, receiverName, format]);

    return (
        <div className="flex flex-col items-center gap-2">
            <div style={{ position: 'relative', width: PREVIEW_W, height: previewH }}>
                <canvas
                    ref={canvasRef}
                    width={EXPORT_WIDTH}
                    height={exportH}
                    style={{ width: PREVIEW_W, height: previewH, borderRadius: 10, display: 'block' }}
                />
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
