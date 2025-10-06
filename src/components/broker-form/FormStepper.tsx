"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  label: string;
  labelAr: string;
  icon?: React.ReactNode;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export function FormStepper({ steps, currentStep, onStepClick, className }: FormStepperProps) {
  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol role="list" className="flex items-center justify-between md:flex-col md:gap-4 md:items-start">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && (isCompleted || index === currentStep + 1);

          return (
            <li
              key={step.id}
              className={cn(
                "relative flex items-center md:w-full",
                index !== steps.length - 1 && "flex-1 md:flex-none"
              )}
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  "group flex items-center gap-3 w-full",
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && "cursor-not-allowed opacity-60"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <div className="flex items-center">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      isCurrent && "border-primary bg-background text-primary",
                      !isCompleted && !isCurrent && "border-muted-foreground/25 bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </span>
                </div>

                <div className="hidden md:flex md:flex-col md:items-start md:flex-1">
                  <span
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isCurrent && "text-primary",
                      !isCurrent && "text-muted-foreground"
                    )}
                  >
                    <span className="hidden ltr:inline">{step.label}</span>
                    <span className="hidden rtl:inline">{step.labelAr}</span>
                  </span>
                </div>
              </button>

              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 md:hidden transition-colors",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                  aria-hidden="true"
                />
              )}

              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    "hidden md:block absolute left-4 top-12 w-0.5 h-8 -mt-1 transition-colors",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
