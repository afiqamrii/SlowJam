import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: Request) {
    // 1. Get the Authorization header from the request
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
        return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        // 2. Fetch the user using the auth token
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 3. Get all favorited capsule IDs
        const { data, error } = await supabase
            .from('capsules_favorites')
            .select('capsule_id')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching user favorites:', error);
            return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
        }

        const favoritedIds = data.map(row => row.capsule_id);
        return NextResponse.json({ favorites: favoritedIds });

    } catch (error) {
        console.error('Unexpected error fetching user favorites:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
