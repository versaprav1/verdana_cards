\"use client\";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Deck, type Flashcard, type QuizAttempt, type MediaAsset } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { addDays } from 'date-fns';
import supabase from '@/lib/supabaseClient';
import { useSupabaseAuth } from '@/lib/supabaseHooks';

interface DecksContextType {
  decks: Deck[];
  mediaAssets: MediaAsset[];
  loading: boolean;
  addDeck: (
    title: string,
    language: 'English' | 'German',
    flashcards: Omit<Flashcard, 'id' | 'srsLevel' | 'nextReviewDate'>[]
  ) => void;
  deleteDeck: (deckId: string) => void;
  updateDeckTitle: (deckId: string, newTitle: string) => void;
  addCardToDeck: (
    deckId: string,
    card: Omit<Flashcard, 'id' | 'srsLevel' | 'nextReviewDate'>
  ) => void;
  addCardsToDeck: (
    deckId: string,
    cards: Omit<Flashcard, 'id' | 'srsLevel' | 'nextReviewDate'>[]
  ) => void;
  updateCardInDeck: (
    deckId: string,
    cardId: string,
    updatedCard: Partial<Omit<Flashcard, 'id'>>
  ) => void;
  deleteCardFromDeck: (deckId: string, cardId: string) => void;
  updateCardSrs: (
    deckId: string,
    cardId: string,
    rating: 'again' | 'hard' | 'good' | 'easy'
  ) => void;
  addQuizResultToDeck: (deckId: string, attempt: QuizAttempt) => void;
  addMediaAsset: (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => void;
  deleteMediaAsset: (assetId: string) => void;
}

const DecksContext = createContext<DecksContextType | undefined>(undefined);

export function DecksProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useSupabaseAuth();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------- Fetch Media Assets ----------
  useEffect(() => {
    if (!user) {
      setMediaAssets([]);
      return;
    }
    const fetchAssets = async () => {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching media assets:', error);
        setMediaAssets([]);
        return;
      }
      setMediaAssets(data as MediaAsset[]);
    };
    fetchAssets();
  }, [user]);

  // ---------- Fetch Decks & Flashcards ----------
  useEffect(() => {
    if (!user) {
      setDecks([]);
      setLoading(false);
      return;
    }
    const fetchAll = async () => {
      setLoading(true);
      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (deckError) {
        console.error('Error fetching decks:', deckError);
        setDecks([]);
        setLoading(false);
        return;
      }

      const decksWithCards: Deck[] = await Promise.all(
        (deckData as Deck[]).map(async (deck) => {
          const { data: cardsData, error: cardsError } = await supabase
            .from('flashcards')
            .select('*')
            .eq('deck_id', deck.id);

          if (cardsError) {
            console.error('Error fetching flashcards for deck', deck.id, cardsError);
            return { ...deck, flashcards: [] };
          }

          return { ...deck, flashcards: cardsData as Flashcard[] };
        })
      );

      setDecks(decksWithCards);
      setLoading(false);
    };

    fetchAll();
  }, [user]);

  const addDeck = useCallback(
    async (
      title: string,
      language: 'English' | 'German',
      flashcards: Omit<Flashcard, 'id' | 'srsLevel' | 'nextReviewDate'>[]
    ) => {
      if (!user) return;
      // Insert deck
      const { data: deckInsert, error: deckError } = await supabase
        .from('decks')
        .insert({
          user_id: user.id,
          title,
          language,
          created_at: new Date().toISOString(),
          quiz_history: [],
        })
        .select();

      if (deckError) {
        console.error('Error adding deck:', deckError);
        return;
      }
      const newDeck = deckInsert[0] as Deck;

      // Insert flashcards if any
      if (flashcards.length > 0) {
        const flashcardsToInsert = flashcards.map((c) => ({
          ...c,
          deck_id: newDeck.id,
          srs_level: 0,
          next_review_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }));
        const { error: cardsError } = await supabase
          .from('flashcards')
          .insert(flashcardsToInsert);
        if (cardsError) {
          console.error('Error adding flashcards:', cardsError);
        }
      }

      // Refresh decks
      setDecks((prev) => [
        ...prev,
        { ...newDeck, flashcards: flashcards.map((c) => ({ ...c, id: '', srsLevel: 0, nextReviewDate: new Date().toISOString() })) },
      ]);
    },
    [user]
  );

  const deleteDeck = useCallback(
    async (deckId: string) => {
      if (!user) return;
      // Delete flashcards first
      const { error: cardsError } = await supabase
        .from('flashcards')
        .delete()
        .eq('deck_id', deckId);
      if (cardsError) {
        console.error('Error deleting flashcards:', cardsError);
        return;
      }

      // Delete deck
      const { error: deckError } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId);
      if (deckError) {
        console.error('Error deleting deck:', deckError);
        return;
      }

      toast({
        title: 'Deck Deleted',
        description: 'The deck and all its cards have been permanently removed.',
      });

      setDecks((prev) => prev.filter((d) => d.id !== deckId));
    },
    [user, toast]
  );

  const updateDeckTitle = useCallback(
    async (deckId: string, newTitle: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('decks')
        .update({ title: newTitle })
        .eq('id', deckId);
      if (error) {
        console.error('Error updating deck title:', error);
        return;
      }
      setDecks((prev) =>
        prev.map((d) => (d.id === deckId ? { ...d, title: newTitle } : d))
      );
    },
    [user]
  );

  const addCardsToDeck = useCallback(
    async (
      deckId: string,
      cards: Omit<Flashcard, 'id' | 'srsLevel' | 'nextReviewDate'>[]
    ) => {
      if (!user) return;
      const cardsToInsert = cards.map((c) => ({
        ...c,
        deck_id: deckId,
        srs_level: 0,
        next_review_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('flashcards').insert(cardsToInsert);
      if (error) {
        console.error('Error adding cards:', error);
        return;
      }
      // Refresh decks
      setDecks((prev) =>
        prev.map((d) =>
          d.id === deckId
            ? {
                ...d,
                flashcards: [
                  ...d.flashcards,
                  ...cards.map((c) => ({
                    ...c,
                    id: '',
                    srsLevel: 0,
                    nextReviewDate: new Date().toISOString(),
                  })),
                ],
              }
            : d
        )
      );
    },
    [user]
  );

  const addCardToDeck = useCallback(
    (deckId: string, card: Omit<Flashcard, 'id' | 'srsLevel' | 'nextReviewDate'>) => {
      addCardsToDeck(deckId, [card]);
    },
    [addCardsToDeck]
  );

  const updateCardInDeck = useCallback(
    async (deckId: string, cardId: string, updatedCard: Partial<Omit<Flashcard, 'id'>>) => {
      if (!user) return;
      const { error } = await supabase
        .from('flashcards')
        .update(updatedCard)
        .eq('id', cardId);
      if (error) {
        console.error('Error updating card:', error);
        return;
      }
      setDecks((prev) =>
        prev.map((d) =>
          d.id === deckId
            ? {
                ...d,
                flashcards: d.flashcards.map((c) =>
                  c.id === cardId ? { ...c, ...updatedCard } : c
                ),
              }
            : d
        )
      );
    },
    [user]
  );

  const deleteCardFromDeck = useCallback(
    async (deckId: string, cardId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId);
      if (error) {
        console.error('Error deleting card:', error);
        return;
      }
      setDecks((prev) =>
        prev.map((d) =>
          d.id === deckId
            ? { ...d, flashcards: d.flashcards.filter((c) => c.id !== cardId) }
            : d
        )
      );
    },
    [user]
  );

  const getSrsInterval = (
    srsLevel: number,
    rating: 'again' | 'hard' | 'good' | 'easy'
  ): number => {
    if (rating === 'again') return 0;
    const baseIntervals: { [key: string]: number[] } = {
      hard: [0, 1, 2, 3, 5, 8],
      good: [1, 2, 4, 8, 16, 32],
      easy: [2, 4, 8, 16, 32, 64],
    };
    const intervals = baseIntervals[rating];
    if (!intervals) return 1;
    return intervals[Math.min(srsLevel, intervals.length - 1)];
  };

  const updateCardSrs = useCallback(
    async (deckId: string, cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
      if (!user) return;
      const deck = decks.find((d) => d.id === deckId);
      const card = deck?.flashcards.find((c) => c.id === cardId);
      if (!card) return;

      let newSrsLevel = card.srsLevel;
      if (rating === 'again') {
        newSrsLevel = 0;
      } else if (rating === 'good' || rating === 'easy') {
        newSrsLevel += 1;
      }

      const intervalDays = getSrsInterval(card.srsLevel, rating);
      const newNextReviewDate = addDays(new Date(), intervalDays).toISOString();

      const { error } = await supabase.from('flashcards').update({
        srs_level: newSrsLevel,
        next_review_date: newNextReviewDate,
      }).eq('id', cardId);
      if (error) {
        console.error('Error updating card SRS:', error);
        return;
      }

      setDecks((prev) =>
        prev.map((d) =>
          d.id === deckId
            ? {
                ...d,
                flashcards: d.flashcards.map((c) =>
                  c.id === cardId
                    ? { ...c, srsLevel: newSrsLevel, nextReviewDate: newNextReviewDate }
                    : c
                ),
              }
            : d
        )
      );
    },
    [user, decks]
  );

  const addQuizResultToDeck = useCallback(
    async (deckId: string, attempt: QuizAttempt) => {
      if (!user) return;
      const deck = decks.find((d) => d.id === deckId);
      if (!deck) return;
      const newHistory = [attempt, ...(deck.quizHistory ?? [])].slice(0, 5);
      const { error } = await supabase
        .from('decks')
        .update({ quiz_history: newHistory })
        .eq('id', deckId);
      if (error) {
        console.error('Error updating quiz history:', error);
        return;
      }
      setDecks((prev) =>
        prev.map((d) =>
          d.id === deckId ? { ...d, quizHistory: newHistory } : d
        )
      );
    },
    [user, decks]
  );

  const addMediaAsset = useCallback(
    async (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => {
      if (!user) return;
      const { error, data } = await supabase
        .from('media_assets')
        .insert({
          user_id: user.id,
          ...asset,
          created_at: new Date().toISOString(),
        })
        .select();
      if (error) {
        console.error('Error adding media asset:', error);
        return;
      }
      setMediaAssets((prev) => [...prev, data[0] as MediaAsset]);
    },
    [user]
  );

  const deleteMediaAsset = useCallback(
    async (assetId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', assetId);
      if (error) {
        console.error('Error deleting media asset:', error);
        return;
      }
      setMediaAssets((prev) => prev.filter((a) => a.id !== assetId));
    },
    [user]
  );

  return (
    <DecksContext.Provider
      value={{
        decks,
        mediaAssets,
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
        deleteMediaAsset,
      }}
    >
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
