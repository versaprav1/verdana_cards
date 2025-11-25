'use server';
/**
 * @fileOverview A flow for generating picture-based flashcard decks using AI.
 *
 * - generatePictureDeck - A function that generates a deck of flashcards with images.
 * - GeneratePictureDeckInput - The input type for the generatePictureDeck function.
 * - GeneratePictureDeckOutput - The return type for the generatePictureDeck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { GeneratePictureDeckInputSchema, GeneratePictureDeckOutputSchema } from '@/lib/types';

export type GeneratePictureDeckInput = z.infer<typeof GeneratePictureDeckInputSchema>;
export type GeneratePictureDeckOutput = z.infer<typeof GeneratePictureDeckOutputSchema>;

export async function generatePictureDeck(input: GeneratePictureDeckInput): Promise<GeneratePictureDeckOutput> {
  return generatePictureDeckFlow(input);
}

// 1. A prompt to generate the list of items for the flashcard deck.
const termListPrompt = ai.definePrompt({
    name: 'pictureDeckTermListPrompt',
    input: { schema: GeneratePictureDeckInputSchema },
    output: { schema: z.object({
        terms: z.array(z.object({
            term: z.string().describe("The name of the term/concept."),
            description: z.string().describe("A brief description of the term.")
        })).describe("An array of terms related to the topic.")
    })},
    prompt: `You are an expert in creating educational materials. Generate a list of {{{count}}} key terms or concepts related to the following topic: {{{topic}}}. For each term, provide a short, clear description suitable for a flashcard.`,
});


const generatePictureDeckFlow = ai.defineFlow(
  {
    name: 'generatePictureDeckFlow',
    inputSchema: GeneratePictureDeckInputSchema,
    outputSchema: GeneratePictureDeckOutputSchema,
  },
  async (input) => {
    // Step 1: Generate the list of terms and descriptions
    const termListResponse = await termListPrompt(input);
    const terms = termListResponse.output?.terms;

    if (!terms || terms.length === 0) {
        throw new Error('Could not generate terms for the deck.');
    }

    // Step 2: Create flashcards with placeholder images.
    const flashcards = terms.map((item) => {
        // Use a placeholder image service. Using the term as a seed ensures the same image is generated for the same term.
        const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(item.term)}/600/400`;

        return {
            front: item.term,
            back: item.description,
            imageUrl: imageUrl,
        };
    });

    return { flashcards };
  }
);
