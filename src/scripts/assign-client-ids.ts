import { createAdminClient } from '@/lib/supabase/server';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file at the root of the project
config({ path: resolve(__dirname, '../../.env') });

const STARTING_ID = 100001;

async function assignClientIds() {
  console.log('Starting script to assign client IDs...');

  try {
    const supabase = await createAdminClient();

    // 1. Get users without a client_id (client_id will be null for users without one)
    const { data: usersWithoutClientId, error: fetchError } = await supabase
      .from('users')
      .select('id, created_at')
      .is('client_id', null)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      throw fetchError;
    }

    if (!usersWithoutClientId || usersWithoutClientId.length === 0) {
      console.log('All users already have a client ID. No action needed.');
      return;
    }

    console.log(`Found ${usersWithoutClientId.length} users without a client ID. Assigning IDs now...`);

    // 2. Get the current max client_id to determine next ID
    const { data: maxData, error: maxError } = await supabase
      .from('users')
      .select('client_id')
      .not('client_id', 'is', null)
      .order('client_id', { ascending: false })
      .limit(1);

    if (maxError) {
      console.error('Error fetching max client_id:', maxError);
      throw maxError;
    }

    let nextId = maxData && maxData.length > 0 && maxData[0].client_id 
      ? maxData[0].client_id + 1 
      : STARTING_ID;

    // 3. Assign new IDs to users
    for (const user of usersWithoutClientId) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ client_id: nextId })
        .eq('id', user.id);

      if (updateError) {
        console.error(`Error assigning Client ID ${nextId} to user ${user.id}:`, updateError);
        throw updateError;
      }

      console.log(`Assigning Client ID ${nextId} to user ${user.id}`);
      nextId++;
    }

    console.log('Script finished successfully. All users now have a client ID.');
  } catch (error) {
    console.error('An error occurred during the script:', error);
    console.log('Script failed. Please check the error message and try again.');
    throw error;
  }
}

assignClientIds().then(() => {
  console.log("Exiting script.");
  process.exit(0);
}).catch(e => {
  console.error("Unhandled error in script:", e);
  process.exit(1);
});
