'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Send, Menu, LogOut, LogIn } from 'lucide-react';
import GradientText from './GradientText';
import { useAuth } from '@/app/hooks/useAuth';
import WhatsNew from './WhatsNew';

const NAV_LINKS = [
    { label: 'Create', href: '/create' },
    { label: 'Browse', href: '/browse' },
    { label: 'History', href: '/history' },
];

export default function Navbar() {
    const pathname = usePathname();
    const [supportOpen, setSupportOpen] = useState(false);
    const [report, setReport] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const confirmRef = useRef<HTMLDivElement>(null);
    const { user, signInWithGoogle, signOut } = useAuth();

    // Close confirm popover when clicking outside
    useEffect(() => {
        if (!showSignOutConfirm) return;
        const handler = (e: MouseEvent) => {
            if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
                setShowSignOutConfirm(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showSignOutConfirm]);

    const handleSendReport = () => {
        if (!report.trim()) return;
        const subject = encodeURIComponent('SlowJam — Support Request');
        const body = encodeURIComponent(report);
        window.open(`mailto:support@slowjam.xyz?subject=${subject}&body=${body}`, '_blank');
        setReport('');
        setSupportOpen(false);
    };

    // Get initials or first letter from email
    const userInitial = user?.user_metadata?.name
        ? user.user_metadata.name[0].toUpperCase()
        : user?.email?.[0]?.toUpperCase() ?? '?';

    const userAvatar = user?.user_metadata?.avatar_url;

    return (
        <>
            {/* ─── Navbar ─────────────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">

                    {/* Brand */}
                    <Link href="/" className="shrink-0">
                        <GradientText
                            colors={['#d97559', '#c8a882', '#9b8ea0', '#d97559']}
                            animationSpeed={5}
                            className="font-(--font-gloria) text-xl font-bold"
                        >
                            SlowJam
                        </GradientText>
                    </Link>

                    {/* Desktop links */}
                    <div className="hidden sm:flex items-center gap-1">
                        {NAV_LINKS.map((link) => {
                            const active = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative px-4 py-1.5 text-sm font-medium font-sans rounded-full transition-colors ${active ? 'text-[var(--accent)]' : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="nav-pill"
                                            className="absolute inset-0 bg-[var(--accent)]/10 rounded-full"
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                    {link.label}
                                </Link>
                            );
                        })}
                        <button
                            onClick={() => setSupportOpen(true)}
                            className="px-4 py-1.5 text-sm font-medium font-sans text-gray-500 hover:text-gray-800 rounded-full transition-colors"
                        >
                            Support
                        </button>

                        {/* What's New */}
                        <WhatsNew />

                        {/* Auth section */}
                        {user ? (
                            <div className="flex items-center gap-2 ml-2">
                                {/* Avatar */}
                                {userAvatar ? (
                                    <img
                                        src={userAvatar}
                                        alt={user.user_metadata?.name ?? 'User'}
                                        className="w-7 h-7 rounded-full border-2 border-[var(--accent)]/30 object-cover"
                                    />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold">
                                        {userInitial}
                                    </div>
                                )}

                                {/* Sign-out with confirmation popover */}
                                <div className="relative" ref={confirmRef}>
                                    <button
                                        onClick={() => setShowSignOutConfirm(v => !v)}
                                        title="Sign out"
                                        className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={15} />
                                    </button>

                                    <AnimatePresence>
                                        {showSignOutConfirm && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 top-9 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-52 z-50"
                                            >
                                                <p className="text-sm font-sans font-semibold text-gray-700 mb-1">Sign out?</p>
                                                <p className="text-xs font-sans text-gray-400 mb-3">You&apos;ll need to sign in again to see private capsules.</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setShowSignOutConfirm(false)}
                                                        className="flex-1 py-1.5 text-xs font-sans font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => { signOut(); setShowSignOutConfirm(false); }}
                                                        className="flex-1 py-1.5 text-xs font-sans font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                                                    >
                                                        Sign out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={signInWithGoogle}
                                className="ml-2 flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold font-sans text-[var(--accent)] border border-[var(--accent)]/40 rounded-full hover:bg-[var(--accent)]/8 transition-colors"
                            >
                                <LogIn size={14} />
                                Sign In
                            </button>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileOpen(v => !v)}
                        className="sm:hidden p-2 rounded-lg text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="sm:hidden border-t border-gray-100 bg-white overflow-hidden"
                        >
                            <div className="px-5 py-3 flex flex-col gap-1">
                                {NAV_LINKS.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={`px-3 py-2 rounded-lg text-sm font-sans font-medium transition-colors ${pathname === link.href
                                            ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <button
                                    onClick={() => { setMobileOpen(false); setSupportOpen(true); }}
                                    className="text-left px-3 py-2 rounded-lg text-sm font-sans font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Support
                                </button>
                                {/* What's New — mobile */}
                                <div className="px-1 py-1" onClick={() => setMobileOpen(false)}>
                                    <WhatsNew />
                                </div>

                                {/* Mobile auth */}
                                <div className="pt-1 mt-1 border-t border-gray-100">
                                    {user ? (
                                        <div className="flex items-center gap-3 px-3 py-2">
                                            {userAvatar ? (
                                                <img
                                                    src={userAvatar}
                                                    alt={user.user_metadata?.name ?? 'User'}
                                                    className="w-7 h-7 rounded-full border border-[var(--accent)]/30 object-cover"
                                                />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold">
                                                    {userInitial}
                                                </div>
                                            )}
                                            <span className="flex-1 text-sm font-sans text-gray-600 truncate">{user.user_metadata?.name ?? user.email}</span>
                                            {/* Mobile sign-out — simple confirm with two buttons inline */}
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Sign out of SlowJam?')) {
                                                        setMobileOpen(false);
                                                        signOut();
                                                    }
                                                }}
                                                className="flex items-center gap-1 text-xs text-red-500 font-sans font-medium"
                                            >
                                                <LogOut size={13} /> Sign out
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setMobileOpen(false); signInWithGoogle(); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-sans font-medium text-[var(--accent)] hover:bg-[var(--accent)]/8 transition-colors"
                                        >
                                            <LogIn size={15} /> Sign In with Google
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

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
                                    Having trouble? Describe your issue below and we&apos;ll open your email app with the details pre-filled.
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
                                        <Send size={15} /> Send Report
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
