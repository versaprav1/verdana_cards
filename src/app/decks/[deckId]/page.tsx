
"use client";

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useDecks } from '@/context/DecksContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, PlusCircle, Edit, Trash2, Home, ChevronRight, Layers, BrainCircuit, MessageCircle, Globe, Loader2, Sparkles } from 'lucide-react';
import AddEditCardDialog from '@/components/AddEditCardDialog';
import { type Flashcard } from '@/lib/types';
import { isToday, isPast } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DeckPage() {
  const params = useParams();
  const router = useRouter();
  const { decks, loading, deleteCardFromDeck, deleteDeck } = useDecks();

  const deckId = params.deckId as string;

  const deck = useMemo(() => decks.find(d => d.id === deckId), [decks, deckId]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  
  const dueCardsCount = useMemo(() => {
    if (!deck) return 0;
    return deck.flashcards.filter(card => {
        const reviewDate = new Date(card.nextReviewDate);
        return isToday(reviewDate) || isPast(reviewDate);
    }).length;
  }, [deck]);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-bold">Loading Deck...</h1>
        </div>
    );
  }

  if (!deck) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <h1 className="text-2xl font-bold">Deck not found</h1>
            <p className="text-muted-foreground">The deck you are looking for does not exist.</p>
            <Button asChild className="mt-4">
                <Link href="/">Go to Dashboard</Link>
            </Button>
        </div>
    );
  }

  const handleAddCard = () => {
    setEditingCard(null);
    setDialogOpen(true);
  };

  const handleEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setDialogOpen(true);
  };
  
  const handleDeleteDeck = () => {
    deleteDeck(deck.id);
    router.push('/');
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center text-sm sm:text-base">
                  <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                      <Home className="h-4 w-4 mr-2" />
                      Decks
                  </Link>
                  <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                  <span className="font-semibold text-foreground truncate">{deck.title}</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5 text-sm text-muted-foreground border rounded-md px-3 h-9">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">{deck.language}</span>
                 </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Delete Deck</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the deck "{deck.title}" and all its cards.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteDeck}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button onClick={handleAddCard} size="sm">
                  <PlusCircle className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Card</span>
                </Button>
                 <Button asChild size="sm" variant="outline">
                    <Link href={`/decks/${deck.id}/buddy`}>
                        <MessageCircle className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">AI Buddy</span>
                    </Link>
                </Button>
                {deck.flashcards && deck.flashcards.length > 0 && (
                    <Button asChild size="sm" variant="outline">
                        <Link href={`/decks/${deck.id}/quiz`}>
                            <BrainCircuit className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Start Quiz</span>
                        </Link>
                    </Button>
                )}
                {dueCardsCount > 0 && (
                  <Button asChild size="sm">
                    <Link href={`/decks/${deck.id}/study`}>
                      <BookOpen className="h-4 w-4 sm:mr-2" />
                       <span className="hidden sm:inline">Study {dueCardsCount} Card{dueCardsCount === 1 ? '' : 's'}</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          {deck.flashcards && deck.flashcards.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto bg-secondary/50 rounded-full h-24 w-24 flex items-center justify-center">
                <Layers className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold">No Cards in this Deck</h2>
              <p className="mt-2 text-muted-foreground">Add your first flashcard to start learning.</p>
              <div className='flex gap-4 justify-center'>
                <Button className="mt-6" onClick={handleAddCard}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add a Card
                </Button>
                 <Button className="mt-6" asChild>
                    <Link href={`/decks/${deck.id}/add`}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate with AI
                    </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deck.flashcards && deck.flashcards.map((card) => (
                <Card key={card.id} className="flex flex-col">
                  <CardHeader className="p-0">
                    {card.imageUrl && (
                      <div className="aspect-video relative w-full">
                        <Image src={card.imageUrl} alt={card.front} width={600} height={400} style={{ objectFit: 'cover' }} className="rounded-t-lg" data-ai-hint={card.front} />
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow pt-6">
                     {card.imageUrl ? (
                        <p className="text-lg font-semibold text-foreground">{card.front}</p>
                     ) : (
                        <CardTitle className="text-lg">{card.front}</CardTitle>
                     )}
                    <CardDescription className="mt-2 text-base">{card.back}</CardDescription>
                  </CardContent>
                  <div className="p-4 pt-0 flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditCard(card)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit card</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete card</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this flashcard. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteCardFromDeck(deck.id, card.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
      <AddEditCardDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        deckId={deck.id}
        card={editingCard}
      />
    </>
  );
}
