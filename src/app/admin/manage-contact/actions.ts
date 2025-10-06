'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { ContactSettings } from '@/types';

const SETTINGS_DOC_ID = 'contact';

export async function getContactSettings(): Promise<ContactSettings> {
    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from('contact_settings')
            .select('*')
            .eq('id', SETTINGS_DOC_ID)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error("Error fetching contact settings:", error);
            throw new Error("Failed to fetch contact settings");
        }
        
        if (!data) {
            const defaultSettings: Omit<ContactSettings, 'id'> = {
                email: '',
                phone: '',
                address: '',
                social: {
                    facebook: '',
                    twitter: '',
                    instagram: '',
                    whatsapp: '',
                    telegram: '',
                },
            };
            
            const { error: insertError } = await supabase
                .from('contact_settings')
                .insert({
                    id: SETTINGS_DOC_ID,
                    ...defaultSettings,
                });

            if (insertError) {
                console.error("Error creating default contact settings:", insertError);
                throw new Error("Failed to create default contact settings");
            }
            
            return {
                id: SETTINGS_DOC_ID,
                ...defaultSettings,
            };
        }
        
        return {
            id: data.id,
            email: data.email,
            phone: data.phone,
            address: data.address,
            social: data.social,
        } as ContactSettings;
    } catch (error) {
        console.error("Error fetching contact settings:", error);
        throw new Error("Failed to fetch contact settings");
    }
}

export async function updateContactSettings(data: Omit<ContactSettings, 'id'>) {
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from('contact_settings')
            .update(data)
            .eq('id', SETTINGS_DOC_ID);

        if (error) {
            console.error("Error updating contact settings:", error);
            return { success: false, message: 'فشل تحديث إعدادات الاتصال.' };
        }

        return { success: true, message: 'تم تحديث إعدادات الاتصال بنجاح.' };
    } catch (error) {
        console.error("Error updating contact settings:", error);
        return { success: false, message: 'فشل تحديث إعدادات الاتصال.' };
    }
}
