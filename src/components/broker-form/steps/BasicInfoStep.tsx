"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BasicInfoStepProps {
  form: UseFormReturn<any>;
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="basicInfo.broker_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Broker Name</span>
                <span className="rtl:inline hidden">اسم الوسيط</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter broker name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Logo URL</span>
                <span className="rtl:inline hidden">رابط الشعار</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/logo.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="basicInfo.year_founded"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Year Founded</span>
                <span className="rtl:inline hidden">سنة التأسيس</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="2020"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="basicInfo.headquarters"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Headquarters</span>
                <span className="rtl:inline hidden">المقر الرئيسي</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Country, City" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="basicInfo.website"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Website</span>
              <span className="rtl:inline hidden">الموقع الإلكتروني</span>
            </FormLabel>
            <FormControl>
              <Input type="url" placeholder="https://broker.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="basicInfo.company_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Company Name</span>
              <span className="rtl:inline hidden">اسم الشركة</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="Legal company name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Category</span>
              <span className="rtl:inline hidden">الفئة</span>
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value || 'forex'}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="forex">Forex</SelectItem>
                <SelectItem value="stocks">Stocks</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="commodities">Commodities</SelectItem>
                <SelectItem value="multi-asset">Multi-Asset</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Description</span>
              <span className="rtl:inline hidden">الوصف</span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Brief description of the broker..."
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
