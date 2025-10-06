'use server';

import { logUserActivity } from '@/app/admin/actions';
import { getServerSessionInfo } from '@/lib/server-session-info';

export async function logLoginActivity(userId: string) {
  try {
    const clientInfo = await getServerSessionInfo();
    await logUserActivity(userId, 'login', clientInfo);
    return { success: true };
  } catch (error) {
    console.error('Failed to log login activity:', error);
    return { success: false };
  }
}
