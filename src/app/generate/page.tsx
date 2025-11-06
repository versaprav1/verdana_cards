
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useDecks } from '@/context/DecksContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Home, ChevronRight, FileText, Link as LinkIcon, Lightbulb } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


import { generateDeck } from '@/ai/flows/generate-deck-flow';
import { generateDeckFromPdf } from '@/ai/flows/generate-deck-from-pdf-flow';
import { generateDeckFromUrl } from '@/ai/flows/generate-deck-from-url-flow';
import { generatePictureDeck } from '@/ai/flows/generate-picture-deck-flow';
import { Badge } from '@/components/ui/badge';

const MAX_CARDS_TEXT = 50;
const MAX_CARDS_PICTURE = 10;
const DEFAULT_CARDS = 10;

const popularTopics = [
    "The Roman Empire",
    "World War II",
    "Photosynthesis",
    "The Solar System",
    "Machine Learning Basics",
    "Italian Renaissance Art",
    "JavaScript Fundamentals",
    "The French Revolution",
    "Human Anatomy",
    "Principles of Economics",
];

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Failed to read file as Data URI'));
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.').max(50, 'Title must not be longer than 50 characters.'),
  source: z.enum(['topic', 'pdf', 'url']),
  language: z.enum(['English', 'German']),
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
    // A topic is implicitly the title if not provided.
    if (data.source === 'topic' && !data.topic) {
        data.topic = data.title;
    }
});

export default function GeneratePage() {
  const { addDeck } = useDecks();
  const { toast } = useToast();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileName, setFileName] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      source: 'topic',
      topic: '',
      language: 'English',
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

  const handleTopicClick = (topic: string) => {
    form.setValue('topic', topic);
    form.setValue('title', topic);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    try {
        let result;
        if (values.source === 'topic') {
            const topic = values.topic || values.title;
            if (values.isPictureDeck) {
                result = await generatePictureDeck({ topic, count: values.count, language: values.language });
            } else {
                result = await generateDeck({ topic, count: values.count, language: values.language });
            }
        } else if (values.source === 'url' && values.url) {
            result = await generateDeckFromUrl({ title: values.title, url: values.url, count: values.count, language: values.language });
        } else if (values.source === 'pdf' && values.pdf) {
            const pdfDataUri = await fileToDataUri(values.pdf);
            result = await generateDeckFromPdf({ title: values.title, pdfDataUri, count: values.count, language: values.language });
        } else {
            throw new Error("Invalid form submission");
        }

        addDeck(values.title, values.language, result.flashcards);
        toast({
            title: "Deck generated!",
            description: `Your new deck "${values.title}" is ready.`,
        });
        router.push('/');

    } catch (error) {
        console.error("Failed to generate deck:", error);
        toast({
            title: "Generation Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 text-sm sm:text-base">
                <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                    <Home className="h-4 w-4 mr-2" />
                    Decks
                </Link>
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                <span className="font-semibold text-foreground">Generate with AI</span>
            </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Generate Flashcard Deck
            </CardTitle>
            <CardDescription>
              Let AI create a flashcard deck for you from a topic, PDF, or website URL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deck Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Biology 101, German Verbs" {...field} />
                      </FormControl>
                      <FormDescription>This will be the title of your new deck.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Content Source</FormLabel>
                         <Tabs
                            defaultValue={field.value}
                            onValueChange={(value) => field.onChange(value as 'topic' | 'pdf' | 'url')}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="topic">Topic</TabsTrigger>
                                <TabsTrigger value="pdf">PDF</TabsTrigger>
                                <TabsTrigger value="url">URL</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <FormMessage />
                    </FormItem>
                  )}
                />
                
                 {source === 'topic' && (
                  <>
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., The Renaissance, Quantum Physics" {...field} />
                          </FormControl>
                           <FormDescription>Provide a topic for the AI to generate cards about. If left blank, the Deck Title will be used.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Lightbulb className="h-4 w-4" />
                        <span>Or try one of these popular topics:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {popularTopics.map(topic => (
                          <Badge 
                            key={topic} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-accent"
                            onClick={() => handleTopicClick(topic)}
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {source === 'topic' && (
                  <FormField
                    control={form.control}
                    name="isPictureDeck"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Generate Picture Deck</FormLabel>
                                <FormDescription>Create flashcards with AI-generated images.</FormDescription>
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
                
                <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="German">German</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormDescription>
                            The language for the generated flashcard content.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                  control={form.control}
                  name="count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Cards ({field.value})</FormLabel>
                      <FormControl>
                        <Slider 
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            min={1} max={maxCards} step={1} 
                        />
                      </FormControl>
                       <FormDescription>Max {maxCards} cards for {isPictureDeck ? 'picture' : 'text'} decks.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isGenerating} className="w-full">
                  {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {isGenerating ? 'Generating...' : 'Generate Deck'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

    

    