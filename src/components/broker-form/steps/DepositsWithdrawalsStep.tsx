"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface DepositsWithdrawalsStepProps {
  form: UseFormReturn<any>;
}

export function DepositsWithdrawalsStep({ form }: DepositsWithdrawalsStepProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="depositsWithdrawals.payment_methods"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Payment Methods</span>
              <span className="rtl:inline hidden">طرق الدفع</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="e.g., Credit Card, Bank Transfer, PayPal, Crypto" {...field} value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''} onChange={(e) => field.onChange(e.target.value ? e.target.value.split(',').map((s: string) => s.trim()) : [])} />
            </FormControl>
            <FormDescription>
              <span className="ltr:inline hidden">Comma-separated list of payment methods</span>
              <span className="rtl:inline hidden">قائمة طرق الدفع مفصولة بفواصل</span>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="depositsWithdrawals.min_withdrawal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Minimum Withdrawal</span>
                <span className="rtl:inline hidden">الحد الأدنى للسحب</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="depositsWithdrawals.withdrawal_speed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Withdrawal Speed</span>
                <span className="rtl:inline hidden">سرعة السحب</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., 1-3 business days" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="depositsWithdrawals.deposit_fees"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  <span className="ltr:inline hidden">Deposit Fees</span>
                  <span className="rtl:inline hidden">رسوم الإيداع</span>
                </FormLabel>
                <FormDescription>
                  <span className="ltr:inline hidden">Charges fees on deposits</span>
                  <span className="rtl:inline hidden">يفرض رسوم على الإيداعات</span>
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
          name="depositsWithdrawals.withdrawal_fees"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  <span className="ltr:inline hidden">Withdrawal Fees</span>
                  <span className="rtl:inline hidden">رسوم السحب</span>
                </FormLabel>
                <FormDescription>
                  <span className="ltr:inline hidden">Charges fees on withdrawals</span>
                  <span className="rtl:inline hidden">يفرض رسوم على السحوبات</span>
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
