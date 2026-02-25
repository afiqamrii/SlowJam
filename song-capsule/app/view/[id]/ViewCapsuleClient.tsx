'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, Play, Pause, Music2, Clock, Camera, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import Confetti from 'react-confetti';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ── Polaroid imports ────────────────────────────────────────────────────────
import ImageCropper from '@/app/components/polaroid/ImageCropper';
import PolaroidCard from '@/app/components/polaroid/PolaroidCard';
import ExportButton from '@/app/components/polaroid/ExportButton';
import FavoriteButton from '@/app/components/FavoriteButton';
import { useImageProcessing } from '@/app/hooks/useImageProcessing';
import { useCanvasExport } from '@/app/hooks/useCanvasExport';
import type { ExportFormat } from '@/app/lib/canvasRenderer';
import { useLetterExport } from '@/app/hooks/useLetterExport';
import LetterCard from '@/app/components/letter/LetterCard';
import { useAuth } from '@/app/hooks/useAuth';
import { Check } from 'lucide-react';

interface ViewCapsuleClientProps {
    capsule: any;
    isShareAuthorized?: boolean;
}

export default function ViewCapsuleClient({ capsule, isShareAuthorized = false }: ViewCapsuleClientProps) {
    // Note: capsule is now passed as a prop, already fetched by the server
    const { user, loading: authLoading, signInWithGoogle } = useAuth();
    const router = useRouter();

    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [autoplayBlocked, setAutoplayBlocked] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const [appleMusicUrl, setAppleMusicUrl] = useState<string | null>(null);

    // ── Polaroid state ──────────────────────────────────────────────────────
    const [showPolaroid, setShowPolaroid] = useState(false);
    const [creationType, setCreationType] = useState<'polaroid' | 'letter'>('polaroid');
    const [letterBg, setLetterBg] = useState<string>('/letter_backgrounds/bg1.jpg');
    const letterBackgrounds = ['/letter_backgrounds/bg1.jpg', '/letter_backgrounds/bg2.jpg', '/letter_backgrounds/bg3.jpg', '/letter_backgrounds/bg4.jpg', '/letter_backgrounds/bg5.jpg', '/letter_backgrounds/bg7.jpg'];
    const [signOff, setSignOff] = useState('With love,');
    const [senderName, setSenderName] = useState(capsule?.sender_name || 'Me');
    const [format, setFormat] = useState<ExportFormat>('ig');
    // Shared message for both Polaroid and Letter — can be swapped for AI song meaning
    const [displayMessage, setDisplayMessage] = useState<string>(capsule?.message ?? '');
    const [usingSongMeaning, setUsingSongMeaning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const imgProc = useImageProcessing();
    const { isExporting, exportPNG } = useCanvasExport();
    const { isExporting: isLetterExporting, exportPNG: exportLetterPNG } = useLetterExport();

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ── Enforce content limits for Polaroid ─────────────────────────────────
    const canUseOriginalForPolaroid = (capsule?.message?.length || 0) <= 500;
    const canUseMeaningForPolaroid = !!capsule?.song_meaning && capsule.song_meaning.length <= 500;
    const canUsePolaroid = canUseOriginalForPolaroid || canUseMeaningForPolaroid;

    useEffect(() => {
        if (creationType === 'polaroid') {
            if (!canUsePolaroid) {
                setCreationType('letter');
            } else if (displayMessage && displayMessage.length > 500) {
                // The current selection exceeds the limit. Auto-switch if the alternative is valid.
                if (canUseOriginalForPolaroid && usingSongMeaning) {
                    setUsingSongMeaning(false);
                    setDisplayMessage(capsule.message);
                } else if (canUseMeaningForPolaroid && !usingSongMeaning) {
                    setUsingSongMeaning(true);
                    setDisplayMessage(capsule.song_meaning);
                }
            }
        }
    }, [displayMessage, creationType, canUsePolaroid, canUseMeaningForPolaroid, canUseOriginalForPolaroid, usingSongMeaning, capsule]);

    // ── Resolve Apple Music direct URL via iTunes Lookup API ─────────────────
    // We only store the numeric trackId. The real Apple Music URL also needs
    // the albumId, so we do a quick free lookup to get the full trackViewUrl.
    useEffect(() => {
        const id = capsule?.spotify_track_id?.trim();
        if (!id || isNaN(Number(id))) return; // only run for numeric (iTunes) IDs
        fetch(`https://itunes.apple.com/lookup?id=${id}&entity=song`)
            .then(r => r.json())
            .then(data => {
                const url = data.results?.[0]?.trackViewUrl;
                if (url) setAppleMusicUrl(url);
            })
            .catch(() => { }); // fail silently — fallback search URL used instead
    }, [capsule]);

    // Initial check on mount
    useEffect(() => {
        if (!capsule) return;
        const now = new Date().getTime();
        const unlockTime = new Date(capsule.unlock_at).getTime();
        if (unlockTime <= now) {
            setIsUnlocked(true);
        }
    }, [capsule]);

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

        // Track download in DB (fire and forget)
        supabase.rpc('increment_polaroid_downloads', { target_capsule_id: capsule.id })
            .then(({ error }) => {
                if (error) console.error('Error incrementing polaroid downloads:', error);
            });

        await exportPNG({
            croppedImageCanvas: imgProc.processedCanvas,
            trackName: capsule.track_name,
            artistName: capsule.artist_name,
            albumArtUrl: capsule.album_art_url ?? '',
            message: displayMessage,
            receiverName: capsule.receiver_name,
            format,
        });
    }, [imgProc.processedCanvas, capsule, exportPNG, format, displayMessage]);

    const handleLetterExport = useCallback(async () => {
        if (!capsule) return;

        supabase.rpc('increment_polaroid_downloads', { target_capsule_id: capsule.id })
            .then(({ error }) => {
                if (error) console.error('Error incrementing letter downloads:', error);
            });

        await exportLetterPNG({
            bgImageSrc: letterBg,
            trackName: capsule.track_name,
            artistName: capsule.artist_name,
            albumArtUrl: capsule.album_art_url ?? '',
            message: displayMessage,
            receiverName: capsule.receiver_name,
            signOff,
            senderName,
            format,
        });
    }, [capsule, exportLetterPNG, format, letterBg, signOff, senderName]);

    if (!capsule) return <div className="min-h-screen flex items-center justify-center font-(--font-gloria) text-foreground">Capsule not found.</div>;

    // ── Privacy Gate ─────────────────────────────────────────────────────────
    // Private capsules are accessible if: (a) user is the owner, or (b) they have the secret share link
    const isOwner = !!user && !!capsule.owner_id && user.id === capsule.owner_id;
    const isPrivateAndBlocked = capsule.is_private && !authLoading && !isOwner && !isShareAuthorized;

    if (isPrivateAndBlocked) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 font-(--font-gloria) text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6 max-w-sm w-full bg-white p-8 rounded-3xl border border-border shadow-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-accent to-accent-secondary" />
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto text-accent">
                        <Lock size={32} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">Private Capsule</h1>
                        <p className="text-gray-500 font-sans text-sm">
                            This capsule is private. You need the special link from the creator to view it.
                        </p>
                    </div>
                    {!user ? (
                        <>
                            <p className="text-gray-400 font-sans text-xs">
                                If this is your capsule, sign in to access it.
                            </p>
                            <button
                                onClick={() => signInWithGoogle()}
                                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-white border-2 border-gray-200 rounded-2xl font-semibold text-gray-700 font-sans hover:border-accent hover:shadow-md transition-all active:scale-95"
                            >
                                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                                    <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107" />
                                    <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00" />
                                    <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50" />
                                    <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2" />
                                </svg>
                                Sign in with Google
                            </button>
                        </>
                    ) : (
                        <p className="text-gray-400 font-sans text-xs">
                            You are signed in as <b>{user.email}</b>, but don't have access to this private capsule.
                        </p>
                    )}
                </motion.div>
            </div>
        );
    }


    const hasPreview = capsule.preview_url && capsule.preview_url.trim() !== '';

    // ── Smart ID detection ────────────────────────────────────────────────────
    // Old capsules (Spotify era): spotify_track_id is alphanumeric, e.g. "0VjIjW4GlUZAMYd2vXMi47"
    // New capsules (iTunes era):  spotify_track_id is numeric,       e.g. "1488408568"
    // We can tell them apart with a simple isNaN check — no DB migration needed.
    const rawId = capsule.spotify_track_id?.trim() ?? '';
    const isItunesId = rawId !== '' && !isNaN(Number(rawId));   // numeric  → iTunes
    const isSpotifyId = rawId !== '' && isNaN(Number(rawId));   // alphanum → Spotify
    const itunesId = isItunesId ? rawId : null;
    const spotifyId = isSpotifyId ? rawId : null;

    return (
        <div className="min-h-screen px-3 md:px-6 py-12 flex flex-col items-center justify-start sm:justify-center font-(--font-gloria) text-center text-foreground">
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
                <>
                    <Confetti
                        width={windowSize.width}
                        height={windowSize.height}
                        recycle={false}
                        numberOfPieces={1000}
                        gravity={0.15}
                        style={{ position: 'fixed', top: '56px', left: 0, zIndex: 100, pointerEvents: 'none' }}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8 w-full sm:w-[95%] md:w-[80%] max-w-3xl"
                    >
                        {/* Greeting */}
                        <div className="text-center space-y-2">
                            <p className="text-3xl md:text-4xl font-bold">
                                Hello, {capsule.receiver_name || 'Friend'}
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
                            {/* Hero: Album Art full-cover */}
                            <div className="relative w-full aspect-square md:aspect-auto md:h-104">
                                {capsule.album_art_url ? (
                                    <img
                                        src={capsule.album_art_url}
                                        alt="Album Art"
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 w-full h-full bg-[#5c4033] flex items-center justify-center">
                                        <Music2 size={64} className="text-white/30" />
                                    </div>
                                )}

                                {/* Top-Right Favorite Button */}
                                <div className="absolute top-4 right-4 z-20">
                                    <FavoriteButton
                                        capsuleId={capsule.id}
                                        initialCount={capsule.favorites_count || 0}
                                        variant="glass"
                                    />
                                </div>

                                {/* Gradient overlay — stronger at bottom for text readability */}
                                <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/50 to-black/10" />

                                {/* Track info — bottom-left */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                                    {/* Now Playing label */}
                                    <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2 text-left">Now Playing</p>

                                    {/* Track name — larger, Gloria font (default), left */}
                                    <h2 className="text-white text-3xl md:text-4xl font-bold leading-tight drop-shadow-lg pr-20 text-left">{capsule.track_name}</h2>

                                    {/* Artist name — Gloria font, left */}
                                    <p className="text-white/75 text-base md:text-lg mt-1 pr-20 text-left font-(--font-gloria)">{capsule.artist_name}</p>

                                    {/* ── Platform links & Action row ── */}
                                    <div className="flex items-center gap-3 mt-4">
                                        <p className="text-white/40 text-[10px] uppercase tracking-widest font-sans mr-1">Open in</p>

                                        {/* Spotify — direct link for old capsules (real Spotify ID), search for new ones (iTunes ID) */}
                                        <a
                                            href={spotifyId
                                                ? `https://open.spotify.com/track/${spotifyId}`
                                                : `https://open.spotify.com/search/${encodeURIComponent((capsule.track_name || '') + ' ' + (capsule.artist_name || ''))}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={spotifyId ? 'Open on Spotify' : 'Search on Spotify'}
                                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954">
                                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.441 17.307a.75.75 0 0 1-1.031.25c-2.823-1.726-6.376-2.116-10.564-1.158a.75.75 0 0 1-.334-1.463c4.579-1.045 8.508-.596 11.68 1.34a.75.75 0 0 1 .249 1.031zm1.452-3.23a.938.938 0 0 1-1.288.308c-3.23-1.985-8.152-2.561-11.976-1.402a.937.937 0 1 1-.544-1.794c4.365-1.325 9.79-.682 13.5 1.599a.938.938 0 0 1 .308 1.289zm.125-3.363C15.34 8.445 9.375 8.25 5.858 9.35a1.125 1.125 0 1 1-.653-2.152c4.063-1.233 10.817-1.003 15.088 1.597a1.125 1.125 0 0 1-1.075 1.919z" />
                                            </svg>
                                        </a>

                                        {/* YouTube Music */}
                                        <a
                                            href={`https://music.youtube.com/search?q=${encodeURIComponent((capsule.track_name || '') + ' ' + (capsule.artist_name || ''))}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Open on YouTube Music"
                                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                                        >
                                            {/* YouTube Music — real logo from Wikimedia */}
                                            <img
                                                src="https://upload.wikimedia.org/wikipedia/commons/6/6a/Youtube_Music_icon.svg"
                                                alt="YouTube Music"
                                                width="22"
                                                height="22"
                                                className="rounded-sm"
                                            />
                                        </a>

                                        {/* YouTube */}
                                        <a
                                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent((capsule.track_name || '') + ' ' + (capsule.artist_name || '') + ' official')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Search on YouTube"
                                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                                        >
                                            {/* YouTube logo */}
                                            <svg width="20" height="14" viewBox="0 0 461.001 461.001" fill="#FF0000">
                                                <path d="M365.257,67.393H95.744C42.866,67.393,0,110.259,0,163.137v134.728c0,52.878,42.866,95.744,95.744,95.744h269.513c52.878,0,95.744-42.866,95.744-95.744V163.137C461.001,110.259,418.135,67.393,365.257,67.393z M300.506,237.056l-126.06,60.123c-3.359,1.602-7.239-0.847-7.239-4.568V168.607c0-3.774,3.982-6.22,7.348-4.514l126.06,63.881C304.363,229.873,304.298,235.248,300.506,237.056z" />
                                            </svg>
                                        </a>

                                        {/* Apple Music — direct link via iTunes Lookup, falls back to search */}
                                        <a
                                            href={appleMusicUrl || `https://music.apple.com/search?term=${encodeURIComponent((capsule.track_name || '') + ' ' + (capsule.artist_name || ''))}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Open on Apple Music"
                                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                                        >
                                            {/* Apple Music — real colorful logo from Wikimedia */}
                                            <img
                                                src="https://commons.wikimedia.org/wiki/Special:FilePath/Apple_Music_icon.svg"
                                                alt="Apple Music"
                                                width="22"
                                                height="22"
                                                className="rounded-sm"
                                            />
                                        </a>
                                    </div>

                                    {/* Spotify iframe — only for old capsules with a real Spotify track ID */}
                                    {!hasPreview && spotifyId ? (
                                        <div className="w-full relative mt-4">
                                            <iframe
                                                src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
                                                width="100%"
                                                height="80"
                                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                loading="lazy"
                                                className="rounded-xl shadow-lg"
                                            />
                                        </div>
                                    ) : null}
                                </div>

                                {/* ── Play / Pause button — bottom-right corner ── */}
                                {hasPreview && (
                                    <>
                                        <audio
                                            ref={audioRef}
                                            src={capsule.preview_url}
                                            onEnded={() => setIsPlaying(false)}
                                        />
                                        <motion.button
                                            whileTap={{ scale: 0.88 }}
                                            whileHover={{ scale: 1.08 }}
                                            onClick={togglePlay}
                                            className="absolute bottom-6 right-6 z-20 w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center text-[#5c4033] transition-transform"
                                        >
                                            {isPlaying
                                                ? <Pause size={28} fill="#5c4033" />
                                                : <Play size={28} fill="#5c4033" className="ml-1" />
                                            }
                                        </motion.button>

                                        {/* Spinning ring around button when playing */}
                                        {isPlaying && (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                                className="absolute bottom-6 right-6 z-20 w-16 h-16 rounded-full border-2 border-white/40 border-dashed pointer-events-none"
                                            />
                                        )}
                                    </>
                                )}

                                {/* Autoplay blocked overlay */}
                                {autoplayBlocked && hasPreview && (
                                    <motion.button
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={togglePlay}
                                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer z-30"
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
                            </div>
                        </motion.div>

                        {/* Message Card */}
                        <div className="bg-[#fdf6ee] p-5 md:p-8 rounded-2xl border border-border shadow-md relative">
                            <span className="absolute -top-5 left-4 text-7xl leading-none text-accent opacity-30 font-serif select-none">&ldquo;</span>
                            <div className="relative z-10 text-lg md:text-2xl leading-relaxed text-foreground min-h-24 font-(--font-gloria) flex flex-col gap-4">
                                {capsule.message ? capsule.message.split('\n\n').map((paragraph: string, index: number) => (
                                    <ReactMarkdown key={index} components={{ p: ({ children }) => <span className="whitespace-pre-wrap">{children}</span> }}>
                                        {paragraph.replace(/(?:\n|^)-\s*/g, '\n').trim()}
                                    </ReactMarkdown>
                                )) : null}
                            </div>
                            <span className="absolute -bottom-8 right-4 text-7xl leading-none text-accent opacity-30 font-serif select-none">&rdquo;</span>
                            {capsule.sender_name && (
                                <p className="mt-6 text-right text-sm text-gray-400 font-sans tracking-wide">
                                    — {capsule.sender_name}
                                </p>
                            )}
                        </div>

                        {/* Song Meaning (AI generated) */}
                        {capsule.song_meaning && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-gradient-to-br from-[#E6E6FA]/40 to-[#F0E6FA]/40 p-5 md:p-6 rounded-2xl border border-[#D8BFD8]/50 shadow-sm relative overflow-hidden text-left"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" className="text-purple-600">
                                        <path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5L12 2Z" />
                                    </svg>
                                </div>
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-purple-500">
                                        <path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5L12 2ZM20 20L18 18L16 20L18 22L20 20Z" />
                                    </svg>
                                    <p className="text-lg md:text-xl font-bold text-purple-800/90 tracking-wide font-(--font-gloria)">
                                        Story behind the song
                                    </p>
                                </div>
                                <div className="text-base md:text-lg text-gray-700 leading-relaxed font-(--font-gloria) whitespace-pre-wrap relative z-10 text-center flex flex-col gap-6">
                                    {capsule.song_meaning ? capsule.song_meaning.split('\n\n').map((paragraph: string, index: number, arr: string[]) => (
                                        <div key={index} className={index === arr.length - 1 && arr.length > 1 ? "font-bold text-sm md:text-base" : ""}>
                                            <div className="inline-block">
                                                <ReactMarkdown>
                                                    {paragraph.replace(/(?:\n|^)-\s*/g, '\n').trim()}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )) : null}
                                </div>
                            </motion.div>
                        )}

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
                                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-accent">
                                        <Camera size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--foreground)] text-base">Create a Keepsake</p>
                                        <p className="text-gray-400 text-xs font-sans mt-0.5">Save as a Polaroid or a Letterify</p>
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

                                    {/* ── Format Toggle ── */}
                                    <div className="flex bg-gray-100 p-1 rounded-xl">
                                        <button
                                            onClick={() => setCreationType('polaroid')}
                                            disabled={!canUsePolaroid}
                                            title={!canUsePolaroid ? "Both original message and song story are too long for a Polaroid (max 500 chars)" : "Generate Polaroid"}
                                            className={`flex-1 py-2 text-sm font-bold font-sans rounded-lg transition-all ${creationType === 'polaroid' ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'} ${!canUsePolaroid ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            Polaroid
                                        </button>
                                        <button
                                            onClick={() => setCreationType('letter')}
                                            className={`flex-1 py-2 text-sm font-bold font-sans rounded-lg transition-all ${creationType === 'letter' ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Letterify
                                        </button>
                                    </div>

                                    {creationType === 'polaroid' ? (
                                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
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
                                                        className="w-full border-2 border-dashed border-[var(--border)] rounded-2xl py-10 flex flex-col items-center gap-3 text-gray-400 hover:border-accent hover:bg-[var(--accent)]/5 transition-all"
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
                                                            className="text-xs text-gray-400 hover:text-accent font-sans transition-colors"
                                                        >
                                                            ↩ Change photo
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ── AI Message Toggle (Polaroid) ── */}
                                            {capsule.song_meaning && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest font-sans">✨ Message</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => { setUsingSongMeaning(false); setDisplayMessage(capsule.message ?? ''); }}
                                                            disabled={!canUseOriginalForPolaroid}
                                                            title={!canUseOriginalForPolaroid ? "Original message exceeds 500 chars" : ""}
                                                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-sans font-semibold border-2 transition-all ${!canUseOriginalForPolaroid ? 'opacity-40 cursor-not-allowed border-border text-gray-400' :
                                                                    !usingSongMeaning ? 'border-accent bg-accent/10 text-accent' : 'border-border text-gray-400 hover:border-accent/40'
                                                                }`}
                                                        >
                                                            ✍️ Original message
                                                        </button>
                                                        <button
                                                            onClick={() => { setUsingSongMeaning(true); setDisplayMessage(capsule.song_meaning ?? capsule.message ?? ''); }}
                                                            disabled={!canUseMeaningForPolaroid}
                                                            title={!canUseMeaningForPolaroid ? "Song story exceeds 500 chars" : ""}
                                                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-sans font-semibold border-2 transition-all ${!canUseMeaningForPolaroid ? 'opacity-40 cursor-not-allowed border-border text-gray-400' :
                                                                    usingSongMeaning ? 'border-accent bg-accent/10 text-accent' : 'border-border text-gray-400 hover:border-accent/40'
                                                                }`}
                                                        >
                                                            🎵 AI song story
                                                        </button>
                                                    </div>
                                                    {!canUseOriginalForPolaroid && canUseMeaningForPolaroid && (
                                                        <p className="text-amber-600 text-[11px] leading-tight font-medium mt-1">
                                                            Tip: Your original message exceeds 500 characters, so only the AI Song Story is available for Polaroids.
                                                        </p>
                                                    )}
                                                </div>
                                            )}

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
                                                    message={displayMessage}
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
                                                            ? 'border-accent bg-(--accent)/ text-accent'
                                                            : 'border-border text-gray-400 hover:border-(--accent)/50'
                                                            }`}
                                                    >
                                                        {/* Instagram icon */}
                                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                                            <defs>
                                                                <linearGradient id="ig-grad-polaroid" x1="0%" y1="100%" x2="100%" y2="0%">
                                                                    <stop offset="0%" stopColor="#f09433" />
                                                                    <stop offset="50%" stopColor="#dc2743" />
                                                                    <stop offset="100%" stopColor="#bc1888" />
                                                                </linearGradient>
                                                            </defs>
                                                            <rect x="1" y="1" width="22" height="22" rx="6" fill="url(#ig-grad-polaroid)" />
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
                                                            ? 'border-accent bg-(--accent)/ text-accent'
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
                                    ) : (
                                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                                            {/* ── Step 1: Background ── */}
                                            <div className="space-y-3">
                                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest font-sans">
                                                    1. Choose a background
                                                </p>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {letterBackgrounds.map((bg) => (
                                                        <button
                                                            key={bg}
                                                            onClick={() => setLetterBg(bg)}
                                                            className={`relative aspect-9/16 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${letterBg === bg ? 'border-accent shadow-md' : 'border-transparent'}`}
                                                        >
                                                            <img src={bg} alt="Letter Background" className="w-full h-full object-cover" />
                                                            {letterBg === bg && (
                                                                <div className="absolute inset-0 bg-(--accent)/ mix-blend-multiply" />
                                                            )}
                                                            {letterBg === bg && (
                                                                <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm text-accent">
                                                                    <Check size={14} strokeWidth={3} />
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* ── Custom Color Picker ── */}
                                                <div className="pt-2">
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest font-sans mb-3 text-center sm:text-center">Or use a custom solid color</p>
                                                    <div className="flex gap-3 justify-center sm:justify-center items-center">
                                                        {/* Color visual picker */}
                                                        <div className="relative w-12 h-12 rounded-xl border-2 border-[var(--border)] overflow-hidden shrink-0 shadow-sm cursor-pointer transition-colors focus-within:border-[var(--accent)] hover:border-[var(--accent)]">
                                                            <input
                                                                type="color"
                                                                value={letterBg.startsWith('#') ? letterBg : '#F9F4EA'}
                                                                onChange={(e) => setLetterBg(e.target.value.toUpperCase())}
                                                                className="absolute -inset-4 w-20 h-20 cursor-pointer"
                                                                title="Choose color"
                                                            />
                                                        </div>
                                                        {/* Hex text input */}
                                                        <div className="flex-1 relative max-w-[180px]">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-sans font-bold">#</span>
                                                            <input
                                                                type="text"
                                                                placeholder="F9F4EA"
                                                                value={letterBg.startsWith('#') ? letterBg.replace('#', '') : ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                                                                    setLetterBg(val ? `#${val.toUpperCase()}` : '#');
                                                                }}
                                                                className="w-full pl-8 pr-4 py-3 bg-white border border-[var(--border)] rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-medium text-[var(--foreground)] uppercase shadow-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── Step 2: Customize ── */}
                                            <div className="space-y-3">
                                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest font-sans">
                                                    2. Add your Sign-off & Name
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <input
                                                        type="text"
                                                        value={signOff}
                                                        onChange={(e) => setSignOff(e.target.value)}
                                                        maxLength={30}
                                                        placeholder="e.g. Best Regards,"
                                                        className="flex-1 px-4 py-3 rounded-xl border border-border focus:border-accent text-sm font-sans outline-none transition-colors w-full"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={senderName}
                                                        onChange={(e) => setSenderName(e.target.value)}
                                                        maxLength={30}
                                                        placeholder="Your Name"
                                                        className="flex-1 px-4 py-3 rounded-xl border border-border focus:border-accent text-sm font-sans outline-none transition-colors w-full"
                                                    />
                                                </div>
                                            </div>

                                            {/* ── Step 2.5: Message Source ── only shown when message is short */}
                                            {/* ── AI Message Toggle (Letter) ── */}
                                            {capsule.song_meaning && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest font-sans">✨ Message</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => { setUsingSongMeaning(false); setDisplayMessage(capsule.message ?? ''); }}
                                                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-sans font-semibold border-2 transition-all ${!usingSongMeaning ? 'border-accent bg-accent/10 text-accent' : 'border-border text-gray-400 hover:border-accent/40'
                                                                }`}
                                                        >
                                                            ✍️ Original message
                                                        </button>
                                                        <button
                                                            onClick={() => { setUsingSongMeaning(true); setDisplayMessage(capsule.song_meaning ?? capsule.message ?? ''); }}
                                                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-sans font-semibold border-2 transition-all ${usingSongMeaning ? 'border-accent bg-accent/10 text-accent' : 'border-border text-gray-400 hover:border-accent/40'
                                                                }`}
                                                        >
                                                            🎵 AI song story
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ── Step 3: Preview Letter ── */}
                                            <div className="space-y-3">
                                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest font-sans">
                                                    3. Preview your letter
                                                </p>
                                                <LetterCard
                                                    bgImageSrc={letterBg}
                                                    trackName={capsule.track_name}
                                                    artistName={capsule.artist_name}
                                                    albumArtUrl={capsule.album_art_url ?? ''}
                                                    message={displayMessage}
                                                    receiverName={capsule.receiver_name}
                                                    signOff={signOff}
                                                    senderName={senderName}
                                                    format={format}
                                                />
                                            </div>

                                            {/* ── Step 4: Download ── */}
                                            <div className="space-y-4">
                                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest font-sans">
                                                    4. Download your letter
                                                </p>

                                                <motion.button
                                                    onClick={handleLetterExport}
                                                    disabled={isLetterExporting}
                                                    whileTap={{ scale: 0.96 }}
                                                    whileHover={{ scale: isLetterExporting ? 1 : 1.02 }}
                                                    className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base transition-all"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #c0836b, #a0634e)',
                                                        color: '#fff',
                                                        boxShadow: '0 4px 20px rgba(160,99,78,0.4)',
                                                        fontFamily: 'var(--font-gloria), cursive',
                                                        cursor: isLetterExporting ? 'not-allowed' : 'pointer',
                                                        opacity: isLetterExporting ? 0.7 : 1,
                                                    }}
                                                >
                                                    {isLetterExporting ? (
                                                        <>
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            Writing your letter…
                                                        </>
                                                    ) : (
                                                        <>
                                                            ✉️ Download Letter
                                                        </>
                                                    )}
                                                </motion.button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Owner Edit button */}
                        {isOwner && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="flex justify-center mt-4"
                            >
                                <button
                                    onClick={() => router.push(`/edit/${capsule.id}`)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-sans font-semibold border-2 border-(--accent)/30 text-accent hover:bg-(--accent)/ transition-colors"
                                >
                                    <Pencil size={14} />
                                    Edit this capsule
                                </button>
                            </motion.div>
                        )}

                        {/* Sent on timestamp */}
                        {capsule.created_at && (
                            <p className="text-center text-xs text-gray-400 font-sans tracking-wide mt-2 mb-6">
                                ✉️ Sent on{' '}
                                {new Date(capsule.created_at).toLocaleString('en-MY', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        )}
                    </motion.div>
                </>
            )}
        </div>
    );
}
