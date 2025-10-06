
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getContactSettings, updateContactSettings } from "./actions";
import { Loader2, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";
import type { ContactSettings } from "@/types";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
    email: z.string().email("بريد إلكتروني غير صالح."),
    phone: z.string().min(5, "رقم هاتف غير صالح."),
    address: z.string().min(10, "العنوان قصير جدًا."),
    social: z.object({
        facebook: z.string().url().or(z.literal('')),
        twitter: z.string().url().or(z.literal('')),
        instagram: z.string().url().or(z.literal('')),
        whatsapp: z.string().url().or(z.literal('')),
        telegram: z.string().url().or(z.literal('')),
    }),
});

type FormData = z.infer<typeof formSchema>;

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M16.75 13.96c.25.58.11 1.25-.37 1.62l-1.43.93c-.23.16-.54.2-.8.09c-.66-.27-1.39-.68-2.09-1.22c-.75-.58-1.38-1.29-1.89-2.07c-.16-.25-.13-.59.08-.81l.93-1.43c.37-.48 1.04-.62 1.62-.37l1.93.83c.58.25.86.9.61 1.48l-.53 1.21zM12 2a10 10 0 0 0-10 10a10 10 0 0 0 10 10c.39 0 .78-.04 1.15-.09l3.85 1.19l-1.19-3.85A9.9 9.9 0 0 0 22 12a10 10 0 0 0-10-10z"></path></svg>
);

const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M22 12A10 10 0 0 0 12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10c.39 0 .78-.04 1.15-.09l3.85 1.19l-1.19-3.85A9.9 9.9 0 0 0 22 12m-9.01-1.13l-4.22 1.61c-.5.19-.51.52-.03.7l1.75.54l.54 1.75c.18.48.51.47.7.03l1.61-4.22c.19-.5-.04-.84-.55-.61M14.26 14l-2.61-2.61l.96-.97l3.62 3.63l-.97.95z"></path></svg>
);


export default function ManageContactPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            phone: "",
            address: "",
            social: { facebook: "", twitter: "", instagram: "", whatsapp: "", telegram: "" },
        },
    });

    useEffect(() => {
        async function fetchSettings() {
            setIsLoading(true);
            try {
                const settings = await getContactSettings();
                form.reset(settings);
            } catch (error) {
                toast({ variant: "destructive", title: "خطأ", description: "تعذر جلب إعدادات الاتصال." });
            } finally {
                setIsLoading(false);
            }
        }
        fetchSettings();
    }, [form, toast]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        const result = await updateContactSettings(data);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-6 max-w-3xl">
            <PageHeader 
                title="إدارة معلومات الاتصال"
                description="تحديث تفاصيل الاتصال وروابط وسائل التواصل الاجتماعي المعروضة على موقعك."
            />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader><CardTitle>معلومات الاتصال الأساسية</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>البريد الإلكتروني</FormLabel><div className="relative"><Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input {...field} className="pr-10"/></div><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>الهاتف</FormLabel><div className="relative"><Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input {...field} className="pr-10"/></div><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>العنوان</FormLabel><div className="relative"><MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Textarea {...field} className="pr-10"/></div><FormMessage /></FormItem>)}/>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>روابط وسائل التواصل الاجتماعي والدعم</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="social.facebook" render={({ field }) => (<FormItem><FormLabel>Facebook</FormLabel><div className="relative"><Facebook className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input {...field} placeholder="https://facebook.com/..." className="pr-10"/></div><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="social.twitter" render={({ field }) => (<FormItem><FormLabel>Twitter / X</FormLabel><div className="relative"><Twitter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input {...field} placeholder="https://twitter.com/..." className="pr-10"/></div><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="social.instagram" render={({ field }) => (<FormItem><FormLabel>Instagram</FormLabel><div className="relative"><Instagram className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input {...field} placeholder="https://instagram.com/..." className="pr-10"/></div><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="social.whatsapp" render={({ field }) => (<FormItem><FormLabel>WhatsApp</FormLabel><div className="relative"><WhatsAppIcon /><Input {...field} placeholder="https://wa.me/..." className="pr-10"/></div><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="social.telegram" render={({ field }) => (<FormItem><FormLabel>Telegram</FormLabel><div className="relative"><TelegramIcon /><Input {...field} placeholder="https://t.me/..." className="pr-10"/></div><FormMessage /></FormItem>)}/>
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        حفظ الإعدادات
                    </Button>
                </form>
            </Form>
        </div>
    );
}
