"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface TradingConditionsStepProps {
  form: UseFormReturn<any>;
}

export function TradingConditionsStep({ form }: TradingConditionsStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="tradingConditions.minimum_deposit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Minimum Deposit</span>
                <span className="rtl:inline hidden">الحد الأدنى للإيداع</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tradingConditions.maximum_leverage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Maximum Leverage</span>
                <span className="rtl:inline hidden">الرافعة المالية القصوى</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., 1:500" {...field} />
              </FormControl>
              <FormDescription>
                <span className="ltr:inline hidden">Format: 1:500 or 500:1</span>
                <span className="rtl:inline hidden">التنسيق: 1:500 أو 500:1</span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="tradingConditions.spreads_from"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Spreads From (pips)</span>
                <span className="rtl:inline hidden">الفروق من (نقطة)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tradingConditions.commission"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Commission</span>
                <span className="rtl:inline hidden">العمولة</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., $7 per lot" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="tradingConditions.account_types"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Account Types</span>
              <span className="rtl:inline hidden">أنواع الحسابات</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="e.g., Standard, ECN, Pro" {...field} />
            </FormControl>
            <FormDescription>
              <span className="ltr:inline hidden">Comma-separated list of account types</span>
              <span className="rtl:inline hidden">قائمة أنواع الحسابات مفصولة بفواصل</span>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tradingConditions.execution_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Execution Type</span>
              <span className="rtl:inline hidden">نوع التنفيذ</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="e.g., Market Execution, Instant Execution" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tradingConditions.base_currency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Base Currency</span>
              <span className="rtl:inline hidden">العملة الأساسية</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="e.g., USD, EUR, GBP" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
