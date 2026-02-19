'use client';

/**
 * SpotifyMiniPlayer.tsx
 * Redesigned — clean frosted dark pill, minimal and readable.
 * Uses project font (Gloria Hallelujah via CSS var).
 */

interface SpotifyMiniPlayerProps {
    title: string;
    artist: string;
    coverUrl?: string;
}

export default function SpotifyMiniPlayer({ title, artist, coverUrl }: SpotifyMiniPlayerProps) {
    return (
        <div
            className="flex items-center gap-3 px-4 py-3 rounded-full"
            style={{
                background: 'rgba(15,13,20,0.82)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.10)',
                minWidth: 0,
            }}
        >
            {/* Round album art */}
            {coverUrl ? (
                <img
                    src={coverUrl}
                    alt={title}
                    className="w-9 h-9 rounded-full shrink-0 object-cover"
                    style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.15)' }}
                />
            ) : (
                <div
                    className="w-9 h-9 rounded-full shrink-0"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                />
            )}

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p
                    className="truncate text-white leading-tight"
                    style={{ fontSize: 12, fontFamily: 'var(--font-gloria), cursive' }}
                >
                    {title}
                </p>
                <p
                    className="truncate"
                    style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-gloria), cursive' }}
                >
                    {artist}
                </p>
            </div>

            {/* Progress bar + Spotify dot */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Progress pill */}
                <div className="relative w-16 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ width: '40%', background: '#1DB954' }}
                    />
                </div>

                {/* Spotify green dot */}
                <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: '#1DB954' }}
                >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
