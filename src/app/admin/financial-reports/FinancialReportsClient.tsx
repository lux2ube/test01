'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DollarSign, Filter, Loader2, Search, Calendar, User, Briefcase, CreditCard, FileText } from "lucide-react";
import { 
  FilterOption, 
  ReportFilters, 
  FilteredReportResult,
  getAvailableRecordTypes,
  getAvailableUsers,
  getAvailableBrokers,
  getAvailableAccounts,
  getFilteredReport,
} from './actions';

const RECORD_TYPE_LABELS: Record<string, string> = {
  'cashback': 'الكاش باك',
  'referral': 'عمولات الإحالة',
  'deposit': 'الإيداعات',
  'withdrawal_completed': 'السحوبات المكتملة',
  'withdrawal_processing': 'السحوبات قيد المعالجة',
  'order_created': 'الطلبات (المتجر)',
};

export default function FinancialReportsClient() {
  const [recordTypes, setRecordTypes] = useState<FilterOption[]>([]);
  const [users, setUsers] = useState<FilterOption[]>([]);
  const [brokers, setBrokers] = useState<FilterOption[]>([]);
  const [accounts, setAccounts] = useState<FilterOption[]>([]);
  
  const [selectedRecordType, setSelectedRecordType] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedBroker, setSelectedBroker] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [result, setResult] = useState<FilteredReportResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingFilters(true);
      try {
        const [types, usersData] = await Promise.all([
          getAvailableRecordTypes(),
          getAvailableUsers(),
        ]);
        setRecordTypes(types);
        setUsers(usersData);
        
        const brokersData = await getAvailableBrokers();
        setBrokers(brokersData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoadingFilters(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadBrokers() {
      try {
        const userFilter = selectedUser && selectedUser !== 'all' ? selectedUser : undefined;
        const brokersData = await getAvailableBrokers(userFilter);
        setBrokers(brokersData);
        
        if (selectedBroker && selectedBroker !== 'all' && !brokersData.some(b => b.value === selectedBroker)) {
          setSelectedBroker('');
        }
      } catch (error) {
        console.error('Error loading brokers:', error);
      }
    }
    loadBrokers();
  }, [selectedUser]);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const userFilter = selectedUser && selectedUser !== 'all' ? selectedUser : undefined;
        const brokerFilter = selectedBroker && selectedBroker !== 'all' ? selectedBroker : undefined;
        const accountsData = await getAvailableAccounts(userFilter, brokerFilter);
        setAccounts(accountsData);
        
        if (selectedAccount && selectedAccount !== 'all' && !accountsData.some(a => a.value === selectedAccount)) {
          setSelectedAccount('');
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    }
    loadAccounts();
  }, [selectedUser, selectedBroker]);

  const handleConfirmFilter = async () => {
    if (!selectedRecordType) {
      return;
    }
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const filters: ReportFilters = {
        recordType: selectedRecordType,
        userId: selectedUser && selectedUser !== 'all' ? selectedUser : undefined,
        broker: selectedBroker && selectedBroker !== 'all' ? selectedBroker : undefined,
        accountId: selectedAccount && selectedAccount !== 'all' ? selectedAccount : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };
      
      const reportResult = await getFilteredReport(filters);
      setResult(reportResult);
    } catch (error) {
      console.error('Error fetching report:', error);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedRecordType('');
    setSelectedUser('');
    setSelectedBroker('');
    setSelectedAccount('');
    setDateFrom('');
    setDateTo('');
    setResult(null);
    setHasSearched(false);
  };

  if (isLoadingFilters) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فلاتر التقرير
          </CardTitle>
          <CardDescription>
            حدد نوع السجل والفلاتر المطلوبة ثم اضغط على زر تأكيد الفلتر لعرض النتائج
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                نوع السجل *
              </Label>
              <Select value={selectedRecordType} onValueChange={setSelectedRecordType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع السجل" />
                </SelectTrigger>
                <SelectContent>
                  {recordTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                المستخدم
              </Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المستخدمين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستخدمين</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.value} value={user.value}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                الوسيط
              </Label>
              <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الوسطاء" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الوسطاء</SelectItem>
                  {brokers.map((broker) => (
                    <SelectItem key={broker.value} value={broker.value}>
                      {broker.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                حساب التداول
              </Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحسابات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحسابات</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.value} value={account.value}>
                      {account.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                من تاريخ
              </Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                إلى تاريخ
              </Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button
              onClick={handleConfirmFilter}
              disabled={!selectedRecordType || isLoading}
              className="flex-1 md:flex-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري البحث...
                </>
              ) : (
                <>
                  <Search className="ml-2 h-4 w-4" />
                  تأكيد الفلتر
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={isLoading}
            >
              مسح الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {!hasSearched && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">لم يتم تطبيق أي فلتر بعد</h3>
            <p className="text-muted-foreground">
              حدد نوع السجل والفلاتر المطلوبة ثم اضغط على &quot;تأكيد الفلتر&quot; لعرض النتائج
            </p>
          </CardContent>
        </Card>
      )}

      {hasSearched && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              نتيجة التقرير
            </CardTitle>
            {Object.keys(result.appliedFilters).length > 0 && (
              <CardDescription>
                الفلاتر المطبقة: {' '}
                {result.appliedFilters.user && <span className="font-medium">المستخدم: {result.appliedFilters.user}</span>}
                {result.appliedFilters.broker && <span className="font-medium"> | الوسيط: {result.appliedFilters.broker}</span>}
                {result.appliedFilters.account && <span className="font-medium"> | الحساب: {result.appliedFilters.account}</span>}
                {result.appliedFilters.period && <span className="font-medium"> | الفترة: {result.appliedFilters.period}</span>}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    نوع السجل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {RECORD_TYPE_LABELS[result.recordType] || result.recordType}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    عدد السجلات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {result.count.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/10 border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-primary">
                    المجموع الكلي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    ${result.total.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {hasSearched && !result && !isLoading && (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive">حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
