"use client";

import { useState, useTransition } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { handleGenerateSummary } from "@/app/actions";
import { Skeleton } from "./ui/skeleton";

export function SummaryGenerator() {
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<string | null>(null);
  const { toast } = useToast();

  const onSubmit = () => {
    startTransition(async () => {
      const { summary: result, error } = await handleGenerateSummary();
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error,
        });
        setSummary(null);
      } else {
        setSummary(result);
      }
    });
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-primary" />
            </div>
            <div>
                <CardTitle className="font-headline">AI-Powered Summary</CardTitle>
                <CardDescription>
                Let AI analyze the project and generate a high-level summary.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-[120px]">
        {isPending && (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
        {summary && !isPending && (
          <blockquote className="border-l-2 pl-4 italic text-sm text-foreground/90">
            {summary}
          </blockquote>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={onSubmit} disabled={isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Summary
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
