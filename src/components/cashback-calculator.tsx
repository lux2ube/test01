
"use client";

import { useState, useTransition } from "react";
import { Loader2, DollarSign, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { handleCalculateCashback } from "@/app/actions";
import { Skeleton } from "./ui/skeleton";
import type { CalculateCashbackOutput } from "@/ai/flows/calculate-cashback";
import { Label } from "./ui/label";

export function CashbackCalculator() {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [mcc, setMcc] = useState("");
  const [result, setResult] = useState<CalculateCashbackOutput | null>(null);
  const { toast } = useToast();

  const onSubmit = () => {
    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid transaction amount.",
      });
      return;
    }
    if (!mcc) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter a Merchant Category Code (MCC).",
        });
        return;
      }

    startTransition(async () => {
      const { result: apiResult, error } = await handleCalculateCashback({ amount: transactionAmount, mcc });
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error,
        });
        setResult(null);
      } else {
        setResult(apiResult);
      }
    });
  };

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
                <CardTitle className="font-headline">Cashback Calculator</CardTitle>
                <CardDescription>
                Enter transaction details to calculate the cashback award based on the project's rules.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="amount">Transaction Amount</Label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="amount"
                        type="number"
                        placeholder="e.g., 125.50"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isPending}
                        className="pl-10"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="mcc">Merchant Category Code (MCC)</Label>
                 <div className="relative">
                    <ListTree className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="mcc"
                        type="text"
                        placeholder="e.g., 5812 (Restaurants)"
                        value={mcc}
                        onChange={(e) => setMcc(e.target.value)}
                        disabled={isPending}
                        className="pl-10"
                    />
                </div>
            </div>
        </div>
         <Button onClick={onSubmit} disabled={isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground mt-2">
            {isPending ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
            </>
            ) : (
            <>
                <DollarSign className="mr-2 h-4 w-4" />
                Calculate
            </>
            )}
        </Button>
        
        {isPending && (
          <div className="space-y-2 pt-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
        {result && !isPending && (
          <div className="pt-4 space-y-2">
            <h3 className="text-lg font-bold text-primary">${result.cashbackAmount.toFixed(2)}</h3>
            <p className="text-sm text-muted-foreground">{result.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
