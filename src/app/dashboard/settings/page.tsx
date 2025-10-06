
"use client";

import { useAuthContext } from "@/hooks/useAuthContext";
import { Loader2, User, KeyRound, Copy, Star, Mail, ArrowLeft, Hash, ShieldCheck, Lock, Activity, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const settingsLinks = [
    { href: "/dashboard/profile", icon: User, label: "الملف الشخصي", description: "تعديل معلوماتك الشخصية." },
    { href: "/dashboard/settings/verification", icon: ShieldCheck, label: "التحقق", description: "أكمل KYC وافتح الميزات." },
    { href: "/dashboard/settings/security", icon: Lock, label: "الأمان", description: "إدارة كلمة المرور والمصادقة الثنائية." },
    { href: "/dashboard/settings/activity-logs", icon: Activity, label: "سجلات النشاط", description: "مراجعة نشاط الحساب الأخير." },
];

export default function SettingsPage() {
    const { user, isLoading } = useAuthContext();

    if (isLoading || !user?.profile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <PageHeader title="الإعدادات" description="إدارة حسابك والأمان والتحقق." />

            <div className="space-y-3">
                {settingsLinks.map(link => (
                     <Link href={link.href} key={link.href}>
                         <Card className="hover:bg-muted/50 transition-colors">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-md">
                                    <link.icon className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-grow">
                                    <h3 className="font-semibold">{link.label}</h3>
                                    <p className="text-xs text-muted-foreground">{link.description}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
