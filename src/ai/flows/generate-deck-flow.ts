'use server';
/**
 * @fileOverview A flow for generating flashcard decks using AI.
 *
 * - generateDeck - A function that generates a deck of flashcards on a given topic.
 * - GenerateDeckInput - The input type for the generateDeck function.
 * - GenerateDeckOutput - The return type for the generateDeck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { GenerateDeckInputSchema, GenerateDeckOutputSchema } from '@/lib/types';


export type GenerateDeckInput = z.infer<typeof GenerateDeckInputSchema>;
export type GenerateDeckOutput = z.infer<typeof GenerateDeckOutputSchema>;

export async function generateDeck(input: GenerateDeckInput): Promise<GenerateDeckOutput> {
  return generateDeckFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeckPrompt',
  input: {schema: GenerateDeckInputSchema},
  output: {schema: GenerateDeckOutputSchema},
  prompt: `You are an expert in creating educational materials. Your task is to generate a set of high-quality flashcards for the given topic.

Each flashcard should have a clear "front" (a question, term, or concept) and a corresponding "back" (the answer, definition, or explanation).
{{#if language}}
The flashcards should be generated in {{language}}.
{{/if}}

Topic: {{{topic}}}

Please generate exactly {{{count}}} flashcards related to this topic. Ensure the content is accurate, concise, and suitable for learning.`,
});

const generateDeckFlow = ai.defineFlow(
  {
    name: 'generateDeckFlow',
    inputSchema: GenerateDeckInputSchema,
    outputSchema: GenerateDeckOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI model failed to generate a response.");
    }
    return output;
  }
);
