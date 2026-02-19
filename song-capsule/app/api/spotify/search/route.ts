
import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'track'; // Default to track search

    if (!query) {
        return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    try {
        // Client Credentials Flow
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);

        let searchResults;
        if (type === 'track') {
            searchResults = await spotifyApi.searchTracks(query);
        } else {
            // fallback or extend later
            searchResults = await spotifyApi.searchTracks(query);
        }

        return NextResponse.json(searchResults.body);
    } catch (error) {
        console.error('Spotify API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch from Spotify' }, { status: 500 });
    }
}
