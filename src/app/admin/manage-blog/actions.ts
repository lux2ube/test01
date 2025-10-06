'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { BlogPost } from '@/types';

export async function getAllBlogPosts(): Promise<BlogPost[]> {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false});

    if (error) {
        console.error("Error fetching blog posts:", error);
        return [];
    }

    return data.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || '',
        author: post.author,
        isPublished: post.is_published,
        createdAt: new Date(post.created_at),
        updatedAt: new Date(post.updated_at),
    })) as BlogPost[];
}

export async function addBlogPost(data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
        const supabase = await createAdminClient();
        const now = new Date().toISOString();
        
        const { error } = await supabase
            .from('blog_posts')
            .insert({
                title: data.title,
                slug: data.slug,
                content: data.content,
                excerpt: data.excerpt,
                author: data.author,
                is_published: data.isPublished,
                created_at: now,
                updated_at: now,
            });

        if (error) {
            console.error("Error adding blog post:", error);
            return { success: false, message: 'فشل إنشاء المقال.' };
        }

        return { success: true, message: 'تم إنشاء المقال بنجاح.' };
    } catch (error) {
        console.error("Error adding blog post:", error);
        return { success: false, message: 'فشل إنشاء المقال.' };
    }
}

export async function updateBlogPost(id: string, data: Partial<Omit<BlogPost, 'id' | 'createdAt'>>) {
    try {
        const supabase = await createAdminClient();
        const now = new Date().toISOString();
        
        const updateData: any = {
            updated_at: now,
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

        if (error) {
            console.error("Error updating blog post:", error);
            return { success: false, message: 'فشل تحديث المقال.' };
        }

        return { success: true, message: 'تم تحديث المقال بنجاح.' };
    } catch (error) {
        console.error("Error updating blog post:", error);
        return { success: false, message: 'فشل تحديث المقال.' };
    }
}

export async function deleteBlogPost(id: string) {
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting blog post:", error);
            return { success: false, message: 'فشل حذف المقال.' };
        }

        return { success: true, message: 'تم حذف المقال بنجاح.' };
    } catch (error) {
        console.error("Error deleting blog post:", error);
        return { success: false, message: 'فشل حذف المقال.' };
    }
}
