import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { access_token, refresh_token } = body

    if (!access_token || !refresh_token) {
      console.error('Missing tokens in request')
      return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
    }

    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (error) {
      console.error('Session sync error:', error.message, error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!data.session) {
      console.error('No session returned after setSession')
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    if (!data.user) {
      console.error('No user returned after setSession')
      return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
    }

    console.log('✅ Session synced successfully for user:', data.user.id)
    console.log('✅ Session expires at:', data.session.expires_at)
    
    const response = NextResponse.json({ 
      success: true,
      userId: data.user.id 
    })
    
    return response
  } catch (error) {
    console.error('❌ Session sync exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
