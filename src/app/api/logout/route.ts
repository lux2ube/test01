import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logUserActivity } from '@/app/admin/actions'
import { getServerSessionInfo } from '@/lib/server-session-info'

export async function POST() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const clientInfo = await getServerSessionInfo()
      await logUserActivity(user.id, 'logout', clientInfo)
    }
    
    await supabase.auth.signOut()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
}
