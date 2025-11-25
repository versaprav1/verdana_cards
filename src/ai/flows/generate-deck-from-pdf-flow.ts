'use server';
/**
 * @fileOverview A flow for generating flashcard decks from a PDF file.
 *
 * - generateDeckFromPdf - A function that generates a deck from a PDF.
 * - GenerateDeckFromPdfInput - The input type for the function.
 * - GenerateDeckFromPdfOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { GenerateDeckOutput } from './generate-deck-flow';
import { GenerateDeckFromPdfInputSchema, GenerateDeckOutputSchema } from '@/lib/types';


export type GenerateDeckFromPdfInput = z.infer<typeof GenerateDeckFromPdfInputSchema>;

export type GenerateDeckFromPdfOutput = GenerateDeckOutput;

export async function generateDeckFromPdf(input: GenerateDeckFromPdfInput): Promise<GenerateDeckFromPdfOutput> {
  return generateDeckFromPdfFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeckFromPdfPrompt',
  input: {schema: GenerateDeckFromPdfInputSchema},
  output: {schema: GenerateDeckOutputSchema},
  prompt: `You are an expert in creating educational materials from documents. Your task is to generate a set of high-quality flashcards based on the content of the provided PDF file.

First, extract the key information and main topics from the document. Then, based on that information, create clear, concise flashcards. Each flashcard should have a "front" (a question, term, or concept) and a corresponding "back" (the answer, definition, or explanation).
{{#if language}}
The flashcards should be generated in {{language}}.
{{/if}}

Deck Topic: {{{title}}}
PDF Document: {{media url=pdfDataUri}}

Please generate exactly {{{count}}} flashcards related to the document's content.`,
});

const generateDeckFromPdfFlow = ai.defineFlow(
  {
    name: 'generateDeckFromPdfFlow',
    inputSchema: GenerateDeckFromPdfInputSchema,
    outputSchema: GenerateDeckOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI model failed to generate a response from the PDF.");
    }
    return output;
  }
);
