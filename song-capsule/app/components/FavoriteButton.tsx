'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
    capsuleId: string;
    initialCount: number;
    variant?: 'default' | 'glass';
}

export default function FavoriteButton({ capsuleId, initialCount, variant = 'default' }: FavoriteButtonProps) {
    const [isFavorited, setIsFavorited] = useState(false);
    const [count, setCount] = useState(initialCount);
    const [isUpdating, setIsUpdating] = useState(false);

    // Load initial state from local storage
    useEffect(() => {
        const saved = localStorage.getItem('favorited_capsules');
        if (saved) {
            try {
                const arr = JSON.parse(saved);
                if (Array.isArray(arr) && arr.includes(capsuleId)) {
                    setIsFavorited(true);
                }
            } catch (e) {
                // ignore
            }
        }
    }, [capsuleId]);

    const handleToggle = async (e: React.MouseEvent) => {
        // Prevent clicking the underlying Link tags
        e.preventDefault();
        e.stopPropagation();

        if (isUpdating) return;
        setIsUpdating(true);

        const newFavorited = !isFavorited;
        const newCount = newFavorited ? count + 1 : Math.max(0, count - 1);

        // Optimistic UI updates
        setIsFavorited(newFavorited);
        setCount(newCount);

        // Update LocalStorage
        const saved = localStorage.getItem('favorited_capsules');
        let arr: string[] = [];
        if (saved) {
            try { arr = JSON.parse(saved); } catch (e) { }
        }

        if (newFavorited) {
            if (!arr.includes(capsuleId)) arr.push(capsuleId);
        } else {
            arr = arr.filter(id => id !== capsuleId);
        }
        localStorage.setItem('favorited_capsules', JSON.stringify(arr));

        // Update DB
        try {
            const res = await fetch(`/api/capsules/${capsuleId}/favorite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: newFavorited ? 'add' : 'remove' }),
            });
            const data = await res.json();
            if (data.success && typeof data.newCount === 'number') {
                // Sync with actual DB count just to be safe
                setCount(data.newCount);
            }
        } catch (error) {
            console.error('Failed to update favorite count', error);
        } finally {
            setIsUpdating(false);
        }
    };

    // Styling logic based on variant
    let baseStyles = 'bg-white/50 border-gray-200 text-gray-500 hover:bg-white/80';
    let activeStyles = 'bg-red-50/80 border-red-200 text-red-500 hover:bg-red-100/80';

    if (variant === 'glass') {
        baseStyles = 'bg-white/80 border-white/50 text-gray-700 hover:bg-white hover:text-gray-900 backdrop-blur-md shadow-lg';
        activeStyles = 'bg-white/95 border-red-200 text-red-500 hover:bg-white backdrop-blur-md shadow-lg';
    }

    return (
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
    );
}
