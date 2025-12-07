

"use client";

import React, { useState, useEffect } from "react";
import { useParams, notFound, useRouter } from 'next/navigation';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { updateUser, adminUpdateKyc, adminUpdateAddress, adminUpdatePhoneNumber } from "../actions";
import { getBrokers } from "../../manage-brokers/actions";
import { adminAddTradingAccount } from "../../manage-accounts/actions";
import { getUserDetails } from "../actions";
import { Loader2, User, Wallet, Briefcase, Gift, ArrowRight, PlusCircle, Globe, Phone, Check, X, ShieldAlert, Home, Edit2, ShieldCheck, FileText, ArrowLeft } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import type { Broker, UserProfile, KycData, AddressData } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { countries, getCountryName } from "@/lib/countries";
import { CountrySelector } from "@/components/ui/country-selector";
import { PhoneInputWithCountry } from "@/components/ui/phone-input";
import { isPossiblePhoneNumber } from 'libphonenumber-js';

type UserDetails = Awaited<ReturnType<typeof getUserDetails>>;

const addAccountSchema = z.object({
  brokerName: z.string({ required_error: "الرجاء اختيار وسيط." }),
  accountNumber: z.string().min(3, "رقم الحساب قصير جدًا."),
});

type AddAccountForm = z.infer<typeof addAccountSchema>;

const editUserSchema = z.object({
    name: z.string().min(3, "الاسم مطلوب"),
    country: z.string().length(2, "يجب أن يكون رمز البلد من حرفين").optional(),
})
type EditUserForm = z.infer<typeof editUserSchema>;


