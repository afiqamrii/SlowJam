import { supabase } from '@/lib/supabase';
import { Metadata } from 'next';
import ViewCapsuleClient from './ViewCapsuleClient';
import { notFound } from 'next/navigation';

export const revalidate = 0; // Ensure dynamic data fetching

interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ key?: string }>;
}

async function getCapsule(id: string) {
    const { data, error } = await supabase
        .from('capsules')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        return null;
    }
    return data;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;
    const capsule = await getCapsule(params.id);

    if (!capsule) {
        return {
            title: 'Capsule Not Found - SlowJam',
        };
    }

    const sender = capsule.sender_name || 'Someone';
    const receiver = capsule.receiver_name || 'You';
    const track = capsule.track_name || 'a song';

    const appUrl = 'https://slowjam.xyz';
    const imageUrl = capsule.album_art_url || `${appUrl}/logo.png`;

    const title = `SlowJam - Express Your Feelings Through Music | Musical Messages`;
    const description = `A song for ${receiver} ✦\n${sender} sent you a song capsule. Send meaningful songs to friends and loved ones. Share emotions through music, create dedications, and express.`;

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            url: `${appUrl}/view/${params.id}`,
            siteName: 'SlowJam',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: 'Album Art',
                },
            ],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: [imageUrl],
        },
    };
}

export default async function ViewCapsulePage(props: Props) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const capsule = await getCapsule(params.id);

    if (!capsule) {
        notFound();
    }

    // Validate the share key server-side — never send share_token to the client
    const isShareAuthorized =
        capsule.is_private &&
        !!capsule.share_token &&
        searchParams.key === capsule.share_token;

    // Strip share_token before passing to client
    const { share_token: _removed, ...capsuleForClient } = capsule;

    return <ViewCapsuleClient capsule={capsuleForClient} isShareAuthorized={isShareAuthorized} />;
}
