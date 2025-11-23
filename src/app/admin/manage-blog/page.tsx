
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "slugify";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/hooks/useAuthContext";
import { getAllBlogPosts, addBlogPost, updateBlogPost, deleteBlogPost } from "./actions";
import { PlusCircle, Loader2, Type, Link as LinkIcon, Tag, AlignLeft, FileText } from "lucide-react";
import type { BlogPost } from "@/types";
import { DataTable } from "@/components/data-table/data-table";
import { getColumns } from "./columns";

const formSchema = z.object({
  title: z.string().min(3, "يجب أن يكون العنوان 3 أحرف على الأقل."),
  excerpt: z.string().min(10, "يجب أن يكون المقتطف 10 أحرف على الأقل.").max(200, "يجب أن يكون المقتطف 200 حرف أو أقل."),
  content: z.string().min(50, "يجب أن يكون المحتوى 50 حرفًا على الأقل."),
  imageUrl: z.string().url("يجب أن يكون عنوان URL صالحًا للصورة."),
  status: z.enum(['draft', 'published']),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

function PostForm({ post, onSuccess, onCancel }: { post?: BlogPost | null; onSuccess: () => void; onCancel: () => void; }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuthContext();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: post ? {
            ...post,
            tags: post.tags?.join(', '),
        } : {
            title: "",
            excerpt: "",
            content: "",
            imageUrl: `https://placehold.co/1200x630.png`,
            status: "draft",
            tags: "",
        },
    });

    const onSubmit = async (data: FormData) => {
        if (!user || !user.profile) return;
        setIsSubmitting(true);
        const slug = slugify(data.title, { lower: true, strict: true });
        const payload = {
            ...data,
            slug,
            tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
            authorName: user.profile.name,
            authorId: user.id,
        };

        const result = post
            ? await updateBlogPost(post.id, payload)
            : await addBlogPost(payload);

        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            onSuccess();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                        <FormLabel>العنوان</FormLabel>
                        <FormControl>
                             <div className="relative">
                                <Type className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} className="pr-10" />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="excerpt" render={({ field }) => (
                    <FormItem>
                        <FormLabel>مقتطف</FormLabel>
                        <FormControl>
                             <div className="relative">
                                <AlignLeft className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Textarea {...field} className="pr-10" />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="content" render={({ field }) => (
                     <FormItem>
                        <FormLabel>المحتوى (ماركداون)</FormLabel>
                        <FormControl>
                             <div className="relative">
                                <FileText className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Textarea className="min-h-48 pr-10" {...field} />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>رابط الصورة البارزة</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} className="pr-10" />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="tags" render={({ field }) => (
                    <FormItem>
                        <FormLabel>الوسوم (مفصولة بفواصل)</FormLabel>
                        <FormControl>
                             <div className="relative">
                                <Tag className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} className="pr-10" />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>الحالة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="draft">مسودة</SelectItem><SelectItem value="published">منشور</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>

                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={onCancel}>إلغاء</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        {post ? "حفظ التغييرات" : "إنشاء مقال"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

export default function ManageBlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const data = await getAllBlogPosts();
            setPosts(data);
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "تعذر جلب المقالات." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        const result = await deleteBlogPost(deletingId);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            fetchPosts();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsAlertOpen(false);
        setDeletingId(null);
    };

    const handleDeleteRequest = (id: string) => {
        setDeletingId(id);
        setIsAlertOpen(true);
    };

    const handleEdit = (post: BlogPost) => {
        setEditingPost(post);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingPost(null);
        setIsFormOpen(true);
    }
    
    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingPost(null);
        fetchPosts();
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        setEditingPost(null);
    }
    
    const authors = useMemo(() => {
        const authorSet = new Set(posts.map(p => p.authorName));
        return Array.from(authorSet).map(name => ({ value: name, label: name }));
    }, [posts]);

    const columns = useMemo(() => getColumns(handleEdit, handleDeleteRequest), []);

    if (isLoading) {
        return <div className="container mx-auto flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex justify-between items-start">
                <PageHeader
                    title="إدارة المدونة"
                    description="إنشاء وتحرير ونشر المقالات."
                />
                <Button onClick={handleAdd}>
                    <PlusCircle className="ml-2 h-4 w-4" /> إضافة مقال
                </Button>
            </div>

            <DataTable 
                columns={columns} 
                data={posts}
                searchableColumns={[{id: 'title', title: 'العنوان'}]}
                filterableColumns={[
                     {
                      id: 'status',
                      title: 'الحالة',
                      options: [
                        { value: 'draft', label: 'مسودة' },
                        { value: 'published', label: 'منشور' },
                      ],
                    },
                    {
                      id: 'authorName',
                      title: 'المؤلف',
                      options: authors,
                    }
                ]}
            />
            
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                 <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPost ? "تعديل" : "إضافة"} مقال جديد</DialogTitle>
                    </DialogHeader>
                    <div className="p-1">
                        <PostForm 
                            post={editingPost}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>سيؤدي هذا إلى حذف هذا المقال بشكل دائم.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>حذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
