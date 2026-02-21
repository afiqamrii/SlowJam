import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // We only search for tracks (songs)
    if (!query) {
        return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    try {
        // iTunes Search API is completely free and requires no authentication
        // Limit to 15 results, entity=song ensures we get music tracks
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15`;

        const res = await fetch(itunesUrl, {
            // Optional: specify a user agent if needed, but usually fine without
            headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) {
            throw new Error(`iTunes API responded with status: ${res.status}`);
        }

        const data = await res.json();

        // Map iTunes results to the format our frontend expects (which was originally Spotify's format)
        // This minimizes the changes needed in the frontend components
        const formattedTracks = data.results.map((track: any) => {
            // iTunes returns artworkUrl30, artworkUrl60, artworkUrl100
            // We can get a higher res image by modifying the URL string
            const highResArt = track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : null;

            return {
                id: track.trackId.toString(),
                name: track.trackName,
                artists: [{ name: track.artistName }],
                album: {
                    name: track.collectionName,
                    images: [
                        { url: highResArt || track.artworkUrl100 }, // We put the best image first
                        { url: track.artworkUrl100 }, // Fallback standard
                        { url: track.artworkUrl60 }   // Small
                    ]
                },
                preview_url: track.previewUrl // iTunes provides a generous 30s preview link!
            };
        });

        // Return in a 'tracks.items' structure to match the existing Spotify-like frontend mapping
        return NextResponse.json({
            tracks: {
                items: formattedTracks
            }
        });

    } catch (error: any) {
        console.error('Search API Error (iTunes):', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch search results' },
            { status: 500 }
        );
    }
}
