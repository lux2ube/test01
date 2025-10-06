'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, CheckCircle, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface AddressSimpleUploadProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddressSimpleUpload({ onSuccess, onCancel }: AddressSimpleUploadProps) {
  const [step, setStep] = useState(1);
  
  // Address details
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  // File upload
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const countries = [
    { code: 'YE', name: 'اليمن', flag: '🇾🇪' },
    { code: 'SA', name: 'السعودية', flag: '🇸🇦' },
    { code: 'AE', name: 'الإمارات', flag: '🇦🇪' },
    { code: 'EG', name: 'مصر', flag: '🇪🇬' },
    { code: 'JO', name: 'الأردن', flag: '🇯🇴' },
    { code: 'LB', name: 'لبنان', flag: '🇱🇧' },
    { code: 'IQ', name: 'العراق', flag: '🇮🇶' },
    { code: 'SY', name: 'سوريا', flag: '🇸🇾' },
    { code: 'KW', name: 'الكويت', flag: '🇰🇼' },
    { code: 'QA', name: 'قطر', flag: '🇶🇦' },
    { code: 'BH', name: 'البحرين', flag: '🇧🇭' },
    { code: 'OM', name: 'عمان', flag: '🇴🇲' },
  ];


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocumentFile(file);
      setDocumentPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setDocumentFile(null);
    setDocumentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNextStep = () => {
    if (!country || !city || !streetAddress || !postalCode) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة'
      });
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!documentFile) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى رفع مستند إثبات العنوان'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload document
      const formData = new FormData();
      formData.append('file', documentFile);
      formData.append('documentType', 'address_proof');

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentage);
        }
      });

      const documentUrl = await new Promise<string>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            resolve(result.url);
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error')));

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });

      // Submit address verification
      const response = await fetch('/api/verification/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          city,
          streetAddress,
          stateProvince,
          postalCode,
          documentUrl,
        }),
      });

      if (response.ok) {
        toast({ 
          title: 'نجاح', 
          description: 'تم إرسال طلب التحقق من العنوان بنجاح. سيتم مراجعته قريباً.' 
        });
        onSuccess();
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل رفع المستند. يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setUploading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">معلومات العنوان</h2>
          <p className="text-muted-foreground">أدخل تفاصيل عنوانك الحالي</p>
        </div>

        <div className="space-y-6">
          {/* Country Selection */}
          <div className="space-y-3">
            <Label htmlFor="country">الدولة *</Label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full p-3 border rounded-lg bg-background text-right"
            >
              <option value="">اختر الدولة</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div className="space-y-3">
            <Label htmlFor="city">المدينة *</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="مثال: صنعاء"
              className="text-right"
            />
          </div>

          {/* Street Address */}
          <div className="space-y-3">
            <Label htmlFor="street">عنوان الشارع *</Label>
            <Input
              id="street"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="مثال: شارع الزبيري، حي الحصبة"
              className="text-right"
            />
          </div>

          {/* State/Province (Optional) */}
          <div className="space-y-3">
            <Label htmlFor="state">المنطقة / الولاية (اختياري)</Label>
            <Input
              id="state"
              value={stateProvince}
              onChange={(e) => setStateProvince(e.target.value)}
              placeholder="المنطقة أو الولاية"
              className="text-right"
            />
          </div>

          {/* Postal Code */}
          <div className="space-y-3">
            <Label htmlFor="postal">الرمز البريدي *</Label>
            <Input
              id="postal"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="مثال: 12345"
              className="text-right"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              إلغاء
            </Button>
            <Button 
              onClick={handleNextStep} 
              disabled={!country || !city || !streetAddress || !postalCode}
              className="flex-1"
            >
              التالي
              <ArrowRight className="mr-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: File Upload
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">رفع مستند إثبات العنوان</h2>
        <p className="text-muted-foreground">
          قم برفع فاتورة مرافق، كشف بنكي، أو أي مستند رسمي يثبت عنوانك (لا يزيد عمره عن 3 أشهر)
        </p>
      </div>

      <div className="space-y-6">
        {/* Document Upload */}
        <div className="space-y-3">
          <Label>مستند إثبات العنوان *</Label>
          
          {documentPreview ? (
            <div className="relative border-2 border-primary rounded-lg p-4">
              <button
                onClick={removeFile}
                className="absolute top-2 left-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
              <Image 
                src={documentPreview} 
                alt="Document" 
                width={400} 
                height={300} 
                className="w-full h-64 object-contain rounded"
              />
              <p className="text-center text-sm text-green-600 mt-2 flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                تم الرفع بنجاح
              </p>
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="font-medium">اضغط لرفع المستند</p>
                  <p className="text-sm text-muted-foreground">JPG, PNG, PDF (حجم أقصى 10MB)</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    يجب أن يحتوي المستند على: اسمك الكامل، عنوانك، وتاريخ حديث (آخر 3 أشهر)
                  </p>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              جاري الرفع... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setStep(1)} 
            disabled={uploading}
            className="flex-1"
          >
            <ArrowLeft className="ml-2 h-5 w-5" />
            السابق
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploading || !documentFile}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              'إرسال للمراجعة'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
