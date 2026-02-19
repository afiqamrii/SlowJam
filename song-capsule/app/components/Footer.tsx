'use client';

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
                <div className="flex items-center gap-4">
                    <span>© {new Date().getFullYear()} SlowJam</span>
                    <span className="text-gray-200">|</span>
                    <span>Capsules are permanent — think before you send 💌</span>
                </div>
            </div>
        </footer>
    );
}
