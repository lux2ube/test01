'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { Offer, UserProfile } from '@/types';
import { getServerSessionInfo } from '@/lib/server-session-info';


export async function addOffer(data: Omit<Offer, 'id'>) {
    try {
        const supabase = await createAdminClient();
        
        const { error } = await supabase
            .from('offers')
            .insert({
                title: data.title,
                description: data.description,
                is_enabled: data.isEnabled,
                type: data.type,
                cta_text: data.ctaText,
                cta_link: data.ctaLink,
                script_code: data.scriptCode,
                target_levels: data.targetLevels || [],
                target_countries: data.targetCountries || [],
                target_statuses: data.targetStatuses || [],
            });

        if (error) {
            console.error("Error adding offer:", error);
            return { success: false, message: 'فشل إضافة العرض.' };
        }

        return { success: true, message: 'تمت إضافة العرض بنجاح.' };
    } catch (error) {
        console.error("Error adding offer:", error);
        return { success: false, message: 'فشل إضافة العرض.' };
    }
}

export async function updateOffer(id: string, data: Partial<Omit<Offer, 'id'>>) {
    try {
        const supabase = await createAdminClient();
        
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.isEnabled !== undefined) updateData.is_enabled = data.isEnabled;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.ctaText !== undefined) updateData.cta_text = data.ctaText;
        if (data.ctaLink !== undefined) updateData.cta_link = data.ctaLink;
        if (data.scriptCode !== undefined) updateData.script_code = data.scriptCode;
        if (data.targetLevels !== undefined) updateData.target_levels = data.targetLevels;
        if (data.targetCountries !== undefined) updateData.target_countries = data.targetCountries;
        if (data.targetStatuses !== undefined) updateData.target_statuses = data.targetStatuses;

        const { error } = await supabase
            .from('offers')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error("Error updating offer:", error);
            return { success: false, message: 'فشل تحديث العرض.' };
        }

        return { success: true, message: 'تم تحديث العرض بنجاح.' };
    } catch (error) {
        console.error("Error updating offer:", error);
        return { success: false, message: 'فشل تحديث العرض.' };
    }
}

export async function deleteOffer(id: string) {
    try {
        const supabase = await createAdminClient();
        
        const { error } = await supabase
            .from('offers')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting offer:", error);
            return { success: false, message: 'فشل حذف العرض.' };
        }

        return { success: true, message: 'تم حذف العرض بنجاح.' };
    } catch (error) {
        console.error("Error deleting offer:", error);
        return { success: false, message: 'فشل حذف العرض.' };
    }
}

export async function getOffers(): Promise<Offer[]> {
    const supabase = await createAdminClient();
    
    const { data, error } = await supabase
        .from('offers')
        .select('*');

    if (error) {
        console.error("Error fetching offers:", error);
        return [];
    }

    return (data || []).map(offer => ({
        id: offer.id,
        title: offer.title,
        description: offer.description,
        isEnabled: offer.is_enabled,
        type: offer.type,
        ctaText: offer.cta_text,
        ctaLink: offer.cta_link,
        scriptCode: offer.script_code,
        targetLevels: offer.target_levels || [],
        targetCountries: offer.target_countries || [],
        targetStatuses: offer.target_statuses || [],
    })) as Offer[];
}

export async function getOffersForUser(user: UserProfile | undefined): Promise<Offer[]> {
    try {
        if (!user) return [];
        
        const { geoInfo } = await getServerSessionInfo();
        const userCountry = geoInfo.country;

        const supabase = await createAdminClient();
        
        const { data, error } = await supabase
            .from('offers')
            .select('*')
            .eq('is_enabled', true);

        if (error) {
            console.error("Error fetching offers:", error);
            return [];
        }
        
        const offers = (data || []).map(offer => ({
            id: offer.id,
            title: offer.title,
            description: offer.description,
            isEnabled: offer.is_enabled,
            type: offer.type,
            ctaText: offer.cta_text,
            ctaLink: offer.cta_link,
            scriptCode: offer.script_code,
            targetLevels: offer.target_levels || [],
            targetCountries: offer.target_countries || [],
            targetStatuses: offer.target_statuses || [],
        })) as Offer[];

        return offers.filter(offer => {
            const hasCountryTargeting = offer.targetCountries && offer.targetCountries.length > 0;
            const countryMatch = !hasCountryTargeting || (userCountry && offer.targetCountries!.includes(userCountry)) || !userCountry;
            
            const hasLevelTargeting = offer.targetLevels && offer.targetLevels.length > 0;
            const levelMatch = !hasLevelTargeting || offer.targetLevels!.includes(String(user.level));

            const hasStatusTargeting = offer.targetStatuses && offer.targetStatuses.length > 0;
            const statusMatch = !hasStatusTargeting || offer.targetStatuses!.includes(user.status);
            
            return countryMatch && levelMatch && statusMatch;
        });

    } catch (error) {
        console.error("Error fetching offers for user:", error);
        return [];
    }
}

