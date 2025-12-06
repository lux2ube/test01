
/**
 * Represents the settings for a promotional offer.
 */
export interface Offer {
    id: string;
    title: string;
    description?: string; // Used as main text for 'text' type
    isEnabled: boolean;
    type: 'script' | 'text';
    
    // Fields for 'text' type
    ctaText?: string;
    ctaLink?: string;
    
    // Fields for 'script' type
    scriptCode?: string;
    
    // Targeting Fields
    targetLevels?: string[];
    targetCountries?: string[];
    targetStatuses?: UserStatus[];
}


/**
 * Represents the settings for the promotional banner.
 */
export interface BannerSettings {
    isEnabled: boolean;
    type: 'script' | 'text';
    // Text Banner Fields
    title?: string;
    text?: string;
    ctaText?: string;
    ctaLink?: string;
    // Script Banner Fields
    scriptCode?: string;
    // Targeting Fields
    targetLevels?: string[];
    targetCountries?: string[];
    targetStatuses?: UserStatus[];
}

/**
 * Represents a user document in the 'users' table.
 */
export interface UserProfile {
    id: string; // UUID from Supabase Auth
    email: string;
    name: string;
    role: 'user' | 'admin';
    clientId: number; // Sequential, human-readable ID
    createdAt?: Date;
    country?: string; // ISO 3166-1 alpha-2 country code
    isVerified?: boolean;
    status: UserStatus; // User lifecycle status
    // New profile fields
    phoneNumber?: string;
    phoneNumberVerified?: boolean;
    kycData?: KycData;
    addressData?: AddressData;
    // Referral fields
    referralCode?: string;
    referredBy?: string | null; // ID of the user who referred this person
    referrals?: string[]; // Array of IDs of users this person has referred
    // New Level System
    level: number; // Level 1-6
    monthlyEarnings?: number; // For level calculation
}


export interface KycData {
    documentType: 'id_card' | 'passport' | 'driver_license';
    documentNumber: string;
    fullName: string;
    dateOfBirth: Date;
    nationality: string;
    documentIssueDate: Date;
    documentExpiryDate: Date;
    gender: 'male' | 'female';
    documentFrontUrl: string;
    documentBackUrl?: string;
    selfieUrl?: string;
    status: 'Pending' | 'Verified' | 'Rejected';
    submittedAt: Date;
    rejectionReason?: string;
}

export interface AddressData {
    country: string;
    city: string;
    streetAddress: string;
    stateProvince?: string;
    postalCode: string;
    documentUrl: string;
    status: 'Pending' | 'Verified' | 'Rejected';
    submittedAt: Date;
    rejectionReason?: string;
}


export interface PendingVerification {
    userId: string;
    userName: string;
    userEmail: string;
    type: 'KYC' | 'Address' | 'Phone';
    requestedAt: Date;
    data: KycData | AddressData | { phoneNumber: string };
}


/**
 * Represents a partner broker with a highly detailed structure.
 */
export interface Broker {
    id: string;
    order: number;
    logoUrl: string; // From original design
    basicInfo: {
        broker_name: string;
        group_entity: string;
        founded_year: number;
        headquarters: string;
        CEO: string;
        broker_type: string;
    };
    regulation: {
        licenses: { authority: string; licenseNumber?: string; status: string }[];
        regulated_in: string[];
        regulator_name: string[];
        regulation_status: string;
        offshore_regulation: boolean;
        risk_level: string;
    };
    tradingConditions: {
        account_types: string[];
        max_leverage: string;
        min_deposit: number;
        spread_type: string;
        min_spread: number;
        commission_per_lot: number;
        execution_speed: string;
        swap_free: boolean;
    };
    platforms: {
        platforms_supported: string[];
        mt4_license_type: 'Full License' | 'White Label' | 'None';
        mt5_license_type: 'Full License' | 'White Label' | 'None';
        custom_platform: boolean;
    };
    instruments: {
        forex_pairs: string;
        crypto_trading: boolean;
        stocks: boolean;
        commodities: boolean;
        indices: boolean;
    };
    depositsWithdrawals: {
        payment_methods: string[];
        min_withdrawal: number;
        withdrawal_speed: string;
        deposit_fees: boolean;
        withdrawal_fees: boolean;
    };
    cashback: {
        cashback_per_lot: number;
        cashback_account_type: string[];
        cashback_frequency: 'Daily' | 'Weekly' | 'Monthly';
        rebate_method: string[];
        affiliate_program_link: string;
    };
    globalReach: {
        business_region: string[];
        global_presence: string;
        languages_supported: string[];
        customer_support_channels: string[];
    };
    reputation: {
        wikifx_score: number;
        trustpilot_rating: number;
        reviews_count: number;
        verified_users: number;
    };
    additionalFeatures: {
        education_center: boolean;
        copy_trading: boolean;
        demo_account: boolean;
        trading_contests: boolean;
        regulatory_alerts: string;
        welcome_bonus: boolean;
    };
    // Legacy fields for compatibility until UI is updated
    name: string;
    description: string;
    category: 'forex' | 'crypto' | 'other';
    rating: number; // A number from 1 to 5
    instructions: {
        description: string;
        linkText: string;
        link: string;
        new_account_instructions?: string,
        new_account_link?: string,
        new_account_link_text?: string
    };
    existingAccountInstructions: string | { description?: string; linkText?: string; link?: string };
}


/**
 * Represents a linked trading account document in the 'tradingAccounts' collection.
 */
export interface TradingAccount {
    id: string; // Document ID
    userId: string;
    broker: string;
    accountNumber: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: Date;
    rejectionReason?: string;
}

