// ─── App Versioning ───────────────────────────────────────────────────────────
// Bump APP_VERSION every time you ship notable features.
// Convention: MAJOR.MINOR.PATCH  (semver — https://semver.org)
//   MAJOR → breaking redesign / complete rewrite
//   MINOR → new features (bump this most often)
//   PATCH → small fixes / tweaks
//
// After bumping, add a new entry at the TOP of RELEASES.
// ─────────────────────────────────────────────────────────────────────────────

export const APP_VERSION = '1.1.1';

export interface Release {
    version: string;
    date: string;
    highlights: {
        emoji: string;
        title: string;
        desc: string;
        href?: string; // optional — links user to where the feature lives
        cta?: string;  // custom CTA label, defaults to "See it →"
    }[];
}

export const RELEASES: Release[] = [
    {
        version: '1.1.1',
        date: '2026-02-22',
        highlights: [
            {
                emoji: '📊',
                title: 'Live stats',
                desc: 'Homepage now shows real-time capsule counts and unique songs.',
                href: '/#stats',
                cta: 'See stats →',
            },
            {
                emoji: '🎴',
                title: 'Capsule card stack',
                desc: 'Drag or tap through real capsules — hit Shuffle for a fresh batch.',
                href: '/#capsule-feed',
                cta: 'Try it →',
            },
            {
                emoji: '🏷️',
                title: 'Browse stats strip',
                desc: 'Quick stats pills above the search bar in Browse.',
                href: '/browse',
                cta: 'Go to Browse →',
            },
        ],
    },
    {
        version: '1.0.0',
        date: '2026-02-19',
        highlights: [
            {
                emoji: '🚀',
                title: 'SlowJam launched',
                desc: 'Send a song, lock it in time, and share the moment.',
                href: '/create',
                cta: 'Create →',
            },
        ],
    },
];

