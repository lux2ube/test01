import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function approveLatestWithdrawal() {
  try {
    // Get latest Processing withdrawal
    console.log('🔍 Fetching latest withdrawal...');
    const { data: withdrawals, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('status', 'Processing')
      .order('requested_at', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;
    
    if (!withdrawals || withdrawals.length === 0) {
      console.log('⚠️  No pending withdrawals');
      return;
    }

    const w = withdrawals[0];
    console.log(`✅ Found: ID=${w.id} User=${w.user_id} Amount=${w.amount}`);

    // Update account balances directly
    console.log('💰 Updating account...');
    const { data: account } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', w.user_id)
      .single();

    if (account) {
      const newPending = Math.max(0, account.total_pending_withdrawals - w.amount);
      const newWithdrawn = account.total_withdrawn + w.amount;
      
      await supabase
        .from('accounts')
        .update({
          total_pending_withdrawals: newPending,
          total_withdrawn: newWithdrawn,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', w.user_id);
      
      console.log(`  Pending: ${account.total_pending_withdrawals} → ${newPending}`);
      console.log(`  Withdrawn: ${account.total_withdrawn} → ${newWithdrawn}`);
    }

    // Update withdrawal status
    console.log('📝 Marking withdrawal as Completed...');
    await supabase
      .from('withdrawals')
      .update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
        tx_id: `DIRECT_APPROVAL_${Date.now()}`
      })
      .eq('id', w.id);

    console.log('✅ ✅ ✅ WITHDRAWAL APPROVED SUCCESSFULLY! ✅ ✅ ✅');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

approveLatestWithdrawal();
