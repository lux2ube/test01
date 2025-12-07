'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';
import type { ClientLevel } from '@/types';
import { getClientLevels } from '@/app/actions';

async function requireAdmin() {
    const user = await getAuthenticatedUser();
    if (user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
    }
    return user;
}

export interface UserLevelChange {
    userId: string;
    userName: string;
    userEmail: string;
    currentLevel: number;
    currentLevelName: string;
    reservedLevel: number;
    reservedLevelName: string;
    monthlyEarnings: number;
    changeDirection: 'upgrade' | 'downgrade' | 'same';
}

export interface LevelManagementResult {
    users: UserLevelChange[];
    month: string;
    year: number;
}

/**
 * Calculate monthly earnings for a user from ledger transactions
 * Only counts 'cashback' and 'referral' transaction types
 * ADMIN ONLY
 */
export async function getUserMonthlyEarnings(
    userId: string,
    month: number,
    year: number
): Promise<number> {
    await requireAdmin();
    const supabase = await createAdminClient();
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .in('type', ['cashback', 'referral'])
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    
    if (error) {
        console.error('Error fetching user monthly earnings:', error);
        return 0;
    }
    
    return data?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
}

/**
 * Get all users with their monthly earnings and calculate reserved level
 * ADMIN ONLY
 */
export async function getUsersWithLevelChanges(
    month: number,
    year: number
): Promise<LevelManagementResult> {
    await requireAdmin();
    const supabase = await createAdminClient();
    const levels = await getClientLevels();
    
    if (levels.length === 0) {
        return { users: [], month: getMonthName(month), year };
    }
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    // Get all earnings for the month grouped by user
    const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('user_id, amount')
        .in('type', ['cashback', 'referral'])
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    
    if (txError) {
        console.error('Error fetching transactions:', txError);
        return { users: [], month: getMonthName(month), year };
    }
    
    // Calculate monthly earnings per user
    const earningsMap = new Map<string, number>();
    for (const tx of transactions || []) {
        const current = earningsMap.get(tx.user_id) || 0;
        earningsMap.set(tx.user_id, current + Number(tx.amount));
    }
    
    // Get all users with their current level
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, level')
        .order('name');
    
    if (usersError) {
        console.error('Error fetching users:', usersError);
        return { users: [], month: getMonthName(month), year };
    }
    
    const usersWithChanges: UserLevelChange[] = [];
    
    for (const user of users || []) {
        const monthlyEarnings = earningsMap.get(user.id) || 0;
        const currentLevel = user.level || 1;
        
        // Calculate reserved level based on monthly earnings
        const reservedLevel = calculateReservedLevel(monthlyEarnings, levels);
        
        const currentLevelData = levels.find(l => l.id === currentLevel);
        const reservedLevelData = levels.find(l => l.id === reservedLevel);
        
        let changeDirection: 'upgrade' | 'downgrade' | 'same' = 'same';
        if (reservedLevel > currentLevel) changeDirection = 'upgrade';
        else if (reservedLevel < currentLevel) changeDirection = 'downgrade';
        
        // Only include users with level changes
        if (changeDirection !== 'same') {
            usersWithChanges.push({
                userId: user.id,
                userName: user.name || 'غير معروف',
                userEmail: user.email || '',
                currentLevel,
                currentLevelName: currentLevelData?.name || `Level ${currentLevel}`,
                reservedLevel,
                reservedLevelName: reservedLevelData?.name || `Level ${reservedLevel}`,
                monthlyEarnings,
                changeDirection,
            });
        }
    }
    
    // Sort by change direction (upgrades first) then by earnings
    usersWithChanges.sort((a, b) => {
        if (a.changeDirection === 'upgrade' && b.changeDirection !== 'upgrade') return -1;
        if (a.changeDirection !== 'upgrade' && b.changeDirection === 'upgrade') return 1;
        return b.monthlyEarnings - a.monthlyEarnings;
    });
    
    return {
        users: usersWithChanges,
        month: getMonthName(month),
        year,
    };
}

/**
 * Calculate the reserved level based on monthly earnings
 * Returns the highest level the user qualifies for
 */
function calculateReservedLevel(monthlyEarnings: number, levels: ClientLevel[]): number {
    // Sort levels by required_total descending to find highest qualifying level
    const sortedLevels = [...levels].sort((a, b) => b.required_total - a.required_total);
    
    for (const level of sortedLevels) {
        if (monthlyEarnings >= level.required_total) {
            return level.id;
        }
    }
    
    // Default to lowest level (Bronze)
    return 1;
}

