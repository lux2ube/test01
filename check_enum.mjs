import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check what enum values exist
const { data, error } = await supabase
  .from('transactions')
  .select('type')
  .limit(10);

console.log('📊 Existing transaction types in database:');
if (data) {
  const types = [...new Set(data.map(t => t.type))];
  console.log(types);
} else {
  console.log('Error:', error);
}

// Try to insert with different enum values
const testTypes = ['withdrawal', 'withdrawal_processing', 'withdrawal_completed', 'cashback', 'referral'];

for (const type of testTypes) {
  const testUser = '00000000-0000-0000-0000-000000000000';
  const { error: insertError } = await supabase
    .from('transactions')
    .insert({
      user_id: testUser,
      type: type,
      amount: 0,
      reference_id: testUser
    });
  
  if (!insertError) {
    console.log(`✅ '${type}' is VALID`);
    // Clean up
    await supabase.from('transactions').delete().eq('user_id', testUser);
  } else if (insertError.message.includes('invalid input value for enum')) {
    console.log(`❌ '${type}' is INVALID`);
  } else if (insertError.message.includes('violates foreign key')) {
    console.log(`✅ '${type}' is VALID (foreign key error is expected)`);
  } else {
    console.log(`⚠️  '${type}': ${insertError.message}`);
  }
}
