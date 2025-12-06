'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { Broker } from '@/types';

// Transform database snake_case fields to camelCase for TypeScript
function transformBrokerFromDB(dbBroker: any): Broker {
  return {
    id: dbBroker.id,
    order: dbBroker.order,
    logoUrl: dbBroker.logo_url || dbBroker.logoUrl || "",
    basicInfo: dbBroker.basic_info || dbBroker.basicInfo || {},
    regulation: dbBroker.regulation || {},
    tradingConditions: dbBroker.trading_conditions || dbBroker.tradingConditions || {},
    platforms: dbBroker.platforms || {},
    instruments: dbBroker.instruments || {},
    depositsWithdrawals: dbBroker.deposits_withdrawals || dbBroker.depositsWithdrawals || {},
    cashback: dbBroker.cashback || {},
    globalReach: dbBroker.global_reach || dbBroker.globalReach || {},
    reputation: dbBroker.reputation || {},
    additionalFeatures: dbBroker.additional_features || dbBroker.additionalFeatures || {},
    name: dbBroker.name || "",
    description: dbBroker.description || "",
    category: dbBroker.category || "other",
    rating: dbBroker.rating || 0,
    instructions: dbBroker.instructions || {},
    existingAccountInstructions: dbBroker.existing_account_instructions || dbBroker.existingAccountInstructions || "",
  };
}

// Transform camelCase Broker fields to snake_case for database
function transformBrokerForDB(broker: Partial<Omit<Broker, 'id' | 'order'>>): any {
  const dbData: any = {};
  
  // Map camelCase to snake_case for nested object fields
  if (broker.logoUrl !== undefined) dbData.logo_url = broker.logoUrl;
  if (broker.basicInfo !== undefined) dbData.basic_info = broker.basicInfo;
  if (broker.regulation !== undefined) dbData.regulation = broker.regulation;
  if (broker.tradingConditions !== undefined) dbData.trading_conditions = broker.tradingConditions;
  if (broker.platforms !== undefined) dbData.platforms = broker.platforms;
  if (broker.instruments !== undefined) dbData.instruments = broker.instruments;
  if (broker.depositsWithdrawals !== undefined) dbData.deposits_withdrawals = broker.depositsWithdrawals;
  if (broker.cashback !== undefined) dbData.cashback = broker.cashback;
  if (broker.globalReach !== undefined) dbData.global_reach = broker.globalReach;
  if (broker.reputation !== undefined) dbData.reputation = broker.reputation;
  if (broker.additionalFeatures !== undefined) dbData.additional_features = broker.additionalFeatures;
  
  // Legacy fields
  if (broker.name !== undefined) dbData.name = broker.name;
  if (broker.description !== undefined) dbData.description = broker.description;
  if (broker.category !== undefined) dbData.category = broker.category;
  if (broker.rating !== undefined) dbData.rating = broker.rating;
  if (broker.instructions !== undefined) dbData.instructions = broker.instructions;
  if (broker.existingAccountInstructions !== undefined) dbData.existing_account_instructions = broker.existingAccountInstructions;
  
  return dbData;
}

export async function getBrokers(): Promise<Broker[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('brokers')
    .select('*')
    .order('order');

  if (error) {
    console.error('Error fetching brokers:', error);
    return [];
  }

  return (data || []).map(transformBrokerFromDB);
}

