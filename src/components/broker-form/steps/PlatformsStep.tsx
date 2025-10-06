"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface PlatformsStepProps {
  form: UseFormReturn<any>;
}

export function PlatformsStep({ form }: PlatformsStepProps) {
  const commonPlatforms = [
    { id: "mt4", label: "MetaTrader 4", labelAr: "ميتاتريدر 4" },
    { id: "mt5", label: "MetaTrader 5", labelAr: "ميتاتريدر 5" },
    { id: "ctrader", label: "cTrader", labelAr: "سي تريدر" },
    { id: "webtrader", label: "Web Trader", labelAr: "منصة الويب" },
    { id: "mobile", label: "Mobile Apps", labelAr: "تطبيقات الجوال" },
  ];

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="platforms.trading_platforms"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Trading Platforms</span>
              <span className="rtl:inline hidden">منصات التداول</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="e.g., MT4, MT5, cTrader" {...field} />
            </FormControl>
            <FormDescription>
              <span className="ltr:inline hidden">Comma-separated list of platforms</span>
              <span className="rtl:inline hidden">قائمة المنصات مفصولة بفواصل</span>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="platforms.mobile_trading"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                <span className="ltr:inline hidden">Mobile Trading</span>
                <span className="rtl:inline hidden">التداول عبر الجوال</span>
              </FormLabel>
              <FormDescription>
                <span className="ltr:inline hidden">Mobile apps available</span>
                <span className="rtl:inline hidden">تطبيقات الجوال متاحة</span>
              </FormDescription>
            </div>
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="platforms.demo_account"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                <span className="ltr:inline hidden">Demo Account</span>
                <span className="rtl:inline hidden">حساب تجريبي</span>
              </FormLabel>
              <FormDescription>
                <span className="ltr:inline hidden">Free demo account available</span>
                <span className="rtl:inline hidden">حساب تجريبي مجاني متاح</span>
              </FormDescription>
            </div>
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="platforms.copy_trading"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                <span className="ltr:inline hidden">Copy Trading</span>
                <span className="rtl:inline hidden">نسخ الصفقات</span>
              </FormLabel>
              <FormDescription>
                <span className="ltr:inline hidden">Copy trading feature available</span>
                <span className="rtl:inline hidden">ميزة نسخ الصفقات متاحة</span>
              </FormDescription>
            </div>
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
