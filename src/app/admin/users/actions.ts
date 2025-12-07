'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { UserProfile, UserStatus, ClientLevel, TradingAccount, KycData, AddressData, ActivityLog } from '@/types';
import { startOfMonth } from 'date-fns';
import { getClientLevels } from '@/app/actions';

export async function getUsers(): Promise<UserProfile[]> {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return (data || []).map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clientId: user.client_id,
    createdAt: new Date(user.created_at),
    country: user.country,
    isVerified: user.is_verified,
    status: user.status,
    phoneNumber: user.phone_number,
    phoneNumberVerified: user.phone_number_verified,
    referralCode: user.referral_code,
    referredBy: user.referred_by,
    level: user.level,
    monthlyEarnings: user.monthly_earnings,
    kycData: user.kyc_status ? {
      documentType: user.kyc_document_type,
      documentNumber: user.kyc_document_number,
      fullName: user.kyc_full_name || '',
      dateOfBirth: user.kyc_date_of_birth ? new Date(user.kyc_date_of_birth) : new Date(),
      nationality: user.kyc_nationality || '',
      documentIssueDate: user.kyc_document_issue_date ? new Date(user.kyc_document_issue_date) : new Date(),
      documentExpiryDate: user.kyc_document_expiry_date ? new Date(user.kyc_document_expiry_date) : new Date(),
      gender: user.kyc_gender,
      documentFrontUrl: user.kyc_document_front_url || '',
      documentBackUrl: user.kyc_document_back_url,
      selfieUrl: user.kyc_selfie_url,
      status: user.kyc_status,
      submittedAt: user.kyc_submitted_at ? new Date(user.kyc_submitted_at) : new Date(),
      rejectionReason: user.kyc_rejection_reason,
    } : undefined,
    addressData: user.address_status ? {
      country: user.address_country || user.country || '',
      status: user.address_status,
      submittedAt: user.address_submitted_at ? new Date(user.address_submitted_at) : new Date(),
      rejectionReason: user.address_rejection_reason,
    } : undefined,
  }));
}

export async function updateUser(userId: string, data: Partial<Omit<UserProfile, 'uid'>>) {
  try {
    const supabase = await createAdminClient();
    
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.monthlyEarnings !== undefined) updateData.monthly_earnings = data.monthlyEarnings;
    
    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
    
    return { success: true, message: 'تم تحديث الملف الشخصي بنجاح.' };
  } catch (error) {
    console.error("Error updating user profile:", error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف.';
    return { success: false, message: `فشل تحديث الملف الشخصي: ${errorMessage}` };
  }
}

