import { supabase } from '@/lib/supabase';
import { Metadata } from 'next';
import ViewCapsuleClient from './ViewCapsuleClient';
import { notFound } from 'next/navigation';

export const revalidate = 0; // Ensure dynamic data fetching

interface Props {
    params: Promise<{ id: string }>;
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

    return {
        title: `A song for ${receiver} | SlowJam`,
        description: `${sender} sent you "${track}". Open your time capsule to listen.`,
        openGraph: {
            title: `A song for ${receiver} ✦`,
            description: `${sender} sent you a song capsule.`,
            images: [capsule.album_art_url || '/content/slowjam_logo.png'],
        },
    };
}

export default async function ViewCapsulePage(props: Props) {
    const params = await props.params;
    const capsule = await getCapsule(params.id);

    if (!capsule) {
        notFound();
    }

    return <ViewCapsuleClient capsule={capsule} />;
}
