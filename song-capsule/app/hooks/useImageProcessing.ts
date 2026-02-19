/**
 * useImageProcessing.ts
 * Manages upload, crop state, zoom, and applies canvas filter to produce
 * a processed preview DataURL and an off-screen HTMLCanvasElement for export.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Area } from 'react-easy-crop';
import { applyVintageFilter, DEFAULT_FILTER_CONFIG, type FilterConfig } from '../lib/imageFilters';

export interface ImageProcessingState {
    rawSrc: string | null;
    zoom: number;
    crop: { x: number; y: number };
    cropPixels: Area | null;
    processedDataUrl: string | null;
    /** Ready-to-use canvas with the filtered, cropped image at target size */
    processedCanvas: HTMLCanvasElement | null;
    isProcessing: boolean;
    setRawSrc: (src: string | null) => void;
    setZoom: (z: number) => void;
    setCrop: (c: { x: number; y: number }) => void;
    onCropComplete: (_: Area, croppedPixels: Area) => void;
}

const OUTPUT_SIZE = 756; // internal canvas size for the cropped image

export function useImageProcessing(
    filterConfig: FilterConfig = DEFAULT_FILTER_CONFIG
): ImageProcessingState {
    const [rawSrc, setRawSrc] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [cropPixels, setCropPixels] = useState<Area | null>(null);
    const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);
    const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const imageRef = useRef<HTMLImageElement | null>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
        setCropPixels(croppedPixels);
    }, []);

    // Reprocess whenever cropPixels changes (debounced)
    useEffect(() => {
        if (!rawSrc || !cropPixels) return;

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(async () => {
            setIsProcessing(true);
            try {
                const dataUrl = await processCrop(rawSrc, cropPixels, imageRef, filterConfig);
                setProcessedDataUrl(dataUrl.dataUrl);
                setProcessedCanvas(dataUrl.canvas);
            } finally {
                setIsProcessing(false);
            }
        }, 180);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawSrc, cropPixels]);

    return {
        rawSrc,
        zoom,
        crop,
        cropPixels,
        processedDataUrl,
        processedCanvas,
        isProcessing,
        setRawSrc,
        setZoom,
        setCrop,
        onCropComplete,
    };
}

async function processCrop(
    src: string,
    pixels: Area,
    imageRef: React.MutableRefObject<HTMLImageElement | null>,
    filterConfig: FilterConfig
): Promise<{ dataUrl: string; canvas: HTMLCanvasElement }> {
    return new Promise((resolve, reject) => {
        const img = imageRef.current ?? new Image();
        imageRef.current = img;
        img.crossOrigin = 'anonymous';

        const doProcess = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = OUTPUT_SIZE;
                canvas.height = OUTPUT_SIZE;
                const ctx = canvas.getContext('2d')!;

                ctx.drawImage(
                    img,
                    pixels.x, pixels.y, pixels.width, pixels.height,
                    0, 0, OUTPUT_SIZE, OUTPUT_SIZE
                );

                // Filter removed: applyVintageFilter(ctx, OUTPUT_SIZE, OUTPUT_SIZE, filterConfig);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                resolve({ dataUrl, canvas });
            } catch (err) {
                reject(err);
            }
        };

        if (img.src === src && img.complete) {
            doProcess();
        } else {
            img.onload = doProcess;
            img.onerror = reject;
            img.src = src;
        }
    });
}
