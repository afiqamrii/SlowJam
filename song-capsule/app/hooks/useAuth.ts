'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
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

        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/create`,
            },
        });
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return { user, loading, signInWithGoogle, signOut };
}
