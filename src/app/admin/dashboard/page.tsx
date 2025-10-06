
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTradingAccounts } from '@/app/admin/manage-accounts/actions';
import { getWithdrawals } from '@/app/admin/manage-withdrawals/actions';
import { getUsers } from '@/app/admin/users/actions';
import { getPendingVerifications } from '../manage-verifications/actions';
import { getAdminDashboardStats } from '@/app/actions';
import type { TradingAccount, UserProfile, Withdrawal, CashbackTransaction, Order } from '@/types';
import { Loader2, Users, Briefcase, Landmark, ShieldCheck, HandCoins, ShoppingBag, Banknote, DollarSign } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  pendingAccounts: number;
  pendingWithdrawals: number;
  totalWithdrawals: number;
  pendingVerifications: number;
  totalReferralCommissions: number;
  totalStoreSpending: number;
  totalCashbackAdded: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingAccounts: 0,
    pendingWithdrawals: 0,
    totalWithdrawals: 0,
    pendingVerifications: 0,
    totalReferralCommissions: 0,
    totalStoreSpending: 0,
    totalCashbackAdded: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
            users, 
            accounts, 
            withdrawals, 
            pendingVerifications, 
            dashboardStats,
        ] = await Promise.all([
          getUsers(),
          getTradingAccounts(),
          getWithdrawals(),
          getPendingVerifications(),
          getAdminDashboardStats(),
        ]);
        
        const totalUsers = users.length;
        const pendingAccounts = accounts.filter(a => a.status === 'Pending').length;
        const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'Processing').length;
        const totalWithdrawalsAmount = withdrawals
          .filter(w => w.status === 'Completed')
          .reduce((sum, w) => sum + w.amount, 0);

        const { totalReferralCommissions, totalStoreSpending, totalCashbackAdded } = dashboardStats;

        setStats({ 
            totalUsers, 
            pendingAccounts, 
            pendingWithdrawals: pendingWithdrawalsCount, 
            totalWithdrawals: totalWithdrawalsAmount,
            pendingVerifications: pendingVerifications.length,
            totalReferralCommissions,
            totalStoreSpending,
            totalCashbackAdded,
        });
      } catch (error) {
        console.error("Failed to fetch admin dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title="لوحة تحكم المشرف"
        description="الإشراف على نشاط التطبيق."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحسابات المعلقة</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAccounts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">السحوبات المعلقة</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingWithdrawals}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التحققات المعلقة</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الكاش باك المضاف</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCashbackAdded.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي السحوبات المكتملة</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalWithdrawals.toFixed(2)}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عمولات الإحالة المدفوعة</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalReferralCommissions.toFixed(2)}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي مبيعات المتجر</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalStoreSpending.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
