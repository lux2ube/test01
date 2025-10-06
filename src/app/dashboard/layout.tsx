
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    CircleUser,
    Settings,
    LogOut,
    Bell,
    Check,
    MessageCircle,
    User,
    ShieldCheck,
    Lock,
    Activity,
    ChevronLeft,
    Home,
    Wallet,
    Briefcase,
    Store,
    Gift,
    SunMoon,
    Languages,
    Gem,
    X,
    ArrowUpCircle,
    MessageSquare,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { AuthProvider, useAuthContext } from "@/hooks/useAuthContext";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useEffect, useState, useCallback } from "react";
import type { Notification, ClientLevel } from "@/types";
import { getNotificationsForUser, markNotificationsAsRead, getClientLevels } from "@/app/actions";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";


function NotificationBell() {
    const { user } = useAuthContext();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        
        const fetchNotifications = async () => {
            try {
                const data = await getNotificationsForUser();
                if (data && Array.isArray(data)) {
                    setNotifications(data);
                    setUnreadCount(data.filter(n => !n.isRead).length);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
                setNotifications([]);
                setUnreadCount(0);
            }
        };
        fetchNotifications();
        
        // Poll for new notifications
        const intervalId = setInterval(fetchNotifications, 30000); // every 30 seconds
        return () => clearInterval(intervalId);

    }, [user]);

    const handleMarkAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        if (unreadIds.length > 0) {
            await markNotificationsAsRead(unreadIds);
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        }
    };

    return (
        <Popover onOpenChange={(open) => { if (!open) handleMarkAsRead(); }}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-2 border-b">
                    <h3 className="font-semibold text-sm">الإشعارات</h3>
                </div>
                <ScrollArea className="h-80">
                    <div className="p-2 space-y-1">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <Link href={n.link || '/dashboard'} key={n.id} className="block">
                                    <div className={cn("p-2 rounded-md hover:bg-muted", !n.isRead && "bg-primary/10")}>
                                        <p className="text-sm">{n.message}</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(n.createdAt, { addSuffix: true })}</p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="p-4 text-center text-sm text-muted-foreground">لا توجد إشعارات بعد.</p>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-sm" onClick={handleMarkAsRead}>
                        <Check className="ml-2 h-4 w-4" />
                        وضع علامة "مقروء" على الكل
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

const settingsLinks = [
    { href: "/dashboard/profile", icon: User, label: "الملف الشخصي", description: "تعديل معلوماتك الشخصية." },
    { href: "/dashboard/settings/verification", icon: ShieldCheck, label: "التحقق", description: "أكمل KYC وافتح الميزات." },
    { href: "/dashboard/settings/security", icon: Lock, label: "الأمان", description: "إدارة كلمة المرور والمصادقة الثنائية." },
    { href: "/dashboard/settings/activity-logs", icon: Activity, label: "سجلات النشاط", description: "مراجعة نشاط الحساب الأخير." },
];

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M16.75 13.96c.25.58.11 1.25-.37 1.62l-1.43.93c-.23.16-.54.2-.8.09c-.66-.27-1.39-.68-2.09-1.22c-.75-.58-1.38-1.29-1.89-2.07c-.16-.25-.13-.59.08-.81l.93-1.43c.37-.48 1.04-.62 1.62-.37l1.93.83c.58.25.86.9.61 1.48l-.53 1.21zM12 2a10 10 0 0 0-10 10a10 10 0 0 0 10 10c.39 0 .78-.04 1.15-.09l3.85 1.19l-1.19-3.85A9.9 9.9 0 0 0 22 12a10 10 0 0 0-10-10z"></path></svg>
);

const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M22 12A10 10 0 0 0 12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10c.39 0 .78-.04 1.15-.09l3.85 1.19l-1.19-3.85A9.9 9.9 0 0 0 22 12m-9.01-1.13l-4.22 1.61c-.5.19-.51.52-.03.7l1.75.54l.54 1.75c.18.48.51.47.7.03l1.61-4.22c.19-.5-.04-.84-.55-.61M14.26 14l-2.61-2.61l.96-.97l3.62 3.63l-.97.95z"></path></svg>
);

const supportLinks = [
    { href: "#", icon: WhatsAppIcon, label: "واتساب" },
    { href: "#", icon: TelegramIcon, label: "تليجرام" },
]

