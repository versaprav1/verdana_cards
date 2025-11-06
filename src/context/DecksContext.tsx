
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Deck, type Flashcard, type QuizAttempt, type MediaAsset } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { addDays } from 'date-fns';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, setDoc, addDoc, serverTimestamp, query, orderBy, where, getDocs, writeBatch, onSnapshot } from 'firebase/firestore';
import { useCollection } from '@/firebase';

interface DecksContextType {
  decks: Deck[];
  mediaAssets: MediaAsset[];
  loading: boolean;
  addDeck: (title: string, language: 'English' | 'German', flashcards: Omit<Flashcard, 'id' | 'srsLevel' | 'nextReviewDate'>[]) => void;
  deleteDeck: (deckId: string) => void;
  updateDeckTitle: (deckId: string, newTitle: string) => void;
  addCardToDeck: (deckId: string, card: Omit<Flashcard, 'id' | 'srsLevel' | 'nextReviewDate'>) => void;
  addCardsToDeck: (deckId: string, cards: Omit<Flashcard, 'id' | 'srsLevel' | 'nextReviewDate'>[]) => void;
  updateCardInDeck: (deckId: string, cardId: string, updatedCard: Partial<Omit<Flashcard, 'id'>>) => void;
  deleteCardFromDeck: (deckId: string, cardId: string) => void;
  updateCardSrs: (deckId: string, cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
  addQuizResultToDeck: (deckId: string, attempt: QuizAttempt) => void;
  addMediaAsset: (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => void;
  deleteMediaAsset: (assetId: string) => void;
}

const DecksContext = createContext<DecksContextType | undefined>(undefined);

export function DecksProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [decksLoading, setDecksLoading] = useState(true);

  const mediaAssetsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'mediaAssets'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: mediaAssets, isLoading: mediaAssetsLoading } = useCollection<MediaAsset>(mediaAssetsQuery);
  
