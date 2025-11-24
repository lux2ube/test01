#!/usr/bin/env node

/**
 * Migration Runner for Supabase
 * This script connects to your Supabase database and runs the ledger migration
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Extract database connection URL from Supabase URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
const DATABASE_URL = `postgresql://postgres:[password]@db.${projectRef}.supabase.co:5432/postgres`;

console.log('📚 Ledger Migration Runner');
console.log('==========================');
console.log(`🔗 Project: ${projectRef}`);
console.log('');

// Read the SQL migration file
const sqlFile = path.join(__dirname, 'attached_assets', 'PROCEDURES_ONLY_1763944454233.sql');

if (!fs.existsSync(sqlFile)) {
  console.error(`❌ Error: Migration file not found at ${sqlFile}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFile, 'utf8');

console.log('📄 Migration file loaded successfully');
console.log(`   File: ${path.basename(sqlFile)}`);
console.log(`   Size: ${sqlContent.length} bytes`);
console.log('');

// Use Supabase REST API to execute SQL
async function runMigration() {
  console.log('🚀 Executing migration...');
  console.log('');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sqlContent })
    });

    if (!response.ok) {
      // Try alternative approach using pg library
      console.log('⚠️  REST API approach failed, trying direct PostgreSQL connection...');
      console.log('');
      await runMigrationWithPg();
      return;
    }

    const result = await response.json();
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Next steps:');
    console.log('   1. Verify procedures were created');
    console.log('   2. Test by adding cashback to a user');
    console.log('   3. Check that user totals update correctly');
    console.log('');
  } catch (error) {
    console.error('❌ Error running migration via REST API');
    console.log('');
    console.log('⚠️  Trying direct PostgreSQL connection...');
    console.log('');
    await runMigrationWithPg();
  }
}

async function runMigrationWithPg() {
  const { Client } = require('pg');
  
  // Prompt for database password
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('🔑 Enter your Supabase database password: ', async (password) => {
    rl.close();

    const connectionString = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
    
    const client = new Client({ connectionString });

    try {
      console.log('🔌 Connecting to database...');
      await client.connect();
      console.log('✅ Connected successfully');
      console.log('');

      console.log('⚙️  Executing SQL migration...');
      await client.query(sqlContent);
      
      console.log('✅ Migration completed successfully!');
      console.log('');
      
      // Verify procedures were created
      console.log('🔍 Verifying stored procedures...');
      const verification = await client.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
          AND routine_name LIKE 'ledger_%'
        ORDER BY routine_name;
      `);
      
      console.log(`✅ Found ${verification.rows.length} ledger procedures:`);
      verification.rows.forEach(row => {
        console.log(`   ✓ ${row.routine_name}`);
      });
      console.log('');
      
      console.log('🎉 Migration complete! Your ledger system is ready to use.');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.log('');
      console.log('💡 Manual Alternative:');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Open SQL Editor');
      console.log('   3. Copy content from: attached_assets/PROCEDURES_ONLY_1763944454233.sql');
      console.log('   4. Paste and click RUN');
    } finally {
      await client.end();
    }
  });
}

// Run the migration
runMigration();
