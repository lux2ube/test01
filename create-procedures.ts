/**
 * Run this script to create ledger procedures in your Supabase database
 * Usage: npx tsx create-procedures.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const sql = readFileSync('./attached_assets/SIMPLE_LEDGER_FIX.sql', 'utf8');

console.log('🚀 Creating ledger procedures...\n');

async function createProcedures() {
  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error:', error.message);
      console.log('\n📋 COPY THIS AND RUN IN SUPABASE DASHBOARD:\n');
      console.log('1. Go to: https://supabase.com/dashboard → SQL Editor');
      console.log('2. Copy the file: attached_assets/SIMPLE_LEDGER_FIX.sql');
      console.log('3. Paste and click RUN\n');
    } else {
      console.log('✅ Procedures created successfully!');
    }
  } catch (err: any) {
    console.error('❌ Failed:', err.message);
    console.log('\n📝 MANUAL STEPS:\n');
    console.log('File to copy: attached_assets/SIMPLE_LEDGER_FIX.sql');
    console.log('Where to paste: Supabase Dashboard → SQL Editor\n');
  }
}

createProcedures();
