
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getBannerSettings, updateBannerSettings } from "../actions";
import { getClientLevels } from "@/app/actions";
import { Loader2, Code, Megaphone, Target, Globe, Gem, UserCheck } from "lucide-react";
import type { BannerSettings, ClientLevel, UserStatus } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MultiSelect } from "@/components/ui/multi-select";
import { countries } from "@/lib/countries";

const formSchema = z.object({
    isEnabled: z.boolean(),
    type: z.enum(['script', 'text']),
    
    // Text Banner Fields
    title: z.string().optional(),
    text: z.string().optional(),
    ctaText: z.string().optional(),
    ctaLink: z.string().url().or(z.literal('')).optional(),
    
    // Script Banner Fields
    scriptCode: z.string().optional(),

    // Targeting Fields
    targetTiers: z.array(z.string()).optional(),
    targetCountries: z.array(z.string()).optional(),
    targetStatuses: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ManageBannerPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientLevels, setClientLevels] = useState<ClientLevel[]>([]);
    const { toast } = useToast();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            isEnabled: false,
            type: 'text',
            title: "",
            text: "",
            ctaText: "",
            ctaLink: "",
            scriptCode: "",
            targetTiers: [],
            targetCountries: [],
            targetStatuses: [],
        },
    });
    
    const bannerType = form.watch('type');

    useEffect(() => {
        async function fetchInitialData() {
            setIsLoading(true);
            try {
                const [settings, levels] = await Promise.all([
                    getBannerSettings(),
                    getClientLevels()
                ]);
                form.reset(settings);
                setClientLevels(levels);
            } catch (error) {
                toast({ variant: "destructive", title: "خطأ", description: "تعذر جلب الإعدادات الأولية." });
            } finally {
                setIsLoading(false);
            }
        }
        fetchInitialData();
    }, [form, toast]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        const result = await updateBannerSettings(data);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    };
    
    const levelOptions = clientLevels.map(level => ({ value: String(level.id), label: level.name }));
    const countryOptions = countries.map(country => ({ value: country.code, label: `${country.flag} ${country.nameAr}` }));
    const statusOptions: { value: UserStatus, label: string }[] = [
        { value: 'NEW', label: 'جديد' },
        { value: 'Active', label: 'نشط' },
        { value: 'Trader', label: 'متداول' },
    ];
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader 
                title="إدارة البانر"
                description="تحديث البانر الترويجي المعروض للمستخدمين."
            />

             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>الإعدادات العامة</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="isEnabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">تفعيل البانر</FormLabel>
                                            <FormDescription>
                                                قم بتشغيل هذا الخيار لعرض البانر للمستخدمين المستهدفين.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>محتوى البانر</CardTitle>
                            <CardDescription>
                                اختر نوع البانر الذي تريد عرضه.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>نوع البانر</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="text"><div className="flex items-center gap-2"><Megaphone/> بانر نصي مع زر</div></SelectItem>
                                            <SelectItem value="script"><div className="flex items-center gap-2"><Code/> بانر بكود مخصص</div></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                                )}
                            />

                            {bannerType === 'text' && (
                                <div className="space-y-4 p-4 border rounded-md">
                                    <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>العنوان</FormLabel><FormControl><Input placeholder="عرض حصري!" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField control={form.control} name="text" render={({ field }) => (<FormItem><FormLabel>النص</FormLabel><FormControl><Textarea placeholder="احصل على مكافأة 50$ عند إيداعك القادم." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="ctaText" render={({ field }) => (<FormItem><FormLabel>نص الزر (CTA)</FormLabel><FormControl><Input placeholder="اعرف المزيد" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="ctaLink" render={({ field }) => (<FormItem><FormLabel>رابط الزر (CTA)</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    </div>
                                </div>
                            )}

                             {bannerType === 'script' && (
                                <div className="space-y-4 p-4 border rounded-md">
                                    <FormField
                                        control={form.control}
                                        name="scriptCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>كود سكريبت البانر</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder='<script src="..."></script>'
                                                        className="min-h-[150px] font-mono text-xs"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    أدخل وسم السكريبت الكامل للبانر الإعلاني الخاص بك.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Target/> استهداف الجمهور</CardTitle>
                            <CardDescription>
                                حدد من سيرى هذا البانر. اتركه فارغًا لإظهاره للجميع.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="targetTiers" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Gem className="h-4 w-4"/>استهداف حسب المستوى</FormLabel><MultiSelect options={levelOptions} selected={field.value || []} onChange={field.onChange} placeholder="اختر المستويات..."/><FormDescription>اختر المستويات التي سيظهر لها البانر. اتركه فارغًا للجميع.</FormDescription><FormMessage /></FormItem>)}/>
                            <Separator/>
                            <FormField control={form.control} name="targetCountries" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4"/>استهداف حسب الدولة</FormLabel><MultiSelect options={countryOptions} selected={field.value || []} onChange={field.onChange} placeholder="اختر الدول..."/><FormDescription>اختر الدول التي سيظهر لها البانر. اتركه فارغًا للجميع.</FormDescription><FormMessage /></FormItem>)}/>
                            <Separator/>
                             <FormField control={form.control} name="targetStatuses" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><UserCheck className="h-4 w-4"/>استهداف حسب حالة المستخدم</FormLabel><MultiSelect options={statusOptions} selected={field.value || []} onChange={field.onChange} placeholder="اختر الحالات..."/><FormDescription>اختر حالات المستخدم التي سيظهر لها البانر. اتركه فارغًا للجميع.</FormDescription><FormMessage /></FormItem>)}/>
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
