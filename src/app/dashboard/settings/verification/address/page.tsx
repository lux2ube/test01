"use client";

import { useAuthContext } from "@/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressSimpleUpload } from "@/components/verification/AddressSimpleUpload";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AddressVerificationPage() {
    const { user, isLoading, refetchUserData } = useAuthContext();
    const router = useRouter();

    if (isLoading || !user?.profile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleSuccess = async () => {
        await refetchUserData();
        router.push('/dashboard/settings/verification');
    };

    const handleCancel = () => {
        router.push('/dashboard/settings/verification');
    };

    return (
        <div className="max-w-3xl mx-auto w-full px-4 py-4 space-y-6">
            <Button 
                variant="ghost" 
                onClick={handleCancel}
                className="h-auto p-0 text-sm"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                العودة إلى التحقق
            </Button>
            
            <PageHeader 
                title="التحقق من العنوان" 
                description="قم برفع مستند رسمي يثبت عنوان إقامتك"
            />

            <AddressSimpleUpload
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />
        </div>
    );
}
