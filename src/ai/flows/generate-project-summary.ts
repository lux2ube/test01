'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate a summary of a project
 *  based on its documentation, including architecture, technologies, and main goals.
 *
 * - generateProjectSummary - A function that triggers the project summary generation flow.
 * - GenerateProjectSummaryInput - The input type for the generateProjectSummary function.
 * - GenerateProjectSummaryOutput - The return type for the generateProjectSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProjectSummaryInputSchema = z.object({
  projectDescription: z
    .string()
    .describe('A detailed description of the project, including its purpose, features, and technical details.'),
  architectureDetails: z
    .string()
    .describe('Information about the project architecture.'),
  technologyDetails: z
    .string()
    .describe('Details of technologies used in the project.'),
  mainGoals: z.string().describe('The main goals of the project.'),
});
export type GenerateProjectSummaryInput = z.infer<
  typeof GenerateProjectSummaryInputSchema
>;

const GenerateProjectSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A concise summary of the project, including its architecture, technologies used, and main goals.'
    ),
});
export type GenerateProjectSummaryOutput = z.infer<
  typeof GenerateProjectSummaryOutputSchema
>;

export async function generateProjectSummary(
  input: GenerateProjectSummaryInput
): Promise<GenerateProjectSummaryOutput> {
  return generateProjectSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProjectSummaryPrompt',
  input: {schema: GenerateProjectSummaryInputSchema},
  output: {schema: GenerateProjectSummaryOutputSchema},
  prompt: `You are an AI expert in generating project summaries based on provided information.

  Based on the following details, create a concise summary that covers the project's architecture, technologies used, and main goals.

  Project Description: {{{projectDescription}}}
  Architecture Details: {{{architectureDetails}}}
  Technology Details: {{{technologyDetails}}}
  Main Goals: {{{mainGoals}}}

  Summary:`,
});

const generateProjectSummaryFlow = ai.defineFlow(
  {
    name: 'generateProjectSummaryFlow',
    inputSchema: GenerateProjectSummaryInputSchema,
    outputSchema: GenerateProjectSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
