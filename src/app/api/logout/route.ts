import { destroySession, getSession } from '@/lib/auth/session'
import { NextResponse } from 'next/server'
import { logUserActivity } from '@/app/admin/actions'
import { getServerSessionInfo } from '@/lib/server-session-info'

export async function POST() {
  try {
    // Get current session before destroying
    const session = await getSession()
    
    if (session.userId) {
      const clientInfo = await getServerSessionInfo()
      await logUserActivity(session.userId, 'logout', clientInfo)
    }
    
    // Destroy the custom session cookie
    await destroySession()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
}
