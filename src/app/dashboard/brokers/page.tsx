
"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { BrokerCard } from "@/components/user/BrokerCard";
import type { Broker } from "@/types";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { getBrokers } from "@/app/admin/manage-brokers/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BrokersPage() {
  const [allBrokers, setAllBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("forex");

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
      // Backward compatibility for search
      const name = broker.basicInfo?.broker_name || broker.name;
      return name.toLowerCase().includes(searchQuery.toLowerCase())
    });
  }, [allBrokers, searchQuery]);

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
        <div className="space-y-1">
            <h1 className="text-xl font-bold">كل الكاش باك</h1>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                />
            </div>
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

    