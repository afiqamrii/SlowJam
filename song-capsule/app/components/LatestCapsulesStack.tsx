'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, RefreshCw } from 'lucide-react';
import Stack from './Stack';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CapsulePreview {
    id: string;
    album_art_url?: string;
    track_name: string;
    artist_name: string;
    receiver_name: string;
}

const POOL_SIZE = 40;  // fetch this many from DB
const DISPLAY_SIZE = 8; // show this many in the stack

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Tap vs drag: only navigate if pointer moved < TAP_THRESHOLD px
const TAP_THRESHOLD = 6;

function CapsuleCard({ capsule }: { capsule: CapsulePreview }) {
    const router = useRouter();
    const pointerStart = useRef<{ x: number; y: number } | null>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!pointerStart.current) return;
        const dx = Math.abs(e.clientX - pointerStart.current.x);
        const dy = Math.abs(e.clientY - pointerStart.current.y);
        if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD) {
            router.push(`/view/${capsule.id}`);
        }
        pointerStart.current = null;
    };

    return (
        <div
            className="relative w-full h-full rounded-2xl overflow-hidden select-none"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
        >
            {capsule.album_art_url ? (
                <img
                    src={capsule.album_art_url}
                    alt={capsule.track_name}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                />
            ) : (
                <div
                    className="w-full h-full flex items-center justify-center pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, #d97757 0%, #c4a77d 100%)' }}
                >
                    <Music2 size={40} className="text-white/60" />
                </div>
            )}

            <div
                className="absolute bottom-0 left-0 right-0 px-4 py-3 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}
            >
                <p className="text-white text-xs font-sans font-bold truncate leading-tight">
                    {capsule.track_name}
                </p>
                <p className="text-white/60 text-[10px] font-sans truncate">
                    {capsule.artist_name}
                </p>
                <p className="mt-0.5 text-white/50 text-[10px] font-sans">
                    for <span className="text-white/80 font-semibold">{capsule.receiver_name}</span>
                </p>
            </div>
        </div>
    );
}

export default function LatestCapsulesStack() {
    const [pool, setPool] = useState<CapsulePreview[]>([]);
    const [displayed, setDisplayed] = useState<CapsulePreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [spinning, setSpinning] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);

    const fetchPool = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('capsules')
            .select('id, album_art_url, track_name, artist_name, receiver_name')
            .eq('is_private', false)
            .not('album_art_url', 'is', null)
            .order('created_at', { ascending: false })
            .limit(POOL_SIZE);

        const fetched = data ?? [];
        const shuffled = shuffle(fetched);
        setPool(shuffled);
        setDisplayed(shuffled.slice(0, DISPLAY_SIZE));
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPool();
    }, [fetchPool]);

    const handleRefresh = async () => {
        if (spinning) return;
        setSpinning(true);

        // Every other refresh, also re-fetch from DB to get truly new cards
        if (refreshCount % 2 === 1) {
            await fetchPool();
        } else {
            // Just reshuffle the existing pool for instant feel
            const reshuffled = shuffle(pool);
            setDisplayed(reshuffled.slice(0, DISPLAY_SIZE));
        }

        setRefreshCount(c => c + 1);
        setTimeout(() => setSpinning(false), 600);
    };

    if (loading) return null;
    if (displayed.length === 0) return null;

    const cards = displayed.map(c => <CapsuleCard key={c.id} capsule={c} />);

    return (
        <section className="w-full max-w-5xl px-6 mx-auto py-8 pb-20">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                {/* Text side */}
                <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="flex-1 text-center lg:text-left"
                >
                    <span className="inline-block text-xs font-sans font-bold uppercase tracking-widest text-[#d97757] mb-3 opacity-70">
                        Real capsules ✦ Live feed
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
                        Songs sent<br />with love
                    </h2>
                    <p className="text-gray-400 font-sans text-sm leading-relaxed max-w-sm mx-auto lg:mx-0">
                        Real capsules from real people — drag to flip through, tap to open, or shuffle for a fresh batch.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3 justify-center lg:justify-start">
                        <Link href="/browse">
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                className="inline-flex items-center gap-2 px-5 py-2.5 border-2 rounded-full text-sm font-bold font-sans transition-colors"
                                style={{ borderColor: '#d97757', color: '#d97757' }}
                            >
                                Browse all →
                            </motion.button>
                        </Link>

                        {/* Refresh button */}
                        <motion.button
                            onClick={handleRefresh}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.94 }}
                            title="Shuffle cards"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold font-sans transition-colors"
                            style={{
                                background: 'rgba(217,119,87,0.08)',
                                color: '#d97757',
                                border: '1.5px solid rgba(217,119,87,0.25)',
                            }}
                        >
                            <motion.span
                                animate={{ rotate: spinning ? 360 : 0 }}
                                transition={{ duration: 0.55, ease: 'easeInOut' }}
                                style={{ display: 'flex' }}
                            >
                                <RefreshCw size={14} />
                            </motion.span>
                            Shuffle
                        </motion.button>
                    </div>
                </motion.div>

                {/* Stack side */}
                <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.65, ease: 'easeOut', delay: 0.1 }}
                    className="shrink-0"
                >
                    <div style={{ width: 240, height: 240 }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={refreshCount}
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.92 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                style={{ width: '100%', height: '100%' }}
                            >
                                <Stack
                                    randomRotation
                                    sensitivity={150}
                                    sendToBackOnClick
                                    cards={cards}
                                    autoplay
                                    autoplayDelay={3500}
                                    pauseOnHover
                                    animationConfig={{ stiffness: 280, damping: 22 }}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <p className="mt-5 text-center text-xs font-sans text-gray-400">
                        drag or tap to cycle ✦
                    </p>
                </motion.div>

            </div>
        </section>
    );
}
