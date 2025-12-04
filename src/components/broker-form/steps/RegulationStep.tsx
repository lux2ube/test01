"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiCountrySelector } from "@/components/ui/country-selector";

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
            onClick={() => append({ authority: "", licenseNumber: "", status: "Active" })}
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
                      <span className="ltr:inline hidden">Regulatory Authority</span>
                      <span className="rtl:inline hidden">جهة الترخيص</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select authority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FCA">FCA (UK)</SelectItem>
                        <SelectItem value="CySEC">CySEC (Cyprus)</SelectItem>
                        <SelectItem value="ASIC">ASIC (Australia)</SelectItem>
                        <SelectItem value="ESMA">ESMA (European Union)</SelectItem>
                        <SelectItem value="DFSA">DFSA (UAE)</SelectItem>
                        <SelectItem value="FSA">FSA (Seychelles)</SelectItem>
                        <SelectItem value="VFSC">VFSC (Vanuatu)</SelectItem>
                        <SelectItem value="FSC">FSC (Mauritius)</SelectItem>
                        <SelectItem value="NFA">NFA (USA)</SelectItem>
                        <SelectItem value="CFTC">CFTC (USA)</SelectItem>
                      </SelectContent>
                    </Select>
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

              <FormField
                control={form.control}
                name={`regulation.licenses.${index}.status`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="ltr:inline hidden">License Status</span>
                      <span className="rtl:inline hidden">حالة الترخيص</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'Active'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                        <SelectItem value="Revoked">Revoked</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
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
        name="regulation.regulated_in"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Regulated In (Countries)</span>
              <span className="rtl:inline hidden">مرخص في (دول)</span>
            </FormLabel>
            <FormControl>
              <MultiCountrySelector
                value={field.value || []}
                onChange={field.onChange}
                placeholder="اختر الدول"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="regulation.offshore_regulation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="ltr:inline hidden">Offshore Regulation</span>
              <span className="rtl:inline hidden">تنظيم خارج الساحل</span>
            </FormLabel>
            <FormControl>
              <RadioGroup value={field.value ? "yes" : "no"} onValueChange={(val) => field.onChange(val === "yes")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="offshore-yes" />
                  <label htmlFor="offshore-yes" className="text-sm cursor-pointer">
                    <span className="ltr:inline hidden">Yes</span>
                    <span className="rtl:inline hidden">نعم</span>
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="offshore-no" />
                  <label htmlFor="offshore-no" className="text-sm cursor-pointer">
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
  );
}
