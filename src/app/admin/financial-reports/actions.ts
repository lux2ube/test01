'use server';

import { createAdminClient } from '@/lib/supabase/server';

export interface BrokerCashbackTotal {
  broker: string;
  totalCashback: number;
  transactionCount: number;
}

export interface FinancialSummary {
  totalCashback: number;
  totalReferralCommissions: number;
  cashbackByBroker: BrokerCashbackTotal[];
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
  const supabase = await createAdminClient();
  
  const { data: cashbackData, error: cashbackError } = await supabase
    .from('cashback_transactions')
    .select('broker, cashback_amount');
  
  if (cashbackError) {
    console.error('Error fetching cashback transactions:', cashbackError);
    return {
      totalCashback: 0,
      totalReferralCommissions: 0,
      cashbackByBroker: [],
    };
  }
  
  const brokerTotals = new Map<string, { total: number; count: number }>();
  let totalCashback = 0;
  
  for (const tx of cashbackData || []) {
    const amount = parseFloat(tx.cashback_amount || '0');
    totalCashback += amount;
    
    const broker = tx.broker || 'غير محدد';
    const current = brokerTotals.get(broker) || { total: 0, count: 0 };
    brokerTotals.set(broker, {
      total: current.total + amount,
      count: current.count + 1,
    });
  }
  
  const { data: referralData, error: referralError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('type', 'referral_commission');
  
  let totalReferralCommissions = 0;
  
  if (!referralError && referralData) {
    for (const tx of referralData) {
      totalReferralCommissions += parseFloat(tx.amount || '0');
    }
  }
  
  const cashbackByBroker: BrokerCashbackTotal[] = Array.from(brokerTotals.entries())
    .map(([broker, data]) => ({
      broker,
      totalCashback: data.total,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.totalCashback - a.totalCashback);
  
  return {
    totalCashback,
    totalReferralCommissions,
    cashbackByBroker,
  };
}
