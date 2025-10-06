-- Supabase Migration Schema - TESTED VERSION
-- Run this ONCE in Supabase SQL Editor
-- This will create all tables with correct column names

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: Create ENUM Types
-- ============================================
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('active', 'suspended', 'inactive'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('user', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE document_type AS ENUM ('id_card', 'passport'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE gender_type AS ENUM ('male', 'female'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('Pending', 'Verified', 'Rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE account_status AS ENUM ('Pending', 'Approved', 'Rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE withdrawal_status AS ENUM ('Processing', 'Completed', 'Failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('account', 'cashback', 'withdrawal', 'general', 'store', 'loyalty', 'announcement'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE target_type AS ENUM ('all', 'specific'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE broker_category AS ENUM ('forex', 'crypto', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_method_type AS ENUM ('crypto', 'internal_transfer', 'trading_account'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE cashback_frequency AS ENUM ('Daily', 'Weekly', 'Monthly'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE mt_license_type AS ENUM ('Full License', 'White Label', 'None'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE source_type AS ENUM ('cashback', 'store_purchase'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================
-- STEP 2: Create Tables
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'user',
    client_id SERIAL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    country TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    status user_status DEFAULT 'active',
    phone_number TEXT,
    phone_number_verified BOOLEAN DEFAULT FALSE,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 6),
    monthly_earnings NUMERIC(10, 2) DEFAULT 0,
    kyc_document_type document_type,
    kyc_document_number TEXT,
    kyc_full_name TEXT,
    kyc_date_of_birth DATE,
    kyc_nationality TEXT,
    kyc_document_issue_date DATE,
    kyc_document_expiry_date DATE,
    kyc_gender gender_type,
    kyc_document_front_url TEXT,
    kyc_document_back_url TEXT,
    kyc_status verification_status,
    kyc_submitted_at TIMESTAMPTZ,
    kyc_rejection_reason TEXT,
    address_country TEXT,
    address_city TEXT,
    address_street TEXT,
    address_state_province TEXT,
    address_postal_code TEXT,
    address_document_url TEXT,
    address_status verification_status,
    address_submitted_at TIMESTAMPTZ,
    address_rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Brokers table
CREATE TABLE IF NOT EXISTS brokers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order" INTEGER NOT NULL,
    logo_url TEXT,
    name TEXT NOT NULL,
    description TEXT,
    category broker_category DEFAULT 'forex',
    rating NUMERIC(2, 1) CHECK (rating BETWEEN 0 AND 5),
    basic_info JSONB NOT NULL,
    regulation JSONB NOT NULL,
    trading_conditions JSONB NOT NULL,
    platforms JSONB NOT NULL,
    instruments JSONB NOT NULL,
    deposits_withdrawals JSONB NOT NULL,
    cashback JSONB NOT NULL,
    global_reach JSONB NOT NULL,
    reputation JSONB NOT NULL,
    additional_features JSONB NOT NULL,
    instructions JSONB NOT NULL,
    existing_account_instructions TEXT
);

CREATE INDEX IF NOT EXISTS idx_brokers_order ON brokers("order");

-- Trading Accounts table
CREATE TABLE IF NOT EXISTS trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    broker TEXT NOT NULL,
    account_number TEXT NOT NULL,
    status account_status DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_status ON trading_accounts(status);

-- Cashback Transactions table
CREATE TABLE IF NOT EXISTS cashback_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES trading_accounts(id) ON DELETE SET NULL,
    account_number TEXT NOT NULL,
    broker TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    trade_details TEXT,
    cashback_amount NUMERIC(10, 2) NOT NULL,
    referral_bonus_to UUID REFERENCES users(id) ON DELETE SET NULL,
    referral_bonus_amount NUMERIC(10, 2),
    source_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    source_type source_type,
    transaction_id TEXT,
    note TEXT
);

CREATE INDEX IF NOT EXISTS idx_cashback_user_id ON cashback_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cashback_date ON cashback_transactions(date);
CREATE INDEX IF NOT EXISTS idx_cashback_referral ON cashback_transactions(referral_bonus_to);

-- Payment Methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    type payment_method_type NOT NULL,
    fields JSONB NOT NULL
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    status withdrawal_status DEFAULT 'Processing',
    payment_method TEXT NOT NULL,
    withdrawal_details JSONB NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    tx_id TEXT,
    rejection_reason TEXT,
    previous_withdrawal_details JSONB
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_requested_at ON withdrawals(requested_at);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    link TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Admin Notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    target target_type NOT NULL,
    user_ids UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    category_name TEXT,
    stock INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Activity Logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    device JSONB,
    geo JSONB,
    details JSONB
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

-- Blog Posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author TEXT NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);

-- Client Levels table
CREATE TABLE IF NOT EXISTS client_levels (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    required_total NUMERIC(10, 2) NOT NULL,
    advantage_referral_cashback INTEGER NOT NULL,
    advantage_referral_store INTEGER NOT NULL,
    advantage_product_discount INTEGER NOT NULL
);

-- Feedback Forms table
CREATE TABLE IF NOT EXISTS feedback_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    response_count INTEGER DEFAULT 0,
    questions JSONB NOT NULL
);

-- Feedback Responses table
CREATE TABLE IF NOT EXISTS feedback_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    responses JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_responses_form_id ON feedback_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_user_id ON feedback_responses(user_id);

-- Contact Settings table
CREATE TABLE IF NOT EXISTS contact_settings (
    id TEXT PRIMARY KEY DEFAULT 'contact',
    email TEXT,
    phone TEXT,
    address TEXT,
    social JSONB
);

-- Banner Settings table
CREATE TABLE IF NOT EXISTS banner_settings (
    id TEXT PRIMARY KEY DEFAULT 'banner',
    is_enabled BOOLEAN DEFAULT FALSE,
    type TEXT DEFAULT 'text',
    title TEXT,
    text TEXT,
    cta_text TEXT,
    cta_link TEXT,
    script_code TEXT,
    target_levels TEXT[] DEFAULT ARRAY[]::TEXT[],
    target_countries TEXT[] DEFAULT ARRAY[]::TEXT[],
    target_statuses TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    type TEXT DEFAULT 'text',
    cta_text TEXT,
    cta_link TEXT,
    script_code TEXT,
    target_levels TEXT[] DEFAULT ARRAY[]::TEXT[],
    target_countries TEXT[] DEFAULT ARRAY[]::TEXT[],
    target_statuses TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- ============================================
-- STEP 2.5: Ensure All Columns Exist
-- ============================================

-- Add missing columns to tables if they don't exist
ALTER TABLE feedback_forms ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE feedback_forms ADD COLUMN IF NOT EXISTS response_count INTEGER DEFAULT 0;

ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS script_code TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS target_levels TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE offers ADD COLUMN IF NOT EXISTS target_countries TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE offers ADD COLUMN IF NOT EXISTS target_statuses TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';

-- ============================================
-- STEP 3: Row Level Security (RLS) Policies
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashback_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can read own trading accounts" ON trading_accounts;
CREATE POLICY "Users can read own trading accounts" ON trading_accounts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own cashback" ON cashback_transactions;
CREATE POLICY "Users can read own cashback" ON cashback_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own withdrawals" ON withdrawals;
CREATE POLICY "Users can read own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own orders" ON orders;
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own activity logs" ON activity_logs;
CREATE POLICY "Users can read own activity logs" ON activity_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own feedback responses" ON feedback_responses;
CREATE POLICY "Users can read own feedback responses" ON feedback_responses FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Brokers are publicly readable" ON brokers;
CREATE POLICY "Brokers are publicly readable" ON brokers FOR SELECT USING (true);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payment methods are publicly readable" ON payment_methods;
CREATE POLICY "Payment methods are publicly readable" ON payment_methods FOR SELECT USING (is_enabled = true);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Product categories are publicly readable" ON product_categories;
CREATE POLICY "Product categories are publicly readable" ON product_categories FOR SELECT USING (true);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are publicly readable" ON products;
CREATE POLICY "Products are publicly readable" ON products FOR SELECT USING (true);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published blog posts are publicly readable" ON blog_posts;
CREATE POLICY "Published blog posts are publicly readable" ON blog_posts FOR SELECT USING (is_published = true);

ALTER TABLE client_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Client levels are publicly readable" ON client_levels;
CREATE POLICY "Client levels are publicly readable" ON client_levels FOR SELECT USING (true);

ALTER TABLE feedback_forms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active feedback forms are publicly readable" ON feedback_forms;
CREATE POLICY "Active feedback forms are publicly readable" ON feedback_forms FOR SELECT USING (is_active = true);

ALTER TABLE contact_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Contact settings are publicly readable" ON contact_settings;
CREATE POLICY "Contact settings are publicly readable" ON contact_settings FOR SELECT USING (true);

ALTER TABLE banner_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Banner settings are publicly readable" ON banner_settings;
CREATE POLICY "Banner settings are publicly readable" ON banner_settings FOR SELECT USING (true);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enabled offers are publicly readable" ON offers;
CREATE POLICY "Enabled offers are publicly readable" ON offers FOR SELECT USING (is_enabled = true);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin notifications are admin only" ON admin_notifications;
CREATE POLICY "Admin notifications are admin only" ON admin_notifications FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- ============================================
-- STEP 4: Seed Data
-- ============================================

INSERT INTO contact_settings (id, email, phone, address, social)
VALUES ('contact', '', '', '', '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO banner_settings (id, is_enabled, type, title, text, cta_text, cta_link)
VALUES ('banner', false, 'text', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO client_levels (id, name, required_total, advantage_referral_cashback, advantage_referral_store, advantage_product_discount)
VALUES
    (1, 'Bronze', 0, 5, 2, 0),
    (2, 'Silver', 100, 7, 4, 2),
    (3, 'Gold', 500, 10, 6, 4),
    (4, 'Platinum', 2000, 15, 8, 6),
    (5, 'Diamond', 10000, 20, 10, 8),
    (6, 'Ambassador', 50000, 25, 15, 10)
ON CONFLICT (id) DO NOTHING;