/**
 * Update a user's level to their reserved level
 * ADMIN ONLY
 */
export async function applyUserLevelChange(
    userId: string,
    newLevel: number
): Promise<{ success: boolean; message: string }> {
    try {
        await requireAdmin();
        const supabase = await createAdminClient();
        
        const { error } = await supabase
            .from('users')
            .update({ level: newLevel })
            .eq('id', userId);
        
        if (error) throw error;
        
        return { success: true, message: 'تم تحديث مستوى المستخدم بنجاح.' };
    } catch (error: any) {
        console.error('Error updating user level:', error);
        return { success: false, message: error.message || 'فشل تحديث مستوى المستخدم.' };
    }
}

/**
 * Bulk update all users to their reserved levels
 * ADMIN ONLY
 */
export async function applyAllLevelChanges(
    month: number,
    year: number
): Promise<{ success: boolean; message: string; updatedCount: number }> {
    try {
        await requireAdmin();
        const result = await getUsersWithLevelChanges(month, year);
        const supabase = await createAdminClient();
        
        let updatedCount = 0;
        
        for (const user of result.users) {
            const { error } = await supabase
                .from('users')
                .update({ level: user.reservedLevel })
                .eq('id', user.userId);
            
            if (!error) {
                updatedCount++;
            }
        }
        
        return {
            success: true,
            message: `تم تحديث ${updatedCount} مستخدم بنجاح.`,
            updatedCount,
        };
    } catch (error: any) {
        console.error('Error applying all level changes:', error);
        return { success: false, message: error.message || 'فشل تحديث المستويات.', updatedCount: 0 };
    }
}

function getMonthName(month: number): string {
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month - 1] || '';
}

export async function updateClientLevels(levels: ClientLevel[]) {
    try {
        await requireAdmin();
        const supabase = await createAdminClient();
        
        for (const level of levels) {
            const { id, ...levelData } = level;
            const { error } = await supabase
                .from('client_levels')
                .update(levelData)
                .eq('id', id);

            if (error) {
                console.error(`Error updating client level ${id}:`, error);
                return { success: false, message: 'فشل تحديث مستويات العملاء.' };
            }
        }

        return { success: true, message: 'تم تحديث مستويات العملاء بنجاح.' };
    } catch (error) {
        console.error("Error updating client levels:", error);
        return { success: false, message: 'فشل تحديث مستويات العملاء.' };
    }
}

export async function seedClientLevels(): Promise<{ success: boolean; message: string; }> {
    await requireAdmin();
    const supabase = await createAdminClient();
    
    const { data: existingLevels, error: fetchError } = await supabase
        .from('client_levels')
        .select('id')
        .limit(1);

    if (fetchError) {
        console.error("Error checking client levels:", fetchError);
        return { success: false, message: 'فشل التحقق من مستويات العملاء.' };
    }

    if (existingLevels && existingLevels.length > 0) {
        return { success: false, message: 'مستويات العملاء موجودة بالفعل.' };
    }

    const defaultLevels: Omit<ClientLevel, 'id'>[] = [
        { name: 'Bronze', required_total: 0, advantage_referral_cashback: 5, advantage_referral_store: 2, advantage_product_discount: 0 },
        { name: 'Silver', required_total: 100, advantage_referral_cashback: 7, advantage_referral_store: 4, advantage_product_discount: 2 },
        { name: 'Gold', required_total: 500, advantage_referral_cashback: 10, advantage_referral_store: 6, advantage_product_discount: 4 },
        { name: 'Platinum', required_total: 2000, advantage_referral_cashback: 15, advantage_referral_store: 8, advantage_product_discount: 6 },
        { name: 'Diamond', required_total: 10000, advantage_referral_cashback: 20, advantage_referral_store: 10, advantage_product_discount: 8 },
        { name: 'Ambassador', required_total: 50000, advantage_referral_cashback: 25, advantage_referral_store: 15, advantage_product_discount: 10 },
    ];

    try {
        const levelsToInsert = defaultLevels.map((level, index) => ({
            id: index + 1,
            ...level
        }));

        const { error } = await supabase
            .from('client_levels')
            .insert(levelsToInsert);

        if (error) {
            console.error("Error seeding client levels:", error);
            return { success: false, message: 'فشل إضافة مستويات العملاء الافتراضية.' };
        }

        return { success: true, message: 'تمت إضافة مستويات العملاء الافتراضية بنجاح.' };
    } catch (error) {
        console.error("Error seeding client levels:", error);
        return { success: false, message: 'فشل إضافة مستويات العملاء الافتراضية.' };
    }
}
