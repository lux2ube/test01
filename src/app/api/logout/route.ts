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
    
    // Delete the session cookie
    response.cookies.delete('auth_session')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
}
