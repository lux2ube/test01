
"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { BrokerCard } from "@/components/user/BrokerCard";
import type { Broker } from "@/types";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { getBrokers } from "@/app/admin/manage-brokers/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Filters {
  swapFree: boolean;
  lowRisk: boolean;
  lowDeposit: boolean;
  highLeverage: boolean;
  mt4: boolean;
  mt5: boolean;
}

const defaultFilters: Filters = {
  swapFree: false,
  lowRisk: false,
  lowDeposit: false,
  highLeverage: false,
  mt4: false,
  mt5: false,
};

export default function BrokersPage() {
  const [allBrokers, setAllBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("forex");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    const fetchBrokers = async () => {
      setIsLoading(true);
      try {
        const data = await getBrokers();
        // Default sort by order
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
      
      if (filters.swapFree && !broker.tradingConditions?.swap_free) {
        return false;
      }
      
      if (filters.lowRisk && broker.regulation?.risk_level !== 'low') {
        return false;
      }
      
      if (filters.lowDeposit && (broker.tradingConditions?.min_deposit ?? 999) > 100) {
        return false;
      }
      
      if (filters.highLeverage) {
        const leverage = broker.tradingConditions?.max_leverage || "";
        const leverageNum = parseInt(leverage.replace(/[^0-9]/g, '')) || 0;
        if (leverageNum < 500) {
          return false;
        }
      }
      
      if (filters.mt4) {
        const platforms = broker.platforms?.platforms_supported || [];
        if (!platforms.some(p => p.toLowerCase().includes('mt4') || p.toLowerCase().includes('metatrader 4'))) {
          return false;
        }
      }
      
      if (filters.mt5) {
        const platforms = broker.platforms?.platforms_supported || [];
        if (!platforms.some(p => p.toLowerCase().includes('mt5') || p.toLowerCase().includes('metatrader 5'))) {
          return false;
        }
      }
      
      return true;
    });
  }, [allBrokers, searchQuery, filters]);

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const toggleFilter = (key: keyof Filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
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
            <p className="text-muted-foreground text-sm">لا يوجد وسطاء في هذه الفئة.</p>
          </div>
        )
    }

    return (
        <div className="flex flex-col space-y-4">
          {brokers.map((broker) => (
            <BrokerCard key={broker.id} broker={broker} />
          ))}
        </div>
    )
  }
  
  const getBrokersForTab = (category: string) => {
      return filteredBrokers.filter(b => {
          const cat = b.category ?? 'other'; // Fallback for old data
          return cat === category;
      });
  }

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
                    <PopoverContent className="w-64 p-3" align="end">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">تصفية حسب</h4>
                                {activeFilterCount > 0 && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 px-2 text-xs text-muted-foreground"
                                        onClick={clearFilters}
                                    >
                                        مسح الكل
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        id="swapFree" 
                                        checked={filters.swapFree}
                                        onCheckedChange={() => toggleFilter('swapFree')}
                                    />
                                    <Label htmlFor="swapFree" className="text-sm cursor-pointer">حساب إسلامي (بدون سواب)</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        id="lowRisk" 
                                        checked={filters.lowRisk}
                                        onCheckedChange={() => toggleFilter('lowRisk')}
                                    />
                                    <Label htmlFor="lowRisk" className="text-sm cursor-pointer">مخاطر منخفضة</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        id="lowDeposit" 
                                        checked={filters.lowDeposit}
                                        onCheckedChange={() => toggleFilter('lowDeposit')}
                                    />
                                    <Label htmlFor="lowDeposit" className="text-sm cursor-pointer">إيداع أقل من $100</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        id="highLeverage" 
                                        checked={filters.highLeverage}
                                        onCheckedChange={() => toggleFilter('highLeverage')}
                                    />
                                    <Label htmlFor="highLeverage" className="text-sm cursor-pointer">رافعة عالية (500+)</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        id="mt4" 
                                        checked={filters.mt4}
                                        onCheckedChange={() => toggleFilter('mt4')}
                                    />
                                    <Label htmlFor="mt4" className="text-sm cursor-pointer">يدعم MT4</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        id="mt5" 
                                        checked={filters.mt5}
                                        onCheckedChange={() => toggleFilter('mt5')}
                                    />
                                    <Label htmlFor="mt5" className="text-sm cursor-pointer">يدعم MT5</Label>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-1">
                    {filters.swapFree && (
                        <Badge variant="secondary" className="text-xs gap-1">
                            حساب إسلامي
                            <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter('swapFree')} />
                        </Badge>
                    )}
                    {filters.lowRisk && (
                        <Badge variant="secondary" className="text-xs gap-1">
                            مخاطر منخفضة
                            <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter('lowRisk')} />
                        </Badge>
                    )}
                    {filters.lowDeposit && (
                        <Badge variant="secondary" className="text-xs gap-1">
                            إيداع أقل من $100
                            <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter('lowDeposit')} />
                        </Badge>
                    )}
                    {filters.highLeverage && (
                        <Badge variant="secondary" className="text-xs gap-1">
                            رافعة عالية
                            <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter('highLeverage')} />
                        </Badge>
                    )}
                    {filters.mt4 && (
                        <Badge variant="secondary" className="text-xs gap-1">
                            MT4
                            <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter('mt4')} />
                        </Badge>
                    )}
                    {filters.mt5 && (
                        <Badge variant="secondary" className="text-xs gap-1">
                            MT5
                            <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter('mt5')} />
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
          {renderBrokerList(getBrokersForTab('forex'))}
        </TabsContent>
        <TabsContent value="crypto" className="mt-4">
          {renderBrokerList(getBrokersForTab('crypto'))}
        </TabsContent>
        <TabsContent value="other" className="mt-4">
          {renderBrokerList(getBrokersForTab('other'))}
        </TabsContent>
      </Tabs>

    </div>
  );
}

    