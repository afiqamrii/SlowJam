'use client';

import { useState } from 'react';
import { Heart, Mail, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GradientText from './GradientText';

export default function Footer() {
    const [supportOpen, setSupportOpen] = useState(false);
    const [report, setReport] = useState('');

    const handleSendReport = () => {
        if (!report.trim()) return;
        const subject = encodeURIComponent('SlowJam — Support Request');
        const body = encodeURIComponent(report);
        window.open(`mailto:support@slowjam.xyz?subject=${subject}&body=${body}`, '_blank');
        setReport('');
        setSupportOpen(false);
    };

    return (
        <>
            <footer className="w-full border-t border-gray-100 bg-white/70 backdrop-blur-sm mt-auto py-6 px-6">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400 font-sans">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <GradientText
                                colors={['#d97559', '#a08c7a', '#d97559']}
                                animationSpeed={6}
                                className="font-(--font-gloria) text-base font-bold"
                            >
                                SlowJam
                            </GradientText>

                        </div>
                        <button
                            onClick={() => setSupportOpen(true)}
                            className="text-gray-400 hover:text-gray-600 transition-colors font-medium border-l border-gray-200 pl-4"
                        >
                            Support & Feedback
                        </button>
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

            {/* ─── Support Modal ───────────────────────────────────────── */}
            <AnimatePresence>
                {supportOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                        onClick={(e) => { if (e.target === e.currentTarget) setSupportOpen(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="relative bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent-secondary)]/10 px-6 pt-6 pb-4">
                                <button
                                    onClick={() => setSupportOpen(false)}
                                    className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center">
                                        <Mail size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg text-[var(--foreground)] font-(--font-gloria)">Report an Issue</h2>
                                        <p className="text-xs text-gray-500 font-sans">We'll get back to you ASAP 💌</p>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="px-6 pb-6 pt-4 space-y-4">
                                <p className="text-sm text-gray-500 font-sans">
                                    Having trouble or have some feedback? Detail it below and we&apos;ll open your email app with the details pre-filled.
                                </p>
                                <textarea
                                    value={report}
                                    onChange={(e) => setReport(e.target.value)}
                                    placeholder="e.g. The preview isn't playing on the view page..."
                                    rows={4}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[var(--foreground)] font-sans focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none transition-all"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSupportOpen(false)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-sm font-sans font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSendReport}
                                        disabled={!report.trim()}
                                        className="flex-1 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-sans font-bold disabled:opacity-40 hover:bg-[#c0684b] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Send size={15} /> Send Message
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
