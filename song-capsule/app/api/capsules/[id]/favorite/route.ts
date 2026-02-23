import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { action } = await req.json();

        if (action !== 'add' && action !== 'remove') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // 1. Fetch current count
        const { data: capsule, error: fetchError } = await supabase
            .from('capsules')
            .select('favorites_count')
            .eq('id', id)
            .single();

        if (fetchError || !capsule) {
            return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
        }

        const currentCount = capsule.favorites_count || 0;
        const newCount = action === 'add' ? currentCount + 1 : Math.max(0, currentCount - 1);

        // 2. Update count
        const { error: updateError } = await supabase
            .from('capsules')
            .update({ favorites_count: newCount })
            .eq('id', id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, newCount });
    } catch (error) {
        console.error('Error updating favorites:', error);
        return NextResponse.json(
            { error: 'Failed to update favorites' },
            { status: 500 }
        );
    }
}
