"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface ReputationStepProps {
  form: UseFormReturn<any>;
}

export function ReputationStep({ form }: ReputationStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="reputation.wikifx_score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">WikiFX Score</span>
                <span className="rtl:inline hidden">درجة WikiFX</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="0.0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                />
              </FormControl>
              <FormDescription>
                <span className="ltr:inline hidden">Score from 0 to 10</span>
                <span className="rtl:inline hidden">الدرجة من 0 إلى 10</span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reputation.trustpilot_rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Trustpilot Rating</span>
                <span className="rtl:inline hidden">تقييم Trustpilot</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="0.0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                />
              </FormControl>
              <FormDescription>
                <span className="ltr:inline hidden">Rating from 0 to 5</span>
                <span className="rtl:inline hidden">التقييم من 0 إلى 5</span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="reputation.reviews_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Reviews Count</span>
                <span className="rtl:inline hidden">عدد التقييمات</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reputation.verified_users"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="ltr:inline hidden">Verified Users</span>
                <span className="rtl:inline hidden">المستخدمون المؤكدون</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
