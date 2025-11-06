
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useDecks } from '@/context/DecksContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookOpen, Layers, Sparkles, Clapperboard, Settings, Library, Loader2, LogIn } from 'lucide-react';
import CreateDeckDialog from '@/components/CreateDeckDialog';
import DeckActionDialog from '@/components/DeckActionDialog';
import type { Deck } from '@/lib/types';
import { useUser } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase';


export default function Home() {
  const { decks, loading } = useDecks();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [isCreateDeckOpen, setCreateDeckOpen] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  const handleDeckClick = (deck: Deck) => {
    setSelectedDeck(deck);
  };
  
  const handleAnonymousSignIn = () => {
    if (auth) {
      initiateAnonymousSignIn(auth);
    }
  };


  if (isUserLoading || loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-bold">Loading Your Decks...</h1>
        </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <div className="mx-auto bg-secondary/50 rounded-full h-24 w-24 flex items-center justify-center">
          <Layers className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-4xl font-bold font-headline text-primary">Welcome to VerdantCards</h1>
        <p className="mt-2 text-lg text-muted-foreground">Your intelligent learning partner.</p>
        <div className="mt-8">
            <Button onClick={handleAnonymousSignIn} size="lg">
                <LogIn className="mr-2 h-5 w-5" />
                Get Started
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">Sign in anonymously to start creating decks.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <Layers className="h-7 w-7 text-primary" />
                <h1 className="text-2xl font-bold font-headline text-primary">VerdantCards</h1>
              </div>
              <div className="flex items-center gap-2">
                 <Button asChild variant="outline">
                  <Link href="/asset-library">
                    <Library className="mr-2 h-4 w-4" />
                    Asset Library
                  </Link>
                </Button>
                <Button onClick={() => setCreateDeckOpen(true)} variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Deck
                </Button>
                <Button asChild>
                  <Link href="/generate">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                  </Link>
                </Button>
                 <Button asChild variant="outline">
                  <Link href="/generate-video">
                    <Clapperboard className="mr-2 h-4 w-4" />
                    Video
                  </Link>
                </Button>
                 <Button asChild size="icon" variant="ghost">
                  <Link href="/settings">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Settings</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          {decks.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto bg-secondary/50 rounded-full h-24 w-24 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-foreground">No Decks Yet</h2>
              <p className="mt-2 text-muted-foreground">Get started by creating your first flashcard deck.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Button onClick={() => setCreateDeckOpen(true)} variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create a Deck
                </Button>
                 <Button asChild>
                  <Link href="/generate">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {decks.map((deck) => (
                  <Card 
                    key={deck.id} 
                    className="h-full hover:border-primary transition-colors duration-200 flex flex-col group cursor-pointer"
                    onClick={() => handleDeckClick(deck)}
                  >
                    <CardHeader>
                      <CardTitle className="truncate font-headline group-hover:text-primary transition-colors duration-200">{deck.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-end">
                      <p className="text-sm text-muted-foreground">
                        {deck.flashcards?.length || 0} card{deck.flashcards?.length !== 1 ? 's' : ''}
                      </p>
                    </CardContent>
                  </Card>
              ))}
            </div>
          )}
        </main>
      </div>
      <CreateDeckDialog isOpen={isCreateDeckOpen} onOpenChange={setCreateDeckOpen} />
      <DeckActionDialog deck={selectedDeck} onOpenChange={() => setSelectedDeck(null)} />
    </>
  );
}
