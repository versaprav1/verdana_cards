
'use server';
/**
 * @fileOverview A conversational AI flow for the Study Buddy feature.
 *
 * - chatWithBuddy - A function that handles the conversation with the AI buddy.
 * - StudyBuddyInput - The input type for the function.
 * - StudyBuddyOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import { StudyBuddyInputSchema, StudyBuddyOutputSchema } from '@/lib/types';
import type { StudyBuddyInput, StudyBuddyOutput } from '@/lib/types';

export async function chatWithBuddy(input: StudyBuddyInput): Promise<StudyBuddyOutput> {
  return studyBuddyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'studyBuddyPrompt',
  input: {schema: StudyBuddyInputSchema},
  output: {schema: StudyBuddyOutputSchema},
  prompt: `You are an expert, friendly, and encouraging study buddy. Your goal is to help the user understand the topics in their flashcard deck.

The user is currently studying a deck titled: "{{deckTitle}}"
{{#if language}}
The deck's content is in {{language}}. Please conduct this conversation in {{language}}.
{{/if}}

Here is the content of the deck:
{{#each flashcards}}
- Front: "{{this.front}}" / Back: "{{this.back}}"
{{/each}}

The user has sent you the following message:
"{{message}}"

Respond to the user's message in a helpful and conversational way. Be concise. If they ask a question, answer it based on the flashcard content or your general knowledge of the topic. If they seem confused, offer to explain a concept in a simpler way. Keep your tone positive and encouraging.`,
});

const studyBuddyFlow = ai.defineFlow(
  {
    name: 'studyBuddyFlow',
    inputSchema: StudyBuddyInputSchema,
    outputSchema: StudyBuddyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI model failed to generate a response.");
    }
    return output;
  }
);
