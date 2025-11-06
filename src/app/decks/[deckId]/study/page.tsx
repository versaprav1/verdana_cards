
"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useDecks } from '@/context/DecksContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday, isPast } from 'date-fns';
import confetti from 'canvas-confetti';

export default function StudyPage() {
    const params = useParams();
    const router = useRouter();
    const deckId = params.deckId as string;
    const { decks, updateCardSrs } = useDecks();

    const deck = useMemo(() => decks.find(d => d.id === deckId), [decks, deckId]);

    const dueCards = useMemo(() => {
        if (!deck) return [];
        const now = new Date();
        return deck.flashcards
            .filter(card => {
                const reviewDate = new Date(card.nextReviewDate);
                return isToday(reviewDate) || isPast(reviewDate);
            })
            .sort((a, b) => a.srsLevel - b.srsLevel); // Prioritize cards with lower SRS level
    }, [deck]);

    const [sessionQueue, setSessionQueue] = useState(dueCards);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionFinished, setSessionFinished] = useState(false);

    const currentCard = sessionQueue[0];
    const cardsCompleted = dueCards.length - sessionQueue.length;
    const progress = dueCards.length > 0 ? (cardsCompleted / dueCards.length) * 100 : 0;
    
    useEffect(() => {
        if(dueCards.length > 0 && sessionQueue.length === 0 && !sessionFinished) {
            setSessionFinished(true);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [sessionQueue, dueCards, sessionFinished]);

    const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
        if (!currentCard) return;

        updateCardSrs(deckId, currentCard.id, rating);

        setIsFlipped(false);

        setTimeout(() => {
            if (rating === 'again') {
                // Move card to later in the queue
                setSessionQueue(prev => [...prev.slice(1), currentCard]);
            } else {
                // Card is done for this session
                setSessionQueue(prev => prev.slice(1));
            }
        }, 150); // wait for flip back animation
    };

    if (!deck) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading deck...</p>
            </div>
        );
    }
    
    if (dueCards.length === 0 || sessionFinished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <Trophy className="w-20 h-20 text-yellow-400 mb-6" />
                <h1 className="text-3xl font-bold">Great job!</h1>
                <p className="text-muted-foreground mt-2">You have finished all your reviews for this deck for now.</p>
                <Button asChild className="mt-6">
                    <Link href="/">Back to Decks</Link>
                </Button>
            </div>
        )
    }


    return (
        <div className="flex flex-col h-screen bg-secondary/30">
            <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                <h1 className="text-lg font-bold truncate">{deck.title}</h1>
                <Button asChild variant="ghost" size="icon">
                    <Link href="/">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close study session</span>
                    </Link>
                </Button>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center p-4 perspective-[1000px]">
                <div className="w-full max-w-2xl aspect-video relative">
                    <div
                        className={cn("w-full h-full absolute transition-transform duration-500 transform-style-3d", { 'rotate-y-180': isFlipped })}
                        onClick={() => setIsFlipped(true)}
                    >
                        {/* Front of the card */}
                        <div className="absolute w-full h-full backface-hidden rounded-xl shadow-2xl bg-card border flex flex-col items-center justify-center p-8">
                           {currentCard.imageUrl ? (
                                <>
                                    <div className="relative w-full h-4/5">
                                        <Image src={currentCard.imageUrl} alt={currentCard.front} width={600} height={400} style={{ objectFit: 'contain' }} data-ai-hint={currentCard.front} />
                                    </div>
                                    <p className="text-xl md:text-2xl text-center font-semibold mt-4">{currentCard.front}</p>
                                </>
                            ) : (
                                <p className="text-2xl md:text-3xl text-center font-semibold">{currentCard.front}</p>
                            )}
                        </div>
                        {/* Back of the card */}
                        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-xl shadow-2xl bg-card border flex items-center justify-center p-8">
                            <p className="text-2xl md:text-3xl text-center font-semibold">{currentCard.back}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-sm text-muted-foreground">{!isFlipped ? 'Click card to see answer' : 'How well did you know this?'}</div>
            </main>

            <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="w-full max-w-2xl mx-auto">
                    {isFlipped ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <Button variant="destructive" onClick={() => handleRating('again')}>Again</Button>
                           <Button variant="outline" onClick={() => handleRating('hard')}>Hard</Button>
                           <Button variant="outline" onClick={() => handleRating('good')}>Good</Button>
                           <Button variant="default" onClick={() => handleRating('easy')}>Easy</Button>
                        </div>
                    ) : (
                         <Button className="w-full" onClick={() => setIsFlipped(true)}>Show Answer</Button>
                    )}
                     <div className="flex items-center justify-between mt-4">
                        <p className="text-sm font-medium">{cardsCompleted} / {dueCards.length} reviewed</p>
                    </div>
                    <Progress value={progress} className="w-full mt-2" />
                </div>
            </footer>
            
            <style jsx>{`
              .perspective-\\[1000px\\] {
                perspective: 1000px;
              }
              .transform-style-3d {
                transform-style: preserve-3d;
              }
              .rotate-y-180 {
                transform: rotateY(180deg);
              }
              .backface-hidden {
                backface-visibility: hidden;
              }
            `}</style>
        </div>
    );
}