export async function adminUpdateKyc(userId: string, kycData: KycData) {
  try {
    const supabase = await createAdminClient();
    
    const submittedAt = kycData.submittedAt instanceof Date 
      ? kycData.submittedAt.toISOString() 
      : kycData.submittedAt;
    
    const { error } = await supabase
      .from('users')
      .update({
        kyc_document_type: kycData.documentType,
        kyc_document_number: kycData.documentNumber,
        kyc_gender: kycData.gender,
        kyc_status: kycData.status,
        kyc_submitted_at: submittedAt,
        kyc_rejection_reason: kycData.rejectionReason,
      })
      .eq('id', userId);

    if (error) throw error;
    
    return { success: true, message: "تم تحديث حالة KYC." };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function adminUpdateAddress(userId: string, addressData: AddressData) {
  try {
    const supabase = await createAdminClient();
    
    const submittedAt = addressData.submittedAt instanceof Date 
      ? addressData.submittedAt.toISOString() 
      : addressData.submittedAt;
    
    const { error } = await supabase
      .from('users')
      .update({
        country: addressData.country,
        address_country: addressData.country,
        address_status: addressData.status,
        address_submitted_at: submittedAt,
        address_rejection_reason: addressData.rejectionReason,
      })
      .eq('id', userId);

    if (error) throw error;
    
    return { success: true, message: "تم تحديث بيانات العنوان." };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function adminUpdatePhoneNumber(userId: string, phoneNumber: string) {
  try {
    const supabase = await createAdminClient();
    
    const { error } = await supabase
      .from('users')
      .update({
        phone_number: phoneNumber,
        phone_number_verified: false,
      })
      .eq('id', userId);

    if (error) throw error;
    
    return { success: true, message: "تم تحديث رقم الهاتف." };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function backfillUserStatuses(): Promise<{ success: boolean; message: string; }> {
  try {
    const supabase = await createAdminClient();
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, status');

    if (usersError) throw usersError;

    let updatedCount = 0;

    for (const user of users || []) {
      if (user.status) {
        continue;
      }

      let newStatus: UserStatus = 'NEW';

      const { data: cashbackData } = await supabase
        .from('cashback_transactions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (cashbackData && cashbackData.length > 0) {
        newStatus = 'Trader';
      } else {
        const { data: accountsData } = await supabase
          .from('trading_accounts')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'Approved')
          .limit(1);

        if (accountsData && accountsData.length > 0) {
          newStatus = 'Active';
        }
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', user.id);

      if (!updateError) {
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      return { success: true, message: `Successfully updated ${updatedCount} users.` };
    } else {
      return { success: true, message: 'All users already have a status. No updates were needed.' };
    }
  } catch (error) {
    console.error("Error backfilling user statuses:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to backfill statuses: ${errorMessage}` };
  }
}

export async function backfillUserLevels(): Promise<{ success: boolean; message: string; }> {
  try {
    const supabase = await createAdminClient();
    
    const levels = await getClientLevels();
    if (levels.length === 0) {
      return { success: false, message: "No client levels configured. Please seed them first." };
    }
    levels.sort((a, b) => b.required_total - a.required_total);
    const lowestLevel = levels[levels.length - 1];

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');

    if (usersError) throw usersError;

    const monthStart = startOfMonth(new Date());
    const { data: cashbackData, error: cashbackError } = await supabase
      .from('cashback_transactions')
      .select('user_id, cashback_amount')
      .gte('date', monthStart.toISOString());

    if (cashbackError) throw cashbackError;

    const monthlyEarningsMap = new Map<string, number>();
    cashbackData?.forEach((tx) => {
      const currentEarnings = monthlyEarningsMap.get(tx.user_id) || 0;
      monthlyEarningsMap.set(tx.user_id, currentEarnings + tx.cashback_amount);
    });

    let updatedCount = 0;

    for (const user of users || []) {
      const monthlyEarnings = monthlyEarningsMap.get(user.id) || 0;
      const newLevel = levels.find(level => monthlyEarnings >= level.required_total) || lowestLevel;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          level: newLevel.id,
          monthly_earnings: monthlyEarnings,
        })
        .eq('id', user.id);

      if (!updateError) {
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      return { success: true, message: `Successfully updated ${updatedCount} users with calculated levels and earnings.` };
    } else {
      return { success: true, message: 'No users to update.' };
    }
  } catch (error) {
    console.error("Error backfilling user levels:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to backfill levels: ${errorMessage}` };
  }
}

export async function getUserDetails(userId: string) {
  try {
    const supabase = await createAdminClient();
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error("لم يتم العثور على المستخدم");
    }

    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      clientId: user.client_id,
      createdAt: new Date(user.created_at),
      country: user.country,
      isVerified: user.is_verified,
      status: user.status,
      phoneNumber: user.phone_number,
      phoneNumberVerified: user.phone_number_verified,
      referralCode: user.referral_code,
      referredBy: user.referred_by,
      level: user.level,
      monthlyEarnings: user.monthly_earnings,
      kycData: user.kyc_status ? {
        documentType: user.kyc_document_type,
        documentNumber: user.kyc_document_number,
        fullName: user.kyc_full_name || '',
        dateOfBirth: user.kyc_date_of_birth ? new Date(user.kyc_date_of_birth) : new Date(),
        nationality: user.kyc_nationality || '',
        documentIssueDate: user.kyc_document_issue_date ? new Date(user.kyc_document_issue_date) : new Date(),
        documentExpiryDate: user.kyc_document_expiry_date ? new Date(user.kyc_document_expiry_date) : new Date(),
        gender: user.kyc_gender,
        documentFrontUrl: user.kyc_document_front_url || '',
        documentBackUrl: user.kyc_document_back_url,
        selfieUrl: user.kyc_selfie_url,
        status: user.kyc_status,
        submittedAt: user.kyc_submitted_at ? new Date(user.kyc_submitted_at) : new Date(),
        rejectionReason: user.kyc_rejection_reason,
      } : undefined,
      addressData: user.address_status ? {
        country: user.address_country || user.country || '',
        status: user.address_status,
        submittedAt: user.address_submitted_at ? new Date(user.address_submitted_at) : new Date(),
        rejectionReason: user.address_rejection_reason,
      } : undefined,
    };

    const [tradingAccountsResult, ledgerAccountResult] = await Promise.all([
      supabase.from('trading_accounts').select('*').eq('user_id', userId),
      supabase.from('accounts').select('*').eq('user_id', userId).single(),
    ]);

    const tradingAccounts: TradingAccount[] = (tradingAccountsResult.data || []).map((acc) => ({
      id: acc.id,
      userId: acc.user_id,
      broker: acc.broker,
      accountNumber: acc.account_number,
      status: acc.status,
      createdAt: new Date(acc.created_at),
      rejectionReason: acc.rejection_reason,
    }));

    const ledgerAccount = ledgerAccountResult.data;
    const totalEarned = parseFloat(ledgerAccount?.total_earned || '0');
    const totalDeposit = parseFloat(ledgerAccount?.total_deposit || '0');
    const totalWithdrawn = parseFloat(ledgerAccount?.total_withdrawn || '0');
    const totalPendingWithdrawals = parseFloat(ledgerAccount?.total_pending_withdrawals || '0');
    const totalOrders = parseFloat(ledgerAccount?.total_orders || '0');
    
    const availableBalance = totalEarned + totalDeposit - totalWithdrawn - totalPendingWithdrawals - totalOrders;

    const balance = {
      availableBalance,
      totalEarned,
      totalDeposit,
      totalWithdrawn,
      totalPendingWithdrawals,
      totalOrders,
    };

    let referredByName = null;
    if (userProfile.referredBy) {
      const { data: referrer } = await supabase
        .from('users')
        .select('name')
        .eq('id', userProfile.referredBy)
        .single();
      
      if (referrer) {
        referredByName = referrer.name;
      }
    }

    let referralsWithNames: { uid: string; name: string }[] = [];
    const { data: referrals } = await supabase
      .from('users')
      .select('id, name')
      .eq('referred_by', userId);

    if (referrals) {
      referralsWithNames = referrals.map((r) => ({
        uid: r.id,
        name: r.name || 'مستخدم غير معروف',
      }));
    }

    return {
      userProfile,
      balance,
      tradingAccounts,
      referredByName,
      referralsWithNames,
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { error: errorMessage };
  }
}

export async function getUserActivityLogs(userId: string): Promise<ActivityLog[]> {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('event', 'login')
    .order('timestamp', { ascending: false })
    .limit(20);

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