function EditUserDialog({ userProfile, onSuccess }: { userProfile: UserProfile, onSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<EditUserForm>({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            name: userProfile?.name || "",
            country: userProfile?.country || "",
        },
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({
                name: userProfile?.name || "",
                country: userProfile?.country || "",
            });
        }
    }, [isOpen, userProfile, form]);

    const onSubmit = async (values: EditUserForm) => {
        if (!userProfile) return;
        setIsSubmitting(true);
        const result = await updateUser(userProfile.id, values);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            setIsOpen(false);
            onSuccess();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button size="sm" variant="outline"><Edit2 className="ml-2 h-4 w-4"/>تعديل الملف الشخصي</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تعديل المستخدم</DialogTitle>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                         <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>الاسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name="country" render={({ field }) => (
                            <FormItem><FormLabel>الدولة</FormLabel>
                                <FormControl>
                                    <CountrySelector
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="اختر دولة..."
                                    />
                                </FormControl>
                            <FormMessage /></FormItem>
                         )}/>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                حفظ
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function AddAccountDialog({ userId, onSuccess }: { userId: string, onSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [brokers, setBrokers] = useState<Broker[]>([]);
    const { toast } = useToast();
    
    useEffect(() => {
        if(isOpen) {
            getBrokers().then(setBrokers);
        }
    }, [isOpen]);

    const form = useForm<AddAccountForm>({
        resolver: zodResolver(addAccountSchema),
        defaultValues: {
            accountNumber: "",
        },
    });

    const onSubmit = async (values: AddAccountForm) => {
        setIsSubmitting(true);
        const result = await adminAddTradingAccount(userId, values.brokerName, values.accountNumber);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            onSuccess();
            setIsOpen(false);
            form.reset();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button size="sm"><PlusCircle className="ml-2 h-4 w-4" /> إضافة حساب</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>إضافة حساب تداول</DialogTitle>
                    <DialogDescription>
                        أضف حسابًا جديدًا لهذا المستخدم. سيتم الموافقة عليه تلقائيًا.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="brokerName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الوسيط</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="اختر وسيطًا" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {brokers.map(b => <SelectItem key={b.id} value={b.basicInfo?.broker_name || b.name}>{b.basicInfo?.broker_name || b.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="accountNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>رقم الحساب</FormLabel>
                                    <FormControl><Input placeholder="12345678" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                إضافة حساب
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function InfoRow({ label, value, children }: { label: string, value?: any, children?: React.ReactNode }) {
    if (!value && !children) return null;
    return (
        <div className="flex justify-between items-center text-sm py-1">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right break-all">
                {children || value}
            </span>
        </div>
    )
}

const kycSchema = z.object({
  documentType: z.enum(['id_card', 'passport']),
  documentNumber: z.string().min(5, "رقم الوثيقة مطلوب"),
  gender: z.enum(['male', 'female']),
  status: z.enum(['Pending', 'Verified', 'Rejected']),
  rejectionReason: z.string().optional(),
});
type KycFormValues = z.infer<typeof kycSchema>;

function KycEditDialog({ data, userId, onSuccess }: { data?: KycData; userId: string; onSuccess: () => void; }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const form = useForm<KycFormValues>({
        resolver: zodResolver(kycSchema),
        defaultValues: data || { documentType: 'id_card', documentNumber: '', gender: 'male', status: 'Pending', rejectionReason: '' },
    });

    const onSubmit = async (values: KycFormValues) => {
        setIsSubmitting(true);
        const result = await adminUpdateKyc(userId, { ...values, submittedAt: data?.submittedAt || new Date() });
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            onSuccess();
            setIsOpen(false);
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">{data ? <Edit2 className="ml-2 h-4 w-4"/> : <PlusCircle className="ml-2 h-4 w-4"/>}{data ? "تعديل" : "إضافة"}</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>{data ? "تعديل" : "إضافة"} بيانات KYC</DialogTitle></DialogHeader>
                <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="documentType" render={({ field }) => (<FormItem><FormLabel>نوع الوثيقة</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="id_card">بطاقة هوية</SelectItem><SelectItem value="passport">جواز سفر</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="documentNumber" render={({ field }) => (<FormItem><FormLabel>رقم الوثيقة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>الجنس</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">ذكر</SelectItem><SelectItem value="female">أنثى</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>الحالة</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Pending">معلق</SelectItem><SelectItem value="Verified">مقبول</SelectItem><SelectItem value="Rejected">مرفوض</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="rejectionReason" render={({ field }) => (<FormItem><FormLabel>سبب الرفض (إن وجد)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}حفظ</Button></DialogFooter>
                </form></Form>
            </DialogContent>
        </Dialog>
    );
}

const addressSchema = z.object({
  country: z.string().min(2, "الدولة مطلوبة"),
  status: z.enum(['Pending', 'Verified', 'Rejected']),
  rejectionReason: z.string().optional(),
});
type AddressFormValues = z.infer<typeof addressSchema>;

function AddressEditDialog({ data, userId, onSuccess }: { data?: AddressData; userId: string; onSuccess: () => void; }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const form = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: data || { country: '', status: 'Pending', rejectionReason: '' },
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({
                country: data?.country || '',
                status: data?.status || 'Pending',
                rejectionReason: data?.rejectionReason || '',
            });
        }
    }, [isOpen, data, form]);

    const onSubmit = async (values: AddressFormValues) => {
        setIsSubmitting(true);
        const result = await adminUpdateAddress(userId, { ...values, submittedAt: data?.submittedAt || new Date() });
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            onSuccess();
            setIsOpen(false);
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline">{data ? <Edit2 className="ml-2 h-4 w-4"/> : <PlusCircle className="ml-2 h-4 w-4"/>}{data ? "تعديل" : "إضافة"}</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>{data ? "تعديل" : "إضافة"} بيانات دولة الإقامة</DialogTitle></DialogHeader>
                <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="country" render={({ field }) => (
                        <FormItem>
                            <FormLabel>الدولة</FormLabel>
                            <FormControl>
                                <CountrySelector
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="اختر دولة..."
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>الحالة</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Pending">معلق</SelectItem><SelectItem value="Verified">مقبول</SelectItem><SelectItem value="Rejected">مرفوض</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="rejectionReason" render={({ field }) => (<FormItem><FormLabel>سبب الرفض (إن وجد)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}حفظ</Button></DialogFooter>
                </form></Form>
            </DialogContent>
        </Dialog>
    );
}

const phoneSchema = z.object({
  phoneNumber: z.string().refine(value => isPossiblePhoneNumber(value), { message: "الرجاء إدخال رقم هاتف صحيح."}),
});
type PhoneFormValues = z.infer<typeof phoneSchema>;

function PhoneEditDialog({ phoneNumber, userId, onSuccess }: { phoneNumber?: string; userId: string; onSuccess: () => void; }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const form = useForm<PhoneFormValues>({
        resolver: zodResolver(phoneSchema),
        defaultValues: { phoneNumber: phoneNumber || '' },
    });

    const onSubmit = async (values: PhoneFormValues) => {
        setIsSubmitting(true);
        const result = await adminUpdatePhoneNumber(userId, values.phoneNumber);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            onSuccess();
            setIsOpen(false);
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.error });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">{phoneNumber ? <Edit2 className="ml-2 h-4 w-4"/> : <PlusCircle className="ml-2 h-4 w-4"/>}{phoneNumber ? "تعديل" : "إضافة"}</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>{phoneNumber ? "تعديل" : "إضافة"} رقم الهاتف</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>رقم الهاتف</FormLabel>
                                    <FormControl>
                                        <PhoneInputWithCountry
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="أدخل رقم الهاتف"
                                            onlyArab={true}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}حفظ</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function VerificationCard<T extends KycData | AddressData>({
  type,
  title,
  icon,
  data,
  userId,
  onSuccess,
}: {
  type: 'kyc' | 'address';
  title: string;
  icon: React.ElementType;
  data: T | undefined;
  userId: string;
  onSuccess: () => void;
}) {
  const getStatusText = (status?: string) => ({'Pending': 'قيد المراجعة', 'Verified': 'تم التحقق', 'Rejected': 'مرفوض'}[status || ''] || status);
  const getStatusVariant = (status?: string) => ({'Pending': 'secondary', 'Verified': 'default', 'Rejected': 'destructive'}[status || ''] || 'outline') as any;

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
            <CardTitle className="text-base flex items-center gap-2">
                {React.createElement(icon)}
                {title}
            </CardTitle>
            {data && <Badge variant={getStatusVariant(data.status)} className="w-fit mt-2">{getStatusText(data.status)}</Badge>}
        </div>
        {type === 'kyc' ? (
             <KycEditDialog data={data as KycData} userId={userId} onSuccess={onSuccess} />
        ) : (
             <AddressEditDialog data={data as AddressData} userId={userId} onSuccess={onSuccess} />
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {!data ? (
          <p className="text-sm text-muted-foreground">لم يقدم المستخدم هذه المعلومات بعد.</p>
        ) : (
          Object.entries(data).map(([key, value]) => {
            if (key === 'status' || key === 'submittedAt' || key === 'rejectionReason') return null;
            return <InfoRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={String(value)} />;
          })
        )}
        {data?.rejectionReason && <InfoRow label="سبب الرفض" value={data.rejectionReason} />}
      </CardContent>
    </Card>
  );
}


export default function UserDetailPage() {
    const params = useParams();
    const userId = params.userId as string;
    const { toast } = useToast();
    const [details, setDetails] = useState<UserDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchDetails = async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const data = await getUserDetails(userId);
            if ('error' in data) {
                toast({ variant: 'destructive', title: "خطأ", description: data.error });
                return notFound();
            }
            setDetails(data);
        } catch (error) {
            toast({ variant: 'destructive', title: "خطأ", description: "فشل جلب تفاصيل المستخدم." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [userId, toast]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!details || !details.userProfile) {
        return notFound();
    }
    
    const { userProfile, balance, tradingAccounts, referredByName, referralsWithNames } = details;

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Approved': return 'default';
            case 'Pending': return 'secondary';
            case 'Rejected': return 'destructive';
            case 'Completed': return 'default';
            case 'Processing': return 'secondary';
            case 'Failed': return 'destructive';
            case 'Delivered': return 'default';
            case 'Shipped': return 'outline';
            case 'Cancelled': return 'destructive';
            default: return 'outline';
        }
    }
    
    const getStatusText = (status: string) => {
        switch (status) {
            case 'Approved': return 'مقبول';
            case 'Pending': return 'معلق';
            case 'Rejected': return 'مرفوض';
            case 'Completed': return 'مكتمل';
            case 'Processing': return 'قيد المعالجة';
            case 'Failed': return 'فشل';
            case 'Delivered': return 'تم التوصيل';
            case 'Shipped': return 'تم الشحن';
            case 'Cancelled': return 'ملغي';
            default: return status;
        }
    }

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex justify-between items-start">
                 <PageHeader
                    title={userProfile.name}
                    description={`عرض شامل للمستخدم ${userProfile.clientId}`}
                />
                <EditUserDialog userProfile={userProfile} onSuccess={fetchDetails} />
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User/> ملخص المستخدم</CardTitle></CardHeader>
                        <CardContent className="space-y-1 divide-y">
                           <InfoRow label="معرف العميل" value={userProfile.clientId} />
                           <InfoRow label="البريد الإلكتروني" value={userProfile.email} />
                           <InfoRow label="تاريخ الانضمام" value={userProfile.createdAt ? format(userProfile.createdAt, 'PP') : '-'} />
                           <InfoRow label="الدولة" value={userProfile.country || 'N/A'} />
                           <InfoRow label="Auth UID" value={userProfile.uid} />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet/> ملخص مالي</CardTitle></CardHeader>
                        <CardContent className="space-y-1 divide-y">
                           <InfoRow label="الرصيد المتاح"><span className="text-primary font-bold">${balance.availableBalance.toFixed(2)}</span></InfoRow>
                           <InfoRow label="إجمالي المكتسب" value={`$${balance.totalEarned.toFixed(2)}`} />
                           <InfoRow label="إجمالي المسحوب" value={`$${balance.completedWithdrawals.toFixed(2)}`} />
                           <InfoRow label="سحوبات معلقة" value={`$${balance.pendingWithdrawals.toFixed(2)}`} />
                           <InfoRow label="المصروف في المتجر" value={`$${balance.totalSpentOnOrders.toFixed(2)}`} />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gift/> ملخص الإحالات</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1 divide-y">
                                <InfoRow label="تمت إحالته بواسطة" value={referredByName || 'لا يوجد'} />
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-medium text-sm mb-2">المستخدمون المحالون ({referralsWithNames.length})</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {referralsWithNames.length > 0 ? referralsWithNames.map(ref => (
                                        <Link key={ref.uid} href={`/admin/users/${ref.uid}`} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted">
                                            <span>{ref.name}</span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                                        </Link>
                                    )) : <p className="text-sm text-muted-foreground">لم يحل أي مستخدمين.</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><ShieldAlert/> طلبات التحقق</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-1 gap-4">
                            <VerificationCard type="kyc" title="تحقق الهوية (KYC)" icon={FileText} data={userProfile.kycData} userId={userId} onSuccess={fetchDetails} />
                            <VerificationCard type="address" title="تحقق العنوان" icon={Home} data={userProfile.addressData} userId={userId} onSuccess={fetchDetails} />
                            <Card>
                                <CardHeader className="flex flex-row justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base flex items-center gap-2"><Phone/>تحقق الهاتف</CardTitle>
                                        <Badge variant={userProfile.phoneNumberVerified ? 'default' : 'secondary'} className="w-fit mt-2">{userProfile.phoneNumberVerified ? 'تم التحقق' : 'لم يتم التحقق'}</Badge>
                                    </div>
                                    <PhoneEditDialog phoneNumber={userProfile.phoneNumber} userId={userId} onSuccess={fetchDetails} />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{userProfile.phoneNumber || 'لم يتم تقديم رقم هاتف.'}</p>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Briefcase/>
                                <CardTitle className="text-base">حسابات التداول</CardTitle>
                            </div>
                            <AddAccountDialog userId={userId} onSuccess={fetchDetails} />
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>الوسيط</TableHead>
                                        <TableHead>رقم الحساب</TableHead>
                                        <TableHead>الحالة</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tradingAccounts.length > 0 ? tradingAccounts.map(acc => (
                                        <TableRow key={acc.id}>
                                            <TableCell>{acc.broker}</TableCell>
                                            <TableCell>{acc.accountNumber}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(acc.status)}>{getStatusText(acc.status)}</Badge></TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={3} className="text-center">لا توجد حسابات مرتبطة.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}
