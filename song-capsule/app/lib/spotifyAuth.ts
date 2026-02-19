import SpotifyWebApi from 'spotify-web-api-node';

console.log('Initializing Spotify API wrapper...');

// Global cache to persist across hot reloads in dev
// and potentially across warm serverless invocations
const globalForSpotify = global as unknown as {
    spotifyApi: SpotifyWebApi | undefined;
    tokenExpiration: number | undefined;
};

export const spotifyApi =
    globalForSpotify.spotifyApi ??
    new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });

if (process.env.NODE_ENV !== 'production') globalForSpotify.spotifyApi = spotifyApi;

let tokenExpiration = globalForSpotify.tokenExpiration || 0;

/**
 * Ensures the spotifyApi instance has a valid access token.
 * Refreshes it if expired.
 */
export async function ensureAccessToken() {
    const now = Date.now();

    // Buffer of 60 seconds to be safe
    if (now < tokenExpiration - 60 * 1000 && spotifyApi.getAccessToken()) {
        return;
    }

    console.log('Refreshing Spotify Access Token...');
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        const accessToken = data.body['access_token'];
        const expiresInIds = data.body['expires_in'];

        spotifyApi.setAccessToken(accessToken);

        // Calculate expiration time (usually 1 hour)
        tokenExpiration = now + expiresInIds * 1000;

        // Update global for persistence
        if (process.env.NODE_ENV !== 'production') {
            globalForSpotify.tokenExpiration = tokenExpiration;
        }

    } catch (error) {
        console.error('Failed to retrieve Spotify access token:', error);
        throw new Error('Spotify Auth Failed');
    }
}
