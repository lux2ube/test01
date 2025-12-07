
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
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface FilterState {
  platforms: string[];
  paymentMethods: string[];
  accountTypes: string[];
  minDeposit: number;
  maxDeposit: number;
  riskLevels: string[];
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
  };
}

const defaultFilters: FilterState = {
  platforms: [],
  paymentMethods: [],
  accountTypes: [],
  minDeposit: 0,
  maxDeposit: 10000,
  riskLevels: [],
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
  },
};

function MultiSelectDropdown({
  label,
  options,
  selected,
  onSelectionChange,
  placeholder,
}: {
  label: string;
  options: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

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
                    <span className="truncate">{option}</span>
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
    const riskLevels = new Set<string>();
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
      
      if (broker.regulation?.risk_level) {
        riskLevels.add(broker.regulation.risk_level);
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
      riskLevels: Array.from(riskLevels).sort(),
      maxDeposit: maxDeposit || 10000,
    };
  }, [allBrokers]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.platforms.length > 0) count++;
    if (filters.paymentMethods.length > 0) count++;
    if (filters.accountTypes.length > 0) count++;
    if (filters.riskLevels.length > 0) count++;
    if (filters.minDeposit > 0 || filters.maxDeposit < availableOptions.maxDeposit) count++;
    if (Object.values(filters.instruments).some(Boolean)) count++;
    if (Object.values(filters.features).some(Boolean)) count++;
    return count;
  }, [filters, availableOptions.maxDeposit]);

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
    return allBrokers.filter((broker) => {
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

      if (filters.riskLevels.length > 0) {
        if (!filters.riskLevels.includes(broker.regulation?.risk_level || "")) {
          return false;
        }
      }

      const brokerDeposit = broker.tradingConditions?.min_deposit ?? 0;
      if (brokerDeposit < filters.minDeposit || brokerDeposit > filters.maxDeposit) {
        return false;
      }

      if (filters.instruments.crypto && !broker.instruments?.crypto_trading) return false;
      if (filters.instruments.stocks && !broker.instruments?.stocks) return false;
      if (filters.instruments.commodities && !broker.instruments?.commodities) return false;
      if (filters.instruments.indices && !broker.instruments?.indices) return false;

      if (filters.features.copyTrading && !broker.additionalFeatures?.copy_trading) return false;
      if (filters.features.demoAccount && !broker.additionalFeatures?.demo_account) return false;
      if (filters.features.educationCenter && !broker.additionalFeatures?.education_center) return false;
      if (filters.features.welcomeBonus && !broker.additionalFeatures?.welcome_bonus) return false;

      return true;
    });
  }, [allBrokers, searchQuery, filters]);

  const clearAllFilters = () => {
    setFilters({ ...defaultFilters, maxDeposit: availableOptions.maxDeposit });
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
          <BrokerCard key={broker.id} broker={broker} />
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
                  />

                  <MultiSelectDropdown
                    label="طرق الدفع"
                    options={availableOptions.paymentMethods}
                    selected={filters.paymentMethods}
                    onSelectionChange={(s) => setFilters((f) => ({ ...f, paymentMethods: s }))}
                    placeholder="اختر طرق الدفع..."
                  />

                  <MultiSelectDropdown
                    label="أنواع الحسابات"
                    options={availableOptions.accountTypes}
                    selected={filters.accountTypes}
                    onSelectionChange={(s) => setFilters((f) => ({ ...f, accountTypes: s }))}
                    placeholder="اختر نوع الحساب..."
                  />

                  <MultiSelectDropdown
                    label="مستوى المخاطر"
                    options={availableOptions.riskLevels}
                    selected={filters.riskLevels}
                    onSelectionChange={(s) => setFilters((f) => ({ ...f, riskLevels: s }))}
                    placeholder="اختر مستوى المخاطر..."
                  />

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      الحد الأدنى للإيداع: ${filters.minDeposit} - ${filters.maxDeposit}
                    </Label>
                    <div className="px-1">
                      <Slider
                        min={0}
                        max={availableOptions.maxDeposit}
                        step={10}
                        value={[filters.minDeposit, filters.maxDeposit]}
                        onValueChange={([min, max]) =>
                          setFilters((f) => ({ ...f, minDeposit: min, maxDeposit: max }))
                        }
                        className="w-full"
                      />
                    </div>
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
                        <Label htmlFor="welcomeBonus" className="text-sm cursor-pointer">مكافأة ترحيب</Label>
                      </div>
                    </div>
                  </div>
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
            {filters.riskLevels.length > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                المخاطر ({filters.riskLevels.length})
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setFilters((f) => ({ ...f, riskLevels: [] }))}
                />
              </Badge>
            )}
            {(filters.minDeposit > 0 || filters.maxDeposit < availableOptions.maxDeposit) && (
              <Badge variant="secondary" className="text-xs gap-1">
                الإيداع: ${filters.minDeposit}-${filters.maxDeposit}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    setFilters((f) => ({ ...f, minDeposit: 0, maxDeposit: availableOptions.maxDeposit }))
                  }
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
                      features: { copyTrading: false, demoAccount: false, educationCenter: false, welcomeBonus: false },
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
