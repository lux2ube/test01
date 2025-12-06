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

    // Check current address status - allow submission only if Not Verified, Verified (for changes), or Rejected
    const { data: currentUser } = await supabase
      .from('users')
      .select('address_status')
      .eq('id', user.id)
      .single();

    if (currentUser?.address_status === 'Pending') {
      return NextResponse.json({ 
        error: 'لديك طلب قيد المراجعة. يرجى الانتظار حتى تتم مراجعته.' 
      }, { status: 400 });
    }

    // Store submitted country for admin review - status is Pending until admin approves
    // Note: 'country' field is NOT updated here - only admin can update it after approval
    const { error } = await supabase
      .from('users')
      .update({
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
