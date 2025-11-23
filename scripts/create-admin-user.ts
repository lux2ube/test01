import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const email = 'alsabhibassem@gmail.com';
  const password = 'alsabhi0';

  console.log('🔧 Creating admin user:', email);

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    console.error('❌ Error creating auth user:', authError.message);
    process.exit(1);
  }

  console.log('✅ Auth user created:', authData.user.id);

  // Update users table to set role as admin
  const { error: updateError } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('id', authData.user.id);

  if (updateError) {
    console.error('❌ Error updating user role:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Admin user created successfully!');
  console.log('📧 Email:', email);
  console.log('🔑 Password: alsabhi0');
  console.log('👤 User ID:', authData.user.id);
}

createAdminUser();
