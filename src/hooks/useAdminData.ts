"use client";

import { useState, useEffect, useCallback } from 'react';
import { getTradingAccounts } from '@/app/admin/manage-accounts/actions';
import { getUsers } from '@/app/admin/users/actions';
import { getBrokers } from '@/app/admin/manage-brokers/actions';
import type { TradingAccount, UserProfile, Broker } from '@/types';
import { useToast } from './use-toast';

export function useAdminData() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [accounts, setAccounts] = useState<TradingAccount[]>([]);
    const [brokers, setBrokers] = useState<Broker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedUsers, fetchedAccounts, fetchedBrokers] = await Promise.all([
                getUsers(),
                getTradingAccounts(),
                getBrokers()
            ]);
            setUsers(fetchedUsers);
            setAccounts(fetchedAccounts);
            setBrokers(fetchedBrokers);
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load necessary admin data.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { users, accounts, brokers, isLoading, refetch: fetchData };
}
