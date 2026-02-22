'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Globe, Lock, Music } from 'lucide-react';

interface Stats {
    total: number;
    public: number;
    private: number;
    uniqueSongs: number;
}

function useCountUp(target: number, duration = 1400) {
    const [count, setCount] = useState(0);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number | null>(null);

    useEffect(() => {
        if (target === 0) return;
        startRef.current = null;

        const animate = (ts: number) => {
            if (startRef.current === null) startRef.current = ts;
            const elapsed = ts - startRef.current;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [target, duration]);

    return count;
}

const statDefs = [
    { key: 'total' as const, label: 'Capsules Created', icon: Package, color: '#d97757', bg: 'rgba(217,119,87,0.10)' },
    { key: 'public' as const, label: 'Publicly Shared', icon: Globe, color: '#60a5fa', bg: 'rgba(96,165,250,0.10)' },
    { key: 'private' as const, label: 'Kept Private', icon: Lock, color: '#a78bfa', bg: 'rgba(167,139,250,0.10)' },
    { key: 'uniqueSongs' as const, label: 'Songs Used', icon: Music, color: '#8c9b78', bg: 'rgba(140,155,120,0.10)' },
];

function StatCard({ def, value, index }: { def: typeof statDefs[0]; value: number; index: number }) {
    const count = useCountUp(value);
    const Icon = def.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, delay: index * 0.1, ease: 'easeOut' }}
            whileHover={{ y: -4, boxShadow: `0 16px 40px ${def.color}25` }}
            className="flex flex-col items-center gap-3 p-6 rounded-3xl text-center transition-shadow"
            style={{
                background: 'rgba(255,255,255,0.75)',
                border: `1px solid ${def.color}30`,
                backdropFilter: 'blur(10px)',
            }}
        >
            <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: def.bg }}
            >
                <Icon size={22} style={{ color: def.color }} />
            </div>
            <div>
                <p
                    className="text-3xl font-bold leading-none tabular-nums"
                    style={{ color: def.color }}
                >
                    {count.toLocaleString()}
                </p>
                <p className="mt-1.5 text-xs font-sans text-gray-400 uppercase tracking-widest font-semibold">
                    {def.label}
                </p>
            </div>
        </motion.div>
    );
}

export default function StatsBar() {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        fetch('/api/stats')
            .then(r => r.json())
            .then(setStats)
            .catch(() => { /* silently fail */ });
    }, []);

    const values: Stats = stats ?? { total: 0, public: 0, private: 0, uniqueSongs: 0 };

    return (
        <section className="w-full max-w-5xl px-6 py-16 mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-center mb-10"
            >
                <span className="inline-block text-xs font-sans font-bold uppercase tracking-widest text-[#d97757] mb-2 opacity-70">
                    Live
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Moments sent so far
                </h2>
                <p className="mt-2 text-sm text-gray-400 font-sans">
                    Every number is a real song, wrapped in a real feeling.
                </p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statDefs.map((def, i) => (
                    <StatCard key={def.key} def={def} value={values[def.key]} index={i} />
                ))}
            </div>
        </section>
    );
}
