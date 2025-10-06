
"use client";

import { useState } from "react";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { Product } from "@/types";
import { Loader2, Phone, User, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/hooks/useAuthContext";
import { placeOrder } from "@/app/actions";
import { getClientSessionInfo } from "@/lib/device-info";


const purchaseSchema = z.object({
    userName: z.string().min(3, "الاسم الكامل مطلوب."),
    userEmail: z.string().email("الرجاء إدخال بريد إلكتروني صحيح."),
    deliveryPhoneNumber: z.string().min(10, "الرجاء إدخال رقم هاتف صحيح."),
});
type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export function PurchaseForm({ product, isOpen, onClose }: { product: Product; isOpen: boolean; onClose: () => void; }) {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<PurchaseFormValues>({
        resolver: zodResolver(purchaseSchema),
        defaultValues: { 
            userName: user?.profile?.name || "",
            userEmail: user?.profile?.email || "",
            deliveryPhoneNumber: "" 
        }
    });
    
    const handlePurchase = async (data: PurchaseFormValues) => {
        if (!user || !product) return;
        setIsSubmitting(true);
        
        try {
            const clientInfo = await getClientSessionInfo();
            const result = await placeOrder(product.id, data, clientInfo);

            if (result.success) {
                toast({ title: "تم بنجاح!", description: result.message });
                onClose();
                router.push('/dashboard/store/orders');
            } else {
                toast({ variant: 'destructive', title: "فشل الطلب", description: result.message });
            }
        } catch (error) {
            console.error('Error placing order:', error);
            toast({ variant: 'destructive', title: "خطأ", description: "حدث خطأ أثناء معالجة طلبك" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader className="text-right">
                    <DialogTitle>تأكيد الشراء: {product.name}</DialogTitle>
                    <DialogDescription>
                        سيتم خصم ${product.price.toFixed(2)} من رصيد الكاش باك المتاح لديك. أدخل التفاصيل الخاصة بك للتسليم.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handlePurchase)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="userName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الاسم الكامل</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="اسمك الكامل" {...field} className="pr-10 text-right" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="userEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>البريد الإلكتروني</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="email" placeholder="بريدك الإلكتروني" {...field} className="pr-10 text-right" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="deliveryPhoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>رقم هاتف التوصيل</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="tel" placeholder="مثال: +966..." {...field} className="pr-10 text-right" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                تأكيد الطلب
                            </Button>
                             <Button type="button" variant="secondary" onClick={onClose}>
                                إلغاء
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

    