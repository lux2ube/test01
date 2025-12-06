'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { UserProfile, PendingVerification, KycData, AddressData } from '@/types';

async function createNotification(
  userId: string,
  message: string,
  type: 'account' | 'cashback' | 'withdrawal' | 'general' | 'store' | 'loyalty' | 'announcement',
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

export async function getPendingVerifications(): Promise<PendingVerification[]> {
  const supabase = await createAdminClient();
  
  const { data: users, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  const pendingRequests: PendingVerification[] = [];

  users?.forEach((user) => {
    if (user.kyc_status === 'Pending') {
      pendingRequests.push({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type: 'KYC',
        requestedAt: user.kyc_submitted_at ? new Date(user.kyc_submitted_at) : new Date(),
        data: {
          documentType: user.kyc_document_type,
          documentNumber: user.kyc_document_number,
          fullName: user.kyc_full_name,
          dateOfBirth: user.kyc_date_of_birth ? new Date(user.kyc_date_of_birth) : new Date(),
          nationality: user.kyc_nationality,
          documentIssueDate: user.kyc_document_issue_date ? new Date(user.kyc_document_issue_date) : new Date(),
          documentExpiryDate: user.kyc_document_expiry_date ? new Date(user.kyc_document_expiry_date) : new Date(),
          gender: user.kyc_gender,
          documentFrontUrl: user.kyc_document_front_url || '',
          documentBackUrl: user.kyc_document_back_url,
          selfieUrl: user.kyc_selfie_url,
          status: user.kyc_status,
          submittedAt: user.kyc_submitted_at ? new Date(user.kyc_submitted_at) : new Date(),
          rejectionReason: user.kyc_rejection_reason,
        },
      });
    }

    if (user.address_status === 'Pending') {
      pendingRequests.push({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type: 'Address',
        requestedAt: user.address_submitted_at ? new Date(user.address_submitted_at) : new Date(),
        data: {
          country: user.address_country || user.country || '',
          status: user.address_status,
          submittedAt: user.address_submitted_at ? new Date(user.address_submitted_at) : new Date(),
          rejectionReason: user.address_rejection_reason,
        },
      });
    }

    if (user.phone_number && !user.phone_number_verified) {
      pendingRequests.push({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type: 'Phone',
        requestedAt: new Date(),
        data: { phoneNumber: user.phone_number },
      });
    }
  });

  pendingRequests.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

  return pendingRequests;
}

export async function approveKycWithData(
  userId: string,
  extractedData: {
    fullName: string;
    gender: 'male' | 'female';
    dateOfBirth: string;
    documentNumber: string;
    documentIssueDate: string;
    documentExpiryDate: string;
  }
) {
  try {
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from('users')
      .update({
        kyc_full_name: extractedData.fullName,
        kyc_gender: extractedData.gender,
        kyc_date_of_birth: extractedData.dateOfBirth,
        kyc_document_number: extractedData.documentNumber,
        kyc_document_issue_date: extractedData.documentIssueDate || null,
        kyc_document_expiry_date: extractedData.documentExpiryDate || null,
        kyc_status: 'Verified',
        kyc_rejection_reason: null,
      })
      .eq('id', userId);

    if (error) throw error;

    await createNotification(
      userId,
      'تم التحقق من هويتك بنجاح.',
      'general',
      '/dashboard/settings/verification'
    );

    return { success: true, message: 'تم الموافقة على التحقق وحفظ البيانات' };
  } catch (error) {
    console.error('Error approving KYC with data:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
    return { success: false, message: `فشل الموافقة: ${errorMessage}` };
  }
}

export async function updateVerificationStatus(
  userId: string,
  type: 'kyc' | 'address' | 'phone',
  status: 'Verified' | 'Rejected',
  reason?: string
) {
  try {
    const supabase = await createAdminClient();
    let updateData: Record<string, any> = {};
    let notificationMessage = '';
    let notificationLink = '/dashboard/settings/verification';

    if (type === 'kyc') {
      updateData['kyc_status'] = status;
      if (status === 'Rejected') {
        if (!reason) throw new Error('Rejection reason is required.');
        updateData['kyc_rejection_reason'] = reason;
        notificationMessage = `تم رفض طلب التحقق من الهوية. السبب: ${reason}`;
      } else {
        notificationMessage = 'تم التحقق من هويتك بنجاح.';
      }
    } else if (type === 'address') {
      updateData['address_status'] = status;
      if (status === 'Rejected') {
        if (!reason) throw new Error('Rejection reason is required.');
        updateData['address_rejection_reason'] = reason;
        notificationMessage = `تم رفض طلب التحقق من العنوان. السبب: ${reason}`;
      } else {
        notificationMessage = 'تم التحقق من عنوانك بنجاح.';
      }
    } else if (type === 'phone') {
      if (status === 'Verified') {
        updateData['phone_number_verified'] = true;
        notificationMessage = 'تم التحقق من رقم هاتفك بنجاح.';
      } else {
        if (!reason) throw new Error('Rejection reason is required.');
        updateData['phone_number_verified'] = false;
        notificationMessage = `فشل التحقق من رقم هاتفك. السبب: ${reason}`;
      }
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) throw updateError;

    await createNotification(userId, notificationMessage, 'general', notificationLink);

    return { success: true, message: `تم تحديث حالة التحقق بنجاح.` };
  } catch (error) {
    console.error(`Error updating ${type} status for user ${userId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
    return { success: false, message: `فشل تحديث حالة التحقق: ${errorMessage}` };
  }
}
