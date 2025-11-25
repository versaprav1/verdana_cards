'use server';
/**
 * @fileOverview A flow for generating flashcard decks from a website URL.
 *
 * - generateDeckFromUrl - A function that generates a deck from a URL.
 * - GenerateDeckFromUrlInput - The input type for the function.
 * - GenerateDeckFromUrlOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { GenerateDeckOutput } from './generate-deck-flow';
import { GenerateDeckFromUrlInputSchema, GenerateDeckOutputSchema } from '@/lib/types';


export type GenerateDeckFromUrlInput = z.infer<typeof GenerateDeckFromUrlInputSchema>;

export type GenerateDeckFromUrlOutput = GenerateDeckOutput;

export async function generateDeckFromUrl(input: GenerateDeckFromUrlInput): Promise<GenerateDeckFromUrlOutput> {
  return generateDeckFromUrlFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeckFromUrlPrompt',
  input: {schema: GenerateDeckFromUrlInputSchema},
  output: {schema: GenerateDeckOutputSchema},
  prompt: `You are an expert in creating educational materials from web content. Your task is to generate a set of high-quality flashcards based on the content of the provided URL.

Analyze the main content from the website and create clear, concise flashcards. Each flashcard should have a "front" (a question, term, or concept) and a corresponding "back" (the answer, definition, or explanation).
{{#if language}}
The flashcards should be generated in {{language}}.
{{/if}}

Deck Topic: {{{title}}}
Website URL: {{{url}}}

Please generate exactly {{{count}}} flashcards related to the website's content.`,
});

const generateDeckFromUrlFlow = ai.defineFlow(
  {
    name: 'generateDeckFromUrlFlow',
    inputSchema: GenerateDeckFromUrlInputSchema,
    outputSchema: GenerateDeckOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI model failed to generate a response from the URL.");
    }
    return output;
  }
);
