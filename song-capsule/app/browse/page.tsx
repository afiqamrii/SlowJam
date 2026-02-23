'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Music2, Lock, Globe, Music } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import useSWRInfinite from 'swr/infinite';
import FavoriteButton from '../components/FavoriteButton';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface BrowseStats {
    total: number;
    public: number;
    uniqueSongs: number;
}

function BrowseContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [query, setQuery] = useState('');

    // Initialize sort from URL
    const urlSort = searchParams.get('sort') === 'top' ? 'top' : 'latest';
    const [sort, setSort] = useState<'latest' | 'top'>(urlSort);
    const [browseStats, setBrowseStats] = useState<BrowseStats | null>(null);

    const PAGE_SIZE = 12;

    const fetcher = async ({ pageIndex, searchQuery, sortType }: { pageIndex: number, searchQuery: string, sortType: 'latest' | 'top' }) => {
        let q = supabase
            .from('capsules')
            .select('*');

        if (searchQuery.trim()) {
            q = q.ilike('receiver_name', `%${searchQuery.trim()}%`);
        }

        if (sortType === 'top') {
            q = q.order('favorites_count', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
        } else {
            q = q.order('created_at', { ascending: false });
        }

        const from = pageIndex * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await q.range(from, to);
        if (error) throw error;
        return data;
    };

    const getKey = (pageIndex: number, previousPageData: any) => {
        // Reached the end
        if (previousPageData && !previousPageData.length) return null;

        // Pass both pageIndex, query, and sortType to fetcher
        return { pageIndex, searchQuery: query, sortType: sort };
    };

    const { data, size, setSize, isValidating } = useSWRInfinite(getKey, fetcher, {
        revalidateFirstPage: false,
        persistSize: true, // Retains number of pages loaded when navigating back!
    });

    const capsules: any[] = data ? ([] as any[]).concat(...data) : [];
    const isLoadingInitialData = !data && !isValidating;
    const isLoadingMore =
        isLoadingInitialData ||
        (size > 0 && data && typeof data[size - 1] === "undefined");
    const isEmpty = data?.[0]?.length === 0;
    const isReachingEnd =
        isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE);

    // Fetch stats once
    useEffect(() => {
        fetch('/api/stats')
            .then(r => r.json())
            .then((d) => setBrowseStats({ total: d.total, public: d.public, uniqueSongs: d.uniqueSongs }))
            .catch(() => { /* fail silently */ });
    }, []);

    // Restore scroll position after returning from sign-in
    useEffect(() => {
        if (!isValidating && data && data.length > 0) {
            try {
                const savedScrollY = sessionStorage.getItem('authRedirectScrollY');
                if (savedScrollY) {
                    const y = parseInt(savedScrollY, 10);
                    if (!isNaN(y)) {
                        // Use a short timeout to let the DOM settle after render
                        setTimeout(() => {
                            window.scrollTo({ top: y, behavior: 'auto' });
                            sessionStorage.removeItem('authRedirectScrollY');
                        }, 50);
                    }
                }
            } catch (e) {
                // Ignore sessionStorage errors
            }
        }
    }, [isValidating, data]);

    const handleLoadMore = () => {
        setSize(size + 1);
    };

    const handleSortChange = (newSort: 'latest' | 'top') => {
        setSort(newSort);
        setSize(1);

        const params = new URLSearchParams(searchParams.toString());
        if (newSort === 'top') {
            params.set('sort', 'top');
        } else {
            params.delete('sort');
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold text-foreground mb-2">Browse</h1>
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

            {/* ── Stats Strip ── */}
            {browseStats && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                    className="flex flex-wrap gap-2 mb-6"
                >
                    {[
                        { icon: <span className="text-sm">🎁</span>, label: `${browseStats.total.toLocaleString()} capsules total`, color: '#d97757', bg: 'rgba(217,119,87,0.08)', border: 'rgba(217,119,87,0.25)' },
                        { icon: <Globe size={13} className="shrink-0" />, label: `${browseStats.public.toLocaleString()} public`, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)' },
                        { icon: <Music size={13} className="shrink-0" />, label: `${browseStats.uniqueSongs.toLocaleString()} unique songs`, color: '#8c9b78', bg: 'rgba(140,155,120,0.10)', border: 'rgba(140,155,120,0.25)' },
                    ].map((s, i) => (
                        <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0.88 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35, delay: 0.15 + i * 0.08 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-semibold"
                            style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
                        >
                            {s.icon}
                            {s.label}
                        </motion.span>
                    ))}
                </motion.div>
            )}

            {/* Search and Sort */}
            <div className="flex flex-col gap-5 mb-8">
                {/* Sort Tabs */}
                <div className="flex items-center gap-6 border-b border-gray-100">
                    <button
                        onClick={() => handleSortChange('latest')}
                        className={`text-sm font-sans font-semibold transition-all relative pb-3 px-1 ${sort === 'latest' ? 'text-foreground' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Latest Arrivals
                        {sort === 'latest' && (
                            <motion.div layoutId="sortTab" className="absolute -bottom-px left-0 right-0 h-[2px] bg-accent rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => handleSortChange('top')}
                        className={`text-sm font-sans font-semibold transition-all relative pb-3 px-1 ${sort === 'top' ? 'text-foreground' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Sort by Highest Saves
                        {sort === 'top' && (
                            <motion.div layoutId="sortTab" className="absolute -bottom-px left-0 right-0 h-[2px] bg-accent rounded-t-full" />
                        )}
                    </button>
                </div>

                {/* Search bar */}
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by recipient name..."
                        className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-11 pr-5 font-sans text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent shadow-sm"
                    />
                </div>
            </div>

            {/* Capsule grid */}
            {!data && isValidating ? (
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
                    <AnimatePresence>
                        <div className="grid sm:grid-cols-2 gap-4 w-full min-w-0">
                            {capsules.map((capsule, i) => {
                                const isLocked = new Date(capsule.unlock_at) > new Date();
                                return (
                                    <motion.div
                                        key={capsule.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: (i % PAGE_SIZE) * 0.04 }}
                                        className="min-w-0 w-full"
                                    >
                                        <Link
                                            href={`/view/${capsule.id}`}
                                            className="block h-full"
                                            scroll={false} // Prevent automatic scroll to top
                                        >
                                            <div className="w-full h-full bg-white border border-gray-100 hover:border-(--accent)/30 hover:shadow-lg shadow-sm rounded-2xl overflow-hidden flex flex-col transition-all group">
                                                {/* Card body */}
                                                <div className="flex-1 p-5 space-y-3">
                                                    {/* To: badge */}
                                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-full text-xs text-gray-600 font-sans">
                                                        <span className="text-gray-400">To:</span>
                                                        <span className="font-semibold">{capsule.receiver_name}</span>
                                                    </span>

                                                    {/* Message preview */}
                                                    {capsule.is_private ? (
                                                        <div className="flex items-center gap-2 py-1.5 px-3 bg-[var(--accent)]/6 rounded-xl border border-dashed border-[var(--accent)]/25">
                                                            <span className="text-base">🔒</span>
                                                            <p className="text-sm text-[var(--accent)] italic">
                                                                psst... it's a secret. belongs to someone 👀
                                                            </p>
                                                        </div>
                                                    ) : isLocked ? (
                                                        <div className="flex items-center gap-2 py-2">
                                                            <Lock size={14} className="text-gray-400 shrink-0" />
                                                            <p className="text-sm text-gray-400 font-sans italic">
                                                                Locked until {new Date(capsule.unlock_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-foreground leading-snug line-clamp-3">
                                                            {capsule.message}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Song strip */}
                                                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-t border-gray-100 group-hover:bg-(--accent)/5 transition-colors">
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
                                                        <p className="text-sm font-bold text-[var(--foreground)] truncate leading-tight font-sans">
                                                            {capsule.track_name}
                                                        </p>
                                                        <p className="text-xs text-gray-400 truncate font-sans">
                                                            {capsule.artist_name}
                                                        </p>
                                                    </div>
                                                    {/* Favorite */}
                                                    <div className="flex items-center gap-2 shrink-0 z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                                        <FavoriteButton capsuleId={capsule.id} initialCount={capsule.favorites_count || 0} />
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
                    {!isReachingEnd && (
                        <div className="mt-10 flex justify-center">
                            <button
                                onClick={handleLoadMore}
                                disabled={isLoadingMore}
                                className="px-6 py-3 bg-white border border-gray-200 hover:border-accent text-gray-500 hover:text-accent font-sans text-sm font-medium rounded-full shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoadingMore ? (
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
        </>
    );
}

export default function BrowsePage() {
    return (
        <div className="min-h-screen pt-20 pb-12 px-5 max-w-4xl mx-auto font-(--font-gloria) overflow-x-hidden">
            <Suspense fallback={
                <div className="w-full flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                </div>
            }>
                <BrowseContent />
            </Suspense>
        </div>
    );
}
