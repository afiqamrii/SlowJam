'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Lock, Globe, Calendar, Clock, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/hooks/useAuth';
import { toast } from 'sonner';

export default function EditCapsulePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, loading: authLoading, signInWithGoogle } = useAuth();

    const [capsule, setCapsule] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Editable fields
    const [receiverName, setReceiverName] = useState('');
    const [message, setMessage] = useState('');
    const [unlockDate, setUnlockDate] = useState('');
    const [sendNow, setSendNow] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);

    // Fetch capsule and guard ownership
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        supabase
            .from('capsules')
            .select('*')
            .eq('id', id)
            .single()
            .then(({ data, error }) => {
                if (error || !data) {
                    toast.error('Capsule not found.');
                    router.replace('/');
                    return;
                }

                // Check ownership:
                // - Private capsules: must have owner_id === user.id
                // - Public capsules (owner_id = null): check localStorage history as fallback
                const isOwnerById = data.owner_id && data.owner_id === user.id;
                const isInLocalHistory = (() => {
                    try {
                        const raw = localStorage.getItem('slowjam_history');
                        const items: { id: string }[] = raw ? JSON.parse(raw) : [];
                        return items.some(i => i.id === id);
                    } catch { return false; }
                })();

                if (!isOwnerById && !isInLocalHistory) {
                    toast.error("You can only edit your own capsules.");
                    router.replace(`/view/${id}`);
                    return;
                }

                setCapsule(data);
                setReceiverName(data.receiver_name ?? '');
                setMessage(data.message ?? '');
                setIsPrivate(data.is_private ?? false);
                // Convert stored UTC unlock_at to local datetime-local string
                const unlock = new Date(data.unlock_at);
                const offset = unlock.getTimezoneOffset();
                const local = new Date(unlock.getTime() - offset * 60000);
                const isPast = unlock <= new Date();
                setSendNow(isPast);
                if (!isPast) setUnlockDate(local.toISOString().slice(0, 16));
                setLoading(false);
            });
    }, [id, user, authLoading, router]);

    const nowISOLocal = () => {
        const now = new Date();
        now.setSeconds(0, 0);
        const offset = now.getTimezoneOffset();
        const local = new Date(now.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
    };

    const isValidDate = (dateString: string) => {
        if (!dateString) return false;
        return new Date(dateString) > new Date();
    };

    const handleSave = async () => {
        if (!receiverName.trim()) return toast.error('Recipient name is required.');
        if (!message.trim()) return toast.error('Message cannot be empty.');
        if (!sendNow && !isValidDate(unlockDate)) return toast.error('Please set a future unlock date.');

        setSaving(true);
        try {
            const unlockAt = sendNow
                ? new Date().toISOString()
                : new Date(unlockDate).toISOString();

            const query = supabase
                .from('capsules')
                .update({
                    receiver_name: receiverName.trim(),
                    message: message.trim(),
                    unlock_at: unlockAt,
                    is_private: isPrivate,
                })
                .eq('id', id);

            // For private capsules, also enforce owner_id server-side
            const { error } = capsule.owner_id
                ? await query.eq('owner_id', capsule.owner_id)
                : await query;

            if (error) throw error;
            toast.success('Capsule updated!');
            router.push(`/view/${id}`);
        } catch (err: any) {
            toast.error(`Failed to save: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
            </div>
        );
    }

    // Not signed in — show a clear, edit-specific sign-in card
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
                >
                    <div className="h-1.5 w-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]" />
                    <div className="px-8 pt-8 pb-6 flex flex-col items-center text-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="self-start -ml-2 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                            <Save size={26} className="text-[var(--accent)]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground font-(--font-gloria)">Sign in to edit</h1>
                            <p className="text-sm text-gray-500 font-sans mt-1">
                                To make changes to this capsule, sign in with the same Google account you used to create it.
                            </p>
                        </div>
                        <button
                            onClick={() => signInWithGoogle()}
                            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-white border-2 border-gray-200 rounded-2xl font-semibold text-gray-700 font-sans hover:border-[var(--accent)] hover:shadow-md transition-all active:scale-95"
                        >
                            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                                <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107" />
                                <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00" />
                                <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50" />
                                <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2" />
                            </svg>
                            Continue with Google
                        </button>
                        <p className="text-xs text-gray-400 font-sans">You&apos;ll return here after signing in.</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!capsule) return null;

    return (
        <div className="min-h-screen pt-20 pb-16 px-5 max-w-xl mx-auto font-(--font-gloria)">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[var(--accent)] font-sans transition-colors mb-6"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <h1 className="text-3xl font-bold text-foreground">Edit Capsule</h1>
                <p className="text-gray-400 font-sans text-sm mt-1">
                    Only you can see or edit this. The song stays as is.
                </p>
            </motion.div>

            {/* Song — read only badge */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl mb-6"
            >
                {capsule.album_art_url && (
                    <img
                        src={capsule.album_art_url}
                        alt={capsule.track_name}
                        className="w-14 h-14 rounded-xl object-cover shadow-sm"
                    />
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{capsule.track_name}</p>
                    <p className="text-sm text-gray-400 font-sans truncate">{capsule.artist_name}</p>
                </div>
                <span className="text-[10px] font-sans bg-gray-200 text-gray-500 px-2 py-1 rounded-full shrink-0 uppercase tracking-wide">
                    Fixed
                </span>
            </motion.div>

            <div className="space-y-6">
                {/* Recipient */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                >
                    <label className="text-xs font-sans font-bold uppercase tracking-widest text-gray-400">
                        For
                    </label>
                    <input
                        type="text"
                        value={receiverName}
                        onChange={e => setReceiverName(e.target.value)}
                        placeholder="Recipient name..."
                        className="w-full bg-white border border-[var(--border)] rounded-2xl py-3.5 px-5 text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-sans shadow-sm"
                    />
                </motion.div>

                {/* Message */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-2"
                >
                    <label className="text-xs font-sans font-bold uppercase tracking-widest text-gray-400">
                        Message
                    </label>
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        maxLength={1200}
                        rows={6}
                        className="w-full bg-white border border-[var(--border)] rounded-2xl py-4 px-5 text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-sans shadow-sm resize-none"
                    />
                    <p className="text-xs text-gray-400 font-sans text-right">{message.length}/1200</p>
                </motion.div>

                {/* Unlock date */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                >
                    <label className="text-xs font-sans font-bold uppercase tracking-widest text-gray-400">
                        Unlock date
                    </label>

                    {/* Toggle: Unlock now vs schedule */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setSendNow(true)}
                            className={`flex-1 py-3 rounded-2xl border-2 text-sm font-sans font-bold transition-all ${sendNow ? 'border-[var(--accent)] bg-[var(--accent)]/8 text-[var(--accent)]' : 'border-[var(--border)] text-gray-400'}`}
                        >
                            Unlocked now
                        </button>
                        <button
                            onClick={() => setSendNow(false)}
                            className={`flex-1 py-3 rounded-2xl border-2 text-sm font-sans font-bold transition-all ${!sendNow ? 'border-[var(--accent)] bg-[var(--accent)]/8 text-[var(--accent)]' : 'border-[var(--border)] text-gray-400'}`}
                        >
                            Schedule it
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {!sendNow && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-3 overflow-hidden"
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-sans text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                            <Calendar size={10} /> Date
                                        </label>
                                        <input
                                            type="date"
                                            value={unlockDate ? unlockDate.split('T')[0] : ''}
                                            min={nowISOLocal().split('T')[0]}
                                            onChange={e => {
                                                const timePart = unlockDate ? unlockDate.split('T')[1] : '12:00';
                                                setUnlockDate(`${e.target.value}T${timePart || '12:00'}`);
                                            }}
                                            className="w-full bg-white border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-foreground font-sans focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-sans text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                            <Clock size={10} /> Time
                                        </label>
                                        <input
                                            type="time"
                                            value={unlockDate ? unlockDate.split('T')[1] : ''}
                                            onChange={e => {
                                                const datePart = unlockDate ? unlockDate.split('T')[0] : nowISOLocal().split('T')[0];
                                                setUnlockDate(`${datePart}T${e.target.value}`);
                                            }}
                                            className="w-full bg-white border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-foreground font-sans focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                        />
                                    </div>
                                </div>
                                {unlockDate && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-sans ${isValidDate(unlockDate) ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}
                                    >
                                        {isValidDate(unlockDate)
                                            ? <><Check size={12} /> Opens on {new Date(unlockDate).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}</>
                                            : '⚠️ Please select a future date & time.'
                                        }
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Privacy */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-2"
                >
                    <label className="text-xs font-sans font-bold uppercase tracking-widest text-gray-400">
                        Visibility
                    </label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsPrivate(false)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-sans font-bold transition-all ${!isPrivate ? 'border-sky-400 bg-sky-50 text-sky-600' : 'border-[var(--border)] text-gray-400'}`}
                        >
                            <Globe size={14} /> Public
                        </button>
                        <button
                            onClick={() => setIsPrivate(true)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-sans font-bold transition-all ${isPrivate ? 'border-[var(--accent)] bg-[var(--accent)]/8 text-[var(--accent)]' : 'border-[var(--border)] text-gray-400'}`}
                        >
                            <Lock size={14} /> Private
                        </button>
                    </div>
                </motion.div>

                {/* Save button */}
                <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={handleSave}
                    disabled={saving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 bg-[var(--accent)] hover:bg-[#c0684b] text-white rounded-2xl font-bold text-lg shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                    {saving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <><Save size={18} /> Save Changes</>
                    )}
                </motion.button>
            </div>
        </div>
    );
}
