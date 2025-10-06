import { createAdminClient } from '@/lib/supabase/server';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file at the root of the project
config({ path: resolve(__dirname, '../../.env') });

interface PointsRule {
    id?: string;
    action: string;
    points: number;
    is_dollar_based: boolean;
    description: string;
}

const defaultRules: Omit<PointsRule, 'id'>[] = [
    {
        action: 'approve_account',
        points: 50,
        is_dollar_based: false,
        description: 'For linking and approving a new trading account.'
    },
    {
        action: 'cashback_earned',
        points: 1,
        is_dollar_based: true,
        description: 'Earn 1 point for every $1 of cashback received.'
    },
    {
        action: 'store_purchase',
        points: 1,
        is_dollar_based: true,
        description: 'Earn 1 point for every $1 spent in the store.'
    },
    {
        action: 'referral_signup',
        points: 25,
        is_dollar_based: false,
        description: 'For referring a new user who signs up.'
    },
    {
        action: 'referral_becomes_active',
        points: 100,
        is_dollar_based: false,
        description: 'When your referral links their first approved account.'
    },
    {
        action: 'referral_becomes_trader',
        points: 250,
        is_dollar_based: false,
        description: 'When your referral receives their first cashback.'
    },
    {
        action: 'referral_commission',
        points: 1,
        is_dollar_based: true,
        description: 'Earn points from your referral\'s cashback, based on your tier.'
    }
];

async function seedDefaultPointsRules() {
    console.log('Starting script to seed default loyalty points rules...');

    try {
        const supabase = await createAdminClient();

        // Check if points_rules table exists, if not, we'll get an error
        const { data: existingRules, error: fetchError } = await supabase
            .from('points_rules')
            .select('action');

        if (fetchError) {
            console.error('Error fetching existing rules:', fetchError);
            console.error('Note: The points_rules table may not exist yet. Please create it in your Supabase database.');
            throw fetchError;
        }

        const existingActions = existingRules?.map(rule => rule.action) || [];
        const rulesToAdd = defaultRules.filter(rule => !existingActions.includes(rule.action));

        if (rulesToAdd.length === 0) {
            console.log('All default rules already exist. No action needed.');
            return;
        }

        console.log(`Found ${rulesToAdd.length} new rules to add...`);

        for (const rule of rulesToAdd) {
            const { error: insertError } = await supabase
                .from('points_rules')
                .insert(rule);

            if (insertError) {
                console.error(`Error adding rule for action ${rule.action}:`, insertError);
                throw insertError;
            }

            console.log(`Added rule for action: ${rule.action}`);
        }

        console.log('Script finished successfully. Default points rules have been seeded.');

    } catch (error) {
        console.error('An error occurred while seeding rules:', error);
        throw error;
    }
}

seedDefaultPointsRules().then(() => {
    console.log("Exiting script.");
    process.exit(0);
}).catch(e => {
    console.error("Unhandled error in script:", e);
    process.exit(1);
});
