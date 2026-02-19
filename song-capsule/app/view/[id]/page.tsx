'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Lock, Play, Pause, ExternalLink, Music2, Clock } from 'lucide-react';
import { useParams } from 'next/navigation';
import Confetti from 'react-confetti';

export default function ViewCapsule() {
    const { id } = useParams();
    const [capsule, setCapsule] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [autoplayBlocked, setAutoplayBlocked] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchCapsule = async () => {
            if (!id) return;
            const { data, error } = await supabase
                .from('capsules')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching capsule:', error);
            } else {
                setCapsule(data);
                // Check unlock status immediately to prevent flash of locked state
                const now = new Date().getTime();
                const unlockTime = new Date(data.unlock_at).getTime();
                if (unlockTime <= now) {
                    setIsUnlocked(true);
                }
            }
            setLoading(false);
        };

        fetchCapsule();
    }, [id]);

    useEffect(() => {
        if (!capsule) return;

        const checkTime = () => {
            const now = new Date().getTime();
            const unlockTime = new Date(capsule.unlock_at).getTime();
            const distance = unlockTime - now;

            if (distance < 0) {
                setIsUnlocked(true);
                setTimeLeft(null);
                return true; // clear interval signal
            } else {
                setIsUnlocked(false);
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000),
                });
                return false;
            }
        };

        // Run immediately to avoid 1s delay
        if (checkTime()) return;

        const interval = setInterval(() => {
            if (checkTime()) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [capsule]);

    // Auto-play when the capsule becomes unlocked
    useEffect(() => {
        if (!isUnlocked || !audioRef.current) return;
        const audio = audioRef.current;
        audio.play()
            .then(() => {
                setIsPlaying(true);
                setAutoplayBlocked(false);
            })
            .catch(() => {
                // Browser blocked autoplay — show a tap-to-play prompt
                setAutoplayBlocked(true);
            });
    }, [isUnlocked]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setAutoplayBlocked(false);
        setIsPlaying(!isPlaying);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-(--font-gloria) text-[var(--foreground)]">Loading capsule...</div>;
    if (!capsule) return <div className="min-h-screen flex items-center justify-center font-(--font-gloria) text-[var(--foreground)]">Capsule not found.</div>;

    const hasPreview = capsule.preview_url && capsule.preview_url.trim() !== '';
    const hasSpotifyId = capsule.spotify_track_id && capsule.spotify_track_id.trim() !== '';

    // ... existing code ...
    return (
        <div className="min-h-screen px-4 md:px-6 py-12 flex flex-col items-center justify-start sm:justify-center font-(--font-gloria) text-center text-foreground">
            {!isUnlocked ? (
                // ─── Locked State ───────────────────────────────────────────────
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8 max-w-md w-full bg-white p-8 rounded-3xl border border-border shadow-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-accent" />

                    <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent">
                        <Lock size={40} />
                    </div>

                    <div>
                        <p className="text-gray-500 uppercase tracking-widest text-sm mb-2">FOR {capsule.receiver_name || 'YOU'}</p>
                        <h1 className="text-3xl font-bold">Capsule Locked</h1>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-center">
                        {timeLeft && Object.entries(timeLeft).map(([label, value]) => (
                            <div key={label} className="flex flex-col p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-2xl font-bold text-foreground">{value}</span>
                                <span className="text-[10px] uppercase text-gray-400 font-sans tracking-wider">{label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-accent/5 py-3 px-4 rounded-lg border border-accent/20">
                        <p className="text-accent text-sm">
                            Opens on {new Date(capsule.unlock_at).toLocaleString()}
                        </p>
                    </div>

                    {/* Enhanced Locked Visuals */}
                    <div className="flex flex-col items-center gap-2 text-gray-400 mt-4">
                        <Clock size={20} className="animate-bounce opacity-50" />
                        <p className="text-xs font-sans uppercase tracking-widest">Time traveling...</p>
                    </div>
                </motion.div>
            ) : (
                // ─── Unlocked State ─────────────────────────────────────────────
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8 w-[95%] md:w-[80%] max-w-3xl"
                >
                    <Confetti
                        width={windowSize.width}
                        height={windowSize.height}
                        recycle={false}
                        numberOfPieces={1000}
                        gravity={0.15}
                    />
                    {/* Greeting */}
                    <div className="text-center space-y-2">
                        <p className="text-3xl md:text-4xl font-bold font-sans">
                            Hello, <span className="font-(--font-gloria)">{capsule.receiver_name || 'Friend'}</span>
                        </p>
                        <p className="text-gray-500 text-base font-sans">
                            Someone sent you a song... they wanted you to hear this!
                        </p>
                    </div>

                    {/* ── Music Card ── */}
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-full rounded-3xl overflow-hidden shadow-2xl"
                    >
                        {/* Hero: Album Art full-width */}
                        <div className="relative w-full h-56">
                            {capsule.album_art_url ? (
                                <img
                                    src={capsule.album_art_url}
                                    alt="Album Art"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-[#5c4033] flex items-center justify-center">
                                    <Music2 size={64} className="text-white/30" />
                                </div>
                            )}

                            {/* Dark gradient overlay at bottom for text legibility */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                            {/* Track info pinned to bottom of image */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                                <p className="text-white/60 text-xs font-sans uppercase tracking-widest mb-1">Now Playing</p>
                                <h2 className="text-white text-2xl font-bold leading-tight drop-shadow-lg">{capsule.track_name}</h2>
                                <p className="text-white/70 font-sans text-sm mt-0.5">{capsule.artist_name}</p>
                            </div>

                            {/* Play button — floating top-right, only if preview_url */}
                            {hasPreview && (
                                <>
                                    <audio
                                        ref={audioRef}
                                        src={capsule.preview_url}
                                        onEnded={() => setIsPlaying(false)}
                                    />
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={togglePlay}
                                        className="absolute top-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-[#5c4033] hover:scale-105 transition-transform"
                                    >
                                        {isPlaying
                                            ? <Pause size={26} fill="#5c4033" />
                                            : <Play size={26} fill="#5c4033" className="ml-1" />
                                        }
                                    </motion.button>
                                </>
                            )}

                            {/* Tap-to-play overlay — shown when browser blocked autoplay */}
                            {autoplayBlocked && hasPreview && (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={togglePlay}
                                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer z-20"
                                >
                                    <motion.div
                                        animate={{ scale: [1, 1.12, 1] }}
                                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl mb-3"
                                    >
                                        <Play size={36} fill="#5c4033" className="ml-1 text-[#5c4033]" />
                                    </motion.div>
                                    <p className="text-white text-sm font-sans tracking-widest uppercase opacity-80">Tap to play</p>
                                </motion.button>
                            )}

                            {/* Spinning vinyl ring — subtle, only when playing */}
                            {isPlaying && (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                    className="absolute top-4 right-4 w-14 h-14 rounded-full border-2 border-white/30 border-dashed pointer-events-none"
                                />
                            )}
                        </div>

                        {/* Bottom strip: Spotify embed OR Spotify link button */}
                        <div className="bg-[#1a0a05] px-6 py-5 space-y-4">
                            {!hasPreview && hasSpotifyId ? (
                                /* Spotify embed when no native preview */
                                <div className="space-y-2">
                                    <p className="text-white/40 text-xs font-sans uppercase tracking-widest text-center">Listen via Spotify</p>
                                    <iframe
                                        src={`https://open.spotify.com/embed/track/${capsule.spotify_track_id}?utm_source=generator&theme=0`}
                                        width="100%"
                                        height="80"
                                        frameBorder="0"
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        loading="lazy"
                                        className="rounded-xl"
                                    />
                                </div>
                            ) : null}

                            {/* Open on Spotify */}
                            <a
                                href={`https://open.spotify.com/track/${capsule.spotify_track_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-xl transition-colors text-sm font-sans"
                            >
                                {/* Spotify logo mark */}
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                                </svg>
                                Open on Spotify
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    </motion.div>

                    {/* Message Card */}
                    <div className="bg-[#fdf6ee] p-5 md:p-8 rounded-2xl border border-border shadow-md relative">
                        <span className="absolute -top-5 left-4 text-7xl leading-none text-accent opacity-30 font-serif select-none">&ldquo;</span>
                        <p className="relative z-10 text-lg md:text-2xl leading-relaxed text-foreground min-h-24 whitespace-pre-wrap font-(--font-gloria)">
                            {capsule.message}
                        </p>
                        <span className="absolute -bottom-8 right-4 text-7xl leading-none text-accent opacity-30 font-serif select-none">&rdquo;</span>
                        {capsule.sender_name && (
                            <p className="mt-6 text-right text-sm text-gray-400 font-sans tracking-wide">
                                — {capsule.sender_name}
                            </p>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
