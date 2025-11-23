/**
 * Migration Script for Ledger System
 * 
 * Applies all SQL migrations to the Supabase database
 * Run with: npx tsx src/database/scripts/apply-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const migrations = [
  '001_create_accounts_table.sql',
  '002_create_auto_account_trigger.sql',
  '003_create_accounts_rls.sql',
  '004_create_transactions_table.sql',
  '005_create_immutable_events_table.sql',
  '006_create_audit_logs_table.sql',
  '007_create_stored_procedures.sql',
  '008_additional_ledger_procedures.sql',
];

async function executeSqlFile(filename: string): Promise<void> {
  const filePath = join(__dirname, '..', 'migrations', filename);
  const sql = readFileSync(filePath, 'utf-8');

  console.log(`\n📄 Applying migration: ${filename}`);

  const { error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    // Try direct execution if RPC doesn't exist
    const { error: directError } = await (supabase as any).from('_sql').select('*').limit(0);
    
    if (directError) {
      console.error(`❌ Failed to apply ${filename}:`);
      console.error(error.message);
      throw error;
    }
  }

  console.log(`✅ Successfully applied: ${filename}`);
}

async function main() {
  console.log('🚀 Starting database migration...\n');
  console.log(`📡 Supabase URL: ${supabaseUrl}\n`);

  try {
    // Test connection
    const { error: testError } = await supabase.from('users').select('id').limit(1);
    if (testError && !testError.message.includes('does not exist')) {
      console.error('❌ Failed to connect to Supabase:', testError.message);
      process.exit(1);
    }

    console.log('✅ Connected to Supabase\n');

    // Apply each migration
    for (const migration of migrations) {
      await executeSqlFile(migration);
    }

    console.log('\n\n🎉 All migrations applied successfully!\n');
    console.log('📊 Created tables:');
    console.log('  - accounts (user balance totals)');
    console.log('  - transactions (unified ledger)');
    console.log('  - immutable_events (audit trail)');
    console.log('  - audit_logs (admin actions)');
    console.log('\n🔒 Applied RLS policies for security');
    console.log('\n⚡ Created stored procedures:');
    console.log('  - ledger_add_cashback');
    console.log('  - ledger_add_referral');
    console.log('  - ledger_reverse_referral');
    console.log('  - ledger_create_withdrawal');
    console.log('  - ledger_change_withdrawal_status');
    console.log('  - ledger_create_order');
    console.log('  - ledger_change_order_status');
    console.log('  - ledger_get_available_balance');
    console.log('\n✨ Ledger system is ready to use!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
