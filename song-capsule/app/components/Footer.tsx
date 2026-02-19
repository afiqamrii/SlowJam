'use client';

import { Heart } from 'lucide-react';
import GradientText from './GradientText';

export default function Footer() {
    return (
        <footer className="w-full border-t border-gray-100 bg-white/70 backdrop-blur-sm mt-auto py-6 px-6">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400 font-sans">
                <div className="flex items-center gap-1.5">
                    <GradientText
                        colors={['#d97559', '#a08c7a', '#d97559']}
                        animationSpeed={6}
                        className="font-(--font-gloria) text-base font-bold"
                    >
                        SlowJam
                    </GradientText>
                    <span>— send a song to the future.</span>
                </div>
                <div className="flex flex-col items-center sm:items-end gap-0.5 text-center sm:text-right">
                    <span>
                        © {new Date().getFullYear()} Song Capsule — made with{' '}
                        <Heart size={11} className="inline text-[#d97757]" fill="#d97757" /> for the music lovers.
                    </span>
                    <span className="text-[#d97757] font-medium">@by Afiq Amri</span>
                </div>
            </div>
        </footer>
    );
}
