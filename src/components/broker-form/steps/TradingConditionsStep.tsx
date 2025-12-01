"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
          name="tradingConditions.min_spread"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Minimum Spread (pips)</span>
                <span className="rtl:inline hidden">الحد الأدنى للفروق (نقطة)</span>
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
          name="tradingConditions.commission_per_lot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Commission Per Lot</span>
                <span className="rtl:inline hidden">العمولة لكل عقد</span>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="tradingConditions.execution_speed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Execution Speed</span>
                <span className="rtl:inline hidden">سرعة التنفيذ</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., Instant, Market Execution" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tradingConditions.swap_free"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Swap Free</span>
                <span className="rtl:inline hidden">خالي من المبادلة</span>
              </FormLabel>
              <FormControl>
                <RadioGroup value={field.value ? "yes" : "no"} onValueChange={(val) => field.onChange(val === "yes")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="swap-free-yes" />
                    <label htmlFor="swap-free-yes" className="text-sm cursor-pointer">
                      <span className="ltr:inline hidden">Yes</span>
                      <span className="rtl:inline hidden">نعم</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="swap-free-no" />
                    <label htmlFor="swap-free-no" className="text-sm cursor-pointer">
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
