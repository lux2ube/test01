'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { CountrySelector } from '@/components/ui/country-selector';

interface KycSimpleUploadProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function KycSimpleUpload({ onSuccess, onCancel }: KycSimpleUploadProps) {
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState<'id_card' | 'passport' | 'driver_license' | null>(null);
  const [nationality, setNationality] = useState('');
  
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { toast } = useToast();
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'back' | 'selfie'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (type === 'front') {
        setFrontFile(file);
        setFrontPreview(preview);
      } else if (type === 'back') {
        setBackFile(file);
        setBackPreview(preview);
      } else {
        setSelfieFile(file);
        setSelfiePreview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (type: 'front' | 'back' | 'selfie') => {
    if (type === 'front') {
      setFrontFile(null);
      setFrontPreview(null);
      if (frontInputRef.current) frontInputRef.current.value = '';
    } else if (type === 'back') {
      setBackFile(null);
      setBackPreview(null);
      if (backInputRef.current) backInputRef.current.value = '';
    } else {
      setSelfieFile(null);
      setSelfiePreview(null);
      if (selfieInputRef.current) selfieInputRef.current.value = '';
    }
  };

  const handleNextStep = () => {
    if (!documentType || !nationality) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى اختيار نوع الوثيقة والدولة'
      });
      return;
    }
    setStep(2);
  };

  const uploadFile = async (file: File, docType: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentage);
        }
      });

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
  };

  const handleSubmit = async () => {
    if (!frontFile) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى رفع الصورة الأمامية للوثيقة'
      });
      return;
    }

    // For passport, back image is optional. For ID/Driver's license, it's required
    if (documentType !== 'passport' && !backFile) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى رفع الصورة الخلفية للوثيقة'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload front
      const frontUrl = await uploadFile(frontFile, 'kyc_front');
      
      // Upload back if exists
      let backUrl = null;
      if (backFile) {
        backUrl = await uploadFile(backFile, 'kyc_back');
      }

      // Upload selfie if exists
      let selfieUrl = null;
      if (selfieFile) {
        selfieUrl = await uploadFile(selfieFile, 'kyc_selfie');
      }

      // Submit to KYC API
      const response = await fetch('/api/verification/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          nationality,
          documentFrontUrl: frontUrl,
          documentBackUrl: backUrl,
          selfieUrl: selfieUrl,
        }),
      });

      if (response.ok) {
        toast({ 
          title: 'نجاح', 
          description: 'تم إرسال وثائق التحقق بنجاح. سيتم مراجعتها قريباً.' 
        });
        onSuccess();
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل رفع الوثائق. يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setUploading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">معلومات الوثيقة</h2>
          <p className="text-muted-foreground">اختر نوع الوثيقة والدولة المصدرة</p>
        </div>

        <div className="space-y-6">
          {/* Country Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">الدولة المصدرة</label>
            <CountrySelector
              value={nationality}
              onChange={setNationality}
              placeholder="اختر الدولة"
              onlyArab={true}
            />
          </div>

          {/* Document Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">نوع الوثيقة</label>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setDocumentType('driver_license')}
                className={`p-4 border-2 rounded-lg text-right transition-colors ${
                  documentType === 'driver_license' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">🪪</span>
                  <div className="text-right">
                    <p className="font-semibold">رخصة القيادة</p>
                    <p className="text-sm text-muted-foreground">يتطلب صورة أمامية وخلفية</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDocumentType('id_card')}
                className={`p-4 border-2 rounded-lg text-right transition-colors ${
                  documentType === 'id_card' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">🆔</span>
                  <div className="text-right">
                    <p className="font-semibold">بطاقة الهوية</p>
                    <p className="text-sm text-muted-foreground">يتطلب صورة أمامية وخلفية</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDocumentType('passport')}
                className={`p-4 border-2 rounded-lg text-right transition-colors ${
                  documentType === 'passport' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">📘</span>
                  <div className="text-right">
                    <p className="font-semibold">جواز السفر</p>
                    <p className="text-sm text-muted-foreground">يتطلب صورة الصفحة الرئيسية فقط</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              إلغاء
            </Button>
            <Button 
              onClick={handleNextStep} 
              disabled={!documentType || !nationality}
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
        <h2 className="text-2xl font-bold">رفع المستندات</h2>
        <p className="text-muted-foreground">
          قم برفع صور واضحة للوثيقة المطلوبة
        </p>
      </div>

      <div className="space-y-6">
        {/* Front Image */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            الصورة الأمامية {documentType === 'passport' ? '(صفحة البيانات)' : ''} *
          </label>
          
          {frontPreview ? (
            <div className="relative border-2 border-primary rounded-lg p-4">
              <button
                onClick={() => removeFile('front')}
                className="absolute top-2 left-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
              <Image 
                src={frontPreview} 
                alt="Front" 
                width={400} 
                height={300} 
                className="w-full h-48 object-contain rounded"
              />
              <p className="text-center text-sm text-green-600 mt-2 flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                تم الرفع بنجاح
              </p>
            </div>
          ) : (
            <>
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'front')}
                className="hidden"
              />
              <button
                onClick={() => frontInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="font-medium">اضغط لرفع الصورة</p>
                  <p className="text-sm text-muted-foreground">JPG, PNG, HEIC (حجم أقصى 10MB)</p>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Back Image (for ID card and driver's license) */}
        {documentType !== 'passport' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium">الصورة الخلفية *</label>
            
            {backPreview ? (
              <div className="relative border-2 border-primary rounded-lg p-4">
                <button
                  onClick={() => removeFile('back')}
                  className="absolute top-2 left-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
                <Image 
                  src={backPreview} 
                  alt="Back" 
                  width={400} 
                  height={300} 
                  className="w-full h-48 object-contain rounded"
                />
                <p className="text-center text-sm text-green-600 mt-2 flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  تم الرفع بنجاح
                </p>
              </div>
            ) : (
              <>
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'back')}
                  className="hidden"
                />
                <button
                  onClick={() => backInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <p className="font-medium">اضغط لرفع الصورة</p>
                    <p className="text-sm text-muted-foreground">JPG, PNG, HEIC (حجم أقصى 10MB)</p>
                  </div>
                </button>
              </>
            )}
          </div>
        )}

        {/* Selfie (optional) */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">صورة شخصية (اختياري)</label>
          
          {selfiePreview ? (
            <div className="relative border-2 border-primary rounded-lg p-4">
              <button
                onClick={() => removeFile('selfie')}
                className="absolute top-2 left-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
              <Image 
                src={selfiePreview} 
                alt="Selfie" 
                width={400} 
                height={300} 
                className="w-full h-48 object-contain rounded"
              />
              <p className="text-center text-sm text-green-600 mt-2 flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                تم الرفع بنجاح
              </p>
            </div>
          ) : (
            <>
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'selfie')}
                className="hidden"
              />
              <button
                onClick={() => selfieInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="font-medium">اضغط لرفع صورة شخصية</p>
                  <p className="text-sm text-muted-foreground">للتحقق الإضافي (اختياري)</p>
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
            disabled={uploading || !frontFile || (documentType !== 'passport' && !backFile)}
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
