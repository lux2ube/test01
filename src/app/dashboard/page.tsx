
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/useAuthContext";
import { DollarSign, Briefcase, PlusCircle, Landmark, ArrowRight, Users, Gift, Copy, Wallet, MessageSquare, ChevronLeft, KeyRound, History, Settings, Store, ShoppingBag, Download, BadgePercent, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import Link from 'next/link';
import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import type { TradingAccount, FeedbackForm, Offer, BannerSettings, UserProfile } from "@/types";
import { getUserBalance, getUserTradingAccounts, getUnifiedTransactionHistory, getActiveFeedbackFormForUser, submitFeedbackResponse, getEnabledOffers, type UnifiedTransaction } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getClientSessionInfo } from "@/lib/device-info";
import { UserFeedbackForm } from "@/components/user/FeedbackForm";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


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


interface DashboardStats {
    availableBalance: number;
    totalEarned: number;
    linkedAccounts: TradingAccount[];
    pendingWithdrawals: number;
    completedWithdrawals: number;
    totalReferrals: number;
    referralCommission: number;
    totalSpentOnOrders: number;
}

function OffersTabContent() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { user } = useAuthContext();

    useEffect(() => {
        async function fetchAndFilterOffers() {
            if (!user?.profile) {
                setIsLoading(false);
                return;
            }
            try {
                const allOffers = await getEnabledOffers() as Offer[];
                
                const { geoInfo } = await getClientSessionInfo();
                const userCountry = geoInfo.country;

                const filteredOffers = allOffers.filter(offer => {
                    const hasCountryTargeting = offer.targetCountries && offer.targetCountries.length > 0;
                    const countryMatch = !hasCountryTargeting || (userCountry && offer.targetCountries!.includes(userCountry)) || !userCountry;
                    
                    const hasLevelTargeting = offer.targetLevels && offer.targetLevels.length > 0;
                    const levelMatch = !hasLevelTargeting || offer.targetLevels!.includes(String(user.profile!.level));

                    const hasStatusTargeting = offer.targetStatuses && offer.targetStatuses.length > 0;
                    const statusMatch = !hasStatusTargeting || offer.targetStatuses!.includes(user.profile!.status);
                    
                    return countryMatch && levelMatch && statusMatch;
                });
                
                setOffers(filteredOffers);
            } catch (error) {
                console.error("Error fetching offers:", error);
                toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحميل العروض.' });
            } finally {
                setIsLoading(false);
            }
        }
        fetchAndFilterOffers();
    }, [toast, user]);
    
    const renderOffer = (offer: Offer) => {
        const { type, title, description, ctaText, ctaLink, scriptCode } = offer;
        
        if (type === 'text') {
            return (
                <Card dir="rtl" className="bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
                        <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-primary to-secondary rounded-lg shrink-0">
                            <Gift className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="flex-grow">
                            <CardTitle className="text-base font-bold">{title}</CardTitle>
                            {description && <CardDescription className="text-xs mt-1 line-clamp-2">{description}</CardDescription>}
                        </div>
                    </CardHeader>
                    <CardContent>
                         {description && (
                            <Accordion type="single" collapsible>
                                <AccordionItem value="item-1" className="border-b-0">
                                    <AccordionTrigger className="text-xs justify-end py-1">عرض المزيد</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-xs text-muted-foreground whitespace-pre-line">{description}</p>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        )}
                    </CardContent>
                    {ctaText && ctaLink && (
                        <CardFooter className="pt-3">
                            <Button asChild size="sm" className="w-full">
                                <a href={ctaLink} target="_blank" rel="noopener noreferrer">
                                    {ctaText} <ArrowRight className="mr-2 h-4 w-4" />
                                </a>
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            );
        }

        if (type === 'script' && scriptCode) {
            return <div dangerouslySetInnerHTML={{ __html: scriptCode }} />;
        }
        
        return null;
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (offers.length === 0) {
        return (
            <Card className="mt-4">
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                    لا توجد عروض متاحة حاليًا.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4 mt-4">
            {offers.map(offer => (
                <div key={offer.id}>
                    {renderOffer(offer)}
                </div>
            ))}
        </div>
    );
}

function PromoBanner() {
    const bannerContainerRef = useRef<HTMLDivElement>(null);
    const { user } = useAuthContext();
    const [settings, setSettings] = useState<BannerSettings | null>(null);
    const [isBannerVisible, setIsBannerVisible] = useState(false);
    useEffect(() => {
        if(typeof window !== 'undefined') {
            import('@/app/admin/actions').then(actions => {
                actions.getBannerSettings().then(setSettings);
            });
        }
    }, []);
    useEffect(() => {
        if (!settings || !settings.isEnabled || !user?.profile) {
            setIsBannerVisible(false);
            return;
        }
        const checkTargeting = async () => {
            const { targetCountries, targetLevels, targetStatuses } = settings;
            const { geoInfo } = await getClientSessionInfo();
            const userCountry = geoInfo.country;

            const hasCountryTargeting = targetCountries && targetCountries.length > 0;
            const countryMatch = !hasCountryTargeting || (userCountry && targetCountries.includes(userCountry)) || !userCountry;

            const hasLevelTargeting = targetLevels && targetLevels.length > 0;
            const levelMatch = !hasLevelTargeting || targetLevels.includes(String(user.profile!.level));

            const hasStatusTargeting = targetStatuses && targetStatuses.length > 0;
            const statusMatch = !hasStatusTargeting || targetStatuses.includes(user.profile!.status);

            setIsBannerVisible(countryMatch && levelMatch && statusMatch);
        };

        checkTargeting();
    }, [settings, user]);
    
    useEffect(() => {
        const container = bannerContainerRef.current;
        if (!container || !isBannerVisible || settings?.type !== 'script' || !settings.scriptCode) {
            return;
        }
        container.innerHTML = '';
        const template = document.createElement('template');
        template.innerHTML = settings.scriptCode.trim();
        const scriptNode = template.content.firstChild;
        if (scriptNode instanceof HTMLScriptElement) {
             const script = document.createElement('script');
             if (scriptNode.src) script.src = scriptNode.src;
             if (scriptNode.id) script.id = scriptNode.id;
             script.async = scriptNode.async;
             script.innerHTML = scriptNode.innerHTML;
             for(let i = 0; i < scriptNode.attributes.length; i++) {
                 const attr = scriptNode.attributes[i];
                 if(attr.name !== 'src' && attr.name !== 'id' && attr.name !== 'async') {
                    script.setAttribute(attr.name, attr.value);
                 }
             }
             container.appendChild(script);
        } else {
             container.appendChild(template.content.cloneNode(true));
        }
    }, [settings, isBannerVisible]);

    if (!isBannerVisible) {
        return null;
    }

    if (settings?.type === 'text') {
        return (
            <Alert className="my-4">
                {settings.title && <AlertTitle>{settings.title}</AlertTitle>}
                {settings.text && <AlertDescription>{settings.text}</AlertDescription>}
                {settings.ctaText && settings.ctaLink && (
                    <div className="mt-4">
                        <Button asChild>
                            <a href={settings.ctaLink} target="_blank" rel="noopener noreferrer">
                                {settings.ctaText}
                            </a>
                        </Button>
                    </div>
                )}
            </Alert>
        )
    }

    if (settings?.type === 'script') {
        return <div ref={bannerContainerRef} className="my-4 w-full flex justify-center"></div>;
    }

    return null;
}
export default function UserDashboardPage() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    availableBalance: 0,
    totalEarned: 0,
    linkedAccounts: [],
    pendingWithdrawals: 0,
    completedWithdrawals: 0,
    totalReferrals: 0,
    referralCommission: 0,
    totalSpentOnOrders: 0,
  });
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFeedbackForm, setActiveFeedbackForm] = useState<FeedbackForm | null>(null);

  // PWA Install Prompt Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      
      const pwaPromptShown = localStorage.getItem('pwaPromptShown');
      if (pwaPromptShown) {
        return;
      }
      
      const deferredPrompt = e as any;

      toast({
        title: "📲 تثبيت التطبيق",
        description: "أضف موقعنا إلى شاشتك الرئيسية لتسهيل الوصول إليه.",
        action: (
          <Button
            size="sm"
            onClick={async () => {
              deferredPrompt.prompt();
              const { outcome } = await deferredPrompt.userChoice;
              if (outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
              } else {
                console.log('User dismissed the A2HS prompt');
              }
              localStorage.setItem('pwaPromptShown', 'true');
            }}
          >
            <Download className="ml-2 h-4 w-4" />
            تثبيت
          </Button>
        ),
        duration: 30000,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast]);


  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const [balanceData, linkedAccounts, allTransactions, feedbackForm] = await Promise.all([
            getUserBalance(),
            getUserTradingAccounts(),
            getUnifiedTransactionHistory(),
            getActiveFeedbackFormForUser()
          ]);
          
          const referralCommission = allTransactions
            .filter(tx => tx.type === 'referral_commission')
            .reduce((sum, tx) => sum + tx.amount, 0);

          setStats({
            ...balanceData,
            linkedAccounts,
            totalReferrals: user.profile?.referrals?.length || 0,
            referralCommission,
          });
          setTransactions(allTransactions);
          setActiveFeedbackForm(feedbackForm);

        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setIsLoading(false);
        }
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full min-h-[calc(100vh-theme(spacing.14))]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Pending': return 'secondary';
        case 'Rejected': return 'destructive';
        default: return 'outline';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
        case 'Approved': return 'مقبول';
        case 'Pending': return 'معلق';
        case 'Rejected': return 'مرفوض';
        default: return status;
    }
  };

  return (
    <div className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-4 space-y-4 max-w-2xl">
            
            <PromoBanner />
            <UserFeedbackForm form={activeFeedbackForm} />

            <Tabs defaultValue="wallet" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="wallet">محفظة UTSPAY</TabsTrigger>
                    <TabsTrigger value="offers">العروض</TabsTrigger>
                </TabsList>
                <TabsContent value="wallet" className="space-y-4">
                    <h2 className="text-lg font-semibold mt-4 text-right">خصومات الحساب</h2>
                    <Card className="bg-slate-800 text-white shadow-lg overflow-hidden">
                        <CardContent className="p-4 relative">
                            <div className="absolute top-0 right-0 w-full h-full bg-slate-900/20" style={{ backgroundImage: `radial-gradient(circle at top left, hsl(var(--primary) / 0.15), transparent 50%)`}}></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-base font-semibold text-gray-300">COIN CASH</h3>
                                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                      <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <p className="text-xs text-gray-400">إجمالي الكاش باك</p>
                                    <p className="text-3xl font-bold">${stats.availableBalance.toFixed(2)}</p>
                                </div>
                                <div className="mt-4 grid grid-cols-4 divide-x divide-slate-700">
                                    <div className="pr-2 text-center">
                                        <p className="text-xs text-gray-400">الوارد</p>
                                        <p className="font-semibold text-sm">${stats.totalEarned.toFixed(2)}</p>
                                    </div>
                                     <div className="px-2 text-center">
                                        <p className="text-xs text-gray-400">الصادر</p>
                                        <p className="font-semibold text-sm">${stats.completedWithdrawals.toFixed(2)}</p>
                                    </div>
                                     <div className="px-2 text-center">
                                        <p className="text-xs text-gray-400">قيد الانتظار</p>
                                        <p className="font-semibold text-sm">${stats.pendingWithdrawals.toFixed(2)}</p>
                                    </div>
                                    <div className="pl-2 text-center">
                                        <p className="text-xs text-gray-400">المتجر</p>
                                        <p className="font-semibold text-sm">${stats.totalSpentOnOrders.toFixed(2)}</p>
                                    </div>
                                </div>
                                 <div className="mt-2 pt-2 border-t border-slate-700">
                                    <p className="text-xs text-gray-400">أرباح الإحالات</p>
                                    <p className="font-semibold text-sm text-green-400">+${stats.referralCommission.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-2 border-t border-slate-700 bg-slate-800/50 grid grid-cols-2 gap-2">
                           <Button asChild variant="secondary" size="sm">
                               <Link href="/dashboard/withdraw"><Wallet className="ml-2 h-4 w-4" /> سحب</Link>
                           </Button>
                           <Button asChild size="sm">
                               <Link href="/dashboard/brokers"><PlusCircle className="ml-2 h-4 w-4" /> الحصول على كاش باك</Link>
                           </Button>
                        </CardFooter>
                    </Card>

                    <div className="space-y-4">
                         <h2 className="text-lg font-semibold mt-4 text-right">حساباتي التجارية</h2>
                          <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right text-xs">الحساب</TableHead>
                                            <TableHead className="text-left text-xs">الحالة</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.linkedAccounts.length > 0 ? (
                                            stats.linkedAccounts.slice(0, 3).map(acc => (
                                                <TableRow key={acc.id}>
                                                    <TableCell>
                                                        <div className="font-medium text-xs">{acc.broker}</div>
                                                        <div className="text-xs text-muted-foreground">{acc.accountNumber}</div>
                                                    </TableCell>
                                                    <TableCell className="text-left">
                                                        <Badge variant={getStatusVariant(acc.status)}>{getStatusText(acc.status)}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-24 text-center text-xs text-muted-foreground">
                                                    لم يتم ربط أي حسابات بعد.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                             <CardFooter className="p-2 border-t">
                                <Button asChild variant="ghost" size="sm" className="w-full justify-center">
                                    <Link href="/dashboard/my-accounts">عرض كل الحسابات <ChevronLeft className="mr-2 h-4 w-4" /></Link>
                                </Button>
                             </CardFooter>
                         </Card>

                         <h2 className="text-lg font-semibold mt-4 text-right">المعاملات الأخيرة</h2>
                         <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right text-xs">التاريخ</TableHead>
                                            <TableHead className="text-right text-xs">النوع</TableHead>
                                            <TableHead className="text-left text-xs">المبلغ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.length > 0 ? (
                                            transactions.slice(0, 5).map(tx => {
                                                const getIcon = () => {
                                                    switch (tx.type) {
                                                        case 'cashback': return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
                                                        case 'referral_commission': return <Gift className="h-4 w-4 text-purple-500" />;
                                                        case 'referral_reversal': return <Gift className="h-4 w-4 text-red-500" />;
                                                        case 'order':
                                                        case 'order_created': return <ShoppingBag className="h-4 w-4 text-blue-500" />;
                                                        case 'order_cancelled': return <ShoppingBag className="h-4 w-4 text-orange-500" />;
                                                        default: return <ArrowDownCircle className="h-4 w-4" />;
                                                    }
                                                };
                                                return (
                                                    <TableRow key={tx.id}>
                                                        <TableCell className="text-muted-foreground text-xs">{format(tx.date, "PP")}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {getIcon()}
                                                                <div>
                                                                    <div className="font-medium text-xs">{tx.description}</div>
                                                                    <div className="text-xs text-muted-foreground truncate max-w-[100px]">{tx.details}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className={`text-left font-semibold text-xs ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                            {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}$
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-24 text-center text-xs text-muted-foreground">
                                                    لا توجد معاملات بعد.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                             <CardFooter className="p-2 border-t">
                                <Button asChild variant="ghost" size="sm" className="w-full justify-center">
                                    <Link href="/dashboard/transactions">عرض كل المعاملات <ChevronLeft className="mr-2 h-4 w-4" /></Link>
                                </Button>
                             </CardFooter>
                         </Card>
                    </div>


                </TabsContent>
                <TabsContent value="offers">
                    <OffersTabContent />
                </TabsContent>
            </Tabs>
        </div>
        <div className="fixed bottom-4 left-4">
            <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
                <MessageSquare className="h-6 w-6" />
            </Button>
        </div>
    </div>
  );
}
