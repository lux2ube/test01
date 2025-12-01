"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface AdditionalFeaturesStepProps {
  form: UseFormReturn<any>;
}

export function AdditionalFeaturesStep({ form }: AdditionalFeaturesStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="additionalFeatures.education_center"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  <span className="ltr:inline hidden">Education Center</span>
                  <span className="rtl:inline hidden">مركز التعليم</span>
                </FormLabel>
                <FormDescription>
                  <span className="ltr:inline hidden">Educational resources available</span>
                  <span className="rtl:inline hidden">موارد تعليمية متاحة</span>
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
          name="additionalFeatures.copy_trading"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  <span className="ltr:inline hidden">Copy Trading</span>
                  <span className="rtl:inline hidden">نسخ الصفقات</span>
                </FormLabel>
                <FormDescription>
                  <span className="ltr:inline hidden">Social/copy trading feature</span>
                  <span className="rtl:inline hidden">ميزة التداول الاجتماعي/نسخ الصفقات</span>
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
          name="additionalFeatures.demo_account"
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
          name="additionalFeatures.trading_contests"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  <span className="ltr:inline hidden">Trading Contests</span>
                  <span className="rtl:inline hidden">مسابقات التداول</span>
                </FormLabel>
                <FormDescription>
                  <span className="ltr:inline hidden">Runs trading competitions</span>
                  <span className="rtl:inline hidden">يدير مسابقات تداول</span>
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
          name="additionalFeatures.welcome_bonus"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  <span className="ltr:inline hidden">Welcome Bonus</span>
                  <span className="rtl:inline hidden">مكافأة الترحيب</span>
                </FormLabel>
                <FormDescription>
                  <span className="ltr:inline hidden">Offers welcome bonus for new clients</span>
                  <span className="rtl:inline hidden">يقدم مكافأة ترحيب للعملاء الجدد</span>
                </FormDescription>
              </div>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="additionalFeatures.regulatory_alerts"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Regulatory Alerts</span>
              <span className="rtl:inline hidden">تنبيهات تنظيمية</span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any regulatory warnings or alerts..."
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormDescription>
              <span className="ltr:inline hidden">Important regulatory notices or warnings</span>
              <span className="rtl:inline hidden">إشعارات أو تحذيرات تنظيمية هامة</span>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
