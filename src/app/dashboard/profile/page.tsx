
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthContext } from "@/hooks/useAuthContext";
import { Loader2, User, KeyRound, Copy, Star, Mail, ArrowLeft, Hash } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { updateUser } from "@/app/admin/users/actions";
import { getClientLevels } from "@/app/actions";
import { useRouter } from "next/navigation";
import type { ClientLevel } from "@/types";


const profileSchema = z.object({
    name: z.string().min(3, { message: "يجب أن يتكون الاسم من 3 أحرف على الأقل." }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { user, isLoading, refetchUserData } = useAuthContext();
    const router = useRouter();
    const { toast } = useToast();
    
    const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
    const [levels, setLevels] = useState<ClientLevel[]>([]);

    useEffect(() => {
        getClientLevels().then(setLevels);
    }, []);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        values: {
            name: user?.profile?.name || "",
        },
    });

    const handleProfileSubmit = async (values: ProfileFormValues) => {
        if (!user) return;
        setIsProfileSubmitting(true);
        // We removed the verifyAdmin check from this function
        const result = await updateUser(user.id, { name: values.name });
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            refetchUserData();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsProfileSubmitting(false);
    };
    
    const copyToClipboard = (text: string | number | undefined | null) => {
        if (text !== undefined && text !== null) {
            navigator.clipboard.writeText(String(text));
            toast({ title: 'تم النسخ!' });
        }
    }

    if (isLoading || !user || !user.profile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const { profile } = user;
    const levelName = levels.find(l => l.id === profile.level)?.name || 'New';

    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                العودة إلى الإعدادات
            </Button>
            <PageHeader title="تعديل الملف الشخصي" description="إدارة معلوماتك الشخصية." />

            <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-4xl bg-primary/20 text-primary font-bold">
                        {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                    </AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <h2 className="text-2xl font-bold">{profile.name}</h2>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <Badge variant="secondary" className="mt-2">
                        <Star className="mr-2 h-4 w-4 text-amber-500"/>
                        {levelName}
                    </Badge>
                </div>
            </div>

            {/* --- Personal Information Card --- */}
            <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">تحديث المعلومات</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField
                                control={profileForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>الاسم الكامل</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="اسمك الكامل" {...field} className="pl-10" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div>
                                <Label>البريد الإلكتروني</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input readOnly value={profile.email} className="pl-10 bg-muted/70" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 justify-end">
                            <Button type="submit" size="sm" disabled={isProfileSubmitting}>
                                {isProfileSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                حفظ التغييرات
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>

             {/* --- IDs Card --- */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">معرفات الحساب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>معرف العميل (Client ID)</Label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-grow">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input readOnly value={profile.clientId} className="font-mono text-sm pl-10" />
                            </div>
                            <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(profile.clientId)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label>رمز الإحالة الخاص بك</Label>
                        <div className="flex items-center gap-2">
                             <div className="relative flex-grow">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input readOnly value={profile.referralCode || 'N/A'} className="font-mono text-sm pl-10" />
                            </div>
                            <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(profile.referralCode)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
