"use client";

import { useState, useCallback, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormStepper, Step } from "./FormStepper";
import { ArrowLeft, ArrowRight, Save, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStep extends Step {
  component: React.ComponentType<{ form: UseFormReturn<any> }>;
  description?: string;
  descriptionAr?: string;
}

interface BrokerFormWizardProps {
  steps: WizardStep[];
  form: UseFormReturn<any>;
  onSubmit: (data: any) => Promise<void>;
  onSaveDraft?: (data: any) => Promise<void>;
  isSubmitting?: boolean;
  isNew?: boolean;
  className?: string;
}

export function BrokerFormWizard({
  steps,
  form,
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
  isNew = false,
  className,
}: BrokerFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const StepComponent = currentStepData.component;

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setCurrentStep(stepIndex);
        setVisitedSteps((prev) => new Set([...prev, stepIndex]));
      }
    },
    [steps.length]
  );

  const handleNext = useCallback(async () => {
    const isValid = await form.trigger();
    if (isValid && !isLastStep) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, form, isLastStep, goToStep]);

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, isFirstStep, goToStep]);

  const handleSubmitStep = useCallback(
    async (data: any) => {
      if (isLastStep) {
        await onSubmit(data);
      } else {
        await handleNext();
      }
    },
    [isLastStep, onSubmit, handleNext]
  );

  const handleSaveDraft = useCallback(async () => {
    if (onSaveDraft) {
      const formData = form.getValues();
      await onSaveDraft(formData);
    }
  }, [form, onSaveDraft]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  return (
    <div className={cn("w-full", className)}>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <FormStepper
              steps={steps}
              currentStep={currentStep}
              onStepClick={goToStep}
            />
          </div>
        </aside>

        <div className="lg:hidden mb-6">
          <FormStepper steps={steps} currentStep={currentStep} />
        </div>

        <main>
          <Card className="p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">
                <span className="ltr:inline hidden">{currentStepData.label}</span>
                <span className="rtl:inline hidden">{currentStepData.labelAr}</span>
              </h2>
              {currentStepData.description && (
                <p className="text-muted-foreground mt-2 ltr:inline hidden">
                  {currentStepData.description}
                </p>
              )}
              {currentStepData.descriptionAr && (
                <p className="text-muted-foreground mt-2 rtl:inline hidden">
                  {currentStepData.descriptionAr}
                </p>
              )}
            </div>

            <form onSubmit={form.handleSubmit(handleSubmitStep)}>
              <div className="space-y-6">
                <StepComponent form={form} />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isFirstStep || isSubmitting}
                  className="sm:w-auto w-full"
                >
                  <ArrowLeft className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                  <span className="ltr:inline hidden">Previous</span>
                  <span className="rtl:inline hidden">السابق</span>
                </Button>

                <div className="flex gap-3 sm:ml-auto">
                  {!isNew && onSaveDraft && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={isSubmitting}
                      className="sm:w-auto w-full"
                    >
                      <Save className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                      <span className="ltr:inline hidden">Save Draft</span>
                      <span className="rtl:inline hidden">حفظ المسودة</span>
                    </Button>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="sm:w-auto w-full"
                  >
                    {isSubmitting ? (
                      <span className="ltr:inline hidden">Saving...</span>
                    ) : isLastStep ? (
                      <>
                        <Check className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                        <span className="ltr:inline hidden">Submit</span>
                        <span className="rtl:inline hidden">إرسال</span>
                      </>
                    ) : (
                      <>
                        <span className="ltr:inline hidden">Next</span>
                        <span className="rtl:inline hidden">التالي</span>
                        <ArrowRight className="ltr:ml-2 rtl:mr-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </main>
      </div>
    </div>
  );
}
