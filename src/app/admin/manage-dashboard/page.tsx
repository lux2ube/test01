"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTradingAccounts, getWithdrawals, getUsers } from '@/app/actions';
import type { TradingAccount, UserProfile, Withdrawal } from '@/types';
import { Loader2, Users, Briefcase, Landmark } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  pendingAccounts: number;
  pendingWithdrawals: number;
  totalCashbackPaid: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingAccounts: 0,
    pendingWithdrawals: 0,
    totalCashbackPaid: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, accounts, withdrawals] = await Promise.all([
          getUsers(),
          getTradingAccounts(),
          getWithdrawals(),
        ]);
        
        const totalUsers = users.length;
        const pendingAccounts = accounts.filter(a => a.status === 'Pending').length;
        const pendingWithdrawals = withdrawals.filter(w => w.status === 'Processing').length;
        const totalCashbackPaid = withdrawals
          .filter(w => w.status === 'Completed')
          .reduce((sum, w) => sum + w.amount, 0);

        setStats({ totalUsers, pendingAccounts, pendingWithdrawals, totalCashbackPaid });
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
            <CardTitle className="text-sm font-medium">إجمالي المدفوعات</CardTitle>
            <div className="h-4 w-4 text-muted-foreground font-bold">$</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCashbackPaid.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
