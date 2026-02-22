import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 60; // revalidate every 60 seconds

export async function GET() {
    try {
        const [totalResult, privateResult, songsResult] = await Promise.all([
            supabase.from('capsules').select('*', { count: 'exact', head: true }),
            supabase.from('capsules').select('*', { count: 'exact', head: true }).eq('is_private', true),
            supabase.from('capsules').select('track_name, polaroid_downloads'),
        ]);

        const total = totalResult.count ?? 0;
        const privateCapsules = privateResult.count ?? 0;
        const publicCapsules = total - privateCapsules;

        // Count distinct track names and sum polaroid downloads
        const allSongs = songsResult.data ?? [];
        const uniqueSongs = new Set(allSongs.map((r: { track_name: string }) => r.track_name)).size;

        let polaroidDownloads = 0;
        allSongs.forEach((r: { polaroid_downloads?: number }) => {
            polaroidDownloads += (r.polaroid_downloads || 0);
        });

        return NextResponse.json({
            total,
            public: publicCapsules,
            private: privateCapsules,
            uniqueSongs,
            polaroidDownloads,
        });
    } catch (err) {
        console.error('[/api/stats] error:', err);
        return NextResponse.json({ total: 0, public: 0, private: 0, uniqueSongs: 0 }, { status: 500 });
    }
}
