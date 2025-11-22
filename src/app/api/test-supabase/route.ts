import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();
    
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        config: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
          serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set (hidden)' : 'Missing',
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Missing'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      userCount: data?.users?.length || 0,
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        anonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set (hidden)' : 'Missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Missing'
      }
    }, { status: 500 });
  }
}
