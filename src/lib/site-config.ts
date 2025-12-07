/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ملف إعدادات الموقع - SITE CONFIGURATION FILE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * هذا الملف يحتوي على جميع معلومات الموقع في مكان واحد
 * يمكنك تعديل أي قيمة هنا وسيتم تحديثها في جميع أنحاء الموقع
 * 
 * This file contains all website information in one place.
 * Edit any value here and it will update across the entire website.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const siteConfig = {
  
  // ─────────────────────────────────────────────────────────────────────────
  // معلومات الموقع الأساسية - BASIC SITE INFO
  // ─────────────────────────────────────────────────────────────────────────
  
  name: "رفيق الكاش باك",
  nameEn: "Cashback Companion",
  tagline: "اكسب كاش باك في كل مرة تتداول",
  taglineEn: "Earn cashback every time you trade",
  description: "منصة كاش باك للمتداولين، مصممة لمكافأة المستخدمين بكاش باك على كل صفقة",
  descriptionEn: "A cashback platform for traders, designed to reward users with cashback on every trade",
  
  // ─────────────────────────────────────────────────────────────────────────
  // معلومات الاتصال - CONTACT INFORMATION
  // ─────────────────────────────────────────────────────────────────────────
  
  contact: {
    email: "support@cashback-companion.com",
    phone: "+1 (555) 123-4567",
    address: "123 شارع الفوركس، جناح 100، مدينة التداول، TC 54321",
    addressEn: "123 Forex Street, Suite 100, Trading City, TC 54321",
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // روابط التواصل الاجتماعي - SOCIAL MEDIA LINKS
  // ─────────────────────────────────────────────────────────────────────────
  // ضع الرابط الكامل أو اتركه فارغاً "" إذا لم يكن لديك حساب
  // Put the full URL or leave empty "" if you don't have an account
  
  social: {
    facebook: "https://facebook.com/cashbackcompanion",
    twitter: "https://twitter.com/cashbackcomp",
    instagram: "https://instagram.com/cashbackcompanion",
    whatsapp: "https://wa.me/15551234567",
    telegram: "https://t.me/cashbackcompanion",
    youtube: "",
    linkedin: "",
    tiktok: "",
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // روابط الدعم - SUPPORT LINKS
  // ─────────────────────────────────────────────────────────────────────────
  
  support: {
    helpCenter: "/help",
    faq: "/faq",
    contactPage: "/contact",
    termsOfService: "/terms",
    privacyPolicy: "/privacy",
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // معلومات الشركة - COMPANY INFORMATION
  // ─────────────────────────────────────────────────────────────────────────
  
  company: {
    foundedYear: 2024,
    legalName: "شركة رفيق الكاش باك المحدودة",
    legalNameEn: "Cashback Companion Ltd",
    registrationNumber: "12345678",
    country: "الإمارات العربية المتحدة",
    countryEn: "United Arab Emirates",
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // إعدادات SEO - SEO SETTINGS
  // ─────────────────────────────────────────────────────────────────────────
  
  seo: {
    title: "رفيق الكاش باك - اكسب كاش باك في كل صفقة",
    titleEn: "Cashback Companion - Earn Cashback on Every Trade",
    keywords: ["كاش باك", "تداول", "فوركس", "استرداد نقدي", "cashback", "trading", "forex"],
    ogImage: "/og-image.png",
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // ساعات العمل - WORKING HOURS
  // ─────────────────────────────────────────────────────────────────────────
  
  workingHours: {
    days: "الأحد - الخميس",
    daysEn: "Sunday - Thursday",
    hours: "9:00 صباحاً - 6:00 مساءً",
    hoursEn: "9:00 AM - 6:00 PM",
    timezone: "توقيت الخليج (GMT+4)",
    timezoneEn: "Gulf Time (GMT+4)",
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // إعدادات إضافية - ADDITIONAL SETTINGS
  // ─────────────────────────────────────────────────────────────────────────
  
  settings: {
    defaultCurrency: "USD",
    defaultLanguage: "ar",
    supportedLanguages: ["ar", "en"],
    showLiveChat: true,
    maintenanceMode: false,
  },

} as const;

// تصدير الأنواع للاستخدام في الملفات الأخرى
// Export types for use in other files
export type SiteConfig = typeof siteConfig;
