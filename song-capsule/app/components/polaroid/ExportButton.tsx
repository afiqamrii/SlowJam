'use client';

/**
 * ExportButton.tsx
 * Download button for the 1080×1350 PNG polaroid card.
 */

import { Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExportButtonProps {
    onClick: () => void;
    isExporting: boolean;
    disabled?: boolean;
}

export default function ExportButton({ onClick, isExporting, disabled }: ExportButtonProps) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled || isExporting}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base transition-all my-4"
            style={{
                background: disabled
                    ? '#c8b89a'
                    : 'linear-gradient(135deg, #d97757, #c0684b)',
                color: '#fff',
                boxShadow: disabled ? 'none' : '0 4px 20px rgba(217,119,87,0.4)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                fontFamily: 'var(--font-gloria), cursive',
            }}
        >
            {isExporting ? (
                <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating PNG…
                </>
            ) : (
                <>
                    <Download size={20} />
                    Save Polaroid Image
                </>
            )}
        </motion.button>
    );
}