  useEffect(() => {
    if (!user || !firestore) {
      setDecks([]);
      setDecksLoading(false);
      return;
    }

    setDecksLoading(true);
    const decksQuery = query(collection(firestore, 'users', user.uid, 'decks'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(decksQuery, async (snapshot) => {
      const decksData = await Promise.all(snapshot.docs.map(async (deckDoc) => {
        const deck = deckDoc.data() as Omit<Deck, 'flashcards'>;
        
        const flashcardsQuery = query(collection(deckDoc.ref, 'flashcards'));
        const flashcardsSnapshot = await getDocs(flashcardsQuery);
        const flashcards = flashcardsSnapshot.docs.map(cardDoc => cardDoc.data() as Flashcard);

        return {
          ...deck,
          flashcards: flashcards,
        } as Deck;
      }));
      setDecks(decksData);
      setDecksLoading(false);
    }, (error) => {
      console.error("Error fetching decks: ", error);
      setDecksLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore]);


  const loading = isUserLoading || decksLoading || mediaAssetsLoading;

  const addDeck = useCallback(async (title: string, language: 'English' | 'German', flashcards: Omit<Flashcard, 'id' | 'srsLevel' | 'nextReviewDate'>[]) => {
    if (!user || !firestore) return;
    const newDeckRef = doc(collection(firestore, 'users', user.uid, 'decks'));
    const newDeckData = {
      id: newDeckRef.id,
      title,
      language,
      createdAt: serverTimestamp(),
      quizHistory: [],
    };
    await setDoc(newDeckRef, newDeckData);

    if (flashcards.length > 0) {
        const batch = writeBatch(firestore);
        const flashcardsColRef = collection(newDeckRef, 'flashcards');
        for (const card of flashcards) {
            const cardRef = doc(flashcardsColRef);
            const newCard = {
                ...card,
                id: cardRef.id,
                srsLevel: 0,
                nextReviewDate: new Date().toISOString()
            };
            batch.set(cardRef, newCard);
        }
        await batch.commit();
    }
  }, [user, firestore]);

  const deleteDeck = useCallback(async (deckId: string) => {
    if (!user || !firestore) return;
    try {
        const deckRef = doc(firestore, 'users', user.uid, 'decks', deckId);
        
        // Delete all flashcards in the subcollection
        const flashcardsQuery = collection(deckRef, 'flashcards');
        const flashcardsSnapshot = await getDocs(flashcardsQuery);
        const batch = writeBatch(firestore);
        flashcardsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Delete the deck itself
        await deleteDoc(deckRef);

        toast({
            title: "Deck Deleted",
            description: "The deck and all its cards have been permanently removed.",
        });
    } catch (error) {
        console.error("Error deleting deck: ", error);
        toast({
            title: "Error",
            description: "Failed to delete the deck. Please try again.",
            variant: "destructive",
        });
    }
  }, [user, firestore, toast]);

  const updateDeckTitle = useCallback(async (deckId: string, newTitle: string) => {
    if (!user || !firestore) return;
    const deckRef = doc(firestore, 'users', user.uid, 'decks', deckId);
    await setDoc(deckRef, { title: newTitle }, { merge: true });
  }, [user, firestore]);
  
  const addCardsToDeck = useCallback(async (deckId: string, cards: Omit<Flashcard, 'id' | 'srsLevel' | 'nextReviewDate'>[]) => {
    if (!user || !firestore) return;
    const deckRef = doc(firestore, 'users', user.uid, 'decks', deckId);

    const batch = writeBatch(firestore);
    const flashcardsColRef = collection(deckRef, 'flashcards');
    for(const card of cards) {
      const cardRef = doc(flashcardsColRef);
      const newCard: Flashcard = { 
          ...card, 
          id: cardRef.id,
          srsLevel: 0,
          nextReviewDate: new Date().toISOString()
      };
      batch.set(cardRef, newCard);
    }
    await batch.commit();
  }, [user, firestore]);

  const addCardToDeck = useCallback((deckId: string, card: Omit<Flashcard, 'id' | 'srsLevel' | 'nextReviewDate'>) => {
    addCardsToDeck(deckId, [card]);
  }, [addCardsToDeck]);

  const updateCardInDeck = useCallback(async (deckId: string, cardId: string, updatedCard: Partial<Omit<Flashcard, 'id'>>) => {
    if (!user || !firestore) return;
    const cardRef = doc(firestore, 'users', user.uid, 'decks', deckId, 'flashcards', cardId);
    await setDoc(cardRef, updatedCard, { merge: true });
  }, [user, firestore]);

  const deleteCardFromDeck = useCallback(async (deckId: string, cardId: string) => {
    if (!user || !firestore) return;
    const cardRef = doc(firestore, 'users', user.uid, 'decks', deckId, 'flashcards', cardId);
    await deleteDoc(cardRef);
  }, [user, firestore]);
    
  const getSrsInterval = (srsLevel: number, rating: 'again' | 'hard' | 'good' | 'easy'): number => {
    if (rating === 'again') return 0;

    const baseIntervals: { [key in typeof rating]?: number[] } = {
        hard: [0, 1, 2, 3, 5, 8],
        good: [1, 2, 4, 8, 16, 32],
        easy: [2, 4, 8, 16, 32, 64],
    }

    const intervals = baseIntervals[rating];
    if (!intervals) return 1;

    return intervals[Math.min(srsLevel, intervals.length - 1)] || intervals[intervals.length - 1];
  };

  const updateCardSrs = useCallback(async (deckId: string, cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
      if (!user || !firestore) return;
      
      const deckRef = doc(firestore, 'users', user.uid, 'decks', deckId);
      const cardRef = doc(deckRef, 'flashcards', cardId);
      
      const currentCard = decks?.find(d => d.id === deckId)?.flashcards.find(c => c.id === cardId);
      if (!currentCard) return;

      let newSrsLevel = currentCard.srsLevel;
      if (rating === 'again') {
          newSrsLevel = 0;
      } else if (rating === 'good' || rating === 'easy') {
          newSrsLevel += 1;
      }
      
      const intervalDays = getSrsInterval(currentCard.srsLevel, rating);
      const newNextReviewDate = addDays(new Date(), intervalDays).toISOString();

      await setDoc(cardRef, {
        srsLevel: newSrsLevel,
        nextReviewDate: newNextReviewDate,
      }, { merge: true });

  }, [user, firestore, decks]);

  const addQuizResultToDeck = useCallback(async (deckId: string, attempt: QuizAttempt) => {
    if (!user || !firestore) return;
    const deckRef = doc(firestore, 'users', user.uid, 'decks', deckId);
    const existingDeck = decks?.find(d => d.id === deckId);
    if (!existingDeck) return;

    const newHistory = [attempt, ...(existingDeck.quizHistory || [])].slice(0, 5); // Keep last 5 attempts
    await setDoc(deckRef, { quizHistory: newHistory }, { merge: true });
  }, [user, firestore, decks]);

  const addMediaAsset = useCallback(async (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => {
     if (!user || !firestore) return;
    const newAssetRef = doc(collection(firestore, 'users', user.uid, 'mediaAssets'));
    const newAsset = {
        ...asset,
        id: newAssetRef.id,
        createdAt: new Date().toISOString()
    };
    await setDoc(newAssetRef, newAsset);
  }, [user, firestore]);

  const deleteMediaAsset = useCallback(async (assetId: string) => {
    if (!user || !firestore) return;
    const assetRef = doc(firestore, 'users', user.uid, 'mediaAssets', assetId);
    await deleteDoc(assetRef);
  }, [user, firestore]);


  return (
    <DecksContext.Provider value={{
      decks: decks || [],
      mediaAssets: mediaAssets || [],
      loading,
      addDeck,
      deleteDeck,
      updateDeckTitle,
      addCardToDeck,
      addCardsToDeck,
      updateCardInDeck,
      deleteCardFromDeck,
      updateCardSrs,
      addQuizResultToDeck,
      addMediaAsset,
      deleteMediaAsset
    }}>
      {children}
    </DecksContext.Provider>
  );
}

export function useDecks() {
  const context = useContext(DecksContext);
  if (context === undefined) {
    throw new Error('useDecks must be used within a DecksProvider');
  }
  return context;
}
