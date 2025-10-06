'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, Globe, Hash, User as UserIcon, MapPin, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import type { KycData, AddressData } from '@/types';
import Image from 'next/image';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'KYC' | 'Address';
  data: KycData | AddressData;
  userName: string;
  userEmail: string;
}

export function DocumentViewer({ isOpen, onClose, type, data, userName, userEmail }: DocumentViewerProps) {
  const isKyc = type === 'KYC';
  const kycData = isKyc ? (data as KycData) : null;
  const addressData = !isKyc ? (data as AddressData) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isKyc ? 'تفاصيل التحقق من الهوية (KYC)' : 'تفاصيل التحقق من العنوان'}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <p>{userName} ({userEmail})</p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* KYC Details */}
          {isKyc && kycData && (
            <>
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    المعلومات الشخصية
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">الاسم الكامل</p>
                    <p className="text-base font-semibold">{kycData.fullName || 'غير متوفر'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">الجنس</p>
                    <p className="text-base">{kycData.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">تاريخ الميلاد</p>
                    <p className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {kycData.dateOfBirth ? format(new Date(kycData.dateOfBirth), 'dd/MM/yyyy') : 'غير متوفر'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">الجنسية</p>
                    <p className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {kycData.nationality || 'غير متوفر'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Document Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    معلومات الوثيقة
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">نوع الوثيقة</p>
                    <Badge variant="secondary">
                      {kycData.documentType === 'id_card' ? 'بطاقة الهوية الوطنية' : 'جواز السفر'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">رقم الوثيقة</p>
                    <p className="text-base flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      {kycData.documentNumber || 'غير متوفر'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">تاريخ الإصدار</p>
                    <p className="text-base">
                      {kycData.documentIssueDate ? format(new Date(kycData.documentIssueDate), 'dd/MM/yyyy') : 'غير متوفر'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">تاريخ الانتهاء</p>
                    <p className="text-base">
                      {kycData.documentExpiryDate ? format(new Date(kycData.documentExpiryDate), 'dd/MM/yyyy') : 'غير متوفر'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Document Images */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">صور الوثيقة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {kycData.documentFrontUrl && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">الوجه الأمامي</p>
                      <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={kycData.documentFrontUrl}
                          alt="Front Document"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                  {kycData.documentBackUrl && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">الوجه الخلفي</p>
                      <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={kycData.documentBackUrl}
                          alt="Back Document"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                  {!kycData.documentFrontUrl && !kycData.documentBackUrl && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      لا توجد صور للوثيقة
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Address Details */}
          {!isKyc && addressData && (
            <>
              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    معلومات العنوان
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">الدولة</p>
                    <p className="text-base font-semibold">{addressData.country || 'غير متوفر'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">المدينة</p>
                    <p className="text-base">{addressData.city || 'غير متوفر'}</p>
                  </div>
                  {addressData.stateProvince && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">المنطقة / الولاية</p>
                      <p className="text-base">{addressData.stateProvince}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">الرمز البريدي</p>
                    <p className="text-base flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      {addressData.postalCode || 'غير متوفر'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">عنوان الشارع</p>
                    <p className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {addressData.streetAddress || 'غير متوفر'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Address Document */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">مستند إثبات العنوان</CardTitle>
                </CardHeader>
                <CardContent>
                  {addressData.documentUrl ? (
                    <div className="relative w-full h-96 border rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={addressData.documentUrl}
                        alt="Address Proof Document"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      لا يوجد مستند إثبات عنوان
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Submission Date */}
          <div className="text-sm text-muted-foreground">
            <p>تاريخ الإرسال: {format(new Date(data.submittedAt), 'dd/MM/yyyy - HH:mm')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