function SettingsSidebar() {
    const { user, isLoading } = useAuthContext();
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();
    const [theme, setTheme] = useState('light');
    const [levels, setLevels] = useState<ClientLevel[]>([]);

    useEffect(() => {
        getClientLevels().then(setLevels);
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        setTheme(currentTheme);
    }, []);

    const toggleTheme = (isDark: boolean) => {
        setTheme(isDark ? 'dark' : 'light');
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
    
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
    
    const userLevel = user?.profile?.level;
    const levelName = levels.find(l => l.id === userLevel)?.name || 'New';
    const currentLevel = levels.find(l => l.id === userLevel);
    const nextLevel = levels.find(l => l.id === (userLevel || 0) + 1);
    const monthlyEarnings = user?.profile?.monthlyEarnings || 0;
    const progress = nextLevel && !isLoading ? Math.min((monthlyEarnings / nextLevel.required_total) * 100, 100) : 0;


    return (
        <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b text-right flex-shrink-0 flex flex-row justify-between items-center">
                <SheetTitle>الإعدادات</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-grow">
                <div className="p-4 space-y-4">
                    <Card>
                        <CardContent className="p-3 space-y-3">
                             <Link href="/dashboard/profile" className="flex items-start gap-3">
                                 <Avatar className="h-12 w-12">
                                    <AvatarFallback className="text-xl bg-primary/20 text-primary font-bold">
                                        {user?.profile?.name ? user.profile.name.charAt(0).toUpperCase() : '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <h3 className="font-semibold">{isLoading ? <Skeleton className="h-5 w-24" /> : user?.profile?.name}</h3>
                                    <p className="text-xs text-muted-foreground">{isLoading ? <Skeleton className="h-4 w-32 mt-1" /> : user?.profile?.email}</p>
                                    <Badge variant="secondary" className="mt-1 gap-1.5">
                                        <Gem className="h-3 w-3 text-primary" />
                                        {isLoading ? <Skeleton className="h-4 w-12" /> : (currentLevel?.name || 'New')}
                                    </Badge>
                                </div>
                            </Link>
                             <div className="space-y-2">
                                { isLoading ? <Skeleton className="h-1.5 w-full" /> : <Progress value={progress} className="h-1.5" /> }
                                <div className="text-center">
                                    {isLoading ? (
                                        <Skeleton className="h-5 w-28 mx-auto" />
                                    ) : nextLevel ? (
                                        <SheetClose asChild>
                                        <Button asChild variant="link" size="sm" className="text-xs h-auto p-0">
                                            <Link href="/dashboard/loyalty">
                                                <ArrowUpCircle className="ml-1 h-3 w-3" />
                                                الترقية إلى {nextLevel.name}
                                            </Link>
                                        </Button>
                                        </SheetClose>
                                    ) : (
                                        <p className="text-xs text-primary font-semibold">أعلى مستوى!</p>
                                    )}
                                </div>
                            </div>
                            <Separator />
                             <Button variant="ghost" onClick={onLogout} className="w-full justify-start flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10 h-auto -mx-3 -mb-3">
                                <LogOut className="h-5 w-5" />
                                <span className="text-sm font-medium flex-grow text-right">تسجيل الخروج</span>
                            </Button>
                        </CardContent>
                    </Card>

                    <nav className="flex flex-col gap-2">
                        {settingsLinks.map(link => (
                            <SheetClose asChild key={link.href}>
                                <Link
                                    href={link.href}
                                    className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10", {
                                        "bg-primary/10 text-primary": pathname === link.href,
                                    })}
                                >
                                    <link.icon className="h-5 w-5" />
                                    <div className="flex-grow text-sm font-medium">{link.label}</div>
                                    <ChevronLeft className="h-4 w-4" />
                                </Link>
                            </SheetClose>
                        ))}
                        <SheetClose asChild>
                        <Link
                            href="/dashboard/loyalty"
                            className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10", {
                                    "bg-primary/10 text-primary": pathname === '/dashboard/loyalty',
                                })}
                        >
                            <Gem className="h-5 w-5" />
                            <div className="flex-grow text-sm font-medium">برنامج الولاء</div>
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                        </SheetClose>
                    </nav>
                    
                    <Separator />
                    
                    <p className="px-3 text-xs font-semibold text-muted-foreground">الدعم</p>
                     <nav className="flex flex-col gap-2">
                        {supportLinks.map(link => (
                             <SheetClose asChild key={link.label}>
                                <Link
                                    href={link.href}
                                    className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10"
                                >
                                    <link.icon />
                                    <div className="flex-grow text-sm font-medium">{link.label}</div>
                                     <ChevronLeft className="h-4 w-4" />
                                </Link>
                            </SheetClose>
                        ))}
                    </nav>

                    <Separator />
                    
                     <p className="px-3 text-xs font-semibold text-muted-foreground">التفضيلات</p>
                     <div className="flex items-center gap-3 rounded-md px-3 py-2">
                        <SunMoon className="h-5 w-5 text-muted-foreground" />
                        <Label htmlFor="dark-mode" className="text-sm font-medium flex-grow">السمة</Label>
                        <Switch id="dark-mode" checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                    </div>
                    <SheetClose asChild>
                     <Link
                        href="#"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10"
                    >
                        <Languages className="h-5 w-5" />
                        <div className="flex-grow text-sm font-medium">اللغة</div>
                        <span className="text-sm text-muted-foreground">العربية</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                    </SheetClose>

                </div>
            </ScrollArea>
        </div>
    )
}

