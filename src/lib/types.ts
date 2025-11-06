
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';


export const QuizAttemptSchema = z.object({
  date: z.string().describe("The ISO date string of when the quiz was taken."),
  score: z.number().describe("The number of questions answered correctly."),
  totalQuestions: z.number().describe("The total number of questions in the quiz."),
  incorrectFlashcardIds: z.array(z.string()).describe("A list of flashcard IDs that the user answered incorrectly."),
});

export type QuizAttempt = z.infer<typeof QuizAttemptSchema>;

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  imageUrl?: string;
  srsLevel: number; // New field for SRS
  nextReviewDate: string; // New field for SRS - ISO string
}

export interface Deck {
  id:string;
  title: string;
  language: 'English' | 'German';
  flashcards: Flashcard[];
  quizHistory?: QuizAttempt[];
  createdAt: any; // Allow for ServerTimestamp
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video';
  url: string; // data URI
  prompt: string;
  createdAt: string; // Allow for ServerTimestamp
}

// AI-related Schemas
export const GenerateDeckInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate flashcards.'),
  count: z.number().min(1).max(50).describe('The number of flashcards to generate.'),
  language: z.string().optional().describe('The language for the flashcard content.'),
});

const FlashcardSchema = z.object({
  front: z.string().describe('The front side of the flashcard (question or term).'),
  back: z.string().describe('The back side of the flashcard (answer or definition).'),
});

export const GenerateDeckOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of generated flashcards.'),
});

export const GenerateDeckFromPdfInputSchema = z.object({
  title: z.string().describe('The title of the deck.'),
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file encoded as a data URI. Must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'"
    ),
  count: z.number().min(1).max(50).describe('The number of flashcards to generate.'),
  language: z.string().optional().describe('The language for the flashcard content.'),
});

export const GenerateDeckFromUrlInputSchema = z.object({
  title: z.string().describe('The title of the deck.'),
  url: z.string().url().describe('The URL of the website to process.'),
  count: z.number().min(1).max(50).describe('The number of flashcards to generate.'),
  language: z.string().optional().describe('The language for the flashcard content.'),
});

export const GeneratePictureDeckInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate a picture deck.'),
  count: z.number().min(1).max(10).describe('The number of flashcards to generate (max 10 for picture decks).'),
  language: z.string().optional().describe('The language for the flashcard content.'),
});

const PictureFlashcardSchema = z.object({
    front: z.string().describe('The term or concept for the front of the card.'),
    back: z.string().describe('The definition or explanation for the back of the card.'),
    imageUrl: z.string().url().describe('A URL to an image for the front of the card.'),
});

export const GeneratePictureDeckOutputSchema = z.object({
  flashcards: z.array(PictureFlashcardSchema).describe('An array of generated flashcards with images.'),
});


// Quiz Generation Schemas
export const GenerateQuizInputSchema = z.object({
    flashcards: z.array(z.object({
        id: z.string(),
        front: z.string(),
        back: z.string(),
    })).describe("The flashcards to generate a quiz from."),
    quizHistory: z.array(QuizAttemptSchema).optional().describe("The user's past quiz performance for this deck."),
    language: z.string().optional().describe("The language of the deck."),
});

const QuizQuestionSchema = z.object({
    questionText: z.string().describe("The text of the multiple-choice question."),
    options: z.array(z.string()).describe("An array of three incorrect 'distractor' answers."),
    correctAnswer: z.string().describe("The correct answer for the question."),
    flashcardId: z.string().describe("The ID of the flashcard this question is based on."),
});

// The AI only generates the text and options, we add the flashcardId later.
export const AiGeneratedQuizQuestionSchema = z.object({
    questionText: z.string().describe("The text of the multiple-choice question, based on the flashcard's 'front'."),
    options: z.array(z.string()).describe("An array of three plausible but incorrect 'distractor' answers."),
    correctAnswer: z.string().describe("The correct answer for the question, based on the flashcard's 'back'."),
    flashcardId: z.string().describe("The ID of the flashcard this question is based on."),
});


export const GenerateQuizOutputSchema = z.object({
    questions: z.array(AiGeneratedQuizQuestionSchema).describe("An array of generated quiz questions.")
});

// The final type for a question after processing
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const GenerateVideoInputSchema = z.object({
    topic: z.string().min(1, 'Topic is required.').describe('The main topic or subject for the video.'),
    description: z.string().optional().describe('More detailed instructions for the AI.'),
    contextualDecks: z.array(z.object({
        title: z.string(),
        flashcards: z.array(z.object({
            id: z.string(),
            front: z.string()
        })),
    })).optional().describe('An array of existing decks to provide context.'),
});

export const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe("The data URI of the generated video file."),
});

// Study Buddy Schemas
const FlashcardContextSchema = z.object({
    front: z.string(),
    back: z.string(),
});

export const StudyBuddyInputSchema = z.object({
  deckTitle: z.string().describe("The title of the deck the user is studying."),
  language: z.string().optional().describe("The language of the deck."),
  flashcards: z.array(FlashcardContextSchema).describe("The full list of flashcards in the current deck."),
  message: z.string().describe("The user's message to the study buddy."),
});
export type StudyBuddyInput = z.infer<typeof StudyBuddyInputSchema>;

export const StudyBuddyOutputSchema = z.object({
  response: z.string().describe("The AI study buddy's response to the user."),
});
export type StudyBuddyOutput = z.infer<typeof StudyBuddyOutputSchema>;


export const GenerateImageInputSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty.').describe('The text prompt for image generation.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

export const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the generated image."),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

    