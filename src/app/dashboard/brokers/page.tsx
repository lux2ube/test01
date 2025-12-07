
"use client";

import { useState, useMemo, useEffect } from "react";
import { BrokerCard } from "@/components/user/BrokerCard";
import type { Broker } from "@/types";
import { Input } from "@/components/ui/input";
import { Loader2, Search, SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import { getBrokers } from "@/app/admin/manage-brokers/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/hooks/useAuthContext";
import { MultiCountrySelector } from "@/components/ui/country-selector";

const accountTypeTranslations: Record<string, string> = {
  "Standard": "قياسي",
  "standard": "قياسي",
  "Islamic": "إسلامي",
  "islamic": "إسلامي",
  "ECN": "ECN",
  "ecn": "ECN",
  "VIP": "VIP",
  "vip": "VIP",
  "Pro": "احترافي",
  "pro": "احترافي",
  "Professional": "احترافي",
  "professional": "احترافي",
  "Raw Spread": "سبريد خام",
  "raw spread": "سبريد خام",
  "Zero Spread": "سبريد صفر",
  "zero spread": "سبريد صفر",
  "Cent": "سنت",
  "cent": "سنت",
  "Micro": "مايكرو",
  "micro": "مايكرو",
  "Mini": "ميني",
  "mini": "ميني",
  "Demo": "تجريبي",
  "demo": "تجريبي",
  "Swap Free": "بدون سواب",
  "swap free": "بدون سواب",
  "Classic": "كلاسيك",
  "classic": "كلاسيك",
  "Premium": "بريميوم",
  "premium": "بريميوم",
  "Prime": "برايم",
  "prime": "برايم",
  "Proprietary": "منصة خاصة بالوسيط",
  "proprietary": "منصة خاصة بالوسيط",
};

const wikiFxRatings = [
  { value: "1", label: "⭐ وأعلى (1+)", minScore: 1 },
  { value: "2", label: "⭐⭐ وأعلى (2+)", minScore: 2 },
  { value: "3", label: "⭐⭐⭐ وأعلى (4+)", minScore: 4 },
  { value: "4", label: "⭐⭐⭐⭐ وأعلى (6+)", minScore: 6 },
  { value: "5", label: "⭐⭐⭐⭐⭐ وأعلى (8+)", minScore: 8 },
];

const brokerTypeTranslations: Record<string, string> = {
  "ECN": "ECN",
  "ecn": "ECN",
  "STP": "STP",
  "stp": "STP",
  "Market Maker": "صانع سوق",
  "market maker": "صانع سوق",
  "NDD": "NDD",
  "ndd": "NDD",
  "DD": "DD",
  "dd": "DD",
  "Hybrid": "هجين",
  "hybrid": "هجين",
  "DMA": "DMA",
  "dma": "DMA",
  "ECN/STP": "ECN/STP",
  "STP/ECN": "ECN/STP",
  "Proprietary": "منصة خاصة بالوسيط",
  "proprietary": "منصة خاصة بالوسيط",
};

const translateBrokerType = (type: string): string => {
  return brokerTypeTranslations[type] || type;
};

const translateAccountType = (type: string): string => {
  return accountTypeTranslations[type] || type;
};

const paymentMethodTranslations: Record<string, string> = {
  "Bank Transfer": "تحويل بنكي",
  "bank transfer": "تحويل بنكي",
  "Credit Card": "بطاقة ائتمان",
  "credit card": "بطاقة ائتمان",
  "Debit Card": "بطاقة خصم",
  "debit card": "بطاقة خصم",
  "Wire Transfer": "حوالة بنكية",
  "wire transfer": "حوالة بنكية",
  "Skrill": "سكريل",
  "skrill": "سكريل",
  "Neteller": "نتلر",
  "neteller": "نتلر",
  "PayPal": "باي بال",
  "paypal": "باي بال",
  "Crypto": "عملات رقمية",
  "crypto": "عملات رقمية",
  "Cryptocurrency": "عملات رقمية",
  "cryptocurrency": "عملات رقمية",
  "Bitcoin": "بيتكوين",
  "bitcoin": "بيتكوين",
  "USDT": "USDT",
  "usdt": "USDT",
  "Perfect Money": "بيرفكت موني",
  "perfect money": "بيرفكت موني",
  "WebMoney": "ويب موني",
  "webmoney": "ويب موني",
  "Local Bank": "بنك محلي",
  "local bank": "بنك محلي",
  "E-Wallet": "محفظة إلكترونية",
  "e-wallet": "محفظة إلكترونية",
  "Apple Pay": "آبل باي",
  "apple pay": "آبل باي",
  "Google Pay": "جوجل باي",
  "google pay": "جوجل باي",
  "Fasapay": "فاسا باي",
  "fasapay": "فاسا باي",
  "Sticpay": "ستيك باي",
  "sticpay": "ستيك باي",
  "AstroPay": "أسترو باي",
  "astropay": "أسترو باي",
};

const translatePaymentMethod = (method: string): string => {
  return paymentMethodTranslations[method] || method;
};

const platformTranslations: Record<string, string> = {
  "MT4": "MT4",
  "mt4": "MT4",
  "MT5": "MT5",
  "mt5": "MT5",
  "MetaTrader 4": "ميتاتريدر 4",
  "MetaTrader 5": "ميتاتريدر 5",
  "cTrader": "سي تريدر",
  "ctrader": "سي تريدر",
  "WebTrader": "ويب تريدر",
  "webtrader": "ويب تريدر",
  "Proprietary": "منصة خاصة بالوسيط",
  "proprietary": "منصة خاصة بالوسيط",
  "TradingView": "تريدنج فيو",
  "tradingview": "تريدنج فيو",
  "Mobile App": "تطبيق الجوال",
  "mobile app": "تطبيق الجوال",
};

const translatePlatform = (platform: string): string => {
  return platformTranslations[platform] || platform;
};

interface FilterState {
  platforms: string[];
  paymentMethods: string[];
  accountTypes: string[];
  maxMinDeposit: string;
  wikiFxRatings: string[];
  regulators: string[];
  brokerTypes: string[];
  availableInCountries: string[];
  instruments: {
    crypto: boolean;
    stocks: boolean;
    commodities: boolean;
    indices: boolean;
  };
  features: {
    copyTrading: boolean;
    demoAccount: boolean;
    educationCenter: boolean;
    welcomeBonus: boolean;
    tradingContests: boolean;
    regulatoryAlerts: boolean;
  };
}

const defaultFilters: FilterState = {
  platforms: [],
  paymentMethods: [],
  accountTypes: [],
  maxMinDeposit: "",
  wikiFxRatings: [],
  regulators: [],
  brokerTypes: [],
  availableInCountries: [],
  instruments: {
    crypto: false,
    stocks: false,
    commodities: false,
    indices: false,
  },
  features: {
    copyTrading: false,
    demoAccount: false,
    educationCenter: false,
    welcomeBonus: false,
    tradingContests: false,
    regulatoryAlerts: false,
  },
};

function MultiSelectDropdown({
  label,
  options,
  selected,
  onSelectionChange,
  placeholder,
  translateFn,
}: {
  label: string;
  options: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  translateFn?: (option: string) => string;
}) {
  const [open, setOpen] = useState(false);

  const getDisplayName = (option: string) => {
    return translateFn ? translateFn(option) : option;
  };

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onSelectionChange(selected.filter((s) => s !== option));
    } else {
      onSelectionChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between h-9 text-xs font-normal"
          >
            <span className="truncate">
              {selected.length > 0
                ? `${selected.length} محدد`
                : placeholder || "اختر..."}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <ScrollArea className="h-48">
            <div className="p-2 space-y-1">
              {options.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">لا توجد خيارات</p>
              ) : (
                options.map((option) => (
                  <div
                    key={option}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent text-sm",
                      selected.includes(option) && "bg-accent"
                    )}
                    onClick={() => toggleOption(option)}
                  >
                    <div className={cn(
                      "h-4 w-4 border rounded-sm flex items-center justify-center",
                      selected.includes(option) ? "bg-primary border-primary" : "border-input"
                    )}>
                      {selected.includes(option) && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="truncate">{getDisplayName(option)}</span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          {selected.length > 0 && (
            <>
              <Separator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => onSelectionChange([])}
                >
                  مسح الكل
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function BrokersPage() {
  const { user } = useAuthContext();
  const userCountry = user?.profile?.country || "";
  
  const [allBrokers, setAllBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("forex");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const availableOptions = useMemo(() => {
    const platforms = new Set<string>();
    const paymentMethods = new Set<string>();
    const accountTypes = new Set<string>();
    const regulators = new Set<string>();
    const brokerTypes = new Set<string>();
    let maxDeposit = 0;

    allBrokers.forEach((broker) => {
      const brokerPlatforms = broker.platforms?.platforms_supported;
      if (Array.isArray(brokerPlatforms)) {
        brokerPlatforms.forEach((p) => platforms.add(p));
      }
      
      const brokerPayments = broker.depositsWithdrawals?.payment_methods;
      if (Array.isArray(brokerPayments)) {
        brokerPayments.forEach((p) => paymentMethods.add(p));
      }
      
      const brokerAccountTypes = broker.tradingConditions?.account_types;
      if (Array.isArray(brokerAccountTypes)) {
        brokerAccountTypes.forEach((a) => accountTypes.add(a));
      }
      
      const brokerLicenses = broker.regulation?.licenses;
      if (Array.isArray(brokerLicenses)) {
        brokerLicenses.forEach((license) => {
          if (license.authority) {
            regulators.add(license.authority);
          }
        });
      }
      const brokerRegulatorNames = broker.regulation?.regulator_name;
      if (Array.isArray(brokerRegulatorNames)) {
        brokerRegulatorNames.forEach((r) => regulators.add(r));
      }
      
      const brokerType = broker.basicInfo?.broker_type;
      if (brokerType) {
        brokerTypes.add(brokerType);
      }
      
      const deposit = broker.tradingConditions?.min_deposit;
      if (typeof deposit === 'number' && deposit > maxDeposit) {
        maxDeposit = deposit;
      }
    });

    return {
      platforms: Array.from(platforms).sort(),
      paymentMethods: Array.from(paymentMethods).sort(),
      accountTypes: Array.from(accountTypes).sort(),
      regulators: Array.from(regulators).sort(),
      brokerTypes: Array.from(brokerTypes).sort(),
      maxDeposit: maxDeposit || 10000,
    };
  }, [allBrokers]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.platforms.length > 0) count++;
    if (filters.paymentMethods.length > 0) count++;
    if (filters.accountTypes.length > 0) count++;
    if (filters.wikiFxRatings.length > 0) count++;
    if (filters.regulators.length > 0) count++;
    if (filters.brokerTypes.length > 0) count++;
    if (filters.availableInCountries.length > 0) count++;
    if (filters.maxMinDeposit && parseInt(filters.maxMinDeposit) > 0) count++;
    if (Object.values(filters.instruments).some(Boolean)) count++;
    if (Object.values(filters.features).some(Boolean)) count++;
    return count;
  }, [filters]);

  useEffect(() => {
    const fetchBrokers = async () => {
      setIsLoading(true);
      try {
        const data = await getBrokers();
        data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        setAllBrokers(data);
      } catch (error) {
        console.error("Failed to fetch brokers", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrokers();
  }, []);

  const filteredBrokers = useMemo(() => {
    const filtered = allBrokers.filter((broker: Broker) => {
      const name = broker.name || "";
      if (!name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (filters.platforms.length > 0) {
        const brokerPlatforms = broker.platforms?.platforms_supported;
        if (!Array.isArray(brokerPlatforms) || !filters.platforms.some((p) => brokerPlatforms.includes(p))) {
          return false;
        }
      }

      if (filters.paymentMethods.length > 0) {
        const brokerPayments = broker.depositsWithdrawals?.payment_methods;
        if (!Array.isArray(brokerPayments) || !filters.paymentMethods.some((p) => brokerPayments.includes(p))) {
          return false;
        }
      }

      if (filters.accountTypes.length > 0) {
        const brokerAccounts = broker.tradingConditions?.account_types;
        if (!Array.isArray(brokerAccounts) || !filters.accountTypes.some((a) => brokerAccounts.includes(a))) {
          return false;
        }
      }

      if (filters.wikiFxRatings.length > 0) {
        const brokerScore = broker.reputation?.wikifx_score ?? 0;
        const matchesRating = filters.wikiFxRatings.some((ratingValue) => {
          const rating = wikiFxRatings.find((r) => r.value === ratingValue);
          if (!rating) return false;
          return brokerScore >= rating.minScore;
        });
        if (!matchesRating) {
          return false;
        }
      }

      if (filters.regulators.length > 0) {
        const brokerLicenses = broker.regulation?.licenses || [];
        const brokerRegulatorNames = broker.regulation?.regulator_name || [];
        const allRegulators = [
          ...brokerLicenses.map((l) => l.authority).filter(Boolean),
          ...brokerRegulatorNames,
        ];
        if (allRegulators.length === 0 || !filters.regulators.some((r) => allRegulators.includes(r))) {
          return false;
        }
      }

      if (filters.brokerTypes.length > 0) {
        const brokerType = broker.basicInfo?.broker_type || "";
        if (!filters.brokerTypes.includes(brokerType)) {
          return false;
        }
      }

      if (filters.maxMinDeposit && parseInt(filters.maxMinDeposit) > 0) {
        const threshold = parseInt(filters.maxMinDeposit);
        const brokerDeposit = broker.tradingConditions?.min_deposit;
        if (typeof brokerDeposit !== 'number' || brokerDeposit > threshold) {
          return false;
        }
      }

      if (filters.instruments.crypto && !broker.instruments?.crypto_trading) return false;
      if (filters.instruments.stocks && !broker.instruments?.stocks) return false;
      if (filters.instruments.commodities && !broker.instruments?.commodities) return false;
      if (filters.instruments.indices && !broker.instruments?.indices) return false;

      if (filters.features.copyTrading && !broker.additionalFeatures?.copy_trading) return false;
      if (filters.features.demoAccount && !broker.additionalFeatures?.demo_account) return false;
      if (filters.features.educationCenter && !broker.additionalFeatures?.education_center) return false;
      if (filters.features.welcomeBonus && !broker.additionalFeatures?.welcome_bonus) return false;
      if (filters.features.tradingContests && !broker.additionalFeatures?.trading_contests) return false;
      if (filters.features.regulatoryAlerts && !broker.additionalFeatures?.regulatory_alerts) return false;

      return true;
    });

    if (filters.availableInCountries.length > 0) {
      filtered.sort((a: Broker, b: Broker) => {
        const aRestricted = a.globalReach?.restricted_countries || [];
        const bRestricted = b.globalReach?.restricted_countries || [];
        
        const aIsRestricted = filters.availableInCountries.some((c) => aRestricted.includes(c));
        const bIsRestricted = filters.availableInCountries.some((c) => bRestricted.includes(c));
        
        if (aIsRestricted && !bIsRestricted) return 1;
        if (!aIsRestricted && bIsRestricted) return -1;
        return 0;
      });
    }

    return filtered;
  }, [allBrokers, searchQuery, filters]);

  const clearAllFilters = () => {
    setFilters(defaultFilters);
  };

  const renderBrokerList = (brokers: Broker[]) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (brokers.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-sm">لا يوجد وسطاء مطابقين للفلاتر المحددة.</p>
          {activeFilterCount > 0 && (
            <Button variant="link" size="sm" onClick={clearAllFilters} className="mt-2">
              مسح جميع الفلاتر
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col space-y-4">
        {brokers.map((broker) => (
          <BrokerCard 
            key={broker.id} 
            broker={broker} 
            userCountry={userCountry}
            filterCountries={filters.availableInCountries}
          />
        ))}
      </div>
    );
  };

  const getBrokersForTab = (category: string) => {
    return filteredBrokers.filter((b) => {
      const cat = b.category ?? "other";
      return cat === category;
    });
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 py-4 space-y-4">
      <div className="space-y-2">
        <h1 className="text-xl font-bold">كل الكاش باك</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3 relative">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">تصفية النتائج</h4>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={clearAllFilters}
                    >
                      مسح الكل
                    </Button>
                  )}
                </div>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="p-3 space-y-4">
                  <MultiSelectDropdown
                    label="المنصات"
                    options={availableOptions.platforms}
                    selected={filters.platforms}
                    onSelectionChange={(s) => setFilters((f) => ({ ...f, platforms: s }))}
                    placeholder="اختر المنصات..."
                    translateFn={translatePlatform}
                  />

                  <MultiSelectDropdown
                    label="طرق الدفع"
                    options={availableOptions.paymentMethods}
                    selected={filters.paymentMethods}
                    onSelectionChange={(s) => setFilters((f) => ({ ...f, paymentMethods: s }))}
                    placeholder="اختر طرق الدفع..."
                    translateFn={translatePaymentMethod}
                  />

                  <MultiSelectDropdown
                    label="أنواع الحسابات"
                    options={availableOptions.accountTypes}
                    selected={filters.accountTypes}
                    onSelectionChange={(s) => setFilters((f) => ({ ...f, accountTypes: s }))}
                    placeholder="اختر نوع الحساب..."
                    translateFn={translateAccountType}
                  />

                  <MultiSelectDropdown
                    label="تقييم WikiFX"
                    options={wikiFxRatings.map((r) => r.value)}
                    selected={filters.wikiFxRatings}
                    onSelectionChange={(s) => setFilters((f) => ({ ...f, wikiFxRatings: s }))}
                    placeholder="اختر التقييم..."
                    translateFn={(val) => wikiFxRatings.find((r) => r.value === val)?.label || val}
                  />

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      الحد الأقصى للإيداع الأدنى ($)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="مثال: 100"
                      value={filters.maxMinDeposit}
                      onChange={(e) => setFilters((f) => ({ ...f, maxMinDeposit: e.target.value }))}
                      className="h-9"
                    />
                    <p className="text-xs text-muted-foreground">يعرض الوسطاء الذين يقبلون هذا المبلغ أو أقل</p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">الأدوات المالية</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="crypto"
                          checked={filters.instruments.crypto}
                          onCheckedChange={(c) =>
                            setFilters((f) => ({
                              ...f,
                              instruments: { ...f.instruments, crypto: !!c },
                            }))
                          }
                        />
                        <Label htmlFor="crypto" className="text-sm cursor-pointer">كريبتو</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="stocks"
                          checked={filters.instruments.stocks}
                          onCheckedChange={(c) =>
                            setFilters((f) => ({
                              ...f,
                              instruments: { ...f.instruments, stocks: !!c },
                            }))
                          }
                        />
                        <Label htmlFor="stocks" className="text-sm cursor-pointer">أسهم</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="commodities"
                          checked={filters.instruments.commodities}
                          onCheckedChange={(c) =>
                            setFilters((f) => ({
                              ...f,
                              instruments: { ...f.instruments, commodities: !!c },
                            }))
                          }
                        />
                        <Label htmlFor="commodities" className="text-sm cursor-pointer">سلع</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="indices"
                          checked={filters.instruments.indices}
                          onCheckedChange={(c) =>
                            setFilters((f) => ({
                              ...f,
                              instruments: { ...f.instruments, indices: !!c },
                            }))
                          }
                        />
                        <Label htmlFor="indices" className="text-sm cursor-pointer">مؤشرات</Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">ميزات إضافية</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="copyTrading"
                          checked={filters.features.copyTrading}
                          onCheckedChange={(c) =>
                            setFilters((f) => ({
                              ...f,
                              features: { ...f.features, copyTrading: !!c },
                            }))
                          }
                        />
                        <Label htmlFor="copyTrading" className="text-sm cursor-pointer">نسخ التداول</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="demoAccount"
                          checked={filters.features.demoAccount}
                          onCheckedChange={(c) =>
                            setFilters((f) => ({
                              ...f,
                              features: { ...f.features, demoAccount: !!c },
                            }))
                          }
                        />
                        <Label htmlFor="demoAccount" className="text-sm cursor-pointer">حساب تجريبي</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="educationCenter"
                          checked={filters.features.educationCenter}
                          onCheckedChange={(c) =>
                            setFilters((f) => ({
                              ...f,
                              features: { ...f.features, educationCenter: !!c },
                            }))
                          }
                        />
                        <Label htmlFor="educationCenter" className="text-sm cursor-pointer">مركز تعليم</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="welcomeBonus"
                          checked={filters.features.welcomeBonus}
                          onCheckedChange={(c) =>
                            setFilters((f) => ({
                              ...f,
                              features: { ...f.features, welcomeBonus: !!c },
                            }))
                          }
                        />
                        <Label htmlFor="welcomeBonus" className="text-sm cursor-pointer">بونص ع الايداع</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="tradingContests"
                          checked={filters.features.tradingContests}
                          onCheckedChange={(c) =>
                            setFilters((f) => ({
                              ...f,
                              features: { ...f.features, tradingContests: !!c },
                            }))
                          }
                        />
                        <Label htmlFor="tradingContests" className="text-sm cursor-pointer">مسابقات تداول</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="regulatoryAlerts"
                          checked={filters.features.regulatoryAlerts}
                          onCheckedChange={(c) =>
                            setFilters((f) => ({
                              ...f,
                              features: { ...f.features, regulatoryAlerts: !!c },
                            }))
                          }
                        />
                        <Label htmlFor="regulatoryAlerts" className="text-sm cursor-pointer">تنبيهات تنظيمية</Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">الدول المتاحة</Label>
                    <MultiCountrySelector
                      value={filters.availableInCountries}
                      onChange={(countries) => setFilters((f) => ({ ...f, availableInCountries: countries }))}
                      placeholder="اختر الدول..."
                    />
                    <p className="text-xs text-muted-foreground">يعرض الوسطاء المتاحين في هذه الدول</p>
                  </div>

                  <Separator />

                  <MultiSelectDropdown
                    label="الجهة الرقابية"
                    options={availableOptions.regulators}
                    selected={filters.regulators}
                    onSelectionChange={(s) => setFilters((f) => ({ ...f, regulators: s }))}
                    placeholder="اختر الجهة الرقابية..."
                  />

                  <MultiSelectDropdown
                    label="نوع التنفيذ"
                    options={availableOptions.brokerTypes}
                    selected={filters.brokerTypes}
                    onSelectionChange={(s) => setFilters((f) => ({ ...f, brokerTypes: s }))}
                    placeholder="اختر نوع التنفيذ..."
                    translateFn={translateBrokerType}
                  />
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1">
            {filters.platforms.length > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                المنصات ({filters.platforms.length})
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setFilters((f) => ({ ...f, platforms: [] }))}
                />
              </Badge>
            )}
            {filters.paymentMethods.length > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                طرق الدفع ({filters.paymentMethods.length})
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setFilters((f) => ({ ...f, paymentMethods: [] }))}
                />
              </Badge>
            )}
            {filters.accountTypes.length > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                الحسابات ({filters.accountTypes.length})
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setFilters((f) => ({ ...f, accountTypes: [] }))}
                />
              </Badge>
            )}
            {filters.wikiFxRatings.length > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                WikiFX ({filters.wikiFxRatings.length})
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setFilters((f) => ({ ...f, wikiFxRatings: [] }))}
                />
              </Badge>
            )}
            {filters.regulators.length > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                الجهة الرقابية ({filters.regulators.length})
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setFilters((f) => ({ ...f, regulators: [] }))}
                />
              </Badge>
            )}
            {filters.brokerTypes.length > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                نوع التنفيذ ({filters.brokerTypes.length})
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setFilters((f) => ({ ...f, brokerTypes: [] }))}
                />
              </Badge>
            )}
            {filters.availableInCountries.length > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                الدول ({filters.availableInCountries.length})
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setFilters((f) => ({ ...f, availableInCountries: [] }))}
                />
              </Badge>
            )}
            {filters.maxMinDeposit && parseInt(filters.maxMinDeposit) > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                الإيداع ≤ ${filters.maxMinDeposit}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setFilters((f) => ({ ...f, maxMinDeposit: "" }))}
                />
              </Badge>
            )}
            {Object.values(filters.instruments).some(Boolean) && (
              <Badge variant="secondary" className="text-xs gap-1">
                الأدوات
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      instruments: { crypto: false, stocks: false, commodities: false, indices: false },
                    }))
                  }
                />
              </Badge>
            )}
            {Object.values(filters.features).some(Boolean) && (
              <Badge variant="secondary" className="text-xs gap-1">
                الميزات
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      features: { 
                        copyTrading: false, 
                        demoAccount: false, 
                        educationCenter: false, 
                        welcomeBonus: false,
                        tradingContests: false,
                        regulatoryAlerts: false,
                      },
                    }))
                  }
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="forex">فوركس</TabsTrigger>
          <TabsTrigger value="crypto">كريبتو</TabsTrigger>
          <TabsTrigger value="other">أخرى</TabsTrigger>
        </TabsList>
        <TabsContent value="forex" className="mt-4">
          {renderBrokerList(getBrokersForTab("forex"))}
        </TabsContent>
        <TabsContent value="crypto" className="mt-4">
          {renderBrokerList(getBrokersForTab("crypto"))}
        </TabsContent>
        <TabsContent value="other" className="mt-4">
          {renderBrokerList(getBrokersForTab("other"))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
