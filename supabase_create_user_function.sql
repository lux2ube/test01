-- Create a function to create user records (bypasses RLS)
-- This function can be called from the application using the service role

CREATE OR REPLACE FUNCTION create_user_record(
    p_user_id UUID,
    p_name TEXT,
    p_email TEXT,
    p_referral_code TEXT,
    p_referred_by UUID DEFAULT NULL,
    p_country TEXT DEFAULT 'Unknown'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO users (
        id,
        name,
        email,
        role,
        status,
        created_at,
        referral_code,
        referred_by,
        level,
        monthly_earnings,
        country
    ) VALUES (
        p_user_id,
        p_name,
        p_email,
        'user',
        'active',
        NOW(),
        p_referral_code,
        p_referred_by,
        1,
        0,
        p_country
    );
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION create_user_record TO authenticated, service_role;

-- Add comment
COMMENT ON FUNCTION create_user_record IS 'Creates a new user record in the users table. Used during registration to bypass RLS policies.';