export async function addBroker(data: Omit<Broker, 'id' | 'order'>) {
  try {
    const supabase = await createAdminClient();
    
    if (!supabase) {
      console.error('Failed to create admin client');
      return { success: false, error: 'فشل الاتصال بقاعدة البيانات', message: 'فشل إضافة الوسيط.' };
    }
    
    const { data: brokersData, error: fetchError } = await supabase
      .from('brokers')
      .select('order')
      .order('order', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching max order:', fetchError);
      return { success: false, error: fetchError.message, message: 'فشل إضافة الوسيط.' };
    }

    const maxOrder = brokersData && brokersData.length > 0 && brokersData[0].order != null
      ? brokersData[0].order
      : -1;

    const dbData = transformBrokerForDB(data);
    const { error } = await supabase
      .from('brokers')
      .insert({ ...dbData, order: maxOrder + 1 });

    if (error) {
      console.error('Error adding broker:', error);
      return { success: false, error: error.message, message: 'فشل إضافة الوسيط.' };
    }

    return { success: true, message: 'تمت إضافة الوسيط بنجاح.' };
  } catch (error) {
    console.error('Error adding broker:', error);
    return { success: false, error: String(error), message: 'فشل إضافة الوسيط.' };
  }
}

export async function updateBroker(brokerId: string, data: Partial<Omit<Broker, 'id'>>) {
  try {
    const supabase = await createAdminClient();
    
    if (!supabase) {
      console.error('Failed to create admin client');
      return { success: false, error: 'فشل الاتصال بقاعدة البيانات', message: 'فشل تحديث الوسيط.' };
    }
    
    const dbData = transformBrokerForDB(data);
    const { error } = await supabase
      .from('brokers')
      .update(dbData)
      .eq('id', brokerId);

    if (error) {
      console.error('Error updating broker:', error);
      return { success: false, error: error.message, message: 'فشل تحديث الوسيط.' };
    }

    return { success: true, message: 'تم تحديث الوسيط بنجاح.' };
  } catch (error) {
    console.error('Error updating broker:', error);
    return { success: false, error: String(error), message: 'فشل تحديث الوسيط.' };
  }
}

export async function deleteBroker(brokerId: string) {
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from('brokers')
      .delete()
      .eq('id', brokerId);

    if (error) {
      console.error('Error deleting broker:', error);
      return { success: false, message: 'فشل حذف الوسيط.' };
    }

    return { success: true, message: 'تم حذف الوسيط بنجاح.' };
  } catch (error) {
    console.error('Error deleting broker:', error);
    return { success: false, message: 'فشل حذف الوسيط.' };
  }
}

export async function updateBrokerOrder(orderedIds: string[]) {
  try {
    const supabase = await createAdminClient();
    
    for (let index = 0; index < orderedIds.length; index++) {
      const { error } = await supabase
        .from('brokers')
        .update({ order: index })
        .eq('id', orderedIds[index]);

      if (error) {
        console.error('Error updating broker order:', error);
        return { success: false, message: 'فشل تحديث ترتيب الوسطاء.' };
      }
    }

    return { success: true, message: 'تم تحديث ترتيب الوسطاء.' };
  } catch (error) {
    console.error('Error updating broker order:', error);
    return { success: false, message: 'فشل تحديث ترتيب الوسطاء.' };
  }
}

export async function addBrokersBatch(brokers: Omit<Broker, 'id' | 'order'>[]) {
  try {
    const supabase = await createAdminClient();
    
    const { data: brokersData, error: fetchError } = await supabase
      .from('brokers')
      .select('order')
      .order('order', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching max order:', fetchError);
      return { success: false, message: 'فشل إضافة الوسطاء.' };
    }

    let maxOrder = brokersData && brokersData.length > 0 && brokersData[0].order != null
      ? brokersData[0].order
      : -1;

    const brokersToInsert = brokers.map((brokerData) => {
      maxOrder++;
      const dbData = transformBrokerForDB(brokerData);
      return { ...dbData, order: maxOrder };
    });

    const { error } = await supabase
      .from('brokers')
      .insert(brokersToInsert);

    if (error) {
      console.error('Error adding brokers batch:', error);
      return { success: false, message: 'فشل إضافة الوسطاء.' };
    }

    return { success: true, message: `تمت إضافة ${brokers.length} وسطاء بنجاح.` };
  } catch (error) {
    console.error('Error adding brokers batch:', error);
    return { success: false, message: 'فشل إضافة الوسطاء.' };
  }
}
