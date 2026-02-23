'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Lock, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import FavoriteButton from '../components/FavoriteButton';
import { useAuth } from '@/app/hooks/useAuth';

export default function SavedPage() {
    const { user, loading: authLoading, signInWithGoogle } = useAuth();
    const [capsules, setCapsules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSaved = async () => {
            if (!user) {
                setCapsules([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // 1. Get the session token
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("No session");

                // 2. Fetch favorited IDs from API
                const res = await fetch('/api/user/favorites', {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`
                    }
                });

                if (!res.ok) throw new Error("Failed to fetch favorites list");

                const data = await res.json();
                const idsArray = data.favorites;

                if (!Array.isArray(idsArray) || idsArray.length === 0) {
                    setCapsules([]);
                    return;
                }

                // 3. Fetch matched capsules from Supabase
                const { data: capsuleData, error } = await supabase
                    .from('capsules')
                    .select('*')
                    .in('id', idsArray)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (capsuleData) setCapsules(capsuleData);
            } catch (error) {
                console.error('Error fetching saved capsules:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchSaved();
        }
    }, [user, authLoading]);

    if (authLoading) {
        return (
            <div className="min-h-screen pt-20 pb-12 px-5 max-w-4xl mx-auto font-(--font-gloria) overflow-x-hidden">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2">Saved</h1>
                </div>
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen pt-20 pb-12 px-5 max-w-4xl mx-auto font-(--font-gloria) overflow-x-hidden">
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-foreground mb-2">Saved</h1>
                    <p className="text-gray-400 font-sans text-sm">
                        Capsules you've favorited for inspiration.
                    </p>
                </motion.div>

                <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4 border border-dashed border-gray-200 bg-gray-50/50 rounded-3xl">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                        <Lock size={28} className="text-gray-300" />
                    </div>
                    <p className="font-sans text-lg font-bold text-gray-700">Sign in to view saved</p>
                    <p className="font-sans text-sm max-w-sm text-center text-gray-500 mb-2">
                        You need to be signed in to save capsules and view your collection.
                    </p>
                    <button
                        onClick={() => signInWithGoogle('/saved')}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-accent font-sans text-sm font-semibold hover:border-accent hover:shadow-sm rounded-full transition-all"
                    >
                        <LogIn size={16} />
                        Sign In with Google
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-12 px-5 max-w-4xl mx-auto font-(--font-gloria) overflow-x-hidden">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold text-foreground mb-2">Saved</h1>
                <p className="text-gray-400 font-sans text-sm">
                    Capsules you've favorited for inspiration.
                </p>
            </motion.div>

            {/* Capsule grid */}
            {loading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : capsules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3 border-2 border-dashed border-gray-200 rounded-3xl">
                    <Music2 size={48} strokeWidth={1} />
                    <p className="font-sans text-sm font-medium">No saved capsules yet</p>
                    <p className="font-sans text-xs max-w-xs text-center">
                        Browse the public capsules and click the heart icon on any you like to save them here.
                    </p>
                    <Link href="/browse" className="mt-4 px-6 py-2 bg-white border border-gray-200 text-accent font-sans text-sm font-medium hover:border-accent hover:shadow-sm rounded-full transition-all">
                        Browse Capsules
                    </Link>
                </div>
            ) : (
                <AnimatePresence>
                    <div className="grid sm:grid-cols-2 gap-4 w-full min-w-0">
                        {capsules.map((capsule, i) => {
                            const isLocked = new Date(capsule.unlock_at) > new Date();
                            return (
                                <motion.div
                                    key={capsule.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: (i % 12) * 0.04 }}
                                    className="min-w-0 w-full relative group"
                                >
                                    <Link
                                        href={`/view/${capsule.id}`}
                                        className="block h-full"
                                        scroll={false}
                                    >
                                        <div className="w-full h-full bg-white border border-gray-100 hover:border-(--accent)/30 hover:shadow-lg shadow-sm rounded-2xl overflow-hidden flex flex-col transition-all group-hover:border-(--accent)/30">
                                            {/* Card body */}
                                            <div className="flex-1 p-5 space-y-3">
                                                {/* To: badge */}
                                                <div className="flex justify-between items-start">
                                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-full text-xs text-gray-600 font-sans">
                                                        <span className="text-gray-400">To:</span>
                                                        <span className="font-semibold">{capsule.receiver_name}</span>
                                                    </span>

                                                    {/* Heart Button Overlay */}
                                                    <div className="z-10" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                                                        <FavoriteButton capsuleId={capsule.id} initialCount={capsule.favorites_count || 0} />
                                                    </div>
                                                </div>

                                                {/* Message preview */}
                                                {capsule.is_private ? (
                                                    <div className="flex items-center gap-2 py-1.5 px-3 bg-(--accent)/6 rounded-xl border border-dashed border-(--accent)/25">
                                                        <span className="text-base">🔒</span>
                                                        <p className="text-sm text-accent italic">
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
                                                    <p className="text-sm font-bold text-foreground truncate leading-tight font-sans">
                                                        {capsule.track_name}
                                                    </p>
                                                    <p className="text-xs text-gray-400 truncate font-sans">
                                                        {capsule.artist_name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
}
