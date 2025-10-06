
"use client";

import { useAuthContext } from "@/hooks/useAuthContext";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isLoading } = useAuthContext();
    const router = useRouter();

    if (isLoading || !user?.profile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-4">
            <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm self-start">
                <ArrowLeft className="mr-2 h-4 w-4" />
                العودة
            </Button>
            {children}
        </div>
    );
}
