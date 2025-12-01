"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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
        name="tradingConditions.spread_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Spread Type</span>
              <span className="rtl:inline hidden">نوع الفروق</span>
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select spread type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Variable">Variable/Floating</SelectItem>
                <SelectItem value="Fixed">Fixed</SelectItem>
                <SelectItem value="Zero">Zero/Raw</SelectItem>
                <SelectItem value="ECN">ECN/Raw</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tradingConditions.account_types"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Account Types</span>
              <span className="rtl:inline hidden">أنواع الحسابات</span>
            </FormLabel>
            <div className="space-y-3">
              {[
                { id: "Standard", label: "Standard" },
                { id: "Micro", label: "Micro/Cent" },
                { id: "Islamic", label: "Islamic/Swap-Free" },
                { id: "VIP", label: "VIP" },
                { id: "ECN", label: "ECN/RAW" },
                { id: "Demo", label: "Demo" },
              ].map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`account-${type.id}`}
                    checked={field.value?.includes(type.id) || false}
                    onCheckedChange={(checked) => {
                      const value = field.value || [];
                      if (checked) {
                        field.onChange([...value, type.id]);
                      } else {
                        field.onChange(value.filter((v: string) => v !== type.id));
                      }
                    }}
                  />
                  <label htmlFor={`account-${type.id}`} className="text-sm cursor-pointer">
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
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
