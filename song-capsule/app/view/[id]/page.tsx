'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Lock, Play, Pause, ExternalLink, Music2, Clock, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { useParams } from 'next/navigation';
import Confetti from 'react-confetti';

// ── Polaroid imports ────────────────────────────────────────────────────────
import ImageCropper from '@/app/components/polaroid/ImageCropper';
import PolaroidCard from '@/app/components/polaroid/PolaroidCard';
import ExportButton from '@/app/components/polaroid/ExportButton';
import { useImageProcessing } from '@/app/hooks/useImageProcessing';
import { useCanvasExport } from '@/app/hooks/useCanvasExport';
import type { ExportFormat } from '@/app/lib/canvasRenderer';

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

    // ── Polaroid state ──────────────────────────────────────────────────────
    const [showPolaroid, setShowPolaroid] = useState(false);
    const [format, setFormat] = useState<ExportFormat>('ig');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const imgProc = useImageProcessing();
    const { isExporting, exportPNG } = useCanvasExport();

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
                return true;
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

        if (checkTime()) return;

        const interval = setInterval(() => {
            if (checkTime()) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [capsule]);

    useEffect(() => {
        if (!isUnlocked || !audioRef.current) return;
        const audio = audioRef.current;
        audio.play()
            .then(() => {
                setIsPlaying(true);
                setAutoplayBlocked(false);
            })
            .catch(() => {
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

    // ── Image upload handler ────────────────────────────────────────────────
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            imgProc.setRawSrc(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    }, [imgProc]);

    // ── Export handler ──────────────────────────────────────────────────────
    const handleExport = useCallback(async () => {
        if (!imgProc.processedCanvas || !capsule) return;
        await exportPNG({
            croppedImageCanvas: imgProc.processedCanvas,
            trackName: capsule.track_name,
            artistName: capsule.artist_name,
            albumArtUrl: capsule.album_art_url ?? '',
            message: capsule.message ?? '',
            receiverName: capsule.receiver_name,
            format,
        });
    }, [imgProc.processedCanvas, capsule, exportPNG, format]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-(--font-gloria) text-[var(--foreground)]">Loading capsule...</div>;
    if (!capsule) return <div className="min-h-screen flex items-center justify-center font-(--font-gloria) text-[var(--foreground)]">Capsule not found.</div>;

    const hasPreview = capsule.preview_url && capsule.preview_url.trim() !== '';
    const hasSpotifyId = capsule.spotify_track_id && capsule.spotify_track_id.trim() !== '';

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

                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                            <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                                <p className="text-white/60 text-xs font-sans uppercase tracking-widest mb-1">Now Playing</p>
                                <h2 className="text-white text-2xl font-bold leading-tight drop-shadow-lg">{capsule.track_name}</h2>
                                <p className="text-white/70 font-sans text-sm mt-0.5">{capsule.artist_name}</p>
                            </div>

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

                            {isPlaying && (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                    className="absolute top-4 right-4 w-14 h-14 rounded-full border-2 border-white/30 border-dashed pointer-events-none"
                                />
                            )}
                        </div>

                        {/* Bottom strip */}
                        <div className="bg-[#1a0a05] px-6 py-5 space-y-4">
                            {!hasPreview && hasSpotifyId ? (
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

                            <a
                                href={`https://open.spotify.com/track/${capsule.spotify_track_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-xl transition-colors text-sm font-sans"
                            >
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

                    {/* ═══════════════════════════════════════════════════════════
                        POLAROID CARD GENERATOR
                    ═══════════════════════════════════════════════════════════ */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="w-full rounded-3xl border border-border overflow-hidden shadow-lg"
                        style={{ background: '#fdf9f4' }}
                    >
                        {/* Header — toggle button */}
                        <button
                            onClick={() => setShowPolaroid(v => !v)}
                            className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors hover:bg-[#faf5ee]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                                    <Camera size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--foreground)] text-base">Create a Polaroid Card</p>
                                    <p className="text-gray-400 text-xs font-sans mt-0.5">Upload a photo and download a shareable 1080×1350 PNG</p>
                                </div>
                            </div>
                            <div className="text-gray-400">
                                {showPolaroid ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </button>

                        {/* Collapsible body */}
                        <motion.div
                            initial={false}
                            animate={{ height: showPolaroid ? 'auto' : 0, opacity: showPolaroid ? 1 : 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div className="px-6 pb-8 space-y-6">
                                <div className="w-full h-px bg-border" />

                                {/* ── Step 1: Upload photo ── */}
                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest font-sans">
                                        1. Upload your photo
                                    </p>

                                    {/* Hidden file input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />

                                    {!imgProc.rawSrc ? (
                                        /* Drop zone */
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full border-2 border-dashed border-[var(--border)] rounded-2xl py-10 flex flex-col items-center gap-3 text-gray-400 hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all"
                                        >
                                            <Camera size={32} className="opacity-50" />
                                            <span className="text-sm font-sans">Click to upload a photo</span>
                                            <span className="text-xs font-sans opacity-60">JPEG, PNG, WebP — any size</span>
                                        </button>
                                    ) : (
                                        /* Cropper */
                                        <div className="space-y-2">
                                            <ImageCropper
                                                imageSrc={imgProc.rawSrc}
                                                crop={imgProc.crop}
                                                zoom={imgProc.zoom}
                                                onCropChange={imgProc.setCrop}
                                                onZoomChange={imgProc.setZoom}
                                                onCropComplete={imgProc.onCropComplete}
                                            />
                                            <button
                                                onClick={() => { imgProc.setRawSrc(null); }}
                                                className="text-xs text-gray-400 hover:text-[var(--accent)] font-sans transition-colors"
                                            >
                                                ↩ Change photo
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ── Step 2: Preview ── */}
                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest font-sans">
                                        2. Preview your card
                                    </p>
                                    <PolaroidCard
                                        croppedImageCanvas={imgProc.processedCanvas}
                                        trackName={capsule.track_name}
                                        artistName={capsule.artist_name}
                                        albumArtUrl={capsule.album_art_url}
                                        message={capsule.message}
                                        receiverName={capsule.receiver_name}
                                        format={format}
                                    />
                                </div>

                                {/* ── Step 3: Download ── */}
                                <div className="space-y-4">
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest font-sans">
                                        3. Choose format & download
                                    </p>

                                    {/* Format picker */}
                                    <div className="flex gap-3">
                                        {/* IG */}
                                        <button
                                            onClick={() => setFormat('ig')}
                                            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${format === 'ig'
                                                ? 'border-accent bg-(--accent)/8 text-accent'
                                                : 'border-border text-gray-400 hover:border-(--accent)/50'
                                                }`}
                                        >
                                            {/* Instagram icon */}
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                                <defs>
                                                    <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#f09433" />
                                                        <stop offset="50%" stopColor="#dc2743" />
                                                        <stop offset="100%" stopColor="#bc1888" />
                                                    </linearGradient>
                                                </defs>
                                                <rect x="1" y="1" width="22" height="22" rx="6" fill="url(#ig-grad)" />
                                                <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.8" />
                                                <circle cx="17.5" cy="6.5" r="1.3" fill="white" />
                                            </svg>
                                            <span className="text-xs font-bold font-sans">Instagram</span>
                                            <span className="text-[10px] font-sans opacity-70">1080 × 1350</span>
                                        </button>

                                        {/* TikTok */}
                                        <button
                                            onClick={() => setFormat('tiktok')}
                                            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${format === 'tiktok'
                                                ? 'border-accent bg-(--accent)/8 text-accent'
                                                : 'border-border text-gray-400 hover:border-(--accent)/50'
                                                }`}
                                        >
                                            {/* TikTok icon */}
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                                <rect width="24" height="24" rx="6" fill="#010101" />
                                                <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5 2.592 2.592 0 0 1-2.59-2.5 2.592 2.592 0 0 1 2.59-2.5c.28 0 .546.04.795.1V9.84a5.843 5.843 0 0 0-.795-.05 5.682 5.682 0 0 0-5.682 5.682 5.682 5.682 0 0 0 5.682 5.682 5.682 5.682 0 0 0 5.682-5.682V9.35a7.687 7.687 0 0 0 4.502 1.44V7.72s-1.788.08-3.013-1.9z" fill="white" />
                                            </svg>
                                            <span className="text-xs font-bold font-sans">TikTok</span>
                                            <span className="text-[10px] font-sans opacity-70">1080 × 1920</span>
                                        </button>
                                    </div>

                                    <ExportButton
                                        onClick={handleExport}
                                        isExporting={isExporting}
                                        disabled={!imgProc.processedCanvas}
                                    />
                                    {!imgProc.rawSrc && (
                                        <p className="text-xs text-gray-400 font-sans text-center">Upload a photo first to enable download.</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* bottom spacing */}
                    <div className="h-8" />
                </motion.div>
            )}
        </div>
    );
}
