'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Check, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

interface KycReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  documentType: string;
  nationality: string;
  frontUrl: string;
  backUrl?: string | null;
  selfieUrl?: string | null;
  submittedAt: Date;
  onApprove: (extractedData: ExtractedKycData) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

interface ExtractedKycData {
  fullName: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  documentNumber: string;
  documentIssueDate: string;
  documentExpiryDate: string;
}

export function KycReviewForm({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  documentType,
  nationality,
  frontUrl,
  backUrl,
  selfieUrl,
  submittedAt,
  onApprove,
  onReject,
}: KycReviewFormProps) {
  const [extractedData, setExtractedData] = useState<ExtractedKycData>({
    fullName: '',
    gender: 'male',
    dateOfBirth: '',
    documentNumber: '',
    documentIssueDate: '',
    documentExpiryDate: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    // Validate extracted data
    if (!extractedData.fullName || !extractedData.dateOfBirth || !extractedData.documentNumber) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة'
      });
      return;
    }

    setIsApproving(true);
    try {
      await onApprove(extractedData);
      toast({ title: 'تم', description: 'تم الموافقة على طلب التحقق' });
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل الموافقة على الطلب'
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى إدخال سبب الرفض'
      });
      return;
    }

    setIsRejecting(true);
    try {
      await onReject(rejectionReason);
      toast({ title: 'تم', description: 'تم رفض طلب التحقق' });
      setShowRejectDialog(false);
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل رفض الطلب'
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'driver_license': return 'رخصة القيادة';
      case 'id_card': return 'بطاقة الهوية';
      case 'passport': return 'جواز السفر';
      default: return type;
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showRejectDialog} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">مراجعة التحقق من الهوية (KYC)</DialogTitle>
            <div className="text-sm text-muted-foreground">
              <p>{userName} ({userEmail})</p>
              <p>تاريخ الإرسال: {format(submittedAt, 'dd/MM/yyyy - HH:mm')}</p>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side: Uploaded Documents */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">المستندات المرفوعة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">نوع الوثيقة: {getDocumentTypeLabel(documentType)}</p>
                    <p className="text-sm text-muted-foreground">الجنسية: {nationality}</p>
                  </div>

                  {/* Front Image */}
                  {frontUrl && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">الصورة الأمامية</p>
                      <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={frontUrl}
                          alt="Front Document"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Back Image */}
                  {backUrl && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">الصورة الخلفية</p>
                      <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={backUrl}
                          alt="Back Document"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Selfie */}
                  {selfieUrl && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">الصورة الشخصية</p>
                      <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={selfieUrl}
                          alt="Selfie"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Side: Data Extraction Form */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">استخراج البيانات من الوثيقة</CardTitle>
                  <p className="text-sm text-muted-foreground">قم بإدخال البيانات كما تظهر في الوثيقة</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">الاسم الكامل *</Label>
                    <Input
                      id="fullName"
                      value={extractedData.fullName}
                      onChange={(e) => setExtractedData({ ...extractedData, fullName: e.target.value })}
                      placeholder="كما يظهر في الوثيقة"
                      className="text-right"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender">الجنس *</Label>
                    <Select
                      value={extractedData.gender}
                      onValueChange={(value: 'male' | 'female') => 
                        setExtractedData({ ...extractedData, gender: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">تاريخ الميلاد *</Label>
                    <div className="relative">
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={extractedData.dateOfBirth}
                        onChange={(e) => setExtractedData({ ...extractedData, dateOfBirth: e.target.value })}
                      />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Document Number */}
                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">رقم الوثيقة *</Label>
                    <Input
                      id="documentNumber"
                      value={extractedData.documentNumber}
                      onChange={(e) => setExtractedData({ ...extractedData, documentNumber: e.target.value })}
                      placeholder="رقم الوثيقة"
                      className="text-right"
                    />
                  </div>

                  {/* Document Issue Date */}
                  <div className="space-y-2">
                    <Label htmlFor="documentIssueDate">تاريخ الإصدار</Label>
                    <Input
                      id="documentIssueDate"
                      type="date"
                      value={extractedData.documentIssueDate}
                      onChange={(e) => setExtractedData({ ...extractedData, documentIssueDate: e.target.value })}
                    />
                  </div>

                  {/* Document Expiry Date */}
                  <div className="space-y-2">
                    <Label htmlFor="documentExpiryDate">تاريخ الانتهاء</Label>
                    <Input
                      id="documentExpiryDate"
                      type="date"
                      value={extractedData.documentExpiryDate}
                      onChange={(e) => setExtractedData({ ...extractedData, documentExpiryDate: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  className="flex-1"
                  disabled={isApproving}
                >
                  <X className="ml-2 h-5 w-5" />
                  رفض
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting}
                  className="flex-1"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      جاري الموافقة...
                    </>
                  ) : (
                    <>
                      <Check className="ml-2 h-5 w-5" />
                      موافقة وحفظ البيانات
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض طلب التحقق</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">سبب الرفض *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="اذكر سبب رفض الطلب بوضوح"
                className="text-right mt-2"
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                disabled={isRejecting}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting}
                className="flex-1"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري الرفض...
                  </>
                ) : (
                  'تأكيد الرفض'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
