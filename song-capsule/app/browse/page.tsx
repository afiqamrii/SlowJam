'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Music2, Lock, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function BrowsePage() {
    const [capsules, setCapsules] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const PAGE_SIZE = 12;

    const fetchCapsules = async (pageIndex: number, isNewSearch = false) => {
        if (isNewSearch) {
            setLoading(true);
            setCapsules([]);
        } else {
            setLoadingMore(true);
        }

        try {
            let q = supabase
                .from('capsules')
                .select('*')
                .order('created_at', { ascending: false });

            if (query.trim()) {
                q = q.ilike('receiver_name', `%${query.trim()}%`);
            }

            const from = pageIndex * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await q.range(from, to);

            if (error) throw error;

            if (data) {
                if (isNewSearch) {
                    setCapsules(data);
                } else {
                    setCapsules(prev => [...prev, ...data]);
                }

                setHasMore(data.length === PAGE_SIZE);
            }
        } catch (error) {
            console.error('Error fetching capsules:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Initial fetch and search changes
    useEffect(() => {
        setPage(0);
        const delay = setTimeout(() => fetchCapsules(0, true), 400);
        return () => clearTimeout(delay);
    }, [query]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchCapsules(nextPage, false);
    };

    return (
        <div className="min-h-screen pt-20 pb-12 px-5 max-w-4xl mx-auto font-(--font-gloria)">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Browse</h1>
                <p className="text-gray-400 font-sans text-sm">
                    Scroll the latest capsules or search by recipient name to find one.
                </p>

                {/* Permanence notice */}
                <div className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-sans">
                    <span className="text-base leading-none">⚠️</span>
                    <span>
                        <b>Heads up:</b> All capsules are permanent — there is <b>no deletion</b> after submission.
                        Make sure you&apos;re happy with your message before sending!
                    </span>
                </div>
            </motion.div>

            {/* Search bar */}
            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by recipient name..."
                    className="w-full bg-white border border-gray-200 rounded-full py-3.5 pl-11 pr-5 font-sans text-sm text-[var(--foreground)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] shadow-sm"
                />
            </div>

            {/* Capsule grid */}
            {loading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : capsules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                    <Music2 size={48} strokeWidth={1} />
                    <p className="font-sans text-sm">No capsules found</p>
                </div>
            ) : (
                <>
                    <AnimatePresence mode="popLayout">
                        <div className="grid sm:grid-cols-2 gap-4">
                            {capsules.map((capsule, i) => {
                                const isLocked = new Date(capsule.unlock_at) > new Date();
                                return (
                                    <motion.div
                                        key={capsule.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: (i % PAGE_SIZE) * 0.04 }}
                                        layout
                                    >
                                        <Link href={`/view/${capsule.id}`} className="block h-full">
                                            <div className="h-full bg-white border border-gray-100 hover:border-[var(--accent)]/30 hover:shadow-lg shadow-sm rounded-2xl overflow-hidden flex flex-col transition-all group">
                                                {/* Card body */}
                                                <div className="flex-1 p-5 space-y-3">
                                                    {/* To: badge */}
                                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-full text-xs text-gray-600 font-sans">
                                                        <span className="text-gray-400">To:</span>
                                                        <span className="font-semibold">{capsule.receiver_name}</span>
                                                    </span>

                                                    {/* Message preview */}
                                                    {isLocked ? (
                                                        <div className="flex items-center gap-2 py-2">
                                                            <Lock size={14} className="text-gray-400 shrink-0" />
                                                            <p className="text-sm text-gray-400 font-sans italic">
                                                                Locked until {new Date(capsule.unlock_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[var(--foreground)] leading-snug line-clamp-3">
                                                            {capsule.message}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Song strip */}
                                                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-t border-gray-100 group-hover:bg-[var(--accent)]/5 transition-colors">
                                                    {capsule.album_art_url ? (
                                                        <img
                                                            src={capsule.album_art_url}
                                                            alt={capsule.track_name}
                                                            className="w-10 h-10 rounded-md object-cover shrink-0 shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center shrink-0">
                                                            <Music2 size={16} className="text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-[var(--foreground)] truncate leading-tight">
                                                            {capsule.track_name}
                                                        </p>
                                                        <p className="text-xs text-gray-400 truncate font-sans">
                                                            {capsule.artist_name}
                                                        </p>
                                                    </div>
                                                    {/* Spotify icon */}
                                                    <div className="shrink-0 w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center shadow-sm">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                                                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </AnimatePresence>

                    {/* Load More Button */}
                    {hasMore && (
                        <div className="mt-10 flex justify-center">
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="px-6 py-3 bg-white border border-gray-200 hover:border-accent text-gray-500 hover:text-accent font-sans text-sm font-medium rounded-full shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loadingMore ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    'Load More Capsules'
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
