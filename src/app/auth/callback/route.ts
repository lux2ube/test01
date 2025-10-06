import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
    }
    
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  if (body.event === 'SIGNED_IN' && body.session) {
    await supabase.auth.setSession(body.session)
  } else if (body.event === 'SIGNED_OUT') {
    await supabase.auth.signOut()
  }

  return NextResponse.json({ success: true })
}
