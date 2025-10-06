"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface CashbackStepProps {
  form: UseFormReturn<any>;
}

export function CashbackStep({ form }: CashbackStepProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="cashback.offers_cashback"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                <span className="ltr:inline hidden">Offers Cashback</span>
                <span className="rtl:inline hidden">يقدم كاش باك</span>
              </FormLabel>
              <FormDescription>
                <span className="ltr:inline hidden">Enable cashback rewards for this broker</span>
                <span className="rtl:inline hidden">تفعيل مكافآت الكاش باك لهذا الوسيط</span>
              </FormDescription>
            </div>
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {form.watch("cashback.offers_cashback") && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="cashback.cashback_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <span className="ltr:inline hidden">Cashback Amount</span>
                    <span className="rtl:inline hidden">مبلغ الكاش باك</span>
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
                  <FormDescription>
                    <span className="ltr:inline hidden">Amount per lot or percentage</span>
                    <span className="rtl:inline hidden">المبلغ لكل عقد أو نسبة مئوية</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cashback.cashback_currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <span className="ltr:inline hidden">Currency</span>
                    <span className="rtl:inline hidden">العملة</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="AED">AED</SelectItem>
                      <SelectItem value="SAR">SAR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="cashback.cashback_frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <span className="ltr:inline hidden">Frequency</span>
                    <span className="rtl:inline hidden">التكرار</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    <span className="ltr:inline hidden">How often cashback is paid out</span>
                    <span className="rtl:inline hidden">عدد مرات دفع الكاش باك</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cashback.minimum_withdrawal"
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
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="cashback.eligible_instruments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <span className="ltr:inline hidden">Eligible Instruments</span>
                  <span className="rtl:inline hidden">الأدوات المؤهلة</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Forex, CFDs, Stocks" {...field} />
                </FormControl>
                <FormDescription>
                  <span className="ltr:inline hidden">Trading instruments eligible for cashback</span>
                  <span className="rtl:inline hidden">أدوات التداول المؤهلة للكاش باك</span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cashback.terms_and_conditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <span className="ltr:inline hidden">Terms & Conditions</span>
                  <span className="rtl:inline hidden">الشروط والأحكام</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter cashback terms and conditions..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
}
