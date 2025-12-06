'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CountrySelector } from '@/components/ui/country-selector';

interface AddressSimpleUploadProps {
  onSuccess: () => void;
  onCancel: () => void;
  userCountry?: string | null;
}

export function AddressSimpleUpload({ onSuccess, onCancel, userCountry }: AddressSimpleUploadProps) {
  const [country, setCountry] = useState(userCountry || '');
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!country) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى اختيار الدولة'
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/verification/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({ 
          title: 'تم الإرسال', 
          description: 'تم إرسال طلبك بنجاح وسيتم مراجعته من قبل الإدارة.' 
        });
        onSuccess();
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: `فشل في تحديث الدولة: ${errorMessage}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <MapPin className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">تحديد دولة الإقامة</h2>
        <p className="text-sm text-muted-foreground">
          اختر الدولة التي تقيم فيها حالياً
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
          <CountrySelector
            value={country}
            onChange={setCountry}
            placeholder="اختر الدولة"
            onlyArab={false}
            className="w-full"
          />
        </div>

        {country && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">
              تم اختيار الدولة
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={onCancel} 
            disabled={submitting}
            className="flex-1 h-12"
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!country || submitting}
            className="flex-1 h-12"
          >
            {submitting ? (
              <>
                <Loader2 className="me-2 h-5 w-5 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              'حفظ'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
