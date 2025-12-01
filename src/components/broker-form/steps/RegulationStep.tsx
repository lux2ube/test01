"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RegulationStepProps {
  form: UseFormReturn<any>;
}

export function RegulationStep({ form }: RegulationStepProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "regulation.licenses",
  });

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="regulation.is_regulated"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                <span className="ltr:inline hidden">Is Regulated</span>
                <span className="rtl:inline hidden">مرخص</span>
              </FormLabel>
              <div className="text-sm text-muted-foreground">
                <span className="ltr:inline hidden">Is this broker regulated by financial authorities?</span>
                <span className="rtl:inline hidden">هل هذا الوسيط مرخص من قبل الجهات المالية؟</span>
              </div>
            </div>
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="regulation.risk_level"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Risk Level</span>
              <span className="rtl:inline hidden">مستوى المخاطرة</span>
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="regulation.regulation_status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Regulation Status</span>
              <span className="rtl:inline hidden">حالة التنظيم</span>
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select regulation status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Regulated">Regulated</SelectItem>
                <SelectItem value="Unregulated">Unregulated</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="License Revoked">License Revoked</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("regulation.is_regulated") && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                <span className="ltr:inline hidden">Regulatory Licenses</span>
                <span className="rtl:inline hidden">التراخيص التنظيمية</span>
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ authority: "", licenseNumber: "" })}
              >
                <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                <span className="ltr:inline hidden">Add License</span>
                <span className="rtl:inline hidden">إضافة ترخيص</span>
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`regulation.licenses.${index}.authority`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <span className="ltr:inline hidden">Authority</span>
                          <span className="rtl:inline hidden">جهة الترخيص</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., FCA, CySEC, ASIC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`regulation.licenses.${index}.licenseNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <span className="ltr:inline hidden">License Number</span>
                          <span className="rtl:inline hidden">رقم الترخيص</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="License number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  <span className="ltr:inline hidden">Remove</span>
                  <span className="rtl:inline hidden">حذف</span>
                </Button>
              </Card>
            ))}

            {fields.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  <span className="ltr:inline hidden">No licenses added yet. Click "Add License" to get started.</span>
                  <span className="rtl:inline hidden">لم يتم إضافة تراخيص بعد. انقر على "إضافة ترخيص" للبدء.</span>
                </p>
              </div>
            )}
          </div>

          <FormField
            control={form.control}
            name="regulation.regulatory_bodies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <span className="ltr:inline hidden">Regulatory Bodies</span>
                  <span className="rtl:inline hidden">الجهات التنظيمية</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Comma-separated list: FCA, CySEC, ASIC" {...field} />
                </FormControl>
                <div className="text-sm text-muted-foreground">
                  <span className="ltr:inline hidden">Enter regulatory bodies separated by commas</span>
                  <span className="rtl:inline hidden">أدخل الجهات التنظيمية مفصولة بفواصل</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="regulation.investor_protection"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <span className="ltr:inline hidden">Investor Protection</span>
                  <span className="rtl:inline hidden">حماية المستثمر</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Up to £85,000 FSCS protection" {...field} />
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
