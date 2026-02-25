/**
 * useLetterExport.ts
 * Handles the full PNG export and download flow for letters.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { renderLetterToCanvas, type LetterRenderOptions } from '../lib/letterRenderer';
import { preloadFonts } from '../lib/canvasRenderer'; // Reuse font preloading

export interface LetterExportState {
    isExporting: boolean;
    exportPNG: (options: LetterRenderOptions) => Promise<void>;
}

export function useLetterExport(): LetterExportState {
    const [isExporting, setIsExporting] = useState(false);
    const lastExport = useRef<number>(0);

    const exportPNG = useCallback(async (options: LetterRenderOptions) => {
        // Debounce — ignore clicks within 700ms of the last export
        const now = Date.now();
        if (now - lastExport.current < 700) return;
        lastExport.current = now;

        setIsExporting(true);

        try {
            // Ensure fonts are ready before drawing text
            await preloadFonts();

            const canvas = document.createElement('canvas');
            await renderLetterToCanvas(canvas, options);

            // Convert to blob and trigger download
            await new Promise<void>((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        const sanitizedName = (options.receiverName || '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                        a.download = sanitizedName ? `slow-jam-letter-${sanitizedName}.png` : `slow-jam-letter-${Date.now()}.png`;
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
            console.error('[useLetterExport] Export failed:', err);
        } finally {
            setIsExporting(false);
        }
    }, []);

    return { isExporting, exportPNG };
}
