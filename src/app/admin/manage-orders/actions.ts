"use server";

import { createAdminClient } from '@/lib/supabase/server';
import type { Order } from '@/types';
import { awardReferralCommission, clawbackReferralCommission } from '../actions';

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
        } as Order;

        let updateData: any = { status };

        if (status === 'Delivered' && !order.referralCommissionAwarded) {
            await awardReferralCommission(order.userId, 'store_purchase', order.price);
            updateData.referral_commission_awarded = true;
        } else if (status === 'Cancelled' && order.referralCommissionAwarded) {
            await clawbackReferralCommission(order.userId, 'store_purchase', order.price);
            updateData.referral_commission_awarded = false;
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
