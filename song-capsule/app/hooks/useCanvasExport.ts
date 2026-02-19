/**
 * useCanvasExport.ts
 * Handles the full 1080×1350 PNG export and download flow.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { renderPolaroidToCanvas, preloadFonts, type RenderOptions } from '../lib/canvasRenderer';

export interface CanvasExportState {
    isExporting: boolean;
    exportPNG: (options: RenderOptions) => Promise<void>;
}

export function useCanvasExport(): CanvasExportState {
    const [isExporting, setIsExporting] = useState(false);
    const lastExport = useRef<number>(0);

    const exportPNG = useCallback(async (options: RenderOptions) => {
        // Debounce — ignore clicks within 700ms of the last export
        const now = Date.now();
        if (now - lastExport.current < 700) return;
        lastExport.current = now;

        setIsExporting(true);

        try {
            // Ensure fonts are ready before drawing text
            await preloadFonts();

            const canvas = document.createElement('canvas');
            await renderPolaroidToCanvas(canvas, options);

            // Convert to blob and trigger download
            await new Promise<void>((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `slowjam-card-${Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        // Revoke after a short delay to ensure download started
                        setTimeout(() => URL.revokeObjectURL(url), 2000);
                        resolve();
                    },
                    'image/png',
                    1.0
                );
            });
        } catch (err) {
            console.error('[useCanvasExport] Export failed:', err);
        } finally {
            setIsExporting(false);
        }
    }, []);

    return { isExporting, exportPNG };
}