/**
 * Represents a cashback transaction document in the 'cashbackTransactions' collection.
 */
export interface CashbackTransaction {
    id: string; // Document ID
    userId: string;
    accountId: string; // Reference to the TradingAccount document ID
    accountNumber: string;
    broker: string;
    date: Date;
    tradeDetails: string; // e.g., "Trade 1.5 lots EURUSD"
    cashbackAmount: number;
    // Optional referral fields
    referralBonusTo?: string; // UID of the referrer who received the commission
    referralBonusAmount?: number; // The commission amount given to the referrer
    sourceUserId?: string; // The original user who generated the cashback/order
    sourceType?: 'cashback' | 'store_purchase'; // The type of original transaction
    // Admin-provided details
    transactionId?: string;
    note?: string;
}

/**
 * Represents a configurable field for a payment method.
 */
export interface PaymentMethodField {
    name: string; // e.g., "walletAddress", "binanceId"
    label: string; // e.g., "USDT (BEP20) Wallet Address", "Binance ID"
    type: 'text' | 'number';
    placeholder?: string;
    validation: {
        required: boolean;
        minLength?: number;
        maxLength?: number;
        regex?: string; // Stored as a string
        regexErrorMessage?: string;
    };
}

/**
 * Represents a withdrawal payment method configured by the admin.
 */
export interface PaymentMethod {
    id: string;
    name: string; // e.g., "USDT (BEP20)", "Internal Transfer"
    description: string;
    isEnabled: boolean;
    fields: PaymentMethodField[];
    type: 'crypto' | 'internal_transfer' | 'trading_account';
}


/**
 * Represents a withdrawal request document in the 'withdrawals' collection.
 */
export interface Withdrawal {
    id: string; // Document ID
    userId: string;
    amount: number;
    status: 'Processing' | 'Completed' | 'Failed';
    paymentMethod: string; // Name of the payment method, e.g., "USDT (TRC20)" or "Trading Account Transfer"
    withdrawalDetails: Record<string, any>; // Stores field values, e.g., { walletAddress: '0x123...' } or { broker: 'Exness', accountNumber: '12345' }
    requestedAt: Date;
    completedAt?: Date;
    txId?: string; // Transaction ID from the blockchain or internal reference
    rejectionReason?: string;
    // New field for security check
    previousWithdrawalDetails?: Record<string, any> | null;
}


/**
 * Represents a notification for a user.
 */
export interface Notification {
    id: string;
    userId: string;
    message: string;
    type: 'account' | 'cashback' | 'withdrawal' | 'general' | 'store' | 'loyalty' | 'announcement';
    isRead: boolean;
    createdAt: Date;
    link?: string;
}

/**
 * Represents a notification sent by an admin, for logging purposes.
 */
export interface AdminNotification {
    id: string;
    message: string;
    target: 'all' | 'specific';
    userIds: string[];
    createdAt: Date;
}


/**
 * Represents a product category in the 'productCategories' collection.
 */
export interface ProductCategory {
    id: string;
    name: string;
    description: string;
}

/**
 * Represents a product in the 'products' collection.
 */
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    categoryId: string;
    categoryName: string;
    stock: number;
}

/**
 * Represents a user's order from the store.
 */
export interface Order {
    id: string;
    userId: string;
    productId: string;
    productName: string;
    productImage: string;
    price: number;
    deliveryPhoneNumber: string;
    status: 'Processing' | 'Confirmed' | 'Cancelled';
    createdAt: Date;
    userEmail?: string;
    userName?: string;
    referralCommissionAwarded?: boolean;
}

/**
 * Represents device information collected from the client.
 */
export interface DeviceInfo {
    device: string;
    os: string;
    browser: string;
}

/**
 * Represents geolocation information for a user.
 */
export interface GeoInfo {
    ip: string;
    country?: string;
    region?: string;
    city?: string;
}


/**
 * Represents a log of user activity for security and analytics.
 */
export interface ActivityLog {
    id: string;
    userId: string;
    event: 'login' | 'logout' | 'signup' | 'withdrawal_request' | 'store_purchase';
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    geo?: {
        country?: string;
        region?: string;
        city?: string;
    };
    device?: DeviceInfo;
    details?: Record<string, any>; // For event-specific data, e.g., { amount: 100, method: 'USDT' }
}

/**
 * Represents a blog post in the 'blogPosts' collection.
 */
export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string; // Markdown content
    author: string;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Client Level System
export interface ClientLevel {
    id: number; // Level 1-6
    name: string; // e.g. Bronze, Silver
    required_total: number; // Total monthly earnings required for this level
    advantage_referral_cashback: number; // % commission
    advantage_referral_store: number; // % commission
    advantage_product_discount: number; // % discount
}

// Definition of a user's status based on their activity
export type UserStatus = 'NEW' | 'Active' | 'Trader';

// Feedback System
export interface FeedbackQuestion {
  id: string;
  text: string;
  type: 'text' | 'rating' | 'multiple-choice'; // Example types
  options?: string[]; // For multiple-choice
}

export interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  questions: FeedbackQuestion[];
  status: 'active' | 'inactive';
  createdAt: Date;
  responseCount: number;
}

export interface FeedbackResponse {
  id: string;
  formId: string;
  userId: string;
  submittedAt: Date;
  answers: Record<string, any>; // question.id -> answer
}

export interface EnrichedFeedbackResponse extends FeedbackResponse {
    userName: string;
}

export interface ContactSettings {
    id: string;
    email: string;
    phone: string;
    address: string;
    social: {
        facebook: string;
        twitter: string;
        instagram: string;
        whatsapp: string;
        telegram: string;
    };
}
