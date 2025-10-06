'use server';

/**
 * @fileOverview This file defines a Genkit flow to calculate cashback for a transaction.
 *
 * - calculateCashback - A function that triggers the cashback calculation flow.
 * - CalculateCashbackInput - The input type for the calculateCashback function.
 * - CalculateCashbackOutput - The return type for the calculateCashback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateCashbackInputSchema = z.object({
  amount: z.number().describe('The transaction amount.'),
  mcc: z.string().describe('The Merchant Category Code (MCC) of the transaction.'),
});
export type CalculateCashbackInput = z.infer<typeof CalculateCashbackInputSchema>;

const CalculateCashbackOutputSchema = z.object({
  cashbackAmount: z.number().describe('The calculated cashback amount.'),
  explanation: z.string().describe('An explanation of how the cashback was calculated.'),
});
export type CalculateCashbackOutput = z.infer<typeof CalculateCashbackOutputSchema>;

export async function calculateCashback(
  input: CalculateCashbackInput
): Promise<CalculateCashbackOutput> {
  return calculateCashbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateCashbackPrompt',
  input: {schema: CalculateCashbackInputSchema},
  output: {schema: CalculateCashbackOutputSchema},
  prompt: `You are a cashback calculation engine. You must follow these rules precisely.

  Rules:
  1.  **Standard Cashback**: All transactions receive 1% cashback.
  2.  **High-Value Transaction Bonus**: If a transaction amount is over $100, it receives an *additional* 2% cashback. This is cumulative with the standard cashback.
  3.  **MCC Blacklist**: Transactions with the following Merchant Category Codes (MCCs) are blacklisted: "7995", "6011". If a transaction is on the blacklist, the total cashback amount is $0, regardless of other rules.
  
  Calculate the final cashback amount for a transaction of \${{{amount}}} with MCC "{{{mcc}}}".

  Provide the final cashback amount and a step-by-step explanation of how you applied the rules to reach the final amount.
  For blacklisted transactions, state clearly that the MCC is blacklisted and that's why the cashback is $0.`,
});

const calculateCashbackFlow = ai.defineFlow(
  {
    name: 'calculateCashbackFlow',
    inputSchema: CalculateCashbackInputSchema,
    outputSchema: CalculateCashbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
