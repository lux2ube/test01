"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getPaymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } from "./actions";
import { PlusCircle, Loader2, Edit, Trash2, GripVertical, Info, Wallet, Briefcase, Type } from "lucide-react";
import type { PaymentMethod, PaymentMethodField } from "@/types";
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
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/data-table/data-table";
import { getColumns } from "./columns";

const fieldSchema = z.object({
    name: z.string().min(2, "الاسم مطلوب"),
    label: z.string().min(2, "العنوان مطلوب"),
    type: z.enum(['text', 'number']),
    placeholder: z.string().optional(),
    validation: z.object({
        required: z.boolean(),
        minLength: z.coerce.number().optional(),
        maxLength: z.coerce.number().optional(),
        regex: z.string().optional(),
        regexErrorMessage: z.string().optional(),
    }),
});

const formSchema = z.object({
    name: z.string().min(2, "اسم الطريقة مطلوب"),
    description: z.string().min(5, "الوصف مطلوب"),
    isEnabled: z.boolean(),
    type: z.enum(['crypto', 'internal_transfer', 'trading_account']),
    fields: z.array(fieldSchema),
});

type FormData = z.infer<typeof formSchema>;

function PaymentMethodForm({ method, onSuccess, onCancel }: { method?: PaymentMethod | null; onSuccess: () => void; onCancel: () => void; }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: method ? {
            ...method,
        } : {
            name: "",
            description: "",
            isEnabled: true,
            type: 'crypto',
            fields: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "fields",
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        const result = method
            ? await updatePaymentMethod(method.id, data)
            : await addPaymentMethod(data);

        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            onSuccess();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    };

    const addNewField = () => {
        append({
            name: "",
            label: "",
            type: "text",
            placeholder: "",
            validation: { required: true, minLength: 0, maxLength: 0, regex: "", regexErrorMessage: "" },
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>اسم الطريقة</FormLabel>
                          <div className="relative">
                              <Type className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="مثال: USDT (TRC20)" {...field} className="pr-10" />
                          </div>
                        <FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem><FormLabel>النوع</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="اختر نوعًا" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="crypto">عملات مشفرة</SelectItem>
                                <SelectItem value="internal_transfer">تحويل داخلي</SelectItem>
                                <SelectItem value="trading_account">حساب تداول</SelectItem>
                            </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea placeholder="مثال: سحب USDT على شبكة TRON." {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="isEnabled" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>تفعيل الطريقة</FormLabel><FormDescription>يمكن للمستخدمين رؤية واستخدام هذه الطريقة.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                )}/>
                
                <Separator />
                
                <div>
                    <h3 className="text-lg font-medium">الحقول المطلوبة</h3>
                    <p className="text-sm text-muted-foreground">حدد الحقول التي يجب على المستخدمين تعبئتها لهذه الطريقة.</p>
                </div>
                
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="p-4 relative">
                           <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -left-2 h-6 w-6 z-10" onClick={() => remove(index)}>
                               <Trash2 className="h-4 w-4"/>
                           </Button>
                           <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name={`fields.${index}.name`} render={({ field }) => (
                                        <FormItem><FormLabel>اسم الحقل (بالانجليزية)</FormLabel><FormControl><Input placeholder="e.g., walletAddress" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`fields.${index}.label`} render={({ field }) => (
                                        <FormItem><FormLabel>عنوان الحقل</FormLabel><FormControl><Input placeholder="مثال: عنوان المحفظة" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`fields.${index}.placeholder`} render={({ field }) => (
                                        <FormItem><FormLabel>النص النائب</FormLabel><FormControl><Input placeholder="مثال: 0x..." {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                     <FormField control={form.control} name={`fields.${index}.type`} render={({ field }) => (
                                        <FormItem><FormLabel>نوع الحقل</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="اختر نوعًا" /></SelectTrigger></FormControl>
                                            <SelectContent><SelectItem value="text">نص</SelectItem><SelectItem value="number">رقم</SelectItem></SelectContent>
                                        </Select><FormMessage /></FormItem>
                                    )}/>
                                </div>
                                <div className="p-3 border rounded-md space-y-4">
                                    <h4 className="font-medium">قواعد التحقق</h4>
                                     <FormField control={form.control} name={`fields.${index}.validation.required`} render={({ field }) => (
                                        <FormItem className="flex flex-row items-start gap-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>مطلوب</FormLabel></div></FormItem>
                                    )}/>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`fields.${index}.validation.minLength`} render={({ field }) => (
                                            <FormItem><FormLabel>الحد الأدنى للطول</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`fields.${index}.validation.maxLength`} render={({ field }) => (
                                            <FormItem><FormLabel>الحد الأقصى للطول</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <FormField control={form.control} name={`fields.${index}.validation.regex`} render={({ field }) => (
                                            <FormItem><FormLabel>نمط Regex</FormLabel><FormControl><Input placeholder="^0x[a-fA-F0-9]{40}$" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`fields.${index}.validation.regexErrorMessage`} render={({ field }) => (
                                            <FormItem><FormLabel>رسالة خطأ Regex</FormLabel><FormControl><Input placeholder="تنسيق عنوان غير صالح" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                </div>
                           </div>
                        </Card>
                    ))}
                </div>

                <Button type="button" variant="outline" onClick={addNewField}>
                    <PlusCircle className="ml-2 h-4 w-4"/> إضافة حقل
                </Button>

                <DialogFooter className="pt-4">
                    <Button type="button" variant="secondary" onClick={onCancel}>إلغاء</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        {method ? "حفظ التغييرات" : "إنشاء طريقة"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}


export default function ManagePaymentMethodsPage() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const { toast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getPaymentMethods();
            setMethods(data);
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "تعذر جلب طرق الدفع." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteRequest = (id: string) => {
        setDeletingId(id);
        setIsAlertOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        const result = await deletePaymentMethod(deletingId);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            fetchData();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsAlertOpen(false);
        setDeletingId(null);
    };

    const handleEdit = (method: PaymentMethod) => {
        setEditingMethod(method);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingMethod(null);
        setIsFormOpen(true);
    }
    
    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingMethod(null);
        fetchData();
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        setEditingMethod(null);
    }

    const columns = getColumns(handleEdit, handleDeleteRequest);
    
    if(isLoading) {
        return <div className="container mx-auto flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }

    return (
        <>
            <div className="container mx-auto space-y-6">
                <div className="flex justify-between items-start">
                    <PageHeader
                        title="إدارة طرق الدفع"
                        description="تكوين كيفية سحب المستخدمين لأموالهم."
                    />
                    <Button onClick={handleAdd}>
                        <PlusCircle className="ml-2 h-4 w-4" /> إضافة طريقة
                    </Button>
                </div>
                
                <DataTable 
                    columns={columns} 
                    data={methods} 
                    filterableColumns={[
                        {
                            id: 'isEnabled',
                            title: 'الحالة',
                            options: [
                                { value: 'true', label: 'مفعل' },
                                { value: 'false', label: 'معطل' },
                            ]
                        },
                        {
                            id: 'type',
                            title: 'النوع',
                            options: [
                                { value: 'crypto', label: 'عملات مشفرة' },
                                { value: 'internal_transfer', label: 'تحويل داخلي' },
                                { value: 'trading_account', label: 'حساب تداول' },
                            ]
                        }
                    ]}
                />
            </div>
            
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                 <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingMethod ? "تعديل" : "إضافة"} طريقة دفع جديدة</DialogTitle>
                    </DialogHeader>
                    <div className="p-1">
                        <PaymentMethodForm 
                            method={editingMethod}
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
                      <AlertDialogDescription>سيؤدي هذا إلى حذف طريقة الدفع بشكل دائم.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteConfirm}>حذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
