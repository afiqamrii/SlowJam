'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { APP_VERSION, RELEASES } from '@/app/lib/changelog';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'slowjam_seen_version';

export default function WhatsNew() {
    const [open, setOpen] = useState(false);
    const [hasNew, setHasNew] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // On mount: compare stored version to current
    useEffect(() => {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (seen !== APP_VERSION) setHasNew(true);
    }, []);

    // Close popover on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                handleClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleOpen = () => {
        // On narrow screens the popover has no anchor — open the banner modal instead
        if (window.innerWidth < 640) {
            window.dispatchEvent(new CustomEvent('slowjam:open-whats-new'));
            localStorage.setItem(STORAGE_KEY, APP_VERSION);
            setHasNew(false);
            return;
        }
        setOpen(true);
        localStorage.setItem(STORAGE_KEY, APP_VERSION);
        setHasNew(false);
    };

    const handleClose = () => setOpen(false);

    const handleNavigate = (href?: string) => {
        if (!href) return;
        handleClose();
        // Use window.location for hash anchors (enables native smooth scroll)
        if (href.includes('#')) {
            window.location.href = href;
        } else {
            router.push(href);
        }
    };

    const router = useRouter();
    const latest = RELEASES[0];

    return (
        <div className="relative" ref={popoverRef}>
            {/* Trigger button */}
            <motion.button
                onClick={() => (open ? handleClose() : handleOpen())}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-semibold transition-colors"
                style={{
                    background: open
                        ? 'rgba(217,119,87,0.12)'
                        : hasNew
                            ? 'rgba(217,119,87,0.10)'
                            : 'transparent',
                    color: '#d97757',
                    border: '1.5px solid rgba(217,119,87,0.30)',
                }}
                aria-label="What's new"
            >
                <Sparkles size={12} />
                <span>What&apos;s new</span>

                {/* Pulsing dot badge */}
                {hasNew && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d97757] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d97757]" />
                    </span>
                )}
            </motion.button>

            {/* Popover */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -6 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute right-0 top-10 z-[200] w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        {/* Header */}
                        <div
                            className="px-4 pt-4 pb-3 flex items-center justify-between"
                            style={{ background: 'linear-gradient(135deg, rgba(217,119,87,0.08) 0%, rgba(196,167,125,0.08) 100%)' }}
                        >
                            <div>
                                <p className="text-xs font-sans font-bold uppercase tracking-widest text-[#d97757] opacity-70">
                                    v{latest.version}
                                </p>
                                <p className="text-sm font-bold text-gray-800 font-sans mt-0.5">
                                    What&apos;s new in SlowJam
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Highlights */}
                        <div className="px-4 py-3 space-y-2.5">
                            {latest.highlights.map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.06, duration: 0.22 }}
                                    className={`flex items-start gap-3 rounded-xl px-2 py-2 transition-colors group ${h.href ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                                    onClick={() => h.href && handleNavigate(h.href)}
                                >
                                    <span className="text-lg leading-none mt-0.5 shrink-0">{h.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-sans font-bold text-gray-700">{h.title}</p>
                                        <p className="text-xs font-sans text-gray-400 leading-snug mt-0.5">{h.desc}</p>
                                    </div>
                                    {h.href && (
                                        <motion.span
                                            className="shrink-0 flex items-center gap-0.5 text-[10px] font-sans font-bold text-[#d97757] opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                                        >
                                            {h.cta ?? 'See it'}
                                            <ArrowRight size={10} />
                                        </motion.span>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-[10px] font-sans text-gray-300">
                                {new Date(latest.date).toLocaleDateString('en-MY', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                })}
                            </p>
                            <p className="text-[10px] font-sans text-gray-300 font-semibold">
                                SlowJam v{APP_VERSION}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
