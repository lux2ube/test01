
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getFeedbackForms, addFeedbackForm, updateFeedbackForm, deleteFeedbackForm } from "./actions";
import { PlusCircle, Loader2, Edit, Trash2, Send, Type, Check, Star } from "lucide-react";
import type { FeedbackForm, FeedbackQuestion } from "@/types";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/data-table/data-table";
import { getColumns } from "./columns";

const questionSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  text: z.string().min(3, "نص السؤال مطلوب."),
  type: z.enum(['text', 'rating', 'multiple-choice']),
  options: z.array(z.string()).optional(),
});

const formSchema = z.object({
  title: z.string().min(5, "العنوان مطلوب."),
  description: z.string().min(10, "الوصف مطلوب."),
  status: z.enum(['active', 'inactive']),
  questions: z.array(questionSchema).min(1, "يجب إضافة سؤال واحد على الأقل."),
});

type FormData = z.infer<typeof formSchema>;

const defaultFormValues: FormData = {
    title: "",
    description: "",
    status: 'inactive',
    questions: [],
};


function FeedbackFormDialog({ form: existingForm, isOpen, onOpenChange, onSuccess }: { form?: FeedbackForm | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => void; }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const formMethods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: existingForm ? { ...defaultFormValues, ...existingForm, description: existingForm.description || "" } : defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: "questions",
  });
  
  useEffect(() => {
    formMethods.reset(existingForm ? { ...defaultFormValues, ...existingForm, description: existingForm.description || "" } : defaultFormValues);
  }, [isOpen, existingForm, formMethods]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const result = existingForm
      ? await updateFeedbackForm(existingForm.id, data)
      : await addFeedbackForm(data);

    if (result.success) {
      toast({ title: "نجاح", description: result.message });
      onSuccess();
    } else {
      toast({ variant: "destructive", title: "خطأ", description: result.message });
    }
    setIsSubmitting(false);
  };

  const addQuestion = (type: FeedbackQuestion['type']) => {
    append({ id: crypto.randomUUID(), text: "", type: type, options: type === 'multiple-choice' ? [''] : [] });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{existingForm ? "تعديل" : "إنشاء"} نموذج ملاحظات</DialogTitle>
          </DialogHeader>
          <FormProvider {...formMethods}>
            <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-6 p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={formMethods.control} name="title" render={({ field }) => (<FormItem><FormLabel>عنوان النموذج</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={formMethods.control} name="status" render={({ field }) => (<FormItem><FormLabel>الحالة</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="active">نشط</SelectItem><SelectItem value="inactive">غير نشط</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
              </div>
              <FormField control={formMethods.control} name="description" render={({ field }) => (<FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <Separator />
              <div>
                  <h3 className="text-lg font-medium">الأسئلة</h3>
                  <p className="text-sm text-muted-foreground">أضف أسئلة إلى النموذج الخاص بك.</p>
              </div>
              <div className="space-y-4">
                  {fields.map((field, index) => (
                      <div key={field.id} className="p-4 relative bg-muted/50 border rounded-md">
                          <Button type="button" variant="destructive" size="icon" className="absolute top-2 left-2 h-6 w-6 z-10" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                          <div className="space-y-4">
                              <FormField control={formMethods.control} name={`questions.${index}.text`} render={({ field }) => (<FormItem><FormLabel>نص السؤال</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                              <FormField control={formMethods.control} name={`questions.${index}.type`} render={({ field }) => (
                                  <FormItem><FormLabel>نوع السؤال</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="text"><div className="flex items-center gap-2"><Type/> نصي</div></SelectItem>
                                        <SelectItem value="rating"><div className="flex items-center gap-2"><Star/> تقييم (1-5)</div></SelectItem>
                                        <SelectItem value="multiple-choice"><div className="flex items-center gap-2"><Check/> اختيار من متعدد</div></SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage /></FormItem>
                              )}/>
                          </div>
                      </div>
                  ))}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('text')}><PlusCircle className="ml-2 h-4 w-4"/> إضافة سؤال نصي</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('rating')}><PlusCircle className="ml-2 h-4 w-4"/> إضافة تقييم</Button>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>إلغاء</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  {existingForm ? "حفظ التغييرات" : "إنشاء نموذج"}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
    </Dialog>
  );
}


export default function ManageFeedbackPage() {
    const [forms, setForms] = useState<FeedbackForm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingForm, setEditingForm] = useState<FeedbackForm | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const { toast } = useToast();

    const fetchForms = async () => {
        setIsLoading(true);
        try {
            const data = await getFeedbackForms();
            setForms(data);
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "تعذر جلب النماذج." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchForms();
    }, []);

    const handleDeleteRequest = (id: string) => {
        setDeletingId(id);
        setIsAlertOpen(true);
    }
    
    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        const result = await deleteFeedbackForm(deletingId);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            fetchForms();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsAlertOpen(false);
        setDeletingId(null);
    };

    const handleEdit = (form: FeedbackForm) => {
        setEditingForm(form);
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingForm(null);
        setIsDialogOpen(true);
    }
    
    const handleFormSuccess = () => {
        setIsDialogOpen(false);
        setEditingForm(null);
        fetchForms();
    };

    const columns = getColumns(handleEdit, handleDeleteRequest);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex justify-between items-start">
                <PageHeader
                    title="إدارة الملاحظات والنماذج"
                    description="إنشاء وإدارة نماذج الملاحظات للمستخدمين."
                />
                <Button onClick={handleAdd}>
                    <PlusCircle className="ml-2 h-4 w-4" /> إضافة نموذج
                </Button>
            </div>
            
            <FeedbackFormDialog 
                form={editingForm} 
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={handleFormSuccess} 
            />
            
            <DataTable columns={columns} data={forms} />

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                  <AlertDialogDescription>سيؤدي هذا إلى حذف النموذج وجميع استجاباته بشكل دائم.</AlertDialogDescription>
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
