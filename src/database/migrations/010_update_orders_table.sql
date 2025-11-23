-- Migration 010: Update orders table to support ledger integration
-- Adds missing fields required by ledger_place_order procedure

-- Add missing columns if they don't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS product_image TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS delivery_phone_number TEXT,
ADD COLUMN IF NOT EXISTS referral_commission_awarded BOOLEAN DEFAULT FALSE;

-- Update quantity to default to 1 if NULL (for compatibility)
UPDATE public.orders SET quantity = 1 WHERE quantity IS NULL;

-- Add NOT NULL constraint to quantity if it doesn't have one
ALTER TABLE public.orders ALTER COLUMN quantity SET DEFAULT 1;

-- Ensure total_price matches product_price for single-item orders
-- (ledger system uses product_price directly)
UPDATE public.orders 
SET total_price = product_price 
WHERE quantity = 1 AND total_price != product_price;

COMMENT ON COLUMN public.orders.product_image IS 'Product image URL for order display';
COMMENT ON COLUMN public.orders.user_name IS 'User name at time of order';
COMMENT ON COLUMN public.orders.user_email IS 'User email at time of order';
COMMENT ON COLUMN public.orders.delivery_phone_number IS 'Delivery contact number';
COMMENT ON COLUMN public.orders.referral_commission_awarded IS 'Whether referral commission was awarded for this order';
