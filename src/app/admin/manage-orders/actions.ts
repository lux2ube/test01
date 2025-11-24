"use server";

import { createAdminClient } from '@/lib/supabase/server';
import type { Order } from '@/types';
import { awardReferralCommission } from '../actions';

export async function getAllOrders(): Promise<Order[]> {
    try {
        const supabase = await createAdminClient();
        
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching all orders:", error);
            throw new Error("Failed to fetch orders");
        }

        return (data || []).map(order => ({
            id: order.id,
            userId: order.user_id,
            productId: order.product_id,
            productName: order.product_name,
            productImage: order.product_image,
            price: order.product_price,
            deliveryPhoneNumber: order.delivery_phone_number,
            status: order.status,
            createdAt: new Date(order.created_at),
            userEmail: order.user_email,
            userName: order.user_name,
            referralCommissionAwarded: order.referral_commission_awarded || false,
            referralCommissionTransactionId: order.referral_commission_transaction_id || null,
        })) as Order[];
    } catch (error) {
        console.error("Error fetching all orders:", error);
        throw new Error("Failed to fetch orders");
    }
}

export async function updateOrderStatus(orderId: string, status: Order['status']) {
    try {
        const supabase = await createAdminClient();
        
        const { data: orderData, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (fetchError || !orderData) {
            throw new Error("لم يتم العثور على الطلب.");
        }

        const order = {
            id: orderData.id,
            userId: orderData.user_id,
            productId: orderData.product_id,
            productName: orderData.product_name,
            productImage: orderData.product_image,
            price: orderData.product_price,
            deliveryPhoneNumber: orderData.delivery_phone_number,
            status: orderData.status,
            createdAt: new Date(orderData.created_at),
            userEmail: orderData.user_email,
            userName: orderData.user_name,
            referralCommissionAwarded: orderData.referral_commission_awarded || false,
            referralCommissionTransactionId: orderData.referral_commission_transaction_id || null,
        } as Order;

        // Validate status transition rules
        if (order.status === 'Confirmed' && status === 'Cancelled') {
            throw new Error('لا يمكن إلغاء طلب تم تأكيده.');
        }
        
        if (order.status === 'Cancelled' && status === 'Confirmed') {
            throw new Error('لا يمكن تأكيد طلب ملغى.');
        }

        // Call ledger function to track order status change
        const { data: ledgerResult, error: ledgerError } = await supabase.rpc('ledger_change_order_status', {
            p_user_id: order.userId,
            p_reference_id: orderId,
            p_old_status: order.status,
            p_new_status: status,
            p_amount: order.price,
            p_metadata: { product_name: order.productName },
            p_actor_id: null,
            p_actor_action: 'admin_change_order_status'
        });

        if (ledgerError) {
            throw new Error(`فشل تحديث النظام المحاسبي: ${ledgerError.message}`);
        }

        if (!ledgerResult || ledgerResult.length === 0 || !ledgerResult[0].success) {
            const errorMsg = ledgerResult?.[0]?.error_message || 'فشل تحديث النظام المحاسبي';
            throw new Error(errorMsg);
        }

        let updateData: Record<string, any> = { status };

        // Award referral commission when order is confirmed
        if (status === 'Confirmed' && !order.referralCommissionAwarded) {
            const commissionResult = await awardReferralCommission(order.userId, 'store_purchase', order.price);
            if (commissionResult.success && commissionResult.transactionId) {
                updateData.referral_commission_awarded = true;
                updateData.referral_commission_transaction_id = commissionResult.transactionId;
                console.log(`✅ Referral commission transaction saved: ${commissionResult.transactionId}`);
            }
        } else if (status === 'Cancelled' && order.referralCommissionAwarded && order.referralCommissionTransactionId) {
            // Reverse the referral commission using the stored transaction ID
            const { reverseReferralCommissionInLedger } = await import('@/app/actions/ledger');
            const reversalResult = await reverseReferralCommissionInLedger(
                order.userId,
                order.price,
                order.referralCommissionTransactionId,
                {
                    order_id: orderId,
                    product_name: order.productName,
                    reason: 'Order cancelled'
                }
            );
            
            if (reversalResult.success) {
                updateData.referral_commission_awarded = false;
                updateData.referral_commission_transaction_id = null;
                console.log(`✅ Referral commission reversed for order: ${orderId}`);
            } else {
                console.error('Failed to reverse referral commission:', reversalResult.error);
            }
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (updateError) {
            throw new Error("فشل تحديث حالة الطلب.");
        }

        const message = `تم تحديث حالة طلبك لـ "${order.productName}" إلى ${status}.`;
        const { error: notifError } = await supabase
            .from('notifications')
            .insert({
                user_id: order.userId,
                message,
                type: 'store',
                link: '/dashboard/store/orders',
                is_read: false,
                created_at: new Date().toISOString(),
            });

        if (notifError) {
            console.error("Error creating notification:", notifError);
        }

        return { success: true, message: 'تم تحديث حالة الطلب.' };
    } catch (error) {
        console.error("Error updating order status:", error);
        const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف";
        return { success: false, message: `فشل تحديث حالة الطلب: ${errorMessage}` };
    }
}
