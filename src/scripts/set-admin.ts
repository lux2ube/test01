import { createAdminClient } from '@/lib/supabase/server';

// The ID of the user you want to make an admin
const userId = "REPLACE_WITH_USER_ID";

async function setAdminRole() {
  if (!userId || userId === "REPLACE_WITH_USER_ID") {
    console.error("❌ Error: Please replace 'REPLACE_WITH_USER_ID' with the actual user ID in the script.");
    return;
  }

  try {
    const supabase = await createAdminClient();

    // Verify the user exists first
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      console.error(`❌ User with ID ${userId} not found.`);
      console.error('Please verify the ID is correct.');
      throw fetchError || new Error('User not found');
    }

    console.log(`✓ User found: ${user.email || 'no email'}`);

    // Set the admin role
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error setting admin role:', updateError);
      throw updateError;
    }

    console.log("✅ Admin role granted successfully to user:", user.email);
    console.log("User role updated to: admin");
    console.log("\n👉 Important: The user may need to log out and log back in for the changes to take effect.");
  } catch (error) {
    console.error("❌ Error setting admin role:", error);
    throw error;
  }
}

setAdminRole().then(() => {
  console.log("Script finished.");
  process.exit(0);
}).catch(e => {
  console.error("Unhandled error in script execution:", e);
  process.exit(1);
});
