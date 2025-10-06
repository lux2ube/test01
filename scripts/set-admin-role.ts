#!/usr/bin/env tsx

/**
 * Set Admin Role Script
 * 
 * This script grants admin privileges to a specific user by updating their role in the database.
 * After running this script, the user may need to sign out and sign back in for the changes to take effect.
 * 
 * Usage: npx tsx scripts/set-admin-role.ts
 */

import { createAdminClient } from '../src/lib/supabase/server';

const ADMIN_USER_ID = '6yUTvF9JrBQo3GUEqxhUnfleVOE3';
const ADMIN_EMAIL = 'alsabhibassem@gmail.com';

async function setAdminRole() {
  try {
    console.log('🔐 Setting admin role for user...');
    console.log(`User ID: ${ADMIN_USER_ID}`);
    console.log(`Email: ${ADMIN_EMAIL}`);
    
    const supabase = await createAdminClient();

    // Verify the user exists first
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', ADMIN_USER_ID)
      .single();

    if (fetchError || !user) {
      console.error(`❌ User with ID ${ADMIN_USER_ID} not found.`);
      console.error('Please verify the ID is correct.');
      process.exit(1);
    }

    console.log(`✓ User found: ${user.email || 'no email'}`);
    
    if (user.email !== ADMIN_EMAIL) {
      console.warn(`⚠️  Warning: User email (${user.email}) does not match expected email (${ADMIN_EMAIL})`);
    }

    // Set the admin role
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', ADMIN_USER_ID);

    if (updateError) {
      console.error('❌ Error setting admin role:', updateError);
      process.exit(1);
    }

    console.log('✅ Admin role set successfully!');
    
    // Verify the role was updated
    const { data: updatedUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', ADMIN_USER_ID)
      .single();

    console.log('Current role:', updatedUser?.role);
    
    console.log('\n📝 Important:');
    console.log('The user may need to sign out and sign back in for the admin role to take effect.');
    console.log('After signing in again, the user will have admin privileges.');
    
  } catch (error) {
    console.error('❌ Error setting admin role:', error);
    process.exit(1);
  }
}

// Run the script
setAdminRole()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
