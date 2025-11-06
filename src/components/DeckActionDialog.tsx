
"use client";

import { useRouter } from 'next/navigation';
import type { Deck } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookOpen, PlusCircle, Layers } from 'lucide-react';

interface DeckActionDialogProps {
  deck: Deck | null;
  onOpenChange: (isOpen: boolean) => void;
}

export default function DeckActionDialog({ deck, onOpenChange }: DeckActionDialogProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
    onOpenChange(false);
  };
  
  const isOpen = !!deck;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="truncate">{deck?.title}</DialogTitle>
          <DialogDescription>
            What would you like to do with this deck?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
            <Button variant="default" size="lg" onClick={() => handleNavigate(`/decks/${deck?.id}/study`)}>
                <BookOpen className="mr-2 h-4 w-4" />
                Study Deck
            </Button>
            <Button variant="outline" size="lg" onClick={() => handleNavigate(`/decks/${deck?.id}`)}>
                <Layers className="mr-2 h-4 w-4" />
                View & Edit Cards
            </Button>
            <Button variant="outline" size="lg" onClick={() => handleNavigate(`/decks/${deck?.id}/add`)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add More Cards
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
