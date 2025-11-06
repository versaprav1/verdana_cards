
"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import { useDecks } from '@/context/DecksContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Home, ChevronRight, FileText, Link as LinkIcon, Camera } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';


import { generateDeck } from '@/ai/flows/generate-deck-flow';
import { generateDeckFromPdf } from '@/ai/flows/generate-deck-from-pdf-flow';
import { generateDeckFromUrl } from '@/ai/flows/generate-deck-from-url-flow';
import { generatePictureDeck } from '@/ai/flows/generate-picture-deck-flow';

const MAX_CARDS_TEXT = 50;
const MAX_CARDS_PICTURE = 10;
const DEFAULT_CARDS = 5;

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Failed to read file as Data URI'));
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const formSchema = z.object({
  source: z.enum(['topic', 'pdf', 'url', 'screenshot']),
  topic: z.string().optional(),
  pdf: z.instanceof(File).optional(),
  url: z.string().optional(),
  count: z.number().min(1).max(MAX_CARDS_TEXT),
  isPictureDeck: z.boolean(),
}).superRefine((data, ctx) => {
    if (data.source === 'topic' && !data.topic) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Topic is required for this source.", path: ['topic'] });
    }
    if (data.source === 'pdf' && !data.pdf) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A PDF file is required for this source.", path: ['pdf'] });
    }
    if (data.source === 'url' && (!data.url || !z.string().url().safeParse(data.url).success)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A valid URL is required for this source.", path: ['url'] });
    }
    if (data.isPictureDeck && data.source !== 'topic') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Picture decks can only be generated from a topic.", path: ['isPictureDeck'] });
    }
});

export default function AddToDeckPage() {
  const params = useParams();
  const deckId = params.deckId as string;
  const { decks, addCardsToDeck } = useDecks();
  const deck = useMemo(() => decks.find(d => d.id === deckId), [decks, deckId]);

  const { toast } = useToast();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileName, setFileName] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      source: 'topic',
      topic: '',
      count: DEFAULT_CARDS,
      isPictureDeck: false,
    },
  });

  const source = form.watch('source');
  const isPictureDeck = form.watch('isPictureDeck');
  const maxCards = isPictureDeck ? MAX_CARDS_PICTURE : MAX_CARDS_TEXT;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('pdf', file);
      setFileName(file.name);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!deck) return;

    if (values.source === 'screenshot') {
        toast({ title: "Coming Soon!", description: "Generating cards from screenshots is not yet implemented."});
        return;
    }

    setIsGenerating(true);
    try {
        let result;
        const commonPayload = { count: values.count, language: deck.language };

        if (values.source === 'topic') {
            const topic = values.topic || deck.title;
            if (values.isPictureDeck) {
                result = await generatePictureDeck({ topic, ...commonPayload });
            } else {
                result = await generateDeck({ topic, ...commonPayload });
            }
        } else if (values.source === 'url' && values.url) {
            result = await generateDeckFromUrl({ title: deck.title, url: values.url, ...commonPayload });
        } else if (values.source === 'pdf' && values.pdf) {
            const pdfDataUri = await fileToDataUri(values.pdf);
            result = await generateDeckFromPdf({ title: deck.title, pdfDataUri, ...commonPayload });
        } else {
            throw new Error("Invalid form submission");
        }

        addCardsToDeck(deck.id, result.flashcards);
        toast({
            title: "Cards Added!",
            description: `${result.flashcards.length} new cards have been added to "${deck.title}".`,
        });
        router.push(`/decks/${deck.id}`);

    } catch (error) {
        console.error("Failed to generate cards:", error);
        toast({
            title: "Generation Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsGenerating(false);
    }
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

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 text-sm sm:text-base">
                <div className='flex items-center'>
                    <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                        <Home className="h-4 w-4 mr-2" />
                        Decks
                    </Link>
                    <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                    <Link href={`/decks/${deck.id}`} className="flex items-center text-muted-foreground hover:text-foreground transition-colors max-w-32 sm:max-w-none truncate">
                        {deck.title}
                    </Link>
                    <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                    <span className="font-semibold text-foreground">Add Cards</span>
                </div>
            </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Add Cards to "{deck.title}"
            </CardTitle>
            <CardDescription>
              Generate new cards for this deck using AI. The content will be in {deck.language}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Content Source</FormLabel>
                         <Tabs
                            defaultValue={field.value}
                            onValueChange={(value) => field.onChange(value as 'topic' | 'pdf' | 'url' | 'screenshot')}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="topic">Topic</TabsTrigger>
                                <TabsTrigger value="pdf">PDF</TabsTrigger>
                                <TabsTrigger value="url">URL</TabsTrigger>
                                <TabsTrigger value="screenshot"><Camera className="h-4 w-4 mr-2"/>Screenshot</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <FormMessage />
                    </FormItem>
                  )}
                />
                
                 {source === 'topic' && (
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., The Cold War, Photosynthesis" {...field} />
                        </FormControl>
                         <FormDescription>Provide a topic for the AI to generate cards about. If left blank, the deck title ("{deck.title}") will be used.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {source === 'topic' && (
                  <FormField
                    control={form.control}
                    name="isPictureDeck"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Generate Picture Cards</FormLabel>
                                <FormDescription>Add image cards instead of text-only.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                   />
                )}

                {source === 'pdf' && (
                  <FormField
                    control={form.control}
                    name="pdf"
                    render={() => (
                      <FormItem>
                        <FormLabel>PDF File</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Button asChild variant="outline" className="w-full justify-start font-normal">
                                <label htmlFor="pdf-upload" className="cursor-pointer flex items-center gap-2">
                                    <FileText />
                                    {fileName || 'Choose a PDF file'}
                                </label>
                            </Button>
                            <Input id="pdf-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {source === 'url' && (
                    <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Website URL</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="https://example.com/article" {...field} className="pl-10" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                
                {source === 'screenshot' && (
                    <div className='text-center text-muted-foreground border rounded-lg p-8 space-y-2'>
                        <Camera className="h-8 w-8 mx-auto"/>
                        <p className='font-semibold'>Coming Soon</p>
                        <p className='text-sm'>Generating flashcards from screenshots or other images will be available soon.</p>
                    </div>
                )}
                
                {source !== 'screenshot' && (
                    <FormField
                    control={form.control}
                    name="count"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Number of Cards to Add ({field.value})</FormLabel>
                        <FormControl>
                            <Slider 
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={1} max={maxCards} step={1} 
                            />
                        </FormControl>
                        <FormDescription>Max {maxCards} cards for {isPictureDeck ? 'picture' : 'text'} cards.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}

                <Button type="submit" disabled={isGenerating || source === 'screenshot'} className="w-full">
                  {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {isGenerating ? 'Generating...' : 'Add Cards to Deck'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

    