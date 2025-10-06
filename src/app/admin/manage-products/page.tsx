
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addProduct, updateProduct, deleteProduct } from "./actions";
import { getProducts, getCategories } from "@/app/actions";
import { PlusCircle, Loader2 } from "lucide-react";
import type { Product, ProductCategory } from "@/types";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table/data-table";
import { getColumns } from "./columns";

const formSchema = z.object({
    name: z.string().min(2, "اسم المنتج قصير جدًا."),
    description: z.string().min(10, "الوصف قصير جدًا."),
    price: z.coerce.number().positive("يجب أن يكون السعر رقمًا موجبًا."),
    imageUrl: z.string().url("يجب أن يكون عنوان URL صالحًا للصورة."),
    categoryId: z.string({ required_error: "يرجى تحديد فئة."}),
    stock: z.coerce.number().int().min(0, "لا يمكن أن يكون المخزون سالبًا."),
});

type FormData = z.infer<typeof formSchema>;

function ProductForm({ product, categories, onSuccess, onCancel }: { product?: Product | null; categories: ProductCategory[]; onSuccess: () => void; onCancel: () => void; }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: product ? {
            ...product,
        } : {
            name: "",
            description: "",
            price: 0,
            imageUrl: "https://ycoincash.com/wp-content/uploads/2024/05/courses-1-scaled.jpg",
            categoryId: undefined,
            stock: 1000,
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        const category = categories.find(c => c.id === data.categoryId);
        if (!category) {
            toast({ variant: "destructive", title: "خطأ", description: "فئة غير صالحة." });
            setIsSubmitting(false);
            return;
        }

        const payload = { ...data, categoryName: category.name };

        const result = product
            ? await updateProduct(product.id, payload)
            : await addProduct(payload);

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
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>اسم المنتج</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                    <FormItem><FormLabel>رابط الصورة</FormLabel><FormControl><Input placeholder="https://placehold.co/400x400.png" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem><FormLabel>السعر ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="stock" render={({ field }) => (
                        <FormItem><FormLabel>المخزون</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="categoryId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>الفئة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="اختر فئة" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>
                <div className="flex justify-end gap-2">
                    <DialogClose asChild><Button type="button" variant="secondary" onClick={onCancel}>إلغاء</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        {product ? "حفظ التغييرات" : "إنشاء منتج"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

export default function ManageProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [productsData, categoriesData] = await Promise.all([
                getProducts(),
                getCategories(),
            ]);
            setProducts(productsData);
            setCategories(categoriesData);
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "تعذر جلب بيانات المتجر." });
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
        const result = await deleteProduct(deletingId);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            fetchData();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsAlertOpen(false);
        setDeletingId(null);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setIsFormOpen(true);
    }
    
    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingProduct(null);
        fetchData();
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        setEditingProduct(null);
    }

    const columns = useMemo(() => getColumns(handleEdit, handleDeleteRequest, categories), [categories]);

    if(isLoading) {
        return <div className="container mx-auto flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <div className="container mx-auto space-y-6">
                <div className="flex justify-between items-start">
                    <PageHeader
                        title="إدارة المنتجات"
                        description="إضافة أو تعديل أو إزالة المنتجات في متجرك."
                    />
                    <DialogTrigger asChild>
                        <Button onClick={handleAdd}>
                            <PlusCircle className="ml-2 h-4 w-4" /> إضافة منتج
                        </Button>
                    </DialogTrigger>
                </div>

                <DataTable 
                    columns={columns} 
                    data={products} 
                    searchableColumns={[{id: 'name', title: 'المنتج'}]}
                    filterableColumns={[
                        {
                            id: 'categoryName',
                            title: 'الفئة',
                            options: categories.map(c => ({ value: c.name, label: c.name }))
                        }
                    ]}
                />
            </div>
            
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
                </DialogHeader>
                <ProductForm 
                    product={editingProduct} 
                    categories={categories} 
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                />
            </DialogContent>
            
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>سيؤدي هذا إلى حذف المنتج بشكل دائم.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>حذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
