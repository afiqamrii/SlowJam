import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

        // 1. Verify User from Auth Header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (action === 'add') {
            // Attempt to insert into junction table
            const { error: insertError } = await supabase
                .from('capsules_favorites')
                .insert({ user_id: user.id, capsule_id: id });

            // If it succeeds (or if we ignore the duplicate key error code '23505'), increment the actual count
            // Note: If they already favorited it, it throws a duplicate key error which we can gracefully ignore
            //       But we ONLY increment if it was a true fresh insert.
            if (!insertError) {
                // Fetch current count to modify
                const { data: capsule } = await supabase
                    .from('capsules')
                    .select('favorites_count')
                    .eq('id', id)
                    .single();

                const newCount = (capsule?.favorites_count || 0) + 1;

                await supabase
                    .from('capsules')
                    .update({ favorites_count: newCount })
                    .eq('id', id);

                return NextResponse.json({ success: true, newCount });
            } else if (insertError.code === '23505') {
                // Already favorited, just return success without incrementing
                return NextResponse.json({ success: true });
            } else {
                throw insertError;
            }

        } else if (action === 'remove') {
            // Attempt to delete from junction table
            // We use select() to know if a row was actually deleted
            const { data: deletedRows, error: deleteError } = await supabase
                .from('capsules_favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('capsule_id', id)
                .select();

            if (deleteError) throw deleteError;

            // If a row was actually deleted, we can decrement the count
            if (deletedRows && deletedRows.length > 0) {
                const { data: capsule } = await supabase
                    .from('capsules')
                    .select('favorites_count')
                    .eq('id', id)
                    .single();

                const newCount = Math.max(0, (capsule?.favorites_count || 0) - 1);

                await supabase
                    .from('capsules')
                    .update({ favorites_count: newCount })
                    .eq('id', id);

                return NextResponse.json({ success: true, newCount });
            } else {
                // Not favorited in the first place
                return NextResponse.json({ success: true });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating favorites:', error);
        return NextResponse.json(
            { error: 'Failed to update favorites' },
            { status: 500 }
        );
    }
}
