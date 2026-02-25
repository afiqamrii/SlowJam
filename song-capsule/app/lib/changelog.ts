// ─── App Versioning ───────────────────────────────────────────────────────────
// Bump APP_VERSION every time you ship notable features.
// Convention: MAJOR.MINOR.PATCH  (semver — https://semver.org)
//   MAJOR → breaking redesign / complete rewrite
//   MINOR → new features (bump this most often)
//   PATCH → small fixes / tweaks
//
// After bumping, add a new entry at the TOP of RELEASES.
// ─────────────────────────────────────────────────────────────────────────────

export const APP_VERSION = '1.4.0';

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
        version: '1.4.0',
        date: new Date().toISOString().split('T')[0],
        highlights: [
            {
                emoji: '💌',
                title: 'Cute Letters Format',
                desc: 'You can now choose to download your memories as a perfectly formatted digital letter! Pick from 6 aesthetic backgrounds or select your own custom solid color.',
                href: '/create',
                cta: 'Try it out',
            },
            {
                emoji: '✨',
                title: 'AI Song Story Enhancements',
                desc: 'The AI Song Story is now delightfully formatted. Plus, if your message is naturally too long to fit on a Polaroid, the system will smartly use the song story instead!',
                href: '/create',
                cta: 'Create one',
            },
            {
                emoji: '✍️',
                title: 'Write Longer Messages',
                desc: 'With the new Cute Letters format, you are no longer limited by the Polaroid boundary! Pour your heart out with longer, more detailed messages.',
                href: '/create',
                cta: 'Write one now',
            },
            {
                emoji: '💖',
                title: 'Save Your Favorite Capsules',
                desc: 'You can now "heart" your favorite capsules to save them as inspiration for later! Find them all neatly organized in your new "Saved" tab, and easily sort the Browse page by Highest Saves.',
                href: '/saved',
                cta: 'My capsules',
            }

        ],
    },
    {
        version: '1.3.3',
        date: new Date().toISOString().split('T')[0],
        highlights: [
            {
                emoji: '💖',
                title: 'Save Your Favorite Capsules',
                desc: 'You can now "heart" your favorite capsules to save them as inspiration for later! Find them all neatly organized in your new "Saved" tab, and easily sort the Browse page by Highest Saves.',
                href: '/saved',
                cta: 'My capsules',
            },
            {
                emoji: '📅',
                title: 'Calendar Reminders',
                desc: 'Never miss an unlock! You and the receiver can now instantly add scheduled capsules to your Apple, Google, or Outlook calendars.',
                href: '/create',
                cta: 'Try it out',
            },
            {
                emoji: '💌',
                title: 'Secret Email Delivery',
                desc: 'You can now securely deliver a capsule straight to someone\'s email inbox. They will receive the link without knowing who sent it.',
                href: '/create',
                cta: 'Send one',
            },

            {
                emoji: '✏️',
                title: 'Edit your capsule',
                desc: 'Change the message, recipient, unlock date or privacy — only you can edit your own capsule.',
                href: '/history',
                cta: 'My capsules',
            },
        ],
    },
    {
        version: '1.2.0',
        date: '2026-02-22',
        highlights: [
            {
                emoji: '✏️',
                title: 'Edit your capsule',
                desc: 'Change the message, recipient, unlock date or privacy — only you can edit your own capsule.',
                href: '/history',
                cta: 'My capsules →',
            },
            {
                emoji: '📊',
                title: 'Live stats',
                desc: 'Homepage now shows real-time capsule counts and unique songs.',
                href: '/#stats',
                cta: 'See stats →',
            },
            {
                emoji: '�',
                title: 'Capsule card stack',
                desc: 'Drag or tap through real capsules — hit Shuffle for a fresh batch.',
                href: '/#capsule-feed',
                cta: 'Try it →',
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

