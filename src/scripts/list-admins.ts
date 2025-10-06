import { createAdminClient } from '@/lib/supabase/server';

async function listAdminUsers() {
  const adminUsers: { id: string, email?: string }[] = [];
  try {
    console.log('Fetching all users to check for admin role...');
    
    const supabase = await createAdminClient();
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'admin');

    if (error) {
      console.error('❌ Error fetching admin users:', error);
      throw error;
    }

    if (users && users.length > 0) {
      console.log('✅ Found the following admin users:');
      users.forEach(admin => {
        console.log(`   - ID: ${admin.id}, Email: ${admin.email || 'No email available'}`);
      });
    } else {
      console.log('ℹ️ No users with the admin role were found.');
    }

  } catch (error) {
    console.error('❌ Error listing admin users:', error);
    throw error;
  }
}

listAdminUsers().then(() => {
  console.log("Script finished.");
  process.exit(0);
}).catch(e => {
  console.error("Unhandled error in script execution:", e);
  process.exit(1);
});
