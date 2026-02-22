'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { APP_VERSION, RELEASES } from '@/app/lib/changelog';

const STORAGE_KEY = 'slowjam_seen_version';

export default function WhatsNewBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (seen !== APP_VERSION) setVisible(true);
    }, []);

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY, APP_VERSION);
        setVisible(false);
    };

    const latest = RELEASES[0];

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    // Sits just below the fixed navbar (h-14 = 3.5rem)
                    className="fixed top-14 left-0 right-0 z-40 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-sans font-semibold text-white"
                    style={{
                        background: 'linear-gradient(90deg, #d97757 0%, #c4a77d 60%, #8c9b78 100%)',
                    }}
                >
                    <Sparkles size={14} className="shrink-0 opacity-80" />

                    <span className="text-center text-xs sm:text-sm leading-snug">
                        ✨ <span className="font-bold">v{latest.version}</span> just dropped —{' '}
                        {latest.highlights.map(h => h.title).join(', ')}
                    </span>

                    <button
                        onClick={dismiss}
                        className="absolute right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
                        aria-label="Dismiss"
                    >
                        <X size={14} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
