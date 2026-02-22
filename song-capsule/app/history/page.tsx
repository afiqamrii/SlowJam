'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Music2, Copy, Globe, Lock, Inbox, LogIn } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/hooks/useAuth';
import { toast } from 'sonner';

const HISTORY_KEY = 'slowjam_history';

interface CapsuleItem {
    id: string;
    receiver_name: string;
    track_name: string;
    artist_name: string;
    album_art_url?: string;
    created_at: string;
    is_private?: boolean;
    share_token?: string | null;
}

export default function HistoryPage() {
    const { user, signInWithGoogle } = useAuth();
    const [publicItems, setPublicItems] = useState<CapsuleItem[]>([]);
    const [privateItems, setPrivateItems] = useState<CapsuleItem[]>([]);
    const [loadingPrivate, setLoadingPrivate] = useState(false);

    // Load public history from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            const all: CapsuleItem[] = raw ? JSON.parse(raw) : [];
            // Only show non-private ones in the public section
            setPublicItems(all.filter(i => !i.is_private));
        } catch {
            setPublicItems([]);
        }
    }, []);

    // Load private capsules from Supabase when signed in
    useEffect(() => {
        if (!user) {
            setPrivateItems([]);
            return;
        }
        setLoadingPrivate(true);
        supabase
            .from('capsules')
            .select('id, receiver_name, track_name, artist_name, album_art_url, created_at, is_private, share_token')
            .eq('owner_id', user.id)
            .eq('is_private', true)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
                setPrivateItems(data ?? []);
                setLoadingPrivate(false);
            });
    }, [user]);

    const clearPublic = () => {
        localStorage.removeItem(HISTORY_KEY);
        setPublicItems([]);
    };

    const copyLink = (e: React.MouseEvent, item: CapsuleItem) => {
        e.preventDefault();
        e.stopPropagation();
        const base = `${window.location.origin}/view/${item.id}`;
        const link = (item.is_private && item.share_token) ? `${base}?key=${item.share_token}` : base;
        navigator.clipboard.writeText(link);
        toast.success('Link copied!');
    };



    const CapsuleCard = ({ item, isPrivate }: { item: CapsuleItem; isPrivate: boolean }) => (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Link href={`/view/${item.id}`} className="block">
                <div className={`bg-white border hover:shadow-lg shadow-sm rounded-2xl overflow-hidden transition-all group ${isPrivate
                    ? 'border-[var(--accent)]/20 hover:border-[var(--accent)]/40'
                    : 'border-gray-100 hover:border-gray-300'
                    }`}>
                    {/* Top accent line for private */}
                    {isPrivate && <div className="h-0.5 w-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]" />}

                    <div className="flex items-center gap-3 px-4 py-3">
                        {item.album_art_url ? (
                            <img src={item.album_art_url} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0 shadow-sm" />
                        ) : (
                            <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                <Music2 size={18} className="text-gray-400" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-[var(--foreground)] truncate">{item.track_name}</p>
                            <p className="text-xs text-gray-400 truncate">{item.artist_name}</p>
                        </div>
                        {/* Copy link button */}
                        <button
                            onClick={(e) => copyLink(e, item)}
                            title="Copy link"
                            className="p-1.5 rounded-lg text-gray-300 hover:text-[var(--accent)] hover:bg-[var(--accent)]/8 transition-colors shrink-0"
                        >
                            <Copy size={14} />
                        </button>
                    </div>

                    <div className="px-4 pb-3 flex items-center justify-between text-xs text-gray-400 font-sans border-t border-gray-50 pt-2">
                        <span>To: <b className="text-gray-600">{item.receiver_name}</b></span>
                        <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(item.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );

    const hasAnything = publicItems.length > 0 || privateItems.length > 0 || loadingPrivate;

    return (
        <div className="min-h-screen pt-20 pb-12 px-5 max-w-4xl mx-auto font-(--font-gloria)">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-end justify-between"
            >
                <div>
                    <h1 className="text-4xl font-bold text-[var(--foreground)] mb-1">History</h1>
                    <p className="text-gray-400 font-sans text-sm">Capsules you&apos;ve sent.</p>
                </div>
            </motion.div>

            {!hasAnything && !user ? (
                // Completely empty + not signed in
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-300">
                    <Inbox size={56} strokeWidth={1} />
                    <p className="font-sans text-sm">No capsules yet on this device.</p>
                    <Link
                        href="/create"
                        className="mt-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-full text-sm font-sans font-bold hover:bg-[#c0684b] transition-colors"
                    >
                        Create one now
                    </Link>
                </div>
            ) : (
                <div className="space-y-10">

                    {/* ── Private Section ─────────────────────────────────── */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Lock size={15} className="text-[var(--accent)]" />
                                <h2 className="text-sm font-bold text-[var(--accent)] uppercase tracking-widest font-sans">Private</h2>
                            </div>
                            {!user && (
                                <button
                                    onClick={signInWithGoogle}
                                    className="flex items-center gap-1.5 text-xs font-sans font-semibold text-[var(--accent)] hover:underline"
                                >
                                    <LogIn size={12} /> Sign in to view yours
                                </button>
                            )}
                        </div>

                        {!user ? (
                            <div className="border-2 border-dashed border-[var(--accent)]/20 rounded-2xl p-6 text-center flex flex-col items-center gap-2">
                                <Lock size={22} className="text-[var(--accent)]/40" />
                                <p className="text-sm font-sans text-gray-400">Sign in with Google to see your private capsules — they live in the cloud, not just this browser.</p>
                                <button
                                    onClick={signInWithGoogle}
                                    className="mt-1 flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-full text-xs font-sans font-bold hover:bg-[#c0684b] transition-colors"
                                >
                                    <LogIn size={13} /> Sign in
                                </button>
                            </div>
                        ) : loadingPrivate ? (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {[1, 2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
                            </div>
                        ) : privateItems.length === 0 ? (
                            <p className="text-sm font-sans text-gray-400 py-2">No private capsules yet. <Link href="/create" className="text-[var(--accent)] hover:underline">Create one →</Link></p>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {privateItems.map(item => <CapsuleCard key={item.id} item={item} isPrivate={true} />)}
                            </div>
                        )}
                    </div>

                    {/* ── Public Section ──────────────────────────────────── */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Globe size={15} className="text-sky-500" />
                                <h2 className="text-sm font-bold text-sky-500 uppercase tracking-widest font-sans">Public</h2>
                            </div>
                            {publicItems.length > 0 && (
                                <button onClick={clearPublic} className="text-xs font-sans text-red-400 hover:text-red-600 transition-colors">
                                    Clear
                                </button>
                            )}
                        </div>

                        {publicItems.length === 0 ? (
                            <p className="text-sm font-sans text-gray-400 py-2">
                                Public history is saved on this device only.{' '}
                                <span className="text-gray-300">Cleared if you switch browsers or wipe cache.</span>
                            </p>
                        ) : (
                            <>
                                <p className="text-xs font-sans text-amber-500 mb-3">
                                    ⚠️ Saved on this device only — copy your links so you don&apos;t lose them!
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {publicItems.map(item => <CapsuleCard key={item.id} item={item} isPrivate={false} />)}
                                </div>
                            </>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
