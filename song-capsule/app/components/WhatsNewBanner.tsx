'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { APP_VERSION, RELEASES } from '@/app/lib/changelog';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'slowjam_seen_version';

export default function WhatsNewBanner() {
    const [bannerVisible, setBannerVisible] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const router = useRouter();
    const latest = RELEASES[0];

    useEffect(() => {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (seen !== APP_VERSION) setBannerVisible(true);
    }, []);

    // Listen for event fired by the navbar WhatsNew button on mobile
    useEffect(() => {
        const handler = () => setModalOpen(true);
        window.addEventListener('slowjam:open-whats-new', handler);
        return () => window.removeEventListener('slowjam:open-whats-new', handler);
    }, []);

    const dismissBanner = (e: React.MouseEvent) => {
        e.stopPropagation();
        localStorage.setItem(STORAGE_KEY, APP_VERSION);
        setBannerVisible(false);
    };

    const openModal = () => {
        setModalOpen(true);
        localStorage.setItem(STORAGE_KEY, APP_VERSION);
        setBannerVisible(false);
    };

    const closeModal = () => setModalOpen(false);

    const handleNavigate = (href?: string) => {
        if (!href) return;
        closeModal();
        if (href.includes('#')) {
            window.location.href = href;
        } else {
            router.push(href);
        }
    };

    return (
        <>
            {/* ── Slim Banner (below navbar) ── */}
            <AnimatePresence>
                {bannerVisible && (
                    <motion.button
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        onClick={openModal}
                        className="fixed top-14 left-0 right-0 z-40 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white cursor-pointer"
                        style={{ background: 'linear-gradient(90deg, #d97757 0%, #c4a77d 60%, #8c9b78 100%)' }}
                    >
                        <Sparkles size={14} className="shrink-0 opacity-80" />
                        <span className="text-xs sm:text-sm font-sans font-semibold leading-snug">
                            ✨ <span className="font-bold">v{latest.version}</span> just dropped —{' '}
                            {latest.highlights.map(h => h.title).join(', ')}
                        </span>
                        <span className="text-xs font-sans opacity-80 hidden sm:inline">· Tap to see →</span>

                        {/* Dismiss X */}
                        <span
                            role="button"
                            onClick={dismissBanner}
                            className="absolute right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
                            aria-label="Dismiss"
                        >
                            <X size={14} />
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ── What's New Modal ── */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
                    >
                        <motion.div
                            initial={{ y: 60, opacity: 0, scale: 0.96 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 60, opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.28, ease: 'easeOut' }}
                            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div
                                className="px-5 pt-5 pb-4 flex items-center justify-between"
                                style={{ background: 'linear-gradient(135deg, rgba(217,119,87,0.09) 0%, rgba(196,167,125,0.09) 100%)' }}
                            >
                                <div>
                                    <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#d97757] opacity-70 mb-0.5">
                                        v{latest.version} · {new Date(latest.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                    <p className="text-base font-bold text-gray-800 font-sans">
                                        What&apos;s new in SlowJam ✨
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Highlights list */}
                            <div className="px-5 py-4 space-y-2">
                                {latest.highlights.map((h, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.07, duration: 0.22 }}
                                        onClick={() => handleNavigate(h.href)}
                                        className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 group"
                                    >
                                        <span className="text-xl shrink-0">{h.emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-sans font-bold text-gray-700">{h.title}</p>
                                            <p className="text-xs font-sans text-gray-400 leading-snug mt-0.5">{h.desc}</p>
                                        </div>
                                        {h.href && (
                                            <span className="shrink-0 flex items-center gap-0.5 text-[11px] font-sans font-bold text-[#d97757]">
                                                {h.cta ?? 'See it'}
                                                <ArrowRight size={11} />
                                            </span>
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="px-5 pb-5">
                                <button
                                    onClick={closeModal}
                                    className="w-full py-3 rounded-2xl text-sm font-sans font-semibold text-gray-400 border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    Got it!
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
