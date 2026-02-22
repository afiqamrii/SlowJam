'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Calendar, Lock, Check, Copy, Clock, Zap, ChevronLeft, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Confetti from 'react-confetti';
import { useAuth } from '@/app/hooks/useAuth';
import AuthModal from '@/app/components/AuthModal';

export default function CreateCapsule() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    // step 0: Privacy, 1: Receiver, 2: Song, 3: Message, 4: Date, 5: Review, 6: Success
    const [step, setStep] = useState(0);
    const [isPrivate, setIsPrivate] = useState<boolean | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [receiverName, setReceiverName] = useState('');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<any>(null);
    const [message, setMessage] = useState('');
    const [unlockDate, setUnlockDate] = useState('');
    const [sendNow, setSendNow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [capsuleId, setCapsuleId] = useState<string | null>(null);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // If user just signed in (redirect back), auto-pick Private and continue
    useEffect(() => {
        if (!authLoading && user) {
            const intent = sessionStorage.getItem('auth_intent');
            if (intent === 'private') {
                sessionStorage.removeItem('auth_intent');
                setIsPrivate(true);
                setStep(1);
            }
        }
    }, [authLoading, user]);

    // Minimum datetime string for input (now)
    const nowISOLocal = () => {
        const now = new Date();
        now.setSeconds(0, 0);
        const offset = now.getTimezoneOffset();
        const local = new Date(now.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
    };

    // Search Spotify
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length > 2) {
                setLoading(true);
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    if (res.status === 429) {
                        toast.error('Too many search requests. Please wait a moment.');
                        return;
                    }
                    const data = await res.json();
                    if (data.tracks) {
                        setResults(data.tracks.items);
                    } else if (data.error) {
                        console.error('Spotify API returned error:', data.error);
                        toast.error(data.error);
                    }
                } catch (error) {
                    console.error('Search error:', error);
                    toast.error('Failed to search Spotify.');
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    // Validation for Date (Must be in future)
    const isValidDate = (dateString: string) => {
        if (!dateString) return false;
        const selected = new Date(dateString);
        const now = new Date();
        return selected > now;
    };

    const handlePrivacyChoice = (choice: 'public' | 'private') => {
        if (choice === 'private') {
            if (!user) {
                setShowAuthModal(true);
                return;
            }
            setIsPrivate(true);
        } else {
            setIsPrivate(false);
        }
        nextStep();
    };

    const handleSendNow = () => {
        setSendNow(true);
        setUnlockDate('');
        nextStep();
    };

    const handleDateNext = () => {
        setSendNow(false);
        nextStep();
    };

    const handleSeal = async () => {
        if (!selectedTrack || !message || (!unlockDate && !sendNow) || !receiverName) return;
        setLoading(true);

        try {
            const unlockAt = sendNow
                ? new Date().toISOString()
                : new Date(unlockDate).toISOString();

            // Attempt to get AI meaning (fails gracefully)
            let aiMeaning = null;
            try {
                const aiRes = await fetch('/api/generate-meaning', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trackName: selectedTrack.name,
                        artistName: selectedTrack.artists[0]?.name,
                        message: message,
                        senderName: '',
                        receiverName: receiverName,
                    }),
                });
                if (aiRes.ok) {
                    const aiData = await aiRes.json();
                    if (aiData.meaning) {
                        aiMeaning = aiData.meaning;
                    }
                }
            } catch (aiErr) {
                console.warn('AI generation skipped/failed:', aiErr);
            }

            const { data, error } = await supabase
                .from('capsules')
                .insert([
                    {
                        receiver_name: receiverName,
                        spotify_track_id: selectedTrack.id,
                        track_name: selectedTrack.name,
                        artist_name: selectedTrack.artists[0].name,
                        album_art_url: selectedTrack.album.images[0]?.url,
                        preview_url: selectedTrack.preview_url,
                        message,
                        song_meaning: aiMeaning,
                        unlock_at: unlockAt,
                        is_private: isPrivate ?? false,
                        owner_id: isPrivate ? user?.id ?? null : null,
                    },
                ])
                .select()
                .single();

            if (error) throw error;
            setCapsuleId(data.id);

            // Save to localStorage for History page (public only — private are fetched from Supabase)
            try {
                const HISTORY_KEY = 'slowjam_history';
                const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
                const entry = {
                    id: data.id,
                    receiver_name: receiverName,
                    track_name: selectedTrack.name,
                    artist_name: selectedTrack.artists[0].name,
                    album_art_url: selectedTrack.album.images[0]?.url,
                    created_at: new Date().toISOString(),
                    is_private: isPrivate ?? false,
                };
                localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...existing].slice(0, 50)));
            } catch { /* ignore */ }

            nextStep(); // Move to Success Step
        } catch (error: any) {
            console.error('Error creating capsule:', error);
            toast.error(`Failed to seal: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        if (!capsuleId) return;
        const link = `${window.location.origin}/view/${capsuleId}`;
        navigator.clipboard.writeText(link);
        toast.success('Link copied to clipboard!');
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const totalSteps = 6; // 0‑based privacy is step 0, success is step 6

    return (
        <div className="min-h-screen p-6 flex flex-col items-center justify-center font-(--font-gloria) max-w-xl mx-auto text-[var(--foreground)]">

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />

            {step > 0 && step < totalSteps && (
                <div className="w-full mb-8 space-y-3">
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-[var(--accent)] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(step / totalSteps) * 100}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <h1 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                            Step {step}/{totalSteps - 1}
                        </h1>
                        {step > 0 && (
                            <button
                                onClick={prevStep}
                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-[var(--accent)] transition-colors"
                            >
                                <ChevronLeft size={16} /> Back
                            </button>
                        )}
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">

                {/* Step 0: Privacy Picker */}
                {step === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full space-y-6"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold">Who can see this?</h2>
                            <p className="text-gray-400 font-sans text-sm">Choose how your message is shared.</p>
                        </div>

                        {/* Public Card */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handlePrivacyChoice('public')}
                            className="w-full group relative overflow-hidden rounded-2xl border-2 border-[var(--border)] bg-gradient-to-br from-blue-50 to-sky-50 p-6 text-left transition-all hover:border-sky-400 hover:shadow-lg"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center shadow-md shrink-0">
                                    <Globe size={24} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-lg text-[var(--foreground)]">Public</p>
                                    <p className="text-sm text-gray-500 font-sans">Anyone with the link can view it</p>
                                </div>
                                <ArrowRight size={20} className="text-sky-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </motion.button>

                        {/* Private Card */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handlePrivacyChoice('private')}
                            className="w-full group relative overflow-hidden rounded-2xl border-2 border-[var(--border)] bg-gradient-to-br from-[var(--accent)]/8 to-[var(--accent-secondary)]/8 p-6 text-left transition-all hover:border-[var(--accent)] hover:shadow-lg"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center shadow-md shrink-0">
                                    <Lock size={24} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-lg text-[var(--foreground)]">Private</p>
                                    <p className="text-sm text-gray-500 font-sans">Only visible to you — requires sign in</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full font-sans font-semibold">Free</span>
                                    <ArrowRight size={20} className="text-[var(--accent)] opacity-60 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                            {user && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 font-sans">
                                    <div className="w-4 h-4 rounded-full bg-green-400 flex items-center justify-center">
                                        <Check size={10} className="text-white" strokeWidth={3} />
                                    </div>
                                    Signed in as {user.email}
                                </div>
                            )}
                        </motion.button>
                    </motion.div>
                )}

                {/* Step 1: Who is this for? */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full space-y-6"
                    >
                        <h2 className="text-3xl font-bold text-center">Who is this for?</h2>
                        <input
                            type="text"
                            value={receiverName}
                            onChange={(e) => setReceiverName(e.target.value)}
                            placeholder="Enter their name..."
                            className="w-full bg-white border border-[var(--border)] rounded-full py-4 px-6 text-lg text-[var(--foreground)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] shadow-sm"
                        />
                        <button
                            onClick={nextStep}
                            disabled={!receiverName.trim()}
                            className="w-full py-4 bg-[var(--accent)] text-white rounded-full font-bold hover:bg-[#c0684b] disabled:opacity-50 transition-colors"
                        >
                            Next
                        </button>
                    </motion.div>
                )}

                {/* Step 2: Pick a Song */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full space-y-6"
                    >
                        <h2 className="text-3xl font-bold text-center">Pick a Song</h2>
                        <div className="relative">
                            <Search className="absolute left-4 top-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search on Spotify..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-white border border-[var(--border)] rounded-full py-3 pl-12 pr-4 text-[var(--foreground)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] shadow-sm"
                            />
                        </div>

                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {loading && <p className="text-center text-gray-400">Searching...</p>}
                            {results.map((track) => (
                                <div
                                    key={track.id}
                                    onClick={() => {
                                        setSelectedTrack(track);
                                        nextStep();
                                    }}
                                    className="flex items-center gap-4 p-3 hover:bg-[var(--accent)]/10 rounded-xl cursor-pointer transition-colors bg-white border border-transparent hover:border-[var(--accent)]/20"
                                >
                                    <img
                                        src={track.album.images[2]?.url}
                                        alt={track.name}
                                        className="w-12 h-12 rounded-md shadow-sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold truncate text-[var(--foreground)]">{track.name}</p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {track.artists.map((a: any) => a.name).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Write Message */}
                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full space-y-6"
                    >
                        <h2 className="text-3xl font-bold text-center">Write a Message</h2>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={`Say something to ${receiverName}...`}
                            maxLength={500}
                            className="w-full h-64 bg-white border border-[var(--border)] rounded-2xl p-6 text-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none font-sans shadow-sm"
                        />
                        <div className="flex justify-between items-center text-sm text-gray-400">
                            <span>{message.length}/500</span>
                            <button
                                onClick={nextStep}
                                disabled={!message.trim()}
                                className="px-8 py-3 bg-[var(--accent)] text-white rounded-full font-bold hover:bg-[#c0684b] disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 4: Unlock Date */}
                {step === 4 && (
                    <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full space-y-5"
                    >
                        <div className="text-center space-y-1">
                            <h2 className="text-3xl font-bold">When to Open?</h2>
                            <p className="text-gray-400 font-sans text-sm">Choose when the capsule unlocks, or send right now.</p>
                        </div>

                        {/* Send Now Card */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSendNow}
                            className="w-full group relative overflow-hidden rounded-2xl border-2 border-[var(--accent-secondary)] bg-gradient-to-br from-[var(--accent-secondary)]/10 to-[var(--accent-secondary)]/5 p-6 text-left transition-all hover:border-[var(--accent-secondary)] hover:shadow-lg"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[var(--accent-secondary)] flex items-center justify-center shadow-md shrink-0">
                                    <Zap size={24} className="text-white" fill="white" />
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-[var(--foreground)]">Send Now</p>
                                    <p className="text-sm text-gray-500 font-sans">Opens immediately — no waiting!</p>
                                </div>
                                <ArrowRight size={20} className="ml-auto text-[var(--accent-secondary)] opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </motion.button>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400 font-sans uppercase tracking-wider">or schedule it</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* Scheduled Date Card */}
                        <div className="w-full rounded-2xl border-2 border-[var(--border)] bg-white shadow-sm overflow-hidden">
                            <div className="h-1.5 w-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]" />
                            <div className="p-6 space-y-5">
                                <div className="flex items-center gap-3 text-[var(--accent)]">
                                    <Calendar size={22} />
                                    <span className="font-bold text-base text-[var(--foreground)]">Pick a Date & Time</span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-sans uppercase tracking-wider">Date</label>
                                    <input
                                        type="date"
                                        value={unlockDate ? unlockDate.split('T')[0] : ''}
                                        min={nowISOLocal().split('T')[0]}
                                        onChange={(e) => {
                                            const timePart = unlockDate ? unlockDate.split('T')[1] : '12:00';
                                            setUnlockDate(`${e.target.value}T${timePart || '12:00'}`);
                                        }}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[var(--foreground)] font-sans focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-sans uppercase tracking-wider flex items-center gap-1.5">
                                        <Clock size={12} /> Time
                                    </label>
                                    <input
                                        type="time"
                                        value={unlockDate ? unlockDate.split('T')[1] : ''}
                                        onChange={(e) => {
                                            const datePart = unlockDate ? unlockDate.split('T')[0] : new Date().toISOString().split('T')[0];
                                            setUnlockDate(`${datePart}T${e.target.value}`);
                                        }}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[var(--foreground)] font-sans focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                                    />
                                </div>

                                {unlockDate && (
                                    <AnimatePresence mode="wait">
                                        {isValidDate(unlockDate) ? (
                                            <motion.div
                                                key="valid"
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-sans"
                                            >
                                                <Check size={14} />
                                                Opens on {new Date(unlockDate).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="invalid"
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-sans"
                                            >
                                                ⚠️ Please select a future date & time.
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleDateNext}
                            disabled={!unlockDate || !isValidDate(unlockDate)}
                            className="w-full py-4 bg-[var(--accent)] text-white rounded-xl font-bold hover:bg-[#c0684b] disabled:opacity-40 transition-colors"
                        >
                            Schedule Message
                        </button>
                    </motion.div>
                )}

                {/* Step 5: Review */}
                {step === 5 && (
                    <motion.div
                        key="step5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full space-y-8 flex flex-col items-center"
                    >
                        <h2 className="text-3xl font-bold text-center">Ready to Seal?</h2>

                        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border border-[var(--border)] w-full shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]" />

                            {/* Privacy badge */}
                            <div className="self-end">
                                {isPrivate ? (
                                    <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full font-sans font-semibold">
                                        <Lock size={11} /> Private
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-sky-100 text-sky-600 rounded-full font-sans font-semibold">
                                        <Globe size={11} /> Public
                                    </span>
                                )}
                            </div>

                            <p className="text-gray-500 uppercase tracking-widest text-xs">FOR</p>
                            <p className="text-2xl font-bold -mt-2">{receiverName}</p>

                            <div className="w-16 h-px bg-gray-200 my-2" />

                            <div className="flex items-center gap-4 w-full">
                                <img src={selectedTrack?.album.images[0]?.url} className="w-16 h-16 rounded-md shadow-sm" />
                                <div className="text-left">
                                    <p className="font-bold text-lg leading-tight">{selectedTrack?.name}</p>
                                    <p className="text-sm text-gray-500">{selectedTrack?.artists[0].name}</p>
                                </div>
                            </div>

                            <div className="w-full bg-gray-50 p-4 rounded-lg mt-2 text-sm text-gray-600 italic border border-dashed border-gray-200 relative">
                                &quot;{message.length > 50 ? message.substring(0, 50) + '...' : message}&quot;
                            </div>

                            <div className="flex items-center gap-2 mt-2 font-bold">
                                {sendNow ? (
                                    <span className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] rounded-full text-sm">
                                        <Zap size={14} fill="currentColor" /> Opens immediately
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 text-[var(--accent-secondary)]">
                                        <Calendar size={18} />
                                        {new Date(unlockDate).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleSeal}
                            disabled={loading}
                            className="w-full py-4 bg-[var(--accent)] hover:bg-[#c0684b] text-white rounded-full text-xl font-bold shadow-xl hover:scale-105 transition-transform flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Lock size={20} /> {sendNow ? 'Send & Generate Link' : 'Seal & Generate Link'}
                                </>
                            )}
                        </button>
                    </motion.div>
                )}

                {/* Step 6: Success & Copy Link */}
                {step === 6 && (
                    <>
                        <Confetti
                            width={typeof window !== 'undefined' ? window.innerWidth : 300}
                            height={typeof window !== 'undefined' ? window.innerHeight : 200}
                            recycle={false}
                            numberOfPieces={500}
                            gravity={0.15}
                            style={{ position: 'fixed', top: '56px', left: 0, zIndex: 100, pointerEvents: 'none' }}
                        />
                        <motion.div
                            key="step6"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full flex flex-col items-center text-center gap-6"
                        >
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                                <Check size={40} strokeWidth={3} />
                            </div>

                            <h2 className="text-4xl font-bold text-[var(--foreground)]">Capsule Sealed!</h2>
                            <p className="text-gray-600 text-lg">
                                It&apos;s ready for <b>{receiverName}</b>.
                            </p>

                            {isPrivate && (
                                <div className="flex items-center gap-2 text-sm text-[var(--accent)] bg-[var(--accent)]/8 px-4 py-2 rounded-full font-sans">
                                    <Lock size={14} /> This capsule is private — only you can see it
                                </div>
                            )}

                            <div className="w-full bg-white p-2 pl-4 rounded-xl border border-[var(--border)] shadow-sm flex items-center justify-between gap-2 mt-4">
                                <p className="text-sm text-gray-500 truncate">
                                    {`${typeof window !== 'undefined' ? window.location.origin : ''}/view/${capsuleId}`}
                                </p>
                                <button
                                    onClick={copyLink}
                                    className="bg-[var(--accent)] hover:bg-[#c0684b] text-white p-3 rounded-lg transition-colors"
                                >
                                    <Copy size={20} />
                                </button>
                            </div>

                            <div className="flex gap-4 w-full mt-4">
                                <button
                                    onClick={() => router.push(`/view/${capsuleId}`)}
                                    className="flex-1 py-3 border-2 border-[var(--accent)] text-[var(--accent)] rounded-xl font-bold hover:bg-[var(--accent)] hover:text-white transition-colors"
                                >
                                    View Page
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="flex-1 py-3 bg-[var(--accent-secondary)] text-white rounded-xl font-bold hover:bg-[#7a8966] transition-colors"
                                >
                                    Create Another
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
