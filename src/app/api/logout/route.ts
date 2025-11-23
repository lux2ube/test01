import { getSession } from '@/lib/auth/session'
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
    
    const response = NextResponse.json({ success: true })
    
    // CRITICAL: Delete ALL auth cookies to ensure complete logout
    response.cookies.delete('auth_session')
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    response.cookies.delete('sb-session')
    
    // Set Cache-Control to prevent browser cache of session data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
}
