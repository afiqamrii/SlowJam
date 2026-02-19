'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Music2, ExternalLink, Inbox } from 'lucide-react';
import Link from 'next/link';

const HISTORY_KEY = 'slowjam_history';

interface HistoryItem {
    id: string;
    receiver_name: string;
    track_name: string;
    artist_name: string;
    album_art_url?: string;
    created_at: string;
}

export default function HistoryPage() {
    const [items, setItems] = useState<HistoryItem[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            setItems(raw ? JSON.parse(raw) : []);
        } catch {
            setItems([]);
        }
    }, []);

    const clear = () => {
        localStorage.removeItem(HISTORY_KEY);
        setItems([]);
    };

    return (
        <div className="min-h-screen pt-20 pb-12 px-5 max-w-4xl mx-auto font-(--font-gloria)">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-end justify-between"
            >
                <div>
                    <h1 className="text-4xl font-bold text-[var(--foreground)] mb-1">History</h1>
                    <p className="text-gray-400 font-sans text-sm">Capsules you&apos;ve created on this device.</p>
                </div>
                {items.length > 0 && (
                    <button
                        onClick={clear}
                        className="text-xs font-sans text-red-400 hover:text-red-600 transition-colors"
                    >
                        Clear history
                    </button>
                )}
            </motion.div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-300">
                    <Inbox size={56} strokeWidth={1} />
                    <p className="font-sans text-sm">No capsules created yet on this device.</p>
                    <Link
                        href="/create"
                        className="mt-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-full text-sm font-sans font-bold hover:bg-[#c0684b] transition-colors"
                    >
                        Create one now
                    </Link>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    {items.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link href={`/view/${item.id}`} className="block">
                                <div className="bg-white border border-gray-100 hover:border-[var(--accent)]/30 hover:shadow-lg shadow-sm rounded-2xl overflow-hidden transition-all group">
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
                                            <p className="text-xs text-gray-400 font-sans truncate">{item.artist_name}</p>
                                        </div>
                                        <ExternalLink size={14} className="text-gray-300 group-hover:text-[var(--accent)] transition-colors shrink-0" />
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
                    ))}
                </div>
            )}
        </div>
    );
}
