import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { country } = body;

    if (!country) {
      return NextResponse.json({ error: 'Country is required' }, { status: 400 });
    }

    // Update user's country - this updates the main country field
    // and sets address_status to Pending for admin review
    const { error } = await supabase
      .from('users')
      .update({
        country: country,
        address_country: country,
        address_status: 'Pending',
        address_submitted_at: new Date().toISOString(),
        address_rejection_reason: null,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating country:', error);
      return NextResponse.json({ error: 'Failed to update country' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in country update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
