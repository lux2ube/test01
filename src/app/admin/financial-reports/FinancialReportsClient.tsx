'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Filter, Loader2, Search, Calendar, User, Briefcase, CreditCard, FileText, Package, GitBranch, Download, List, BarChart3 } from "lucide-react";
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  FilterOption, 
  ReportFilters, 
  FilteredReportResult,
  DetailedRecord,
  DetailedReportResult,
  getAvailableRecordTypes,
  getAvailableUsers,
  getAvailableBrokers,
  getAvailableAccounts,
  getAvailableProducts,
  getReferralSourceTypes,
  getFilteredReport,
  getDetailedReport,
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
  const [products, setProducts] = useState<FilterOption[]>([]);
  const [referralSourceTypes, setReferralSourceTypes] = useState<FilterOption[]>([]);
  
  const [selectedRecordType, setSelectedRecordType] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedBroker, setSelectedBroker] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedReferralSourceType, setSelectedReferralSourceType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  const [userSearch, setUserSearch] = useState<string>('');
  const [accountSearch, setAccountSearch] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [result, setResult] = useState<FilteredReportResult | null>(null);
  const [detailedResult, setDetailedResult] = useState<DetailedReportResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  
  const filteredUsers = users.filter(user => 
    user.label.toLowerCase().includes(userSearch.toLowerCase())
  );
  
  const filteredAccounts = accounts.filter(account => 
    account.label.toLowerCase().includes(accountSearch.toLowerCase())
  );

  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingFilters(true);
      try {
        const [types, usersData, brokersData, productsData, referralTypes] = await Promise.all([
          getAvailableRecordTypes(),
          getAvailableUsers(),
          getAvailableBrokers(),
          getAvailableProducts(),
          getReferralSourceTypes(),
        ]);
        setRecordTypes(types);
        setUsers(usersData);
        setBrokers(brokersData);
        setProducts(productsData);
        setReferralSourceTypes(referralTypes);
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
        productId: selectedProduct && selectedProduct !== 'all' ? selectedProduct : undefined,
        referralSourceType: selectedReferralSourceType && selectedReferralSourceType !== 'all' 
          ? selectedReferralSourceType as 'cashback' | 'store_purchase' 
          : undefined,
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
    setSelectedProduct('');
    setSelectedReferralSourceType('');
    setDateFrom('');
    setDateTo('');
    setUserSearch('');
    setAccountSearch('');
    setResult(null);
    setDetailedResult(null);
    setHasSearched(false);
    setShowDetailedView(false);
  };

  const handleFetchDetails = async () => {
    if (!selectedRecordType) return;
    
    setIsLoadingDetails(true);
    
    try {
      const filters: ReportFilters = {
        recordType: selectedRecordType,
        userId: selectedUser && selectedUser !== 'all' ? selectedUser : undefined,
        broker: selectedBroker && selectedBroker !== 'all' ? selectedBroker : undefined,
        accountId: selectedAccount && selectedAccount !== 'all' ? selectedAccount : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        productId: selectedProduct && selectedProduct !== 'all' ? selectedProduct : undefined,
        referralSourceType: selectedReferralSourceType && selectedReferralSourceType !== 'all' 
          ? selectedReferralSourceType as 'cashback' | 'store_purchase' 
          : undefined,
      };
      
      const detailedData = await getDetailedReport(filters);
      setDetailedResult(detailedData);
    } catch (error) {
      console.error('Error fetching detailed report:', error);
      setDetailedResult(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleExportExcel = () => {
    if (!detailedResult || detailedResult.records.length === 0) return;
    
    const recordType = selectedRecordType;
    const recordTypeLabel = RECORD_TYPE_LABELS[recordType] || recordType;
    
    const headers: Record<string, string> = {
      id: 'المعرف',
      date: 'التاريخ',
      amount: 'المبلغ',
      userName: 'اسم المستخدم',
      userEmail: 'البريد الإلكتروني',
      broker: 'الوسيط',
      accountNumber: 'رقم الحساب',
      productName: 'المنتج',
      status: 'الحالة',
      sourceType: 'المصدر',
      referredUserName: 'المستخدم المُحال',
    };
    
    const getRelevantHeaders = (): string[] => {
      const baseHeaders = ['date', 'amount', 'userName', 'userEmail'];
      
      switch (recordType) {
        case 'cashback':
          return [...baseHeaders, 'broker', 'accountNumber'];
        case 'referral':
          return [...baseHeaders, 'broker', 'accountNumber', 'sourceType', 'referredUserName'];
        case 'deposit':
          return baseHeaders;
        case 'withdrawal_completed':
        case 'withdrawal_processing':
          return baseHeaders;
        case 'order_created':
          return [...baseHeaders, 'productName', 'status'];
        default:
          return baseHeaders;
      }
    };
    
    const relevantHeaders = getRelevantHeaders();
    
    const excelData = detailedResult.records.map(record => {
      const row: Record<string, any> = {};
      relevantHeaders.forEach(key => {
        const headerLabel = headers[key] || key;
        if (key === 'date') {
          row[headerLabel] = format(new Date(record[key as keyof DetailedRecord] as string), 'PP', { locale: ar });
        } else if (key === 'amount') {
          row[headerLabel] = `$${(record[key as keyof DetailedRecord] as number).toFixed(2)}`;
        } else {
          row[headerLabel] = record[key as keyof DetailedRecord] || '-';
        }
      });
      return row;
    });
    
    excelData.push({
      [headers['date']]: 'المجموع',
      [headers['amount']]: `$${detailedResult.total.toFixed(2)}`,
    });
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, recordTypeLabel);
    
    const fileName = `تقرير_${recordTypeLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
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
              <Select value={selectedUser} onValueChange={(value) => { setSelectedUser(value); setUserSearch(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المستخدمين" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 sticky top-0 bg-background">
                    <Input
                      placeholder="بحث عن مستخدم..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="h-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <SelectItem value="all">جميع المستخدمين</SelectItem>
                  {filteredUsers.map((user) => (
                    <SelectItem key={user.value} value={user.value}>
                      {user.label}
                    </SelectItem>
                  ))}
                  {filteredUsers.length === 0 && userSearch && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      لا توجد نتائج
                    </div>
                  )}
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
              <Select value={selectedAccount} onValueChange={(value) => { setSelectedAccount(value); setAccountSearch(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحسابات" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 sticky top-0 bg-background">
                    <Input
                      placeholder="بحث عن حساب..."
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      className="h-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <SelectItem value="all">جميع الحسابات</SelectItem>
                  {filteredAccounts.map((account) => (
                    <SelectItem key={account.value} value={account.value}>
                      {account.label}
                    </SelectItem>
                  ))}
                  {filteredAccounts.length === 0 && accountSearch && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      لا توجد نتائج
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedRecordType === 'order_created' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  المنتج
                </Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع المنتجات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المنتجات</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.value} value={product.value}>
                        {product.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedRecordType === 'referral' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  مصدر العمولة
                </Label>
                <Select value={selectedReferralSourceType} onValueChange={setSelectedReferralSourceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع المصادر" />
                  </SelectTrigger>
                  <SelectContent>
                    {referralSourceTypes.map((sourceType) => (
                      <SelectItem key={sourceType.value} value={sourceType.value}>
                        {sourceType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  نتيجة التقرير
                </CardTitle>
                {Object.keys(result.appliedFilters).length > 0 && (
                  <CardDescription className="mt-2">
                    الفلاتر المطبقة: {' '}
                    {result.appliedFilters.user && <span className="font-medium">المستخدم: {result.appliedFilters.user}</span>}
                    {result.appliedFilters.broker && <span className="font-medium"> | الوسيط: {result.appliedFilters.broker}</span>}
                    {result.appliedFilters.account && <span className="font-medium"> | الحساب: {result.appliedFilters.account}</span>}
                    {result.appliedFilters.product && <span className="font-medium"> | المنتج: {result.appliedFilters.product}</span>}
                    {result.appliedFilters.referralSourceType && <span className="font-medium"> | المصدر: {result.appliedFilters.referralSourceType}</span>}
                    {result.appliedFilters.period && <span className="font-medium"> | الفترة: {result.appliedFilters.period}</span>}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="view-mode" className="text-sm">ملخص</Label>
                  <Switch
                    id="view-mode"
                    checked={showDetailedView}
                    onCheckedChange={setShowDetailedView}
                  />
                  <Label htmlFor="view-mode" className="text-sm">تفصيلي</Label>
                  <List className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
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

            {showDetailedView && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <List className="h-5 w-5" />
                    السجلات التفصيلية
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleFetchDetails}
                      disabled={isLoadingDetails}
                    >
                      {isLoadingDetails ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري التحميل...
                        </>
                      ) : (
                        <>
                          <Search className="ml-2 h-4 w-4" />
                          {detailedResult ? 'تحديث السجلات' : 'جلب السجلات'}
                        </>
                      )}
                    </Button>
                    {detailedResult && detailedResult.records.length > 0 && (
                      <Button
                        variant="default"
                        onClick={handleExportExcel}
                      >
                        <Download className="ml-2 h-4 w-4" />
                        تصدير Excel
                      </Button>
                    )}
                  </div>
                </div>

                {!detailedResult && !isLoadingDetails && (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    اضغط على &quot;جلب السجلات&quot; لعرض التفاصيل
                  </div>
                )}

                {detailedResult && detailedResult.records.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    لا توجد سجلات مطابقة للفلاتر المحددة
                  </div>
                )}

                {detailedResult && detailedResult.records.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[500px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead className="text-right">#</TableHead>
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-right">المبلغ</TableHead>
                            <TableHead className="text-right">المستخدم</TableHead>
                            {selectedRecordType === 'cashback' && (
                              <>
                                <TableHead className="text-right">الوسيط</TableHead>
                                <TableHead className="text-right">رقم الحساب</TableHead>
                              </>
                            )}
                            {selectedRecordType === 'referral' && (
                              <>
                                <TableHead className="text-right">الوسيط</TableHead>
                                <TableHead className="text-right">رقم الحساب</TableHead>
                                <TableHead className="text-right">المصدر</TableHead>
                                <TableHead className="text-right">المُحال</TableHead>
                              </>
                            )}
                            {selectedRecordType === 'order_created' && (
                              <>
                                <TableHead className="text-right">المنتج</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                              </>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailedResult.records.map((record, index) => (
                            <TableRow key={record.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                {format(new Date(record.date), 'PP', { locale: ar })}
                              </TableCell>
                              <TableCell className="font-medium">
                                ${record.amount.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {record.userName || record.userEmail || '-'}
                              </TableCell>
                              {selectedRecordType === 'cashback' && (
                                <>
                                  <TableCell>{record.broker || '-'}</TableCell>
                                  <TableCell>{record.accountNumber || '-'}</TableCell>
                                </>
                              )}
                              {selectedRecordType === 'referral' && (
                                <>
                                  <TableCell>{record.broker || '-'}</TableCell>
                                  <TableCell>{record.accountNumber || '-'}</TableCell>
                                  <TableCell>{record.sourceType || '-'}</TableCell>
                                  <TableCell>{record.referredUserName || '-'}</TableCell>
                                </>
                              )}
                              {selectedRecordType === 'order_created' && (
                                <>
                                  <TableCell>{record.productName || '-'}</TableCell>
                                  <TableCell>{record.status || '-'}</TableCell>
                                </>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="p-3 bg-muted/50 border-t flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        إجمالي السجلات: {detailedResult.count.toLocaleString()}
                      </span>
                      <span className="font-bold text-primary">
                        المجموع: ${detailedResult.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
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
