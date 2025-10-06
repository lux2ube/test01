"use server";

import { createAdminClient } from '@/lib/supabase/server';
import type { PaymentMethod } from '@/types';

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('name');

    if (error) {
        console.error("Error fetching payment methods:", error);
        return [];
    }

    return data.map(method => ({
        id: method.id,
        name: method.name,
        description: method.description,
        isEnabled: method.is_enabled,
        type: method.type,
        fields: method.fields,
    })) as PaymentMethod[];
}

export async function addPaymentMethod(data: Omit<PaymentMethod, 'id'>) {
    try {
        const supabase = await createAdminClient();
        
        const { error } = await supabase
            .from('payment_methods')
            .insert({
                name: data.name,
                description: data.description,
                is_enabled: data.isEnabled,
                type: data.type,
                fields: data.fields,
            });

        if (error) {
            console.error("Error adding payment method:", error);
            return { success: false, message: 'فشل إضافة طريقة الدفع.' };
        }

        return { success: true, message: 'تمت إضافة طريقة الدفع بنجاح.' };
    } catch (error) {
        console.error("Error adding payment method:", error);
        return { success: false, message: 'فشل إضافة طريقة الدفع.' };
    }
}

export async function updatePaymentMethod(id: string, data: Partial<PaymentMethod>) {
    try {
        const supabase = await createAdminClient();
        
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.isEnabled !== undefined) updateData.is_enabled = data.isEnabled;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.fields !== undefined) updateData.fields = data.fields;

        const { error } = await supabase
            .from('payment_methods')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error("Error updating payment method:", error);
            return { success: false, message: 'فشل تحديث طريقة الدفع.' };
        }

        return { success: true, message: 'تم تحديث طريقة الدفع بنجاح.' };
    } catch (error) {
        console.error("Error updating payment method:", error);
        return { success: false, message: 'فشل تحديث طريقة الدفع.' };
    }
}

export async function deletePaymentMethod(id: string) {
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from('payment_methods')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting payment method:", error);
            return { success: false, message: 'فشل حذف طريقة الدفع.' };
        }

        return { success: true, message: 'تم حذف طريقة الدفع بنجاح.' };
    } catch (error) {
        console.error("Error deleting payment method:", error);
        return { success: false, message: 'فشل حذف طريقة الدفع.' };
    }
}
