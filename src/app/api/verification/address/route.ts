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
    const {
      country,
      city,
      streetAddress,
      stateProvince,
      postalCode,
      documentUrl,
    } = body;

    // Update user's address data
    const { error } = await supabase
      .from('users')
      .update({
        address_country: country,
        address_city: city,
        address_street: streetAddress,
        address_state_province: stateProvince || null,
        address_postal_code: postalCode,
        address_document_url: documentUrl,
        address_status: 'Pending',
        address_submitted_at: new Date().toISOString(),
        address_rejection_reason: null,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating address data:', error);
      return NextResponse.json({ error: 'Failed to submit address data' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in address submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
