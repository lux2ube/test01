'use server';

import { generateProjectSummary } from "@/ai/flows/generate-project-summary";
import type { GenerateProjectSummaryOutput } from "@/ai/flows/generate-project-summary";
import { calculateCashback } from "@/ai/flows/calculate-cashback";
import type { CalculateCashbackInput, CalculateCashbackOutput } from "@/ai/flows/calculate-cashback";
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';
import { generateReferralCode } from "@/lib/referral";
import { logUserActivity } from "./admin/actions";
import { getServerSessionInfo } from "@/lib/server-session-info";
import { getCountryFromHeaders } from "@/lib/server-geo";
import type { Order, Product, ProductCategory, CashbackTransaction, KycData, AddressData, FeedbackForm, ClientLevel, Notification, FeedbackResponse, Withdrawal, TradingAccount, UserProfile, BlogPost, DeviceInfo, GeoInfo } from "@/types";

const projectData = {
    projectDescription: "A cashback calculation system in Go that processes customer transactions. It determines cashback rewards based on a set of configurable rules, including handling for blacklisted Merchant Category Codes (MCCs). The system is exposed via a RESTful API.",
    architectureDetails: "The project is a single microservice built in Go. It exposes a REST API for calculating cashback. The core logic is encapsulated within a rules engine that evaluates transactions against a list of rules to determine the final cashback amount. It has handlers for different API endpoints, and a main function to set up the server.",
    technologyDetails: "The backend is written entirely in Go. It uses the `gorilla/mux` library for HTTP routing and request handling. The project has no external database dependencies mentioned in the repository, suggesting it might be stateless or store data in memory/files.",
    mainGoals: "The main goal is to provide a reliable and efficient service for calculating cashback on transactions. It aims to be flexible through a rule-based system and provide a clear API for integration into larger e-commerce or financial platforms.",
};

export async function handleGenerateSummary(): Promise<{ summary: string | null; error: string | null }> {
    try {
        const result: GenerateProjectSummaryOutput = await generateProjectSummary(projectData);
        if (result && result.summary) {
            return { summary: result.summary, error: null };
        }
        return { summary: null, error: "Failed to generate summary." };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        return { summary: null, error: `An error occurred: ${errorMessage}` };
    }
}

export async function handleCalculateCashback(input: CalculateCashbackInput): Promise<{ result: CalculateCashbackOutput | null; error: string | null }> {
    try {
        const result: CalculateCashbackOutput = await calculateCashback(input);
        if (result) {
            return { result, error: null };
        }
        return { result: null, error: "Failed to calculate cashback." };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        return { result: null, error: `An error occurred: ${errorMessage}` };
    }
}

export async function handleRegisterUser(formData: { name: string, email: string, password: string, referralCode?: string }) {
    const { name, email, password, referralCode } = formData;
    
    let referrerId: string | null = null;

    const supabaseAdmin = await createAdminClient();

    if (referralCode) {
        try {
            const { data: referrerData, error } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('referral_code', referralCode)
                .single();
            
            if (error || !referrerData) {
                return { success: false, error: "The referral code you entered is not valid." };
            }
            referrerId = referrerData.id;
        } catch (error) {
            console.error("Error validating referral code:", error);
            return { success: false, error: "Failed to validate referral code." };
        }
    }

    const detectedCountry = await getCountryFromHeaders();

    try {
        const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (signUpError || !authData.user) {
            console.error("Supabase Auth Error:", signUpError);
            if (signUpError?.message?.includes('already registered')) {
                return { success: false, error: "This email is already in use. Please log in." };
            }
            return { success: false, error: "An unexpected error occurred during registration. Please try again." };
        }

        const userId = authData.user.id;

        const { data: userData, error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
                id: userId,
                name,
                email,
                role: 'user',
                status: 'active',
                created_at: new Date().toISOString(),
                referral_code: generateReferralCode(name),
                referred_by: referrerId,
                level: 1,
                monthly_earnings: 0,
                country: detectedCountry,
            })
            .select()
            .single();

        if (insertError) {
            await supabaseAdmin.auth.admin.deleteUser(userId);
            console.error("Error creating user record:", insertError);
            return { success: false, error: "An unexpected error occurred during registration. Please try again." };
        }

        
        return { success: true, userId: userId };

    } catch (error: any) {
        console.error("Registration Error:", error);
        return { success: false, error: "An unexpected error occurred during registration. Please try again." };
    }
}

