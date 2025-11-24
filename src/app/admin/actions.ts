'use server';

import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import type { ActivityLog, BannerSettings, BlogPost, Broker, CashbackTransaction, DeviceInfo, Notification, Order, PaymentMethod, ProductCategory, Product, TradingAccount, UserProfile, Withdrawal, GeoInfo, ClientLevel, AdminNotification, Offer } from '@/types';
import { getClientLevels } from '@/app/actions';

// ====================================================================
// SECURITY: Admin operations use Supabase Service Role Key which bypasses
// Row Level Security. All functions in this file should only be
// called from admin-authenticated contexts.
// ====================================================================

// Activity Logging
export async function logUserActivity(
  userId: string,
  event: ActivityLog['event'],
  clientInfo: { deviceInfo: DeviceInfo; geoInfo: GeoInfo },
  details?: Record<string, any>
) {
  try {
    const supabase = await createAdminClient();
    
    const logEntry = {
      user_id: userId,
      event,
      timestamp: new Date().toISOString(),
      ip_address: clientInfo.geoInfo.ip || 'unknown',
      user_agent: `${clientInfo.deviceInfo.browser} on ${clientInfo.deviceInfo.os}`,
      device: clientInfo.deviceInfo,
      geo: {
        country: clientInfo.geoInfo.country || 'Unknown',
        city: clientInfo.geoInfo.city || 'Unknown',
      },
      details,
    };
    
    const { error } = await supabase
      .from('activity_logs')
      .insert(logEntry);
    
    if (error) throw error;
  } catch (error) {
    console.error(`Failed to log activity for event ${event}:`, error);
  }
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }

  return (data || []).map((log) => ({
    id: log.id,
    userId: log.user_id,
    event: log.event,
    timestamp: new Date(log.timestamp),
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    device: log.device,
    geo: log.geo,
    details: log.details,
  }));
}

// Generic function to create a notification
async function createNotificationDirect(
  userId: string,
  message: string,
  type: Notification['type'],
  link?: string
) {
  const supabase = await createAdminClient();
  
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      message,
      type,
      link,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  
  if (error) {
    console.error('Error creating notification:', error);
  }
}

// Balance Calculation
export async function getUserBalance(userId: string) {
  const { getUserBalanceAdmin } = await import('@/app/actions/ledger');
  const result = await getUserBalanceAdmin(userId);
  
  if (!result.success || !result.balance) {
    return {
      availableBalance: 0,
      totalEarned: 0,
      pendingWithdrawals: 0,
      completedWithdrawals: 0,
      totalSpentOnOrders: 0,
    };
  }
  
  const { 
    available_balance, 
    total_earned, 
    total_pending_withdrawals, 
    total_withdrawn, 
    total_orders 
  } = result.balance;
  
  return {
    availableBalance: available_balance,
    totalEarned: total_earned,
    pendingWithdrawals: total_pending_withdrawals,
    completedWithdrawals: total_withdrawn,
    totalSpentOnOrders: total_orders,
  };
}

// Point Awarding Engine - Returns transaction ID for tracking/reversal
export async function awardReferralCommission(
  userId: string,
  sourceType: 'cashback' | 'store_purchase',
  amountValue: number
): Promise<{ success: boolean; transactionId?: string; commissionAmount?: number }> {
  try {
    const supabase = await createAdminClient();
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, referred_by')
      .eq('id', userId)
      .single();

    if (userError || !user || !user.referred_by) {
      console.log(`User ${userId} has no referrer. Skipping commission.`);
      return { success: false };
    }
    
    if (amountValue <= 0) {
      console.log(
        `Commission source amount is zero or negative for user ${userId}. Skipping.`
      );
      return { success: false };
    }

    const referrerId = user.referred_by;
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('id, level, monthly_earnings')
      .eq('id', referrerId)
      .single();

    if (referrerError || !referrer) {
      console.log(`Referrer ${referrerId} does not exist. Skipping commission.`);
      return { success: false };
    }

    const referrerLevel = referrer.level || 1;
    const levels = await getClientLevels();
    const currentLevelConfig = levels.find((l) => l.id === referrerLevel);

    if (!currentLevelConfig) {
      console.log(`Level config not found for level ${referrerLevel}. Skipping commission.`);
      return { success: false };
    }

    const commissionPercent =
      sourceType === 'cashback'
        ? currentLevelConfig.advantage_referral_cashback
        : currentLevelConfig.advantage_referral_store;

    if (commissionPercent <= 0) {
      console.log(`No commission for level ${referrerLevel} and source ${sourceType}. Skipping.`);
      return { success: false };
    }

    const commissionAmount = (amountValue * commissionPercent) / 100;
    const referenceId = randomUUID();

    const { addReferralCommissionToLedger } = await import('@/app/actions/ledger');
    const ledgerResult = await addReferralCommissionToLedger(
      referrerId,
      commissionAmount,
      referenceId,
      {
        source_user_id: userId,
        source_user_name: user.name,
        source_type: sourceType,
        commission_percent: commissionPercent,
        original_amount: amountValue
      }
    );

    if (!ledgerResult.success || !ledgerResult.result) {
      console.error('Error creating commission in ledger:', ledgerResult.error);
      return { success: false };
    }

    const transactionId = ledgerResult.result.transaction?.id;

    const message = `لقد ربحت ${commissionAmount.toFixed(2)}$ عمولة إحالة من ${user.name}.`;
    await createNotificationDirect(
      referrerId,
      message,
      'general',
      '/dashboard/referrals'
    );

    console.log(`✅ Referral commission awarded: ${commissionAmount} to ${referrerId}, txId: ${transactionId}`);
    return { 
      success: true, 
      transactionId,
      commissionAmount 
    };
  } catch (error) {
    console.error(`Failed to award referral commission to user ${userId}'s referrer:`, error);
    return { success: false };
  }
}

