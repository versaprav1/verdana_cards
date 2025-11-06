
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDecks } from '@/context/DecksContext';
import { useToast } from '@/hooks/use-toast';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { type QuizQuestion } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, X, Check, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

export default function QuizPage() {
    const params = useParams();
    const router = useRouter();
    const { decks, addQuizResultToDeck } = useDecks();
    const { toast } = useToast();
    
    const deckId = params.deckId as string;
    const deck = useMemo(() => decks.find(d => d.id === deckId), [decks, deckId]);

    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
    const [score, setScore] = useState(0);
    const [incorrectlyAnswered, setIncorrectlyAnswered] = useState<string[]>([]);
    
    useEffect(() => {
        if (deck) {
            if (deck.flashcards.length < 4) {
                 toast({
                    title: "Not enough cards",
                    description: "You need at least 4 cards in your deck to generate a quiz.",
                    variant: "destructive",
                });
                router.push(`/decks/${deck.id}`);
                return;
            }

            const getQuiz = async () => {
                try {
                    setIsLoading(true);
                    const quizResult = await generateQuiz({
                      flashcards: deck.flashcards.map(c => ({ id: c.id, front: c.front, back: c.back })),
                      quizHistory: deck.quizHistory || [],
                      language: deck.language,
                    });
                    setQuestions(quizResult.questions as QuizQuestion[]);
                } catch (error) {
                    console.error("Failed to generate quiz:", error);
                    let description = "The AI failed to create a quiz. Please try again.";
                    if (error instanceof Error && error.message.includes('503')) {
                        description = "The AI model is currently overloaded. Please wait a moment and try again.";
                    }
                    toast({
                        title: "Quiz Generation Failed",
                        description: description,
                        variant: "destructive",
                    });
                    router.push(`/decks/${deck.id}`);
                } finally {
                    setIsLoading(false);
                }
            };
            getQuiz();
        }
    }, [deck, deckId, router, toast]);

    const handleAnswerSelect = (option: string) => {
        if (answerState !== 'unanswered') return;

        setSelectedAnswer(option);
        const isCorrect = option === questions[currentQuestionIndex].correctAnswer;

        if (isCorrect) {
            setAnswerState('correct');
            setScore(prev => prev + 1);
        } else {
            setAnswerState('incorrect');
            setIncorrectlyAnswered(prev => [...prev, questions[currentQuestionIndex].flashcardId]);
        }
    };
    
    const finishQuiz = () => {
         addQuizResultToDeck(deckId, {
            date: new Date().toISOString(),
            score,
            totalQuestions: questions.length,
            incorrectFlashcardIds: incorrectlyAnswered,
        });
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        setCurrentQuestionIndex(questions.length); // Move to finished state
    }

    const handleNextQuestion = () => {
        if (currentQuestionIndex + 1 === questions.length) {
            finishQuiz();
        } else {
            setAnswerState('unanswered');
            setSelectedAnswer(null);
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h1 className="text-2xl font-bold">Generating Your Quiz...</h1>
                <p className="text-muted-foreground">The AI is preparing your questions.</p>
            </div>
        );
    }
    
    if (questions.length === 0 && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <h1 className="text-2xl font-bold">Could not load quiz</h1>
                 <Button asChild className="mt-6">
                    <Link href={`/decks/${deckId}`}>Back to Deck</Link>
                </Button>
            </div>
        )
    }

    const quizFinished = currentQuestionIndex >= questions.length;
    const currentQuestion = questions[currentQuestionIndex];
    const progress = quizFinished ? 100 : (currentQuestionIndex / questions.length) * 100;

    if (quizFinished) {
        return (
             <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <Trophy className="w-24 h-24 text-yellow-400 mb-6" />
                <h1 className="text-4xl font-bold">Quiz Complete!</h1>
                <p className="text-2xl text-muted-foreground mt-2">
                    You scored {score} out of {questions.length}
                </p>
                <div className="flex gap-4 mt-8">
                     <Button asChild variant="outline">
                        <Link href={`/decks/${deckId}`}>Back to Deck</Link>
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                        Play Again
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-secondary/30">
            <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                 <div className="flex-1">
                    <h1 className="text-lg font-bold truncate">{deck?.title} Quiz</h1>
                 </div>
                <div className="flex-1 text-center font-semibold">
                    Score: {score}
                </div>
                <div className="flex-1 flex justify-end">
                    <Button asChild variant="ghost" size="icon">
                        <Link href={`/decks/${deckId}`}>
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close quiz</span>
                        </Link>
                    </Button>
                </div>
            </header>

             <main className="flex-grow flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-3xl">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">{currentQuestion.questionText}</CardTitle>
                    </CardHeader>
                    <CardContent className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentQuestion.options.map((option, index) => {
                                const isSelected = selectedAnswer === option;
                                const isCorrect = option === currentQuestion.correctAnswer;
                                
                                return (
                                    <Button
                                        key={index}
                                        onClick={() => handleAnswerSelect(option)}
                                        disabled={answerState !== 'unanswered'}
                                        className={cn(
                                            "h-auto py-4 text-wrap justify-start",
                                            answerState !== 'unanswered' && isCorrect && 'bg-green-500 hover:bg-green-500 text-white',
                                            answerState === 'incorrect' && isSelected && 'bg-destructive hover:bg-destructive text-white'
                                        )}
                                        variant="outline"
                                    >
                                        <div className="flex items-center w-full">
                                            <div className="flex-grow">{option}</div>
                                            {answerState !== 'unanswered' && isSelected && isCorrect && <Check className="h-5 w-5" />}
                                            {answerState !== 'unanswered' && isSelected && !isCorrect && <X className="h-5 w-5" />}
                                            {answerState !== 'unanswered' && !isSelected && isCorrect && <Check className="h-5 w-5" />}
                                        </div>
                                    </Button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                 {answerState !== 'unanswered' && (
                    <Button className="mt-8" onClick={handleNextQuestion}>
                        {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    </Button>
                )}
            </main>

            <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="w-full max-w-3xl mx-auto">
                     <div className="flex items-center justify-between mt-4">
                        <p className="text-sm font-medium">{currentQuestionIndex + 1} / {questions.length}</p>
                    </div>
                    <Progress value={progress} className="w-full mt-2" />
                </div>
            </footer>
        </div>
    );
}
