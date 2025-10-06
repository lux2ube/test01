
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { updateClientLevels, seedClientLevels } from "./actions";
import { getClientLevels } from "@/app/actions";
import { Loader2, Save, Database } from "lucide-react";
import type { ClientLevel } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const levelSchema = z.object({
  id: z.number(),
  name: z.string().min(2, "Name is required."),
  required_total: z.coerce.number().min(0),
  advantage_referral_cashback: z.coerce.number().min(0).max(100),
  advantage_referral_store: z.coerce.number().min(0).max(100),
  advantage_product_discount: z.coerce.number().min(0).max(100),
});

const formSchema = z.object({
  levels: z.array(levelSchema),
});

type FormData = z.infer<typeof formSchema>;

export default function ManageLevelsPage() {
  const [levels, setLevels] = useState<ClientLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { levels: [] },
  });

  const { fields } = useFieldArray({ control: form.control, name: "levels" });

  const fetchLevels = async () => {
      setIsLoading(true);
      try {
        const data = await getClientLevels();
        setLevels(data);
        form.reset({ levels: data });
      } catch (error) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن تحميل مستويات العملاء.'});
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const handleSeedLevels = async () => {
    setIsSeeding(true);
    const result = await seedClientLevels();
    if (result.success) {
      toast({ title: "نجاح", description: result.message });
      fetchLevels(); // Refetch to show the new data
    } else {
      toast({ variant: "destructive", title: "خطأ", description: result.message });
    }
    setIsSeeding(false);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const result = await updateClientLevels(data.levels);
    if (result.success) {
      toast({ title: "نجاح", description: result.message });
    } else {
      toast({ variant: "destructive", title: "خطأ", description: result.message });
    }
    setIsSubmitting(false);
  };
  
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full min-h-[calc(100vh-theme(spacing.14))]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (levels.length === 0) {
    return (
        <div className="container mx-auto space-y-6 text-center">
             <PageHeader
                title="إدارة مستويات العملاء"
                description="تكوين متطلبات ومزايا كل مستوى."
            />
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>تهيئة نظام المستويات</CardTitle>
                    <CardDescription>
                        لا توجد مستويات مكونة في قاعدة البيانات. قم بإضافتها الآن للبدء.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleSeedLevels} disabled={isSeeding}>
                        {isSeeding && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        <Database className="ml-2 h-4 w-4" />
                        إضافة المستويات الافتراضية
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title="إدارة مستويات العملاء"
        description="تكوين متطلبات ومزايا كل مستوى."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="p-0">
                <ScrollArea>
                  <Table className="min-w-max">
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستوى</TableHead>
                        <TableHead>اسم المستوى</TableHead>
                        <TableHead>إجمالي الأرباح المطلوبة ($)</TableHead>
                        <TableHead>عمولة إحالة الكاش باك (%)</TableHead>
                        <TableHead>عمولة إحالة المتجر (%)</TableHead>
                        <TableHead>خصم على المنتجات (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((level, index) => (
                           <TableRow key={level.id}>
                                <TableCell className="font-semibold text-lg">{level.id}</TableCell>
                               <TableCell>
                                    <FormField control={form.control} name={`levels.${index}.name`} render={({ field }) => (
                                        <FormItem><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                               </TableCell>
                               <TableCell>
                                    <FormField control={form.control} name={`levels.${index}.required_total`} render={({ field }) => (
                                        <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                               </TableCell>
                               <TableCell>
                                    <FormField control={form.control} name={`levels.${index}.advantage_referral_cashback`} render={({ field }) => (
                                        <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                               </TableCell>
                               <TableCell>
                                    <FormField control={form.control} name={`levels.${index}.advantage_referral_store`} render={({ field }) => (
                                        <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                               </TableCell>
                               <TableCell>
                                    <FormField control={form.control} name={`levels.${index}.advantage_product_discount`} render={({ field }) => (
                                        <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                               </TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
          </Card>
           <div className="flex justify-end mt-6">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> حفظ كل التغييرات
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
