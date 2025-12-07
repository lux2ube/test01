
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { 
  updateClientLevels, 
  seedClientLevels, 
  getUsersWithLevelChanges, 
  applyUserLevelChange,
  applyAllLevelChanges,
  type UserLevelChange,
  type LevelManagementResult 
} from "./actions";
import { getClientLevels } from "@/app/actions";
import { Loader2, Save, Database, Filter, ArrowUp, ArrowDown, RefreshCw, Users, CheckCircle2 } from "lucide-react";
import type { ClientLevel } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const months = [
  { value: '1', label: 'يناير' },
  { value: '2', label: 'فبراير' },
  { value: '3', label: 'مارس' },
  { value: '4', label: 'أبريل' },
  { value: '5', label: 'مايو' },
  { value: '6', label: 'يونيو' },
  { value: '7', label: 'يوليو' },
  { value: '8', label: 'أغسطس' },
  { value: '9', label: 'سبتمبر' },
  { value: '10', label: 'أكتوبر' },
  { value: '11', label: 'نوفمبر' },
  { value: '12', label: 'ديسمبر' },
];

function LevelManagementSection() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [result, setResult] = useState<LevelManagementResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const { toast } = useToast();

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = now.getFullYear() - i;
    return { value: String(year), label: String(year) };
  });

  const handleFilter = async () => {
    setIsLoading(true);
    try {
      const data = await getUsersWithLevelChanges(Number(selectedMonth), Number(selectedYear));
      setResult(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحميل البيانات.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyLevel = async (user: UserLevelChange) => {
    setUpdatingUserId(user.userId);
    try {
      const res = await applyUserLevelChange(user.userId, user.reservedLevel);
      if (res.success) {
        toast({ title: 'نجاح', description: res.message });
        handleFilter();
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: res.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث المستوى.' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleApplyAll = async () => {
    if (!result || result.users.length === 0) return;
    
    setIsApplyingAll(true);
    try {
      const res = await applyAllLevelChanges(Number(selectedMonth), Number(selectedYear));
      if (res.success) {
        toast({ title: 'نجاح', description: res.message });
        handleFilter();
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: res.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث المستويات.' });
    } finally {
      setIsApplyingAll(false);
    }
  };

  const upgradeCount = result?.users.filter(u => u.changeDirection === 'upgrade').length || 0;
  const downgradeCount = result?.users.filter(u => u.changeDirection === 'downgrade').length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          إدارة مستويات المستخدمين
        </CardTitle>
        <CardDescription>
          عرض المستخدمين الذين يستحقون تغيير مستوياتهم بناءً على أرباحهم الشهرية
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">الشهر</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">السنة</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleFilter} disabled={isLoading}>
            {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Filter className="ml-2 h-4 w-4" />}
            عرض التغييرات
          </Button>
          {result && result.users.length > 0 && (
            <Button onClick={handleApplyAll} disabled={isApplyingAll} variant="default">
              {isApplyingAll ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="ml-2 h-4 w-4" />}
              تطبيق جميع التغييرات ({result.users.length})
            </Button>
          )}
        </div>

        {result && (
          <>
            <Separator />
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <ArrowUp className="ml-1 h-3 w-3" />
                  ترقية: {upgradeCount}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <ArrowDown className="ml-1 h-3 w-3" />
                  تخفيض: {downgradeCount}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {result.month} {result.year}
              </div>
            </div>

            {result.users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا يوجد مستخدمون يستحقون تغيير مستوياتهم في هذا الشهر
              </div>
            ) : (
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>المستوى الحالي</TableHead>
                      <TableHead>أرباح الشهر</TableHead>
                      <TableHead>المستوى المحجوز</TableHead>
                      <TableHead>إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.users.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.userName}</div>
                            <div className="text-xs text-muted-foreground">{user.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.currentLevelName}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          ${user.monthlyEarnings.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.changeDirection === 'upgrade' ? (
                              <ArrowUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDown className="h-4 w-4 text-red-600" />
                            )}
                            <Badge 
                              variant={user.changeDirection === 'upgrade' ? 'default' : 'destructive'}
                            >
                              {user.reservedLevelName}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleApplyLevel(user)}
                            disabled={updatingUserId === user.userId}
                          >
                            {updatingUserId === user.userId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="ml-1 h-3 w-3" />
                                تحديث
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LevelConfigurationSection({ 
  levels, 
  onSeedLevels, 
  isSeeding 
}: { 
  levels: ClientLevel[]; 
  onSeedLevels: () => void;
  isSeeding: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { levels },
  });

  const { fields } = useFieldArray({ control: form.control, name: "levels" });

  useEffect(() => {
    form.reset({ levels });
  }, [levels, form]);

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

  if (levels.length === 0) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>تهيئة نظام المستويات</CardTitle>
          <CardDescription>
            لا توجد مستويات مكونة في قاعدة البيانات. قم بإضافتها الآن للبدء.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onSeedLevels} disabled={isSeeding}>
            {isSeeding && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            <Database className="ml-2 h-4 w-4" />
            إضافة المستويات الافتراضية
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>إعدادات المستويات</CardTitle>
            <CardDescription>تكوين متطلبات ومزايا كل مستوى</CardDescription>
          </CardHeader>
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
  );
}

export default function ManageLevelsPage() {
  const [levels, setLevels] = useState<ClientLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  const fetchLevels = async () => {
    setIsLoading(true);
    try {
      const data = await getClientLevels();
      setLevels(data);
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
      fetchLevels();
    } else {
      toast({ variant: "destructive", title: "خطأ", description: result.message });
    }
    setIsSeeding(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-theme(spacing.14))]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title="إدارة مستويات العملاء"
        description="تكوين متطلبات ومزايا كل مستوى وإدارة تحديثات المستويات الشهرية."
      />
      
      <Tabs defaultValue="management" className="space-y-6">
        <TabsList>
          <TabsTrigger value="management">إدارة المستويات</TabsTrigger>
          <TabsTrigger value="configuration">إعدادات المستويات</TabsTrigger>
        </TabsList>
        
        <TabsContent value="management">
          <LevelManagementSection />
        </TabsContent>
        
        <TabsContent value="configuration">
          <LevelConfigurationSection 
            levels={levels} 
            onSeedLevels={handleSeedLevels}
            isSeeding={isSeeding}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
