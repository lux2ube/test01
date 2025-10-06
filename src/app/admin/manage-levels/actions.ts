'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { ClientLevel } from '@/types';

export async function updateClientLevels(levels: ClientLevel[]) {
    try {
        const supabase = await createAdminClient();
        
        for (const level of levels) {
            const { id, ...levelData } = level;
            const { error } = await supabase
                .from('client_levels')
                .update(levelData)
                .eq('id', id);

            if (error) {
                console.error(`Error updating client level ${id}:`, error);
                return { success: false, message: 'فشل تحديث مستويات العملاء.' };
            }
        }

        return { success: true, message: 'تم تحديث مستويات العملاء بنجاح.' };
    } catch (error) {
        console.error("Error updating client levels:", error);
        return { success: false, message: 'فشل تحديث مستويات العملاء.' };
    }
}

export async function seedClientLevels(): Promise<{ success: boolean; message: string; }> {
    const supabase = await createAdminClient();
    
    const { data: existingLevels, error: fetchError } = await supabase
        .from('client_levels')
        .select('id')
        .limit(1);

    if (fetchError) {
        console.error("Error checking client levels:", fetchError);
        return { success: false, message: 'فشل التحقق من مستويات العملاء.' };
    }

    if (existingLevels && existingLevels.length > 0) {
        return { success: false, message: 'مستويات العملاء موجودة بالفعل.' };
    }

    const defaultLevels: Omit<ClientLevel, 'id'>[] = [
        { name: 'Bronze', required_total: 0, advantage_referral_cashback: 5, advantage_referral_store: 2, advantage_product_discount: 0 },
        { name: 'Silver', required_total: 100, advantage_referral_cashback: 7, advantage_referral_store: 4, advantage_product_discount: 2 },
        { name: 'Gold', required_total: 500, advantage_referral_cashback: 10, advantage_referral_store: 6, advantage_product_discount: 4 },
        { name: 'Platinum', required_total: 2000, advantage_referral_cashback: 15, advantage_referral_store: 8, advantage_product_discount: 6 },
        { name: 'Diamond', required_total: 10000, advantage_referral_cashback: 20, advantage_referral_store: 10, advantage_product_discount: 8 },
        { name: 'Ambassador', required_total: 50000, advantage_referral_cashback: 25, advantage_referral_store: 15, advantage_product_discount: 10 },
    ];

    try {
        const levelsToInsert = defaultLevels.map((level, index) => ({
            id: index + 1,
            ...level
        }));

        const { error } = await supabase
            .from('client_levels')
            .insert(levelsToInsert);

        if (error) {
            console.error("Error seeding client levels:", error);
            return { success: false, message: 'فشل إضافة مستويات العملاء الافتراضية.' };
        }

        return { success: true, message: 'تمت إضافة مستويات العملاء الافتراضية بنجاح.' };
    } catch (error) {
        console.error("Error seeding client levels:", error);
        return { success: false, message: 'فشل إضافة مستويات العملاء الافتراضية.' };
    }
}
