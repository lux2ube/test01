"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface InstructionsStepProps {
  form: UseFormReturn<any>;
}

export function InstructionsStep({ form }: InstructionsStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          <span className="ltr:inline hidden">New Account Instructions</span>
          <span className="rtl:inline hidden">تعليمات الحساب الجديد</span>
        </h3>

        <FormField
          control={form.control}
          name="instructions.description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Description</span>
                <span className="rtl:inline hidden">الوصف</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter instructions description..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instructions.new_account_instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Instructions</span>
                <span className="rtl:inline hidden">التعليمات</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Step-by-step instructions for new account..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                <span className="ltr:inline hidden">Detailed steps for creating a new account</span>
                <span className="rtl:inline hidden">خطوات مفصلة لإنشاء حساب جديد</span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="instructions.new_account_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <span className="ltr:inline hidden">Sign Up Link</span>
                  <span className="rtl:inline hidden">رابط التسجيل</span>
                </FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instructions.new_account_link_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <span className="ltr:inline hidden">Link Text</span>
                  <span className="rtl:inline hidden">نص الرابط</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Sign Up Now" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <h3 className="text-lg font-medium">
          <span className="ltr:inline hidden">Existing Account Instructions</span>
          <span className="rtl:inline hidden">تعليمات الحساب الحالي</span>
        </h3>

        <FormField
          control={form.control}
          name="existingAccountInstructions.description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Description</span>
                <span className="rtl:inline hidden">الوصف</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Instructions for existing account holders..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="existingAccountInstructions.linkText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <span className="ltr:inline hidden">Link Text</span>
                  <span className="rtl:inline hidden">نص الرابط</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Connect Account" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="existingAccountInstructions.link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <span className="ltr:inline hidden">Link</span>
                  <span className="rtl:inline hidden">الرابط</span>
                </FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
