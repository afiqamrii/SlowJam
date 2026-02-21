import { NextResponse } from 'next/server';
import { spotifyApi, ensureAccessToken } from '@/app/lib/spotifyAuth';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'track'; // Default to track search

    if (!query) {
        return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    try {
        // Ensure we have a valid token (cached if possible)
        await ensureAccessToken();

        let searchResults;
        try {
            if (type === 'track') {
                searchResults = await spotifyApi.searchTracks(query, { limit: 10 });
            } else {
                searchResults = await spotifyApi.searchTracks(query, { limit: 10 });
            }
        } catch (apiError: any) {
            if (apiError.statusCode === 429) {
                // Rate limited by Spotify
                console.warn('Spotify API Rate Limit Exceeded (429). Retry after:', apiError.headers?.['retry-after']);
                return NextResponse.json(
                    { error: 'Too many requests to Spotify. Please try again in a moment.' },
                    { status: 429 }
                );
            }
            throw apiError; // re-throw for generic error handler
        }

        return NextResponse.json(searchResults.body);
    } catch (error: any) {
        console.error('Spotify API Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch from Spotify' }, { status: 500 });
    }
}
