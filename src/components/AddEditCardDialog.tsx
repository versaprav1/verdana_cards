"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDecks } from '@/context/DecksContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { type Flashcard } from '@/lib/types';

const formSchema = z.object({
  front: z.string().min(1, 'Front cannot be empty.').max(500, 'Front is too long.'),
  back: z.string().min(1, 'Back cannot be empty.').max(500, 'Back is too long.'),
});

interface AddEditCardDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  deckId: string;
  card: Flashcard | null;
}

export default function AddEditCardDialog({ isOpen, onOpenChange, deckId, card }: AddEditCardDialogProps) {
  const { addCardToDeck, updateCardInDeck } = useDecks();
  const { toast } = useToast();
  const isEditMode = card !== null;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      front: '',
      back: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        front: card?.front || '',
        back: card?.back || '',
      });
    }
  }, [isOpen, card, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditMode && card) {
      updateCardInDeck(deckId, card.id, values);
      toast({ title: 'Card updated!', description: 'Your flashcard has been saved.' });
    } else {
      addCardToDeck(deckId, values);
      toast({ title: 'Card added!', description: 'A new flashcard has been added to your deck.' });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Card' : 'Add New Card'}</DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Update the content of your flashcard.' : 'Fill in the front and back of your new card.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="front"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Front</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., What is the capital of France?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="back"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Back</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Paris" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Card'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
