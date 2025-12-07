"use client";

import { useState, useMemo, useEffect } from "react";
import { PublicBrokerCard } from "@/components/public/PublicBrokerCard";
import type { Broker } from "@/types";
import { Input } from "@/components/ui/input";
import { Loader2, Search, SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import { getBrokers } from "@/app/admin/manage-brokers/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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

export default function PublicBrokersPage() {
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

      if (filters.availableInCountries.length > 0) {
        const restrictedCountries = broker.globalReach?.restricted_countries || [];
        const isRestrictedInSelectedCountries = filters.availableInCountries.some((c) => restrictedCountries.includes(c));
        if (isRestrictedInSelectedCountries) {
          return false;
        }
      }

      return true;
    });

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
          <PublicBrokerCard key={broker.id} broker={broker} />
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">الوسطاء</h1>
          <p className="text-muted-foreground text-sm">اختر وسيطك واحصل على كاش باك على كل صفقة</p>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث عن وسيط..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-10"
            />
          </div>
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative h-10 w-10">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge className="absolute -top-1 -left-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">الفلاتر</h4>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 text-xs">
                      <X className="h-3 w-3 ml-1" />
                      مسح الكل
                    </Button>
                  )}
                </div>
              </div>
              <ScrollArea className="h-[60vh] max-h-[400px]">
                <div className="p-3 space-y-4">
                  <MultiSelectDropdown
                    label="المنصات"
                    options={availableOptions.platforms}
                    selected={filters.platforms}
                    onSelectionChange={(selected) => setFilters({ ...filters, platforms: selected })}
                    placeholder="اختر المنصات"
                    translateFn={translatePlatform}
                  />

                  <MultiSelectDropdown
                    label="طرق الدفع"
                    options={availableOptions.paymentMethods}
                    selected={filters.paymentMethods}
                    onSelectionChange={(selected) => setFilters({ ...filters, paymentMethods: selected })}
                    placeholder="اختر طرق الدفع"
                    translateFn={translatePaymentMethod}
                  />

                  <MultiSelectDropdown
                    label="أنواع الحسابات"
                    options={availableOptions.accountTypes}
                    selected={filters.accountTypes}
                    onSelectionChange={(selected) => setFilters({ ...filters, accountTypes: selected })}
                    placeholder="اختر أنواع الحسابات"
                    translateFn={translateAccountType}
                  />

                  <MultiSelectDropdown
                    label="تقييم WikiFX"
                    options={wikiFxRatings.map((r) => r.value)}
                    selected={filters.wikiFxRatings}
                    onSelectionChange={(selected) => setFilters({ ...filters, wikiFxRatings: selected })}
                    placeholder="اختر التقييم"
                    translateFn={(value) => wikiFxRatings.find((r) => r.value === value)?.label || value}
                  />

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">الحد الأقصى للإيداع</Label>
                    <Input
                      type="number"
                      placeholder="أدخل الحد الأقصى"
                      value={filters.maxMinDeposit}
                      onChange={(e) => setFilters({ ...filters, maxMinDeposit: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <MultiSelectDropdown
                    label="الجهات الرقابية"
                    options={availableOptions.regulators}
                    selected={filters.regulators}
                    onSelectionChange={(selected) => setFilters({ ...filters, regulators: selected })}
                    placeholder="اختر الجهات الرقابية"
                  />

                  <MultiSelectDropdown
                    label="نوع الوسيط"
                    options={availableOptions.brokerTypes}
                    selected={filters.brokerTypes}
                    onSelectionChange={(selected) => setFilters({ ...filters, brokerTypes: selected })}
                    placeholder="اختر نوع الوسيط"
                    translateFn={translateBrokerType}
                  />

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">الدول المتاحة</Label>
                    <MultiCountrySelector
                      value={filters.availableInCountries}
                      onChange={(countries) => setFilters({ ...filters, availableInCountries: countries })}
                      placeholder="اختر الدول"
                    />
                  </div>
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="forex" className="flex-1 text-xs">
              فوركس
              <Badge variant="secondary" className="mr-1 text-[10px]">{getBrokersForTab("forex").length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex-1 text-xs">
              كريبتو
              <Badge variant="secondary" className="mr-1 text-[10px]">{getBrokersForTab("crypto").length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="other" className="flex-1 text-xs">
              أخرى
              <Badge variant="secondary" className="mr-1 text-[10px]">{getBrokersForTab("other").length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forex">
            {renderBrokerList(getBrokersForTab("forex"))}
          </TabsContent>
          <TabsContent value="crypto">
            {renderBrokerList(getBrokersForTab("crypto"))}
          </TabsContent>
          <TabsContent value="other">
            {renderBrokerList(getBrokersForTab("other"))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
