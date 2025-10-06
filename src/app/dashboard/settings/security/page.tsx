
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Loader2, Lock, KeyRound, ArrowLeft } from "lucide-react";

const passwordSchema = z.object({
    currentPassword: z.string().min(8, "يجب أن تكون كلمة المرور 8 أحرف على الأقل."),
    newPassword: z.string().min(8, "يجب أن تكون كلمة المرور 8 أحرف على الأقل."),
    confirmPassword: z.string().min(8, "يجب أن تكون كلمة المرور 8 أحرف على الأقل."),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "كلمات المرور الجديدة غير متطابقة.",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SecurityPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const handlePasswordSubmit = async (values: PasswordFormValues) => {
        setIsPasswordSubmitting(true);
        
        try {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user?.email) {
                toast({ 
                    variant: "destructive", 
                    title: "خطأ", 
                    description: "لم يتم العثور على المستخدم." 
                });
                return;
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: values.currentPassword,
            });

            if (signInError) {
                toast({ 
                    variant: "destructive", 
                    title: "خطأ", 
                    description: "كلمة المرور الحالية غير صحيحة." 
                });
                return;
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: values.newPassword,
            });

            if (updateError) {
                toast({ 
                    variant: "destructive", 
                    title: "خطأ", 
                    description: "فشل تحديث كلمة المرور. حاول مرة أخرى." 
                });
                return;
            }

            toast({ 
                title: "تم بنجاح!", 
                description: "تم تحديث كلمة المرور بنجاح." 
            });
            
            passwordForm.reset();
        } catch (error: any) {
            console.error('Password change error:', error);
            toast({ 
                variant: "destructive", 
                title: "خطأ", 
                description: "حدث خطأ غير متوقع." 
            });
        } finally {
            setIsPasswordSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                العودة إلى الإعدادات
            </Button>
            <PageHeader title="مركز الأمان" description="إدارة كلمة المرور وأمان الحساب." />

            {/* Change Password Card */}
            <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">تغيير كلمة المرور</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>كلمة المرور الحالية</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type="password" {...field} className="pl-10" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={passwordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>كلمة المرور الجديدة</FormLabel>
                                        <FormControl>
                                             <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type="password" {...field} className="pl-10" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={passwordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                                        <FormControl>
                                             <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type="password" {...field} className="pl-10" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                         <CardFooter className="p-4 pt-0 justify-end">
                            <Button type="submit" size="sm" disabled={isPasswordSubmitting}>
                                {isPasswordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                تحديث كلمة المرور
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>

            {/* 2FA Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">المصادقة الثنائية (2FA)</CardTitle>
                    <CardDescription className="text-xs">أضف طبقة إضافية من الأمان إلى حسابك.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                         <div className="space-y-0.5">
                            <p className="font-medium">تطبيق المصادقة</p>
                            <p className="text-xs text-muted-foreground">الحالة: معطل</p>
                        </div>
                        <Switch />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
