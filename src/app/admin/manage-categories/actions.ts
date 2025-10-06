"use server";

import { createAdminClient } from '@/lib/supabase/server';
import type { ProductCategory } from '@/types';

export async function addCategory(data: Omit<ProductCategory, 'id'>) {
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from('product_categories')
            .insert(data);

        if (error) {
            console.error("Error adding category:", error);
            return { success: false, message: 'فشل إضافة الفئة.' };
        }

        return { success: true, message: 'تمت إضافة الفئة بنجاح.' };
    } catch (error) {
        console.error("Error adding category:", error);
        return { success: false, message: 'فشل إضافة الفئة.' };
    }
}

export async function updateCategory(id: string, data: Partial<ProductCategory>) {
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from('product_categories')
            .update(data)
            .eq('id', id);

        if (error) {
            console.error("Error updating category:", error);
            return { success: false, message: 'فشل تحديث الفئة.' };
        }

        return { success: true, message: 'تم تحديث الفئة بنجاح.' };
    } catch (error) {
        console.error("Error updating category:", error);
        return { success: false, message: 'فشل تحديث الفئة.' };
    }
}

export async function deleteCategory(id: string) {
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from('product_categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting category:", error);
            return { success: false, message: 'فشل حذف الفئة.' };
        }

        return { success: true, message: 'تم حذف الفئة بنجاح.' };
    } catch (error) {
        console.error("Error deleting category:", error);
        return { success: false, message: 'فشل حذف الفئة.' };
    }
}
