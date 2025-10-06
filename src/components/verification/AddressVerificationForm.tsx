'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadVerificationDocument } from '@/app/actions/upload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries as allCountries } from '@/lib/countries';

const countries = allCountries.map(c => ({
  value: c.code,
  label: c.nameAr || c.name,
  flag: c.flag || ''
}));

const addressSchema = z.object({
  country: z.string().min(2, 'الدولة مطلوبة'),
  city: z.string().min(2, 'المدينة مطلوبة'),
  stateProvince: z.string().optional(),
  streetAddress: z.string().min(5, 'عنوان الشارع مطلوب'),
  postalCode: z.string().min(3, 'الرمز البريدي مطلوب'),
  documentFile: z.instanceof(File, { message: 'مستند إثبات العنوان مطلوب' }),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressVerificationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  userCountry?: string | null;
}

export function AddressVerificationForm({ onSuccess, onCancel, userCountry }: AddressVerificationFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country: userCountry || '',
      city: '',
      stateProvince: '',
      streetAddress: '',
      postalCode: '',
    },
  });

  const handleFileChange = (file: File | undefined) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('documentFile', file, { shouldValidate: false });
    }
  };

  const onSubmit = async (data: AddressFormValues) => {
    setIsSubmitting(true);
    try {
      // Upload address document
      const formData = new FormData();
      formData.append('file', data.documentFile);
      const uploadResult = await uploadVerificationDocument(formData, 'address_proof');

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'فشل رفع المستند');
      }

      // Submit address data
      const response = await fetch('/api/verification/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          documentUrl: uploadResult.url,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل إرسال بيانات العنوان');
      }

      toast({ title: 'نجاح', description: 'تم إرسال معلومات العنوان للمراجعة' });
      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء الإرسال',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step >= num
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-muted-foreground text-muted-foreground'
                }`}
              >
                {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
              </div>
              {num < 2 && (
                <div className={`h-0.5 w-12 ${step > num ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Address Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                معلومات العنوان
              </CardTitle>
              <CardDescription>أدخل عنوانك الحالي كما يظهر في مستند إثبات العنوان</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدولة *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الدولة">
                              {field.value && (
                                <span className="flex items-center gap-2">
                                  <span>{countries.find(c => c.value === field.value)?.flag}</span>
                                  <span>{countries.find(c => c.value === field.value)?.label}</span>
                                </span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {countries.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              <div className="flex items-center gap-2">
                                <span>{country.flag}</span>
                                <span>{country.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدينة *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: الرياض" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="stateProvince"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المنطقة / الولاية (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: منطقة الرياض" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان الشارع *</FormLabel>
                    <FormControl>
                      <Input placeholder="الشارع، رقم المبنى، الحي" {...field} />
                    </FormControl>
                    <FormDescription>
                      أدخل العنوان الكامل بما في ذلك رقم المبنى والحي
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرمز البريدي *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: 12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  تأكد من مطابقة العنوان المدخل للعنوان الموجود في مستند الإثبات
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload Document */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>رفع مستند إثبات العنوان</CardTitle>
              <CardDescription>
                يُقبل: فاتورة كهرباء، فاتورة مياه، كشف حساب بنكي، عقد إيجار (صادر خلال آخر 3 شهور)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="documentFile"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>مستند إثبات العنوان *</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {documentPreview ? 'تم الرفع - انقر للتغيير' : 'انقر لرفع المستند'}
                            </p>
                          </div>
                          <Input
                            type="file"
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleFileChange(e.target.files?.[0])}
                          />
                        </label>
                        {documentPreview && (
                          <div className="relative w-full h-64 border rounded-lg overflow-hidden">
                            <img src={documentPreview} alt="Preview" className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      JPEG، PNG، أو PDF - حتى 10MB
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>المستندات المقبولة:</strong><br />
                  • فاتورة كهرباء أو مياه أو غاز (آخر 3 شهور)<br />
                  • كشف حساب بنكي (آخر 3 شهور)<br />
                  • عقد إيجار أو ملكية موثق<br />
                  • إثبات إقامة حكومي<br />
                  <br />
                  <strong>متطلبات المستند:</strong><br />
                  • يجب أن يظهر اسمك الكامل بوضوح<br />
                  • يجب أن يظهر العنوان الكامل<br />
                  • يجب أن يكون حديثاً (آخر 3 شهور)
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (step === 1) {
                onCancel();
              } else {
                setStep(step - 1);
              }
            }}
            disabled={isSubmitting}
          >
            {step === 1 ? 'إلغاء' : 'السابق'}
          </Button>

          {step < 2 ? (
            <Button
              type="button"
              onClick={async () => {
                const fields = ['country', 'city', 'streetAddress', 'postalCode'];
                const valid = await form.trigger(fields as any);
                if (valid) setStep(step + 1);
              }}
            >
              التالي
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                'إرسال للمراجعة'
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
