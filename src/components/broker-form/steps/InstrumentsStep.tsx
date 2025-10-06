"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface InstrumentsStepProps {
  form: UseFormReturn<any>;
}

export function InstrumentsStep({ form }: InstrumentsStepProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="instruments.forex_pairs"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Forex Pairs</span>
              <span className="rtl:inline hidden">أزواج الفوركس</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="e.g., 50+ currency pairs" {...field} />
            </FormControl>
            <FormDescription>
              <span className="ltr:inline hidden">Number or description of available forex pairs</span>
              <span className="rtl:inline hidden">عدد أو وصف أزواج الفوركس المتاحة</span>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="instruments.crypto_trading"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  <span className="ltr:inline hidden">Crypto Trading</span>
                  <span className="rtl:inline hidden">تداول العملات المشفرة</span>
                </FormLabel>
                <FormDescription>
                  <span className="ltr:inline hidden">Cryptocurrency trading available</span>
                  <span className="rtl:inline hidden">تداول العملات المشفرة متاح</span>
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
          name="instruments.stocks"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  <span className="ltr:inline hidden">Stocks</span>
                  <span className="rtl:inline hidden">الأسهم</span>
                </FormLabel>
                <FormDescription>
                  <span className="ltr:inline hidden">Stock trading available</span>
                  <span className="rtl:inline hidden">تداول الأسهم متاح</span>
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
          name="instruments.commodities"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  <span className="ltr:inline hidden">Commodities</span>
                  <span className="rtl:inline hidden">السلع</span>
                </FormLabel>
                <FormDescription>
                  <span className="ltr:inline hidden">Commodity trading available</span>
                  <span className="rtl:inline hidden">تداول السلع متاح</span>
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
          name="instruments.indices"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  <span className="ltr:inline hidden">Indices</span>
                  <span className="rtl:inline hidden">المؤشرات</span>
                </FormLabel>
                <FormDescription>
                  <span className="ltr:inline hidden">Index trading available</span>
                  <span className="rtl:inline hidden">تداول المؤشرات متاح</span>
                </FormDescription>
              </div>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