export async function handleLogout() {
    try {
        return { success: true };
    } catch (error) {
        console.error("Logout Error: ", error);
        return { success: false, error: "Failed to log out." };
    }
}

export async function handleForgotPassword(email: string) {
    try {
        const supabase = await createClient();
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                       (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000');
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${siteUrl}/reset-password`,
        });
        
        if (error) {
            console.error("Forgot Password Error: ", error);
            return { success: false, error: "An unexpected error occurred. Please try again." };
        }
        
        return { success: true };
    } catch (error: any) {
        console.error("Forgot Password Error: ", error);
        return { success: false, error: "An unexpected error occurred. Please try again." };
    }
}

export async function getClientLevels(): Promise<ClientLevel[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('client_levels')
        .select('*')
        .order('id', { ascending: true });
    
    if (error) {
        console.error("Error fetching client levels:", error);
        return [];
    }
    
    return data || [];
}

export async function getNotificationsForUser(): Promise<Notification[]> {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }

    return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        message: item.message,
        type: item.type,
        isRead: item.is_read,
        createdAt: new Date(item.created_at),
        link: item.link,
    }));
}

export async function markNotificationsAsRead(notificationIds: string[]) {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    const supabase = await createAdminClient();
    
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .in('id', notificationIds);
    
    if (error) {
        console.error("Error marking notifications as read:", error);
    }
}

export async function getActiveFeedbackFormForUser(): Promise<FeedbackForm | null> {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    const supabase = await createAdminClient();
    
    const { data: activeForms, error: formsError } = await supabase
        .from('feedback_forms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    
    if (formsError || !activeForms || activeForms.length === 0) {
        return null;
    }

    const { data: userResponses, error: responsesError } = await supabase
        .from('feedback_responses')
        .select('form_id')
        .eq('user_id', userId);
    
    const respondedFormIds = new Set((userResponses || []).map(r => r.form_id));

    for (const form of activeForms) {
        if (!respondedFormIds.has(form.id)) {
            return {
                id: form.id,
                title: form.title,
                description: form.description || '',
                questions: form.questions,
                status: form.status,
                createdAt: new Date(form.created_at),
                responseCount: form.response_count || 0,
            };
        }
    }

    return null;
}

export async function submitFeedbackResponse(
    formId: string,
    answers: Record<string, any>
): Promise<{ success: boolean, message: string }> {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    try {
        const supabase = await createAdminClient();
        
        const { error: insertError } = await supabase
            .from('feedback_responses')
            .insert({
                form_id: formId,
                user_id: userId,
                submitted_at: new Date().toISOString(),
                responses: answers,
            });

        if (insertError) {
            throw insertError;
        }

        const { data: formData } = await supabase
            .from('feedback_forms')
            .select('response_count')
            .eq('id', formId)
            .single();

        if (formData) {
            const { error: updateError } = await supabase
                .from('feedback_forms')
                .update({ response_count: (formData.response_count || 0) + 1 })
                .eq('id', formId);

            if (updateError) {
                console.error("Error updating response count:", updateError);
            }
        }

        return { success: true, message: "شكرا لملاحظاتك!" };
    } catch (error) {
        console.error("Error submitting feedback:", error);
        return { success: false, message: "فشل إرسال الملاحظات." };
    }
}

export async function getProducts(): Promise<Product[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('products')
        .select('*');
    
    if (error) {
        console.error("Error fetching products:", error);
        return [];
    }
    
    return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.image_url,
        categoryId: item.category_id,
        categoryName: item.category_name,
        stock: item.stock,
    }));
}

export async function getCategories(): Promise<ProductCategory[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('product_categories')
        .select('*');
    
    if (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
    
    return data || [];
}

export async function getOrders(): Promise<Order[]> {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
    
    return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        productId: item.product_id,
        productName: item.product_name,
        productImage: item.product_image,
        price: item.product_price,
        status: item.status,
        createdAt: new Date(item.created_at),
        userName: item.user_name,
        userEmail: item.user_email,
        deliveryPhoneNumber: item.delivery_phone_number,
        referralCommissionAwarded: item.referral_commission_awarded,
    }));
}

export async function getCashbackTransactions(): Promise<CashbackTransaction[]> {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('cashback_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
    
    if (error) {
        console.error("Error fetching cashback transactions:", error);
        return [];
    }
    
    return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        accountId: item.account_id,
        accountNumber: item.account_number,
        broker: item.broker,
        date: new Date(item.date),
        tradeDetails: item.trade_details,
        cashbackAmount: item.cashback_amount,
        referralBonusTo: item.referral_bonus_to,
        referralBonusAmount: item.referral_bonus_amount,
        sourceUserId: item.source_user_id,
        sourceType: item.source_type,
        transactionId: item.transaction_id,
        note: item.note,
    }));
}

export type UnifiedTransaction = {
    id: string;
    type: 'cashback' | 'referral_commission' | 'referral_reversal' | 'withdrawal' | 'order' | 'order_created' | 'order_cancelled';
    amount: number;
    date: Date;
    description: string;
    details: string;
    metadata?: Record<string, any>;
};

export async function getUnifiedTransactionHistory(): Promise<UnifiedTransaction[]> {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    const supabase = await createAdminClient();
    
    // Fetch all ledger transactions
    let ledgerData: any[] | null = null;
    const { data: ledgerResult, error: ledgerError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    
    if (ledgerError) {
        // Table may not exist yet if migrations haven't been applied
        if (ledgerError.code !== '42P01') {
            console.error("Error fetching ledger transactions:", ledgerError);
        }
    } else {
        ledgerData = ledgerResult;
    }
    
    // Fetch legacy cashback transactions (for backwards compatibility)
    const { data: cashbackData, error: cashbackError } = await supabase
        .from('cashback_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
    
    if (cashbackError) {
        console.error("Error fetching cashback transactions:", cashbackError);
    }
    
    const transactions: UnifiedTransaction[] = [];
    
    // Map ledger transactions (exclude withdrawals - they have their own page)
    (ledgerData || []).forEach(tx => {
        // Skip withdrawal transactions
        if (tx.type === 'withdrawal' || tx.type === 'withdrawal_processing' || 
            tx.type === 'withdrawal_completed' || tx.type === 'withdrawal_cancelled') {
            return;
        }
        
        const metadata = tx.metadata || {};
        let description = '';
        let details = '';
        
        switch (tx.type) {
            case 'cashback':
                description = 'كاش باك';
                details = metadata.broker ? `${metadata.broker} - ${metadata.account_number || ''}` : 'من التداول';
                break;
            case 'referral_commission':
                description = 'عمولة إحالة';
                details = metadata.source_user_name ? `من ${metadata.source_user_name}` : 'عمولة من مُحال';
                break;
            case 'referral_reversal':
                description = 'عكس عمولة إحالة';
                details = metadata.reason || 'تم إلغاء العمولة';
                break;
            case 'order':
            case 'order_created':
                description = 'شراء من المتجر';
                details = metadata.product_name || 'طلب من المتجر';
                break;
            case 'order_cancelled':
                description = 'إلغاء طلب';
                details = metadata.product_name || 'تم إلغاء الطلب';
                break;
            default:
                description = 'معاملة';
                details = '';
        }
        
        transactions.push({
            id: tx.id,
            type: tx.type,
            amount: parseFloat(tx.amount),
            date: new Date(tx.created_at),
            description,
            details,
            metadata,
        });
    });
    
    // Map legacy cashback transactions (only if not already in ledger)
    const ledgerIds = new Set((ledgerData || []).map(tx => tx.reference_id));
    (cashbackData || []).forEach(item => {
        // Skip if this cashback is already represented in ledger
        if (ledgerIds.has(item.id)) return;
        
        transactions.push({
            id: item.id,
            type: 'cashback',
            amount: parseFloat(item.cashback_amount),
            date: new Date(item.date),
            description: 'كاش باك',
            details: `${item.broker || ''} - ${item.account_number || ''}`.trim(),
            metadata: {
                broker: item.broker,
                account_number: item.account_number,
                trade_details: item.trade_details,
            },
        });
    });
    
    // Sort by date descending
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return transactions;
}

export async function placeOrder(
    productId: string,
    formData: { userName: string; userEmail: string; deliveryPhoneNumber: string },
    clientInfo: { deviceInfo: DeviceInfo, geoInfo: GeoInfo }
) {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    try {
        const supabase = await createAdminClient();
        
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        
        if (productError || !product) {
            throw new Error("Product not found.");
        }
        
        const { data: result, error: placeOrderError } = await supabase.rpc('ledger_place_order', {
            p_user_id: userId,
            p_product_id: productId,
            p_product_name: product.name,
            p_product_image: product.image_url,
            p_product_price: product.price,
            p_user_name: formData.userName,
            p_user_email: formData.userEmail,
            p_delivery_phone: formData.deliveryPhoneNumber,
            p_actor_id: userId,
            p_actor_action: 'user_place_order'
        });
        
        if (placeOrderError) {
            throw new Error(placeOrderError.message || 'Failed to place order');
        }
        
        if (!result || result.length === 0 || !result[0].success) {
            const errorMsg = result?.[0]?.error_message || 'Failed to place order';
            throw new Error(errorMsg);
        }
        
        const orderId = result[0].order_id;
        
        await logUserActivity(userId, 'store_purchase', clientInfo, { 
            productId, 
            orderId,
            price: product.price 
        });
        
        return { success: true, message: 'تم تقديم الطلب بنجاح!' };
    } catch (error) {
        console.error('Error placing order:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while placing your order.';
        return { success: false, message: errorMessage };
    }
}

export async function sendVerificationEmail(): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getAuthenticatedUser();
        
        if (!user || !user.email) {
            return { success: false, error: 'User not found or no email associated.' };
        }

        const supabase = await createClient();
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                       (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000');
        
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: user.email,
            options: {
                emailRedirectTo: `${siteUrl}/auth/callback`
            }
        });

        if (error) {
            console.error('Error sending verification email:', error);
            return { success: false, error: 'Failed to send verification email. Please try again.' };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Send verification email error:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function submitKycData(data: Omit<KycData, 'status' | 'submittedAt'>): Promise<{ success: boolean; error?: string }> {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from('users')
            .update({
                kyc_document_type: data.documentType,
                kyc_document_number: data.documentNumber,
                kyc_gender: data.gender,
                kyc_status: 'Pending',
                kyc_submitted_at: new Date().toISOString(),
            })
            .eq('id', userId);
        
        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function submitAddressData(data: Omit<AddressData, 'status' | 'submittedAt'>): Promise<{ success: boolean; error?: string }> {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from('users')
            .update({
                address_country: data.country,
                address_city: data.city,
                address_street: data.streetAddress,
                address_status: 'Pending',
                address_submitted_at: new Date().toISOString(),
            })
            .eq('id', userId);
        
        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateUserPhoneNumber(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from('users')
            .update({ 
                phone_number: phoneNumber,
                phone_number_verified: false
            })
            .eq('id', userId);
        
        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function adminUpdateUserPhoneNumber(targetUserId: string, phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    const user = await getAuthenticatedUser();
    const supabase = await createAdminClient();
    
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (userData?.role !== 'admin') {
        return { success: false, error: 'Unauthorized: Admin access required' };
    }
    
    try {
        const { error } = await supabase
            .from('users')
            .update({ 
                phone_number: phoneNumber,
                phone_number_verified: true
            })
            .eq('id', targetUserId);
        
        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getUserBalance() {
    const { getMyBalance } = await import('@/app/actions/ledger');
    const result = await getMyBalance();
    
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

export async function requestWithdrawal(
    payload: Omit<Withdrawal, 'id' | 'requestedAt' | 'userId'>
) {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    try {
        const supabase = await createAdminClient();
        
        const { getMyBalance } = await import('@/app/actions/ledger');
        const balanceResult = await getMyBalance();
        
        if (!balanceResult.success) {
            throw new Error('Failed to fetch balance');
        }
        
        const availableBalance = balanceResult.balance.available_balance;
        
        if (payload.amount > availableBalance) {
            throw new Error("Insufficient available balance for this withdrawal.");
        }
        
        const { data: withdrawal, error } = await supabase
            .from('withdrawals')
            .insert({
                user_id: userId,
                amount: payload.amount,
                status: payload.status,
                payment_method: payload.paymentMethod,
                withdrawal_details: payload.withdrawalDetails,
                requested_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error || !withdrawal) throw error || new Error('Failed to create withdrawal');
        
        const { createWithdrawal } = await import('@/lib/ledger/service');
        const ledgerResult = await createWithdrawal({
            userId,
            amount: payload.amount,
            referenceId: withdrawal.id,
            metadata: {
                payment_method: payload.paymentMethod,
                withdrawal_details: payload.withdrawalDetails,
                _actor_id: userId,
                _actor_action: 'user_request_withdrawal'
            }
        });
        
        if (!ledgerResult) {
            await supabase.from('withdrawals').delete().eq('id', withdrawal.id);
            throw new Error('Failed to update ledger');
        }
        
        return { success: true, message: 'Withdrawal request submitted successfully.' };
    } catch (error) {
        console.error('Error requesting withdrawal:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return { success: false, message: errorMessage };
    }
}

export async function getTradingAccounts(): Promise<TradingAccount[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('trading_accounts')
        .select('*');
    
    if (error) {
        console.error("Error fetching trading accounts:", error);
        return [];
    }
    
    return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        broker: item.broker,
        accountNumber: item.account_number,
        status: item.status,
        createdAt: new Date(item.created_at),
        rejectionReason: item.rejection_reason,
    }));
}

export async function getUserTradingAccounts(): Promise<TradingAccount[]> {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('trading_accounts')
        .select('*')
        .eq('user_id', userId);
    
    if (error) {
        console.error("Error fetching user trading accounts:", error);
        return [];
    }
    
    return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        broker: item.broker,
        accountNumber: item.account_number,
        status: item.status,
        createdAt: new Date(item.created_at),
        rejectionReason: item.rejection_reason,
    }));
}

export async function getUserWithdrawals(): Promise<Withdrawal[]> {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId);
    
    if (error) {
        console.error("Error fetching user withdrawals:", error);
        return [];
    }
    
    return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        amount: item.amount,
        status: item.status,
        paymentMethod: item.payment_method,
        withdrawalDetails: item.withdrawal_details,
        requestedAt: new Date(item.requested_at),
        completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
        txId: item.tx_id,
        rejectionReason: item.rejection_reason,
        previousWithdrawalDetails: item.previous_withdrawal_details,
    }));
}

export async function getAdminDashboardStats() {
    const user = await getAuthenticatedUser();
    const supabase = await createAdminClient();
    
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (userData?.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
    }
    
    const { data: commissions } = await supabase
        .from('cashback_transactions')
        .select('cashback_amount')
        .in('source_type', ['cashback', 'store_purchase']);
    
    const totalReferralCommissions = (commissions || []).reduce((sum, c) => sum + (c.cashback_amount || 0), 0);
    
    const { data: orders } = await supabase
        .from('orders')
        .select('product_price, status');
    
    const totalStoreSpending = (orders || [])
        .filter(o => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + (o.product_price || 0), 0);
    
    const { data: allCashback } = await supabase
        .from('cashback_transactions')
        .select('cashback_amount');
    
    const totalCashbackAdded = (allCashback || []).reduce((sum, c) => sum + (c.cashback_amount || 0), 0);
    
    return {
        totalReferralCommissions,
        totalStoreSpending,
        totalCashbackAdded,
    };
}

export async function getUserReferralData() {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    const supabase = await createAdminClient();
    
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, referral_code')
        .eq('id', userId)
        .single();
    
    if (userError || !userData) {
        throw new Error('User not found');
    }
    
    const { data: referrals } = await supabase
        .from('users')
        .select('id, name, created_at, status')
        .eq('referred_by', userId);
    
    const referralsList = (referrals || []).map(r => ({
        id: r.id,
        name: r.name,
        createdAt: new Date(r.created_at),
        status: r.status,
    }));
    
    // Fetch referral commissions from the ledger transactions table
    const { data: ledgerCommissions, error: ledgerError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .in('type', ['referral_commission', 'referral_reversal'])
        .order('created_at', { ascending: false });
    
    if (ledgerError) {
        console.error('Error fetching referral commissions from ledger:', ledgerError);
    }
    
    // Get current month boundaries for loyalty calculation
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Calculate total commission (all time) and monthly commission (current month only)
    let totalCommission = 0;
    let monthlyCommission = 0;
    
    (ledgerCommissions || []).forEach(tx => {
        const isReversal = tx.type === 'referral_reversal';
        const amount = isReversal ? -Math.abs(parseFloat(tx.amount)) : parseFloat(tx.amount);
        totalCommission += amount;
        
        // Check if transaction is in current month for loyalty purposes
        const txDate = new Date(tx.created_at);
        if (txDate >= monthStart && txDate <= monthEnd) {
            monthlyCommission += amount;
        }
    });
    
    // Group commissions by source_user_id for per-user earnings lookup
    const earningsByUser: Record<string, number> = {};
    (ledgerCommissions || []).forEach(tx => {
        const metadata = tx.metadata || {};
        const sourceUserId = metadata.source_user_id;
        if (sourceUserId) {
            const isReversal = tx.type === 'referral_reversal';
            const amount = isReversal ? -Math.abs(parseFloat(tx.amount)) : parseFloat(tx.amount);
            earningsByUser[sourceUserId] = (earningsByUser[sourceUserId] || 0) + amount;
        }
    });
    
    return {
        userProfile: {
            id: userData.id,
            referralCode: userData.referral_code,
            referrals: referralsList.map(r => r.id),
        },
        referrals: referralsList,
        totalCommission,
        monthlyCommission,
        earningsByUser,
    };
}

export async function getEnabledOffers() {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('is_enabled', true);
    
    if (error) {
        console.error("Error fetching offers:", error);
        return [];
    }
    
    return data || [];
}

export async function submitTradingAccount(
    brokerId: string,
    brokerName: string,
    accountNumber: string
): Promise<{ success: boolean; message: string }> {
    const user = await getAuthenticatedUser();
    const userId = user.id;
    
    const normalizedAccountNumber = accountNumber.trim();
    
    try {
        const supabase = await createAdminClient();
        
        const { data: existing, error: checkError } = await supabase
            .from('trading_accounts')
            .select('id')
            .eq('broker', brokerName)
            .eq('account_number', normalizedAccountNumber)
            .single();
        
        if (existing) {
            return {
                success: false,
                message: 'رقم حساب التداول هذا مرتبط بالفعل لهذا الوسيط.'
            };
        }
        
        const { error: insertError } = await supabase
            .from('trading_accounts')
            .insert({
                user_id: userId,
                broker: brokerName,
                account_number: normalizedAccountNumber,
                status: 'Pending',
                created_at: new Date().toISOString(),
            });
        
        if (insertError) {
            throw insertError;
        }
        
        return {
            success: true,
            message: 'تم تقديم حساب التداول الخاص بك للموافقة.'
        };
    } catch (error) {
        console.error('Error submitting trading account:', error);
        return {
            success: false,
            message: 'حدثت مشكلة أثناء تقديم حسابك. يرجى المحاولة مرة أخرى.'
        };
    }
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching blog posts:", error);
        return [];
    }

    return (data || []).map(item => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        content: item.content,
        excerpt: item.excerpt || '',
        author: item.author,
        isPublished: item.is_published,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
    }));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const supabase = await createClient();
    const { data, error} = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

    if (error || !data) {
        return null;
    }

    return {
        id: data.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt || '',
        author: data.author,
        isPublished: data.is_published,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
    };
}

export async function addBlogPost(data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('blog_posts')
            .insert({
                title: data.title,
                slug: data.slug,
                content: data.content,
                excerpt: data.excerpt,
                author: data.author,
                is_published: data.isPublished,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        
        if (error) throw error;
        return { success: true, message: 'تم إنشاء المقال بنجاح.' };
    } catch (error) {
        console.error("Error adding blog post:", error);
        return { success: false, message: 'فشل إنشاء المقال.' };
    }
}

export async function updateBlogPost(id: string, data: Partial<Omit<BlogPost, 'id' | 'createdAt'>>) {
    try {
        const supabase = await createClient();
        const updateData: any = {
            updated_at: new Date().toISOString(),
        };
        
        if (data.title !== undefined) updateData.title = data.title;
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.content !== undefined) updateData.content = data.content;
        if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
        if (data.author !== undefined) updateData.author = data.author;
        if (data.isPublished !== undefined) updateData.is_published = data.isPublished;
        
        const { error } = await supabase
            .from('blog_posts')
            .update(updateData)
            .eq('id', id);
        
        if (error) throw error;
        return { success: true, message: 'تم تحديث المقال بنجاح.' };
    } catch (error) {
        console.error("Error updating blog post:", error);
        return { success: false, message: 'فشل تحديث المقال.' };
    }
}

export async function deleteBlogPost(id: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return { success: true, message: 'تم حذف المقال بنجاح.' };
    } catch (error) {
        console.error("Error deleting blog post:", error);
        return { success: false, message: 'فشل حذف المقال.' };
    }
}