function BottomNavBar() {
    const pathname = usePathname();
    const navItems = [
        { href: "/dashboard", icon: Home, label: "الرئيسية" },
        { href: "/dashboard/withdraw", icon: Wallet, label: "المحفظة" },
        { href: "/dashboard/store", icon: Store, label: "المتجر" },
        { href: "/dashboard/referrals", icon: Gift, label: "الدعوات" },
    ];

    const fabItem = { href: "/dashboard/brokers", icon: Briefcase, label: "الوسطاء" };

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
            <div className="grid h-full grid-cols-5 max-w-lg mx-auto">
                {navItems.slice(0, 2).map((item) => (
                    <Link key={item.href} href={item.href} className="inline-flex flex-col items-center justify-center font-medium px-5 hover:bg-muted group">
                        <item.icon className={cn("h-5 w-5 mb-1 text-muted-foreground group-hover:text-primary", { "text-primary": pathname === item.href })} />
                        <span className={cn("text-xs text-muted-foreground group-hover:text-primary", { "text-primary": pathname === item.href })}>{item.label}</span>
                    </Link>
                ))}
                
                <div className="relative flex items-center justify-center">
                    <Link href={fabItem.href} className="absolute bottom-4 inline-flex items-center justify-center w-14 h-14 font-medium bg-primary rounded-full text-primary-foreground shadow-lg hover:bg-primary/90">
                        <fabItem.icon className="h-6 w-6" />
                    </Link>
                </div>

                {navItems.slice(2).map((item) => (
                     <Link key={item.href} href={item.href} className="inline-flex flex-col items-center justify-center font-medium px-5 hover:bg-muted group">
                        <item.icon className={cn("h-5 w-5 mb-1 text-muted-foreground group-hover:text-primary", { "text-primary": pathname.startsWith(item.href) })} />
                        <span className={cn("text-xs text-muted-foreground group-hover:text-primary", { "text-primary": pathname.startsWith(item.href) })}>{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}

function DesktopSidebar() {
    const pathname = usePathname();
    const { user } = useAuthContext();
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
    
    const navItems = [
        { href: "/dashboard", icon: Home, label: "الرئيسية" },
        { href: "/dashboard/brokers", icon: Briefcase, label: "الوسطاء" },
        { href: "/dashboard/my-accounts", icon: ShieldCheck, label: "حساباتي" },
        { href: "/dashboard/withdraw", icon: Wallet, label: "المحفظة" },
        { href: "/dashboard/store", icon: Store, label: "المتجر" },
        { href: "/dashboard/referrals", icon: Gift, label: "الدعوات" },
        { href: "/dashboard/loyalty", icon: Gem, label: "برنامج الولاء" },
    ];

    return (
        <aside className="hidden md:block w-64 border-r bg-muted/40 p-4">
             <div className="flex flex-col h-full">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold mb-6">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </div>
                    <span className="font-headline text-lg">رفيق الكاش باك</span>
                </Link>

                <nav className="flex-1 space-y-2">
                    {navItems.map(item => (
                         <Link
                            key={item.href}
                            href={item.href}
                            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
                                "bg-primary/10 text-primary": pathname === item.href,
                            })}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="mt-auto space-y-2">
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/dashboard/profile"><Settings className="h-4 w-4" /> الإعدادات</Link>
                    </Button>
                    <Button variant="ghost" onClick={onLogout} className="w-full justify-start">
                        <LogOut className="h-4 w-4" /> تسجيل الخروج
                    </Button>
                </div>
            </div>
        </aside>
    )
}

function ContactMenu() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="relative h-9 gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>تواصل معنا</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end">
                <div className="flex flex-col gap-1">
                    {supportLinks.map(link => (
                        <Button key={link.label} asChild variant="ghost" className="justify-start gap-3 px-3">
                             <a href={link.href} target="_blank" rel="noopener noreferrer">
                                <link.icon />
                                <span>{link.label}</span>
                            </a>
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    
    return (
        <AuthProvider>
            <AuthGuard>
                <div className="flex min-h-screen w-full">
                    <DesktopSidebar />
                    <div className="flex flex-col flex-1">
                        <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 z-10 md:hidden">
                            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                </div>
                            </Link>
                            
                            <div className="mr-auto flex items-center gap-2">
                                <ContactMenu />
                                <NotificationBell />
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="secondary" size="icon" className="rounded-full h-9 w-9">
                                            <Settings className="h-5 w-5" />
                                            <span className="sr-only">فتح لوحة الإعدادات</span>
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="right" className="p-0 w-full max-w-xs flex flex-col">
                                        <SettingsSidebar />
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </header>
                        <main className="flex-1 pb-16 md:pb-0">
                            {children}
                        </main>
                        <BottomNavBar />
                    </div>
                </div>
            </AuthGuard>
        </AuthProvider>
    )
}
