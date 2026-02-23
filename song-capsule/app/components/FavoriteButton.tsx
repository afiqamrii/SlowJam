import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';

interface FavoriteButtonProps {
    capsuleId: string;
    initialCount: number;
    variant?: 'default' | 'glass';
}

// Fetcher that handles sending the auth token
const fetcher = async (url: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { favorites: [] };

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    });
    if (!res.ok) throw new Error('Failed to fetch favorites');
    return res.json();
};

export default function FavoriteButton({ capsuleId, initialCount, variant = 'default' }: FavoriteButtonProps) {
    const { user, signInWithGoogle } = useAuth();
    const pathname = usePathname();
    const [count, setCount] = useState(initialCount);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showAuthDialog, setShowAuthDialog] = useState(false);

    // Only fetch favorites if user is signed in
    const { data: favoritesData } = useSWR(
        user ? '/api/user/favorites' : null,
        fetcher,
        {
            revalidateOnFocus: false, // Don't over-fetch
        }
    );

    const isFavorited = favoritesData?.favorites?.includes(capsuleId) ?? false;

    // Optional: Keep count synced with initialCount if it changes from props (like via SWR on Browse page)
    useEffect(() => {
        setCount(initialCount);
    }, [initialCount]);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isUpdating) return;

        // Require sign in, but ask first!
        if (!user) {
            setShowAuthDialog(true);
            return;
        }

        setIsUpdating(true);

        const newFavorited = !isFavorited;
        const newCount = newFavorited ? count + 1 : Math.max(0, count - 1);

        // Optimistic UI updates
        setCount(newCount);

        // Optimistically mutate the SWR cache
        const currentFavorites = favoritesData?.favorites || [];
        const newFavorites = newFavorited
            ? [...currentFavorites, capsuleId]
            : currentFavorites.filter((id: string) => id !== capsuleId);

        mutate('/api/user/favorites', { favorites: newFavorites }, false);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            const res = await fetch(`/api/capsules/${capsuleId}/favorite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ action: newFavorited ? 'add' : 'remove' }),
            });
            const data = await res.json();

            if (data.success && typeof data.newCount === 'number') {
                setCount(data.newCount);
            }
        } catch (error) {
            console.error('Failed to update favorite count', error);
            // Revert optimistic update on failure
            mutate('/api/user/favorites');
            setCount(count);
        } finally {
            setIsUpdating(false);
        }
    };

    let baseStyles = 'bg-white/50 border-gray-200 text-gray-500 hover:bg-white/80';
    let activeStyles = 'bg-red-50/80 border-red-200 text-red-500 hover:bg-red-100/80';

    if (variant === 'glass') {
        baseStyles = 'bg-white/80 border-white/50 text-gray-700 hover:bg-white hover:text-gray-900 backdrop-blur-md shadow-lg';
        activeStyles = 'bg-white/95 border-red-200 text-red-500 hover:bg-white backdrop-blur-md shadow-lg';
    }

    return (
        <>
            <button
                onClick={handleToggle}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border ${isFavorited ? activeStyles : baseStyles}`}
            >
                <Heart
                    size={16}
                    strokeWidth={isFavorited ? 1 : 2}
                    className={`transition-all ${isFavorited ? 'fill-current scale-110' : 'fill-transparent scale-100'}`}
                />
                <span className="text-xs font-sans font-medium tabular-nums shadow-none">
                    {count > 0 ? `${count} ${count === 1 ? 'Save' : 'Saves'}` : 'Save'}
                </span>
            </button>

            <AnimatePresence>
                {showAuthDialog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAuthDialog(false); }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                <Heart size={28} className="text-red-400 fill-current" />
                            </div>
                            <h3 className="text-xl font-bold font-sans text-gray-900 mb-2">Save this Capsule?</h3>
                            <p className="text-gray-500 font-sans text-sm mb-6">
                                Sign in to save this capsule to your collection and show the creator some love.
                            </p>
                            <div className="flex w-full gap-3">
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAuthDialog(false); }}
                                    className="flex-1 py-2.5 px-4 rounded-xl font-sans font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    Not now
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowAuthDialog(false);
                                        signInWithGoogle(pathname);
                                    }}
                                    className="flex-1 py-2.5 px-4 rounded-xl font-sans font-semibold text-white bg-accent hover:bg-accent-secondary transition-colors shadow-sm"
                                >
                                    Sign In
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
