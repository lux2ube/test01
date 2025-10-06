'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { FeedbackForm, FeedbackResponse, EnrichedFeedbackResponse } from '@/types';

export async function getFeedbackForms(): Promise<FeedbackForm[]> {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('feedback_forms')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching feedback forms:", error);
        return [];
    }

    return data.map(form => ({
        id: form.id,
        title: form.title,
        description: form.description,
        status: form.is_active ? 'active' : 'inactive',
        questions: form.questions,
        createdAt: new Date(form.created_at),
        responseCount: form.response_count,
    })) as FeedbackForm[];
}

export async function addFeedbackForm(data: Omit<FeedbackForm, 'id' | 'createdAt' | 'responseCount'>) {
    try {
        const supabase = await createAdminClient();
        const now = new Date().toISOString();
        
        const { error } = await supabase
            .from('feedback_forms')
            .insert({
                title: data.title,
                description: data.description,
                is_active: data.status === 'active',
                questions: data.questions,
                created_at: now,
                response_count: 0,
            });

        if (error) {
            console.error("Error adding feedback form:", error);
            return { success: false, message: 'فشل إنشاء النموذج.' };
        }

        return { success: true, message: 'تم إنشاء نموذج الملاحظات بنجاح.' };
    } catch (error) {
        console.error("Error adding feedback form:", error);
        return { success: false, message: 'فشل إنشاء النموذج.' };
    }
}

export async function updateFeedbackForm(id: string, data: Partial<Omit<FeedbackForm, 'id' | 'createdAt'>>) {
    try {
        const supabase = await createAdminClient();
        
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.status !== undefined) updateData.is_active = data.status === 'active';
        if (data.questions !== undefined) updateData.questions = data.questions;
        if (data.responseCount !== undefined) updateData.response_count = data.responseCount;

        const { error } = await supabase
            .from('feedback_forms')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error("Error updating feedback form:", error);
            return { success: false, message: 'فشل تحديث النموذج.' };
        }

        return { success: true, message: 'تم تحديث النموذج بنجاح.' };
    } catch (error) {
        console.error("Error updating feedback form:", error);
        return { success: false, message: 'فشل تحديث النموذج.' };
    }
}

export async function deleteFeedbackForm(id: string) {
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from('feedback_forms')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting feedback form:", error);
            return { success: false, message: 'فشل حذف النموذج.' };
        }

        return { success: true, message: 'تم حذف النموذج بنجاح.' };
    } catch (error) {
        console.error("Error deleting feedback form:", error);
        return { success: false, message: 'فشل حذف النموذج.' };
    }
}

export async function getFeedbackFormById(formId: string): Promise<FeedbackForm | null> {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('feedback_forms')
        .select('*')
        .eq('id', formId)
        .single();

    if (error || !data) {
        console.error("Error fetching feedback form:", error);
        return null;
    }

    return {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.is_active ? 'active' : 'inactive',
        questions: data.questions,
        createdAt: new Date(data.created_at),
        responseCount: data.response_count,
    } as FeedbackForm;
}

export async function getFeedbackResponses(formId: string): Promise<EnrichedFeedbackResponse[]> {
    const supabase = await createAdminClient();
    
    const { data: responses, error } = await supabase
        .from('feedback_responses')
        .select(`
            *,
            users (
                name
            )
        `)
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error("Error fetching feedback responses:", error);
        return [];
    }

    return responses.map(response => ({
        id: response.id,
        formId: response.form_id,
        userId: response.user_id,
        answers: response.responses,
        submittedAt: new Date(response.submitted_at),
        userName: response.users?.name || 'مستخدم غير معروف'
    })) as EnrichedFeedbackResponse[];
}
