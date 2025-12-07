

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutGrid,
    Users,
    PlusCircle,
    ArrowDownUp,
    Briefcase,
    GalleryHorizontal,
    LogOut,
    Menu,
    Gift,
    Store,
    List,
    Package,
    ShoppingBag,
    Wallet,
    Shield,
    Newspaper,
    Gem,
    Send,
    MessageSquare,
    BarChart,
    ShieldCheck,
    Upload,
    BadgePercent,
    Settings,
    Activity,
    CircleDollarSign,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AuthProvider } from "@/hooks/useAuthContext";
import { AdminGuard } from "@/components/shared/AdminGuard";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useToast } from "@/hooks/use-toast";

const navLinks = [
    { href: "/admin/dashboard", icon: LayoutGrid, label: "لوحة التحكم" },
    { href: "/admin/users", icon: Users, label: "إدارة المستخدمين" },
    { href: "/admin/manage-accounts", icon: Briefcase, label: "إدارة الحسابات" },
    { href: "/admin/manage-verifications", icon: ShieldCheck, label: "إدارة التحققات"},
    { href: "/admin/manage-cashback", icon: PlusCircle, label: "إدارة الكاش باك" },
    { href: "/admin/bulk-cashback", icon: Upload, label: "رفع كاش باك بالجملة" },
    { href: "/admin/manage-withdrawals", icon: ArrowDownUp, label: "إدارة السحوبات" },
    { href: "/admin/manage-deposits", icon: CircleDollarSign, label: "إدارة الإيداعات" },
    { href: "/admin/manage-payment-methods", icon: Wallet, label: "طرق الدفع" },
    { href: "/admin/manage-brokers", icon: Briefcase, label: "إدارة الوسطاء" },
    { href: "/admin/blog", icon: Newspaper, label: "إدارة المدونة"},
    { href: "/admin/manage-levels", icon: BarChart, label: "إدارة المستويات"},
    { href: "/admin/manage-notifications", icon: Send, label: "إدارة الإشعارات"},
    { href: "/admin/manage-feedback", icon: MessageSquare, label: "إدارة الملاحظات"},
    { href: "/admin/manage-offers", icon: BadgePercent, label: "إدارة العروض" },
    { href: "/admin/manage-banner", icon: GalleryHorizontal, label: "إدارة البانر" },
    { href: "/admin/manage-contact", icon: Settings, label: "إعدادات الاتصال" },
    { href: "/admin/security-logs", icon: Activity, label: "سجلات الأمان" },
];

const storeLinks = [
    { href: "/admin/manage-categories", icon: List, label: "إدارة الفئات" },
    { href: "/admin/manage-products", icon: Package, label: "إدارة المنتجات" },
    { href: "/admin/manage-orders", icon: ShoppingBag, label: "إدارة الطلبات" },
];

function NavLinks({ currentPathname }: { currentPathname: string }) {
    return (
        <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground">الرئيسية</p>
            {navLinks.map(link => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
                        "bg-primary/10 text-primary": currentPathname === link.href,
                    })}
                >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                </Link>
            ))}
            <p className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground">المتجر</p>
            {storeLinks.map(link => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
                        "bg-primary/10 text-primary": currentPathname.startsWith(link.href),
                    })}
                >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                </Link>
            ))}
        </nav>
    );
}

function SidebarHeader() {
    return (
        <div className="p-4 border-b">
            <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </div>
                <span className="font-headline text-lg">لوحة التحكم</span>
            </Link>
        </div>
    )
}

function UserInfoFooter({ user }: { user: any }) {
    const router = useRouter();
    const { toast } = useToast();
    
    const onLogout = async () => {
        try {
            // Call middleware-managed logout endpoint to clear auth cookies
            const response = await fetch('/api/logout', {
                method: 'POST',
            });
            
            if (response.ok) {
                toast({ title: "تم تسجيل الخروج", description: "لقد قمت بتسجيل الخروج بنجاح."});
                router.push('/login');
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            toast({ variant: 'destructive', title: "خطأ", description: "Failed to log out." });
        }
    };
    
    return (
        <div className="mt-auto p-4 border-t space-y-2">
            <div className="text-sm">
                <p className="font-semibold">{user?.profile?.name || 'مشرف'}</p>
                <p className="text-muted-foreground">{user?.email}</p>
            </div>
             <Button
                variant="ghost"
                onClick={onLogout}
                className="w-full justify-start flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10"
            >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
            </Button>
        </div>
    )
}


export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    
    const { user } = useAuthContext();
    const pathname = usePathname();

    const DesktopNav = () => (
         <div className="flex flex-col h-full">
            <SidebarHeader />
            <NavLinks currentPathname={pathname} />
            <UserInfoFooter user={user} />
        </div>
    );
    
    const MobileNav = () => (
        <>
            <SheetHeader className="p-4 border-b">
                <SheetTitle>
                    <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                           <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        </div>
                        <span className="font-headline text-lg">لوحة التحكم</span>
                    </Link>
                </SheetTitle>
            </SheetHeader>
            <NavLinks currentPathname={pathname} />
            <UserInfoFooter user={user} />
        </>
    );

    return (
        <AuthProvider>
            <AdminGuard>
                 <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                    <aside className="hidden border-r bg-muted/40 md:block">
                        <DesktopNav />
                    </aside>
                    <div className="flex flex-col">
                        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">فتح قائمة التنقل</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="flex flex-col p-0 w-full max-w-sm">
                                    <MobileNav />
                                </SheetContent>
                            </Sheet>
                            <h1 className="text-lg font-semibold font-headline">لوحة المشرف</h1>
                        </header>
                        <main className="flex flex-1 flex-col p-4 lg:p-6">
                            {children}
                        </main>
                    </div>
                 </div>
            </AdminGuard>
        </AuthProvider>
    )
}
