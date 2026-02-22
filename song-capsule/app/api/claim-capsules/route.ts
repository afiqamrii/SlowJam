import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── POST /api/claim-capsules ──────────────────────────────────────────────────
// Called from the History page when a user signs in.
// Takes a list of capsule IDs from localStorage and assigns owner_id to the
// authenticated user for any that currently have owner_id = null.
// Uses the service-role key so it can bypass RLS and update unowned rows.
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ids, userId } = body as { ids: string[]; userId: string };

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ claimed: 0 });
        }
        if (!userId || typeof userId !== 'string') {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Verify the bearer token matches the userId claim
        const authHeader = req.headers.get('authorization') ?? '';
        const token = authHeader.replace('Bearer ', '').trim();
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify the token with Supabase (using the user client)
        const supabaseUser = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token);
        if (authError || !user || user.id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use the admin client to claim unowned capsules
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } },
        );

        const { data, error } = await supabaseAdmin
            .from('capsules')
            .update({ owner_id: userId })
            .in('id', ids)
            .is('owner_id', null)  // Only claim genuinely unowned rows
            .select('id');

        if (error) throw error;

        return NextResponse.json({ claimed: data?.length ?? 0 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
