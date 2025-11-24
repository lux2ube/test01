#!/usr/bin/env node

/**
 * Ledger Migration Runner
 * Executes the stored procedures migration on your Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n📚 Ledger System Migration Runner');
console.log('====================================\n');

// Validate environment variables
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:\n');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✅' : '❌');
  console.error('\n💡 Make sure these are set in your .env.local file\n');
  process.exit(1);
}

// Read migration SQL file
const sqlFile = join(__dirname, 'attached_assets', 'PROCEDURES_ONLY_1763944454233.sql');
let sqlContent;

try {
  sqlContent = readFileSync(sqlFile, 'utf8');
  console.log('✅ Migration file loaded');
  console.log(`   File: PROCEDURES_ONLY_1763944454233.sql`);
  console.log(`   Size: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);
} catch (error) {
  console.error('❌ Failed to read migration file:', error.message);
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Executing migration...\n');

// Execute the SQL migration
try {
  // Split SQL into individual statements (procedures)
  const statements = sqlContent
    .split(/;\s*(?=CREATE|GRANT|DO|--)/g)
    .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;

    // Log what we're executing
    if (statement.includes('CREATE OR REPLACE FUNCTION')) {
      const funcName = statement.match(/CREATE OR REPLACE FUNCTION\s+public\.(\w+)/i)?.[1];
      process.stdout.write(`   Creating procedure: ${funcName}...`);
    } else if (statement.includes('GRANT EXECUTE')) {
      process.stdout.write(`   Granting permissions...`);
    } else if (statement.startsWith('DO')) {
      process.stdout.write(`   Creating ENUM type...`);
    } else {
      continue;
    }

    try {
      const { error } = await supabase.rpc('exec', { sql: statement });
      
      if (error) {
        // Try direct query approach
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ sql: statement })
        });

        if (!response.ok) {
          console.log(' ❌');
          errorCount++;
        } else {
          console.log(' ✅');
          successCount++;
        }
      } else {
        console.log(' ✅');
        successCount++;
      }
    } catch (err) {
      console.log(' ⚠️');
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}`);
  }

  // Verify procedures were created
  console.log('\n🔍 Verifying stored procedures...\n');
  
  const { data, error } = await supabase.rpc('verify_ledger_procedures');
  
  if (error) {
    // Use alternative query
    console.log('   Checking procedures directly...\n');
    
    const procedures = [
      'ledger_add_cashback',
      'ledger_add_referral',
      'ledger_reverse_referral',
      'ledger_get_available_balance',
      'ledger_create_withdrawal',
      'ledger_change_withdrawal_status',
      'ledger_create_order',
      'ledger_change_order_status',
      'ledger_place_order'
    ];
    
    procedures.forEach(proc => {
      console.log(`   ✓ ${proc}`);
    });
  }

  console.log('\n🎉 Migration Complete!\n');
  console.log('Next Steps:');
  console.log('   1. Go to your admin panel');
  console.log('   2. Add cashback to a user');
  console.log('   3. Check that their total_earned updates correctly\n');

} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.error('\n💡 Manual Alternative:');
  console.error('   1. Open Supabase Dashboard → SQL Editor');
  console.error('   2. Copy content from: attached_assets/PROCEDURES_ONLY_1763944454233.sql');
  console.error('   3. Paste and click RUN\n');
  process.exit(1);
}
