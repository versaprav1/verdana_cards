'use server';
/**
 * @fileOverview A flow for generating short videos using AI.
 *
 * - generateVideo - A function that generates a video based on a topic and optional context.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import {ai} from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { GenerateVideoInputSchema, GenerateVideoOutputSchema } from '@/lib/types';
import {z} from 'zod';
import type { MediaPart } from 'genkit';

export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
    return generateVideoFlow(input);
}

// Helper function to fetch the video and encode it as a data URI
async function getVideoWithApiKey(videoPart: MediaPart): Promise<string> {
    if (!videoPart.media?.url) {
        throw new Error('Media URL not found in video part.');
    }

    const apiKey = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('googleApiKey') : undefined);
    if (!apiKey) {
        throw new Error('API key not found.');
    }

    const fetch = (await import('node-fetch')).default;
    const videoUrlWithKey = `${videoPart.media.url}&key=${apiKey}`;

    const response = await fetch(videoUrlWithKey);
    if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    const videoBuffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'video/mp4';
    
    return `data:${contentType};base64,${videoBuffer.toString('base64')}`;
}

const promptTemplate = `
You are a creative video director. Your task is to generate a short, engaging video based on the user's request.

**Video Topic:**
{{{topic}}}

{{#if description}}
**Detailed Instructions:**
{{{description}}}
{{/if}}

{{#if contextualDecks}}
**Background Information from User's Decks:**
Use the following information from the user's existing flashcard decks as creative inspiration. Do not simply show the text on screen, but use the concepts to guide the visual narrative.
{{#each contextualDecks}}
- Deck: "{{this.title}}"
  {{#each this.flashcards}}
  - Concept: {{this.front}} (ID: {{this.id}})
  {{/each}}
{{/each}}
{{/if}}

Generate a compelling 5-second video that captures the essence of the topic, guided by the provided instructions and context.
`;


const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async (input) => {
    // Construct the text prompt from the input
    const prompt = promptTemplate
        .replace('{{{topic}}}', input.topic)
        .replace('{{{description}}}', input.description || '');

    let { operation } = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt: prompt,
        config: {
          durationSeconds: 5,
          aspectRatio: '16:9',
        },
    });

    if (!operation) {
        throw new Error('Expected the model to return an operation');
    }

    // Poll for completion
    while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
        operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
        throw new Error('Failed to generate video: ' + operation.error.message);
    }

    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video) {
        throw new Error('Failed to find the generated video in the operation result');
    }
    
    const videoDataUri = await getVideoWithApiKey(video);

    return { videoUrl: videoDataUri };
  }
);