export async function clawbackReferralCommission(
  originalUserId: string,
  sourceType: 'cashback' | 'store_purchase',
  originalAmount: number
) {
  try {
    const supabase = await createAdminClient();
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, referred_by')
      .eq('id', originalUserId)
      .single();

    if (userError || !user || !user.referred_by) {
      return;
    }

    const referrerId = user.referred_by;
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('id, level, monthly_earnings')
      .eq('id', referrerId)
      .single();

    if (referrerError || !referrer) return;

    const referrerLevel = referrer.level || 1;
    const levels = await getClientLevels();
    const currentLevelConfig = levels.find((l) => l.id === referrerLevel);

    if (!currentLevelConfig) return;

    const commissionPercent =
      sourceType === 'cashback'
        ? currentLevelConfig.advantage_referral_cashback
        : currentLevelConfig.advantage_referral_store;

    if (commissionPercent <= 0) return;

    const commissionAmountToClawback = (originalAmount * commissionPercent) / 100;
    const clawbackReferenceId = randomUUID();

    const { reverseReferralCommissionInLedger } = await import('@/app/actions/ledger');
    const ledgerResult = await reverseReferralCommissionInLedger(
      referrerId,
      commissionAmountToClawback,
      clawbackReferenceId,
      {
        source_user_id: originalUserId,
        source_user_name: user.name,
        source_type: sourceType,
        reason: 'Order/transaction cancelled',
        commission_percent: commissionPercent,
        original_amount: originalAmount
      }
    );

    if (!ledgerResult.success) {
      console.error('Error creating clawback in ledger:', ledgerResult.error);
      return;
    }

    const message = `تم خصم ${commissionAmountToClawback.toFixed(2)}$ من رصيدك بسبب إلغاء معاملة من قبل ${user.name}.`;
    await createNotificationDirect(referrerId, message, 'general', '/dashboard/referrals');
  } catch (error) {
    console.error('Error in clawbackReferralCommission:', error);
  }
}

// Admin Notifications
export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin notifications:', error);
    return [];
  }

  return (data || []).map((notif) => ({
    id: notif.id,
    message: notif.message,
    target: notif.target,
    userIds: notif.user_ids || [],
    createdAt: new Date(notif.created_at),
  }));
}

export async function sendAdminNotification(
  message: string,
  target: 'all' | 'specific',
  userIds: string[]
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createAdminClient();
    
    const { error: adminNotifError } = await supabase
      .from('admin_notifications')
      .insert({
        message,
        target,
        user_ids: userIds,
        created_at: new Date().toISOString(),
      });

    if (adminNotifError) {
      console.error('Error creating admin notification:', adminNotifError);
      return { success: false, message: 'فشل إرسال الإشعار.' };
    }

    let targetUserIds: string[] = [];

    if (target === 'all') {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id');
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
        return { success: false, message: 'فشل جلب المستخدمين.' };
      }
      
      targetUserIds = (users || []).map((u) => u.id);
    } else {
      targetUserIds = userIds;
    }

    if (targetUserIds.length === 0) {
      return { success: false, message: 'لم يتم تحديد مستخدمين مستهدفين.' };
    }

    const notifications = targetUserIds.map((userId) => ({
      user_id: userId,
      message,
      type: 'announcement' as const,
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    const { error: notifsError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifsError) {
      console.error('Error creating user notifications:', notifsError);
      return { success: false, message: 'فشل إنشاء الإشعارات للمستخدمين.' };
    }

    return { success: true, message: `تم إرسال الإشعار إلى ${targetUserIds.length} مستخدم.` };
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return { success: false, message: 'فشل إرسال الإشعار.' };
  }
}

export async function getBannerSettings(): Promise<BannerSettings> {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from('banner_settings')
    .select('*')
    .eq('id', 'banner')
    .single();

  if (error || !data) {
    return {
      isEnabled: false,
      type: 'text',
      title: '',
      text: '',
      ctaText: '',
      ctaLink: '',
      scriptCode: '',
      targetLevels: [],
      targetCountries: [],
      targetStatuses: [],
    };
  }

  return {
    isEnabled: data.is_enabled || false,
    type: data.type || 'text',
    title: data.title || '',
    text: data.text || '',
    ctaText: data.cta_text || '',
    ctaLink: data.cta_link || '',
    scriptCode: data.script_code || '',
    targetLevels: data.target_levels || [],
    targetCountries: data.target_countries || [],
    targetStatuses: data.target_statuses || [],
  };
}

export async function updateBannerSettings(settings: BannerSettings) {
  try {
    const supabase = await createAdminClient();
    
    const { error } = await supabase
      .from('banner_settings')
      .update({
        is_enabled: settings.isEnabled,
        type: settings.type,
        title: settings.title,
        text: settings.text,
        cta_text: settings.ctaText,
        cta_link: settings.ctaLink,
        script_code: settings.scriptCode,
        target_levels: settings.targetLevels,
        target_countries: settings.targetCountries,
        target_statuses: settings.targetStatuses,
      })
      .eq('id', 'banner');

    if (error) throw error;
    
    return { success: true, message: 'تم تحديث إعدادات البانر بنجاح.' };
  } catch (error) {
    console.error('Error updating banner settings:', error);
    return { success: false, message: 'فشل تحديث إعدادات البانر.' };
  }
}
