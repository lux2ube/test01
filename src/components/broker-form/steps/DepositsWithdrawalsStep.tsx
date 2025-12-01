"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
            <div className="space-y-3">
              {[
                { id: "Crypto", label: "Crypto Wallets" },
                { id: "Cards", label: "Cards (Visa/Mastercard)" },
                { id: "Local", label: "Local Payment Systems" },
                { id: "Wire", label: "Wire Transfer" },
                { id: "Neteller", label: "Neteller" },
                { id: "Skrill", label: "Skrill" },
                { id: "PerfectMoney", label: "Perfect Money" },
                { id: "WebMoney", label: "WebMoney" },
              ].map((method) => (
                <div key={method.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`payment-${method.id}`}
                    checked={field.value?.includes(method.id) || false}
                    onCheckedChange={(checked) => {
                      const value = field.value || [];
                      if (checked) {
                        field.onChange([...value, method.id]);
                      } else {
                        field.onChange(value.filter((v: string) => v !== method.id));
                      }
                    }}
                  />
                  <label htmlFor={`payment-${method.id}`} className="text-sm cursor-pointer">
                    {method.label}
                  </label>
                </div>
              ))}
            </div>
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
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Deposit Fees</span>
                <span className="rtl:inline hidden">رسوم الإيداع</span>
              </FormLabel>
              <FormControl>
                <RadioGroup value={field.value ? "yes" : "no"} onValueChange={(val) => field.onChange(val === "yes")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="deposit-fees-yes" />
                    <label htmlFor="deposit-fees-yes" className="text-sm cursor-pointer">
                      <span className="ltr:inline hidden">Yes</span>
                      <span className="rtl:inline hidden">نعم</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="deposit-fees-no" />
                    <label htmlFor="deposit-fees-no" className="text-sm cursor-pointer">
                      <span className="ltr:inline hidden">No</span>
                      <span className="rtl:inline hidden">لا</span>
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="depositsWithdrawals.withdrawal_fees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Withdrawal Fees</span>
                <span className="rtl:inline hidden">رسوم السحب</span>
              </FormLabel>
              <FormControl>
                <RadioGroup value={field.value ? "yes" : "no"} onValueChange={(val) => field.onChange(val === "yes")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="withdrawal-fees-yes" />
                    <label htmlFor="withdrawal-fees-yes" className="text-sm cursor-pointer">
                      <span className="ltr:inline hidden">Yes</span>
                      <span className="rtl:inline hidden">نعم</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="withdrawal-fees-no" />
                    <label htmlFor="withdrawal-fees-no" className="text-sm cursor-pointer">
                      <span className="ltr:inline hidden">No</span>
                      <span className="rtl:inline hidden">لا</span>
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
