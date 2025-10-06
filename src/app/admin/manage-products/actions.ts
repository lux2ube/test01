"use server";

import { createAdminClient } from '@/lib/supabase/server';
import type { Product } from '@/types';

export async function addProduct(data: Omit<Product, 'id'>) {
    try {
        const supabase = await createAdminClient();
        
        const { error } = await supabase
            .from('products')
            .insert({
                name: data.name,
                description: data.description,
                price: data.price,
                image_url: data.imageUrl,
                category_id: data.categoryId,
                category_name: data.categoryName,
                stock: data.stock,
            });

        if (error) {
            console.error("Error adding product:", error);
            return { success: false, message: 'فشل إضافة المنتج.' };
        }

        return { success: true, message: 'تمت إضافة المنتج بنجاح.' };
    } catch (error) {
        console.error("Error adding product:", error);
        return { success: false, message: 'فشل إضافة المنتج.' };
    }
}

export async function updateProduct(id: string, data: Partial<Product>) {
    try {
        const supabase = await createAdminClient();
        
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
        if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
        if (data.categoryName !== undefined) updateData.category_name = data.categoryName;
        if (data.stock !== undefined) updateData.stock = data.stock;

        const { error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error("Error updating product:", error);
            return { success: false, message: 'فشل تحديث المنتج.' };
        }

        return { success: true, message: 'تم تحديث المنتج بنجاح.' };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, message: 'فشل تحديث المنتج.' };
    }
}

export async function deleteProduct(id: string) {
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting product:", error);
            return { success: false, message: 'فشل حذف المنتج.' };
        }

        return { success: true, message: 'تم حذف المنتج بنجاح.' };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, message: 'فشل حذف المنتج.' };
    }
}
