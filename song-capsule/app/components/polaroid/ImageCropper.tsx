'use client';

/**
 * ImageCropper.tsx
 * Wraps react-easy-crop for square photo cropping with drag + pinch/scroll zoom.
 */

import { useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

interface ImageCropperProps {
    imageSrc: string;
    crop: { x: number; y: number };
    zoom: number;
    onCropChange: (crop: { x: number; y: number }) => void;
    onZoomChange: (zoom: number) => void;
    onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
}

export default function ImageCropper({
    imageSrc,
    crop,
    zoom,
    onCropChange,
    onZoomChange,
    onCropComplete,
}: ImageCropperProps) {
    const handleCropComplete = useCallback(
        (croppedArea: Area, croppedAreaPixels: Area) => {
            onCropComplete(croppedArea, croppedAreaPixels);
        },
        [onCropComplete]
    );

    return (
        /* Outer container — fixed height, relative so Cropper can use position:absolute internally */
        <div className="relative w-full" style={{ height: 340, background: '#1a0e07', borderRadius: 16, overflow: 'hidden' }}>
            <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={handleCropComplete}
                showGrid={false}
                style={{
                    containerStyle: { borderRadius: 16 },
                    cropAreaStyle: {
                        border: '2px solid rgba(217,119,87,0.85)',
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                    },
                }}
            />

            {/* Scroll-to-zoom hint */}
            <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs pointer-events-none select-none"
                style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}
            >
                Scroll to zoom · Drag to reposition
            </div>
        </div>
    );
}
