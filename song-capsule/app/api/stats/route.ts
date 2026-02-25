import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 60; // revalidate every 60 seconds

export async function GET() {
    try {
        const [totalResult, privateResult] = await Promise.all([
            supabase.from('capsules').select('*', { count: 'exact', head: true }),
            supabase.from('capsules').select('*', { count: 'exact', head: true }).eq('is_private', true),
        ]);

        const total = totalResult.count ?? 0;
        const privateCapsules = privateResult.count ?? 0;
        const publicCapsules = total - privateCapsules;

        // Fetch all songs with pagination to overcome the 1000 row limit
        let allSongs: any[] = [];
        let from = 0;
        const step = 1000;

        while (true) {
            const { data, error } = await supabase
                .from('capsules')
                .select('track_name, polaroid_downloads, letterify_downloads, email_sent')
                .range(from, from + step - 1);

            if (error || !data || data.length === 0) break;
            allSongs = allSongs.concat(data);

            if (data.length < step) break; // Reached the end
            from += step;
        }

        // Count distinct track names and sum polaroid downloads
        const uniqueSongs = new Set(allSongs.map((r: { track_name: string }) => r.track_name)).size;

        let polaroidDownloads = 0;
        let letterifyDownloads = 0;
        let secretEmailsSent = 0;
        allSongs.forEach((r: { polaroid_downloads?: number, letterify_downloads?: number, email_sent?: boolean }) => {
            polaroidDownloads += (r.polaroid_downloads || 0);
            letterifyDownloads += (r.letterify_downloads || 0);
            if (r.email_sent) secretEmailsSent++;
        });

        return NextResponse.json({
            total,
            public: publicCapsules,
            private: privateCapsules,
            uniqueSongs,
            polaroidDownloads,
            letterifyDownloads,
            secretEmailsSent,
        });
    } catch (err) {
        console.error('[/api/stats] error:', err);
        return NextResponse.json({ total: 0, public: 0, private: 0, uniqueSongs: 0 }, { status: 500 });
    }
}
