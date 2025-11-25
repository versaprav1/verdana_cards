
'use server';
/**
 * @fileOverview A flow for generating a multiple-choice quiz from a flashcard deck.
 *
 * - generateQuiz - A function that generates a quiz.
 * - GenerateQuizInput - The input type for the function.
 * - GenerateQuizOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { GenerateQuizInputSchema, GenerateQuizOutputSchema } from '@/lib/types';


export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an expert in creating educational quizzes. Based on the provided list of flashcards (question and answer pairs), generate a multiple-choice quiz.
{{#if language}}
The quiz should be generated in {{language}}.
{{/if}}

For each flashcard, create one multiple-choice question. The flashcard's "front" should be the basis for the question, and its "back" should be the correct answer.
Generate three plausible but incorrect "distractor" answers for each question. The options should be shuffled.

Return a list of quiz questions.

{{#if quizHistory}}
This user has taken quizzes on this deck before. Here is their performance history:
{{#each quizHistory}}
- On {{this.date}}, they scored {{this.score}} out of {{this.totalQuestions}}. They answered questions for the following cards incorrectly: {{#each this.incorrectFlashcardIds}} {{this}} {{/each}}.
{{/each}}

Analyze this history. Generate a new quiz that focuses more on the topics and cards the user has previously struggled with. Introduce some new questions as well to ensure variety, but prioritize the difficult areas.
{{else}}
This is the user's first quiz for this deck. Generate a balanced quiz covering all topics.
{{/if}}

Flashcards:
{{#each flashcards}}
- (ID: {{this.id}}) Front: {{{this.front}}}, Back: {{{this.back}}} (Correct Answer)
{{/each}}
`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI model failed to generate a quiz.");
    }
    // Associate questions with original flashcard IDs and shuffle options
    const processedQuestions = output.questions.map((q) => {
        const originalCard = input.flashcards.find(c => c.id === q.flashcardId);
        if (!originalCard) return null; // Card might not be in the input if AI hallucinates an ID
        
        const options = [...q.options, q.correctAnswer];
        // Simple shuffle
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        return {
            ...q,
            options,
        };
    }).filter((q): q is NonNullable<typeof q> => q !== null);

    return { questions: processedQuestions };
  }
);
