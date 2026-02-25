'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const REDIRECT_KEY = 'authRedirectTo';
const SCROLL_KEY = 'authRedirectScrollY';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes — handle post-login redirect
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);

            // After a fresh sign-in, restore the page the user was on
            if (event === 'SIGNED_IN') {
                try {
                    const dest = sessionStorage.getItem(REDIRECT_KEY);
                    const scrollY = sessionStorage.getItem(SCROLL_KEY);
                    if (dest) {
                        sessionStorage.removeItem(REDIRECT_KEY);
                        sessionStorage.removeItem(SCROLL_KEY);
                        // Only navigate if we are not already on the right page
                        if (window.location.pathname !== dest) {
                            window.location.replace(dest);
                        } else if (scrollY) {
                            // Already on the right page — just restore scroll position
                            setTimeout(() => window.scrollTo(0, parseInt(scrollY, 10)), 100);
                        }
                    }
                } catch {
                    // Ignore sessionStorage errors (e.g. private/incognito mode)
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async (redirectTo?: string) => {
        // Google blocks OAuth in in-app browsers (Threads, Instagram, WhatsApp, TikTok, etc.)
        // Detect and warn the user to open in a real browser instead
        const ua = navigator.userAgent || '';
        const isInAppBrowser = /Instagram|FBAN|FBAV|FB_IAB|Twitter|BytedanceWebview|musical_ly|MicroMessenger|WeChat|Snapchat|Line\/|WhatsApp/i.test(ua);

        if (isInAppBrowser) {
            alert(
                'Sign-in is not supported inside this app\'s browser.\n\nPlease tap the ••• menu (or share button) and choose "Open in Chrome" or "Open in Safari" to sign in.'
            );
            return;
        }

        // Persist the destination page in sessionStorage before the OAuth redirect.
        // The onAuthStateChange SIGNED_IN handler above reads this and navigates back.
        const dest = redirectTo ?? window.location.pathname;
        try {
            sessionStorage.setItem(REDIRECT_KEY, dest);
            sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
        } catch {
            // Ignore
        }

        // We redirect back to the base origin so that Supabase only needs
        // the root URL whitelisted — the real redirect is handled client-side.
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return { user, loading, signInWithGoogle, signOut };
}
