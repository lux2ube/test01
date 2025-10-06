
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getOffers, updateOffer, addOffer, deleteOffer } from "./actions";
import { getClientLevels } from "@/app/actions";
import { PlusCircle, Loader2, Edit, Trash2, Link as LinkIcon, Code, Megaphone, Target, Gem, Globe, UserCheck } from "lucide-react";
import type { Offer, ClientLevel } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { countries } from "@/lib/countries";
import { MultiSelect } from "@/components/ui/multi-select";

const formSchema = z.object({
    title: z.string().min(3, "العنوان قصير جدًا."),
    description: z.string().optional(),
    type: z.enum(['script', 'text']),
    ctaText: z.string().optional(),
    ctaLink: z.string().url({ message: "الرجاء إدخال رابط صالح" }).or(z.literal('')).optional(),
    scriptCode: z.string().optional(),
    isEnabled: z.boolean(),
    targetLevels: z.array(z.string()).optional(),
    targetCountries: z.array(z.string()).optional(),
    targetStatuses: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

function OfferForm({ offer, onSuccess, onCancel, clientLevels }: { offer?: Offer | null; onSuccess: () => void; onCancel: () => void; clientLevels: ClientLevel[] }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: offer ? {
            ...offer,
            description: offer.description || "",
        } : {
            title: "",
            description: "",
            type: 'text',
            ctaText: "اعرف المزيد",
            ctaLink: "",
            scriptCode: "",
            isEnabled: true,
            targetLevels: [],
            targetCountries: [],
            targetStatuses: [],
        },
    });

    const offerType = form.watch('type');

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        const result = offer
            ? await updateOffer(offer.id, data)
            : await addOffer(data as Omit<Offer, 'id'>);

        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            onSuccess();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    };

    const levelOptions = clientLevels.map(level => ({ value: String(level.id), label: level.name }));
    const countryOptions = countries.map(country => ({ value: country.code, label: country.name }));
    const statusOptions = [
        { value: 'NEW', label: 'جديد' },
        { value: 'Active', label: 'نشط' },
        { value: 'Trader', label: 'متداول' },
    ];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="isEnabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>تفعيل العرض</FormLabel><FormDescription>سيظهر هذا العرض للمستخدمين المستهدفين.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>العنوان</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>نوع العرض</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="text"><div className="flex items-center gap-2"><Megaphone/> نصي مع زر</div></SelectItem>
                                <SelectItem value="script"><div className="flex items-center gap-2"><Code/> كود مخصص</div></SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                    )}
                />
                {offerType === 'text' && (
                    <div className="space-y-4 p-4 border rounded-md">
                        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>الوصف/النص</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="ctaText" render={({ field }) => (<FormItem><FormLabel>نص الزر (CTA)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="ctaLink" render={({ field }) => (<FormItem><FormLabel>رابط الزر (CTA)</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    </div>
                )}
                {offerType === 'script' && (
                    <FormField control={form.control} name="scriptCode" render={({ field }) => (<FormItem><FormLabel>كود السكريبت</FormLabel><FormControl><Textarea className="min-h-[150px] font-mono text-xs" {...field} /></FormControl><FormDescription>أدخل وسم السكريبت الكامل للعرض.</FormDescription><FormMessage /></FormItem>)}/>
                )}
                
                 <Separator />
                 <h3 className="text-lg font-medium flex items-center gap-2"><Target/> استهداف الجمهور</h3>
                <FormField control={form.control} name="targetLevels" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Gem className="h-4 w-4"/>استهداف حسب المستوى</FormLabel><MultiSelect options={levelOptions} selected={field.value || []} onChange={field.onChange} placeholder="اختر المستويات..."/><FormDescription>اختر المستويات التي سيظهر لها العرض. اتركه فارغًا للجميع.</FormDescription><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="targetCountries" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4"/>استهداف حسب الدولة</FormLabel><MultiSelect options={countryOptions} selected={field.value || []} onChange={field.onChange} placeholder="اختر الدول..."/><FormDescription>اختر الدول التي سيظهر لها العرض. اتركه فارغًا للجميع.</FormDescription><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="targetStatuses" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><UserCheck className="h-4 w-4"/>استهداف حسب حالة المستخدم</FormLabel><MultiSelect options={statusOptions} selected={field.value || []} onChange={field.onChange} placeholder="اختر الحالات..."/><FormDescription>اختر حالات المستخدم التي سيظهر لها العرض. اتركه فارغًا للجميع.</FormDescription><FormMessage /></FormItem>)}/>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={onCancel}>إلغاء</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        {offer ? "حفظ التغييرات" : "إنشاء عرض"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

export default function ManageOffersPage() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [clientLevels, setClientLevels] = useState<ClientLevel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const { toast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [offersData, levelsData] = await Promise.all([getOffers(), getClientLevels()]);
            setOffers(offersData);
            setClientLevels(levelsData);
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "تعذر جلب البيانات." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        const result = await deleteOffer(id);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            fetchData();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
    };

    const handleEdit = (offer: Offer) => {
        setEditingOffer(offer);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingOffer(null);
        setIsFormOpen(true);
    };
    
    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingOffer(null);
        fetchData();
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        setEditingOffer(null);
    };

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex justify-between items-start">
                <PageHeader
                    title="إدارة العروض"
                    description="إنشاء وتحرير العروض المعروضة في لوحة تحكم المستخدم."
                />
                <Button onClick={handleAdd}>
                    <PlusCircle className="ml-2 h-4 w-4" /> إضافة عرض
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>العروض الحالية</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>العنوان</TableHead>
                                    <TableHead>النوع</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead className="text-left">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {offers.map((offer) => (
                                    <TableRow key={offer.id}>
                                        <TableCell className="font-medium">{offer.title}</TableCell>
                                        <TableCell className="capitalize">{offer.type}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${offer.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{offer.isEnabled ? 'مفعل' : 'معطل'}</span>
                                        </TableCell>
                                        <TableCell className="text-left space-x-2">
                                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEdit(offer)}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="icon" variant="destructive" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle><AlertDialogDescription>سيؤدي هذا إلى حذف هذا العرض بشكل دائم.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(offer.id)}>حذف</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                 <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingOffer ? "تعديل" : "إضافة"} عرض جديد</DialogTitle>
                    </DialogHeader>
                    <div className="p-1">
                        <OfferForm 
                            offer={editingOffer}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                            clientLevels={clientLevels}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
