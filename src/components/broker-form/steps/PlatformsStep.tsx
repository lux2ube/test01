"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PlatformsStepProps {
  form: UseFormReturn<any>;
}

export function PlatformsStep({ form }: PlatformsStepProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="platforms.platforms_supported"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Supported Trading Platforms</span>
              <span className="rtl:inline hidden">منصات التداول المدعومة</span>
            </FormLabel>
            <div className="space-y-3">
              {[
                { id: "MT4", label: "MetaTrader 4 (MT4)" },
                { id: "MT5", label: "MetaTrader 5 (MT5)" },
                { id: "cTrader", label: "cTrader" },
                { id: "Proprietary", label: "Proprietary Platform" },
              ].map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.id}
                    checked={field.value?.includes(platform.id) || false}
                    onCheckedChange={(checked) => {
                      const value = field.value || [];
                      if (checked) {
                        field.onChange([...value, platform.id]);
                      } else {
                        field.onChange(value.filter((v: string) => v !== platform.id));
                      }
                    }}
                  />
                  <label htmlFor={platform.id} className="text-sm cursor-pointer">
                    {platform.label}
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
          name="platforms.mt4_license_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">MT4 License Type</span>
                <span className="rtl:inline hidden">نوع ترخيص MT4</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select license type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Full License">Full License</SelectItem>
                  <SelectItem value="White Label">White Label</SelectItem>
                  <SelectItem value="None">None</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="platforms.mt5_license_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">MT5 License Type</span>
                <span className="rtl:inline hidden">نوع ترخيص MT5</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select license type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Full License">Full License</SelectItem>
                  <SelectItem value="White Label">White Label</SelectItem>
                  <SelectItem value="None">None</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="platforms.custom_platform"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                <span className="ltr:inline hidden">Custom/Proprietary Platform</span>
                <span className="rtl:inline hidden">منصة خاصة بالوسيط</span>
              </FormLabel>
              <FormDescription>
                <span className="ltr:inline hidden">Offers custom trading platform</span>
                <span className="rtl:inline hidden">يقدم منصة تداول مخصصة</span>
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
