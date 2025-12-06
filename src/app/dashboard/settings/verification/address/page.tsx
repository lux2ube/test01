"use client";

import { useAuthContext } from "@/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ArrowLeft, Clock, CheckCircle2, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddressSimpleUpload } from "@/components/verification/AddressSimpleUpload";
import { PageHeader } from "@/components/shared/PageHeader";
import { getCountryDisplay } from "@/lib/countries";

export default function AddressVerificationPage() {
    const { user, isLoading, refetchUserData } = useAuthContext();
    const router = useRouter();
    const [showChangeForm, setShowChangeForm] = useState(false);

    if (isLoading || !user?.profile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleSuccess = async () => {
        await refetchUserData();
        setShowChangeForm(false);
        router.push('/dashboard/settings/verification');
    };

    const handleCancel = () => {
        if (showChangeForm) {
            setShowChangeForm(false);
        } else {
            router.push('/dashboard/settings/verification');
        }
    };

    const { profile } = user;
    const addressStatus = profile.addressData?.status;
    const submittedCountry = profile.addressData?.country;
    const currentCountry = profile.country;
    const rejectionReason = profile.addressData?.rejectionReason;

    const renderPendingState = () => (
        <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-100 rounded-full">
                        <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">قيد المراجعة</h3>
                        <p className="text-sm text-muted-foreground">طلبك قيد المراجعة من قبل الإدارة</p>
                    </div>
                    <Badge variant="secondary" className="mr-auto">قيد الانتظار</Badge>
                </div>
                
                {submittedCountry && (
                    <div className="p-4 bg-white rounded-lg border">
                        <p className="text-sm text-muted-foreground mb-1">الدولة المقدمة:</p>
                        <p className="font-medium text-lg">{getCountryDisplay(submittedCountry, 'ar')}</p>
                    </div>
                )}
                
                <Alert>
                    <AlertDescription>
                        سيتم إعلامك عند اكتمال المراجعة. يرجى الانتظار.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );

    const renderVerifiedState = () => (
        <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-full">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">تم التحقق</h3>
                        <p className="text-sm text-muted-foreground">تم التحقق من دولة إقامتك بنجاح</p>
                    </div>
                    <Badge variant="default" className="mr-auto bg-green-600">تم التحقق</Badge>
                </div>
                
                <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">دولة الإقامة:</p>
                    </div>
                    <p className="font-medium text-lg">{getCountryDisplay(currentCountry, 'ar')}</p>
                </div>
                
                <Button 
                    variant="outline" 
                    onClick={() => setShowChangeForm(true)}
                    className="w-full"
                >
                    <RefreshCw className="h-4 w-4 ml-2" />
                    تغيير دولة الإقامة
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                    سيتطلب التغيير موافقة الإدارة مرة أخرى
                </p>
            </CardContent>
        </Card>
    );

    const renderRejectedState = () => (
        <div className="space-y-4">
            {rejectionReason && (
                <Alert variant="destructive">
                    <AlertDescription>
                        <strong>سبب الرفض:</strong> {rejectionReason}
                    </AlertDescription>
                </Alert>
            )}
            <AddressSimpleUpload
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                userCountry={submittedCountry || currentCountry}
            />
        </div>
    );

    const renderFormState = () => (
        <AddressSimpleUpload
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            userCountry={submittedCountry || currentCountry}
        />
    );

    const getTitle = () => {
        if (addressStatus === 'Pending') return 'حالة طلب التحقق';
        if (addressStatus === 'Verified' && !showChangeForm) return 'دولة الإقامة';
        return 'تحديد دولة الإقامة';
    };

    const getDescription = () => {
        if (addressStatus === 'Pending') return 'طلبك قيد المراجعة';
        if (addressStatus === 'Verified' && !showChangeForm) return 'تم التحقق من دولة إقامتك';
        if (addressStatus === 'Rejected') return 'يرجى تقديم طلب جديد';
        return 'اختر الدولة التي تقيم فيها حالياً';
    };

    const renderContent = () => {
        if (showChangeForm) {
            return renderFormState();
        }
        
        switch (addressStatus) {
            case 'Pending':
                return renderPendingState();
            case 'Verified':
                return renderVerifiedState();
            case 'Rejected':
                return renderRejectedState();
            default:
                return renderFormState();
        }
    };

    return (
        <div className="max-w-3xl mx-auto w-full px-4 py-4 space-y-6">
            <Button 
                variant="ghost" 
                onClick={handleCancel}
                className="h-auto p-0 text-sm"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {showChangeForm ? 'إلغاء' : 'العودة إلى التحقق'}
            </Button>
            
            <PageHeader 
                title={getTitle()} 
                description={getDescription()}
            />

            {renderContent()}
        </div>
    );
}
