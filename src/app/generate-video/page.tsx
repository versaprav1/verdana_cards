
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDecks } from '@/context/DecksContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, ChevronsUpDown, Loader2, Sparkles, Home, ChevronRight, Clapperboard, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

import { GenerateVideoInputSchema } from '@/lib/types';
import type { GenerateVideoInput } from '@/lib/types';
import { generateVideo } from '@/ai/flows/generate-video-flow';

export default function GenerateVideoPage() {
    const { decks, addMediaAsset } = useDecks();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [lastPrompt, setLastPrompt] = useState('');

    const form = useForm<GenerateVideoInput>({
        resolver: zodResolver(GenerateVideoInputSchema),
        defaultValues: {
            topic: '',
            description: '',
            contextualDecks: [],
        }
    });

    async function onSubmit(values: GenerateVideoInput) {
        setIsGenerating(true);
        setGeneratedVideoUrl(null);
        setLastPrompt(values.topic);

        // Filter full deck objects to only include the data needed by the flow
        const selectedDeckData = values.contextualDecks?.map(selectedDeckInfo => {
            const fullDeck = decks.find(d => d.id === (selectedDeckInfo as any).value);
            if (!fullDeck) return null;
            return {
                title: fullDeck.title,
                flashcards: fullDeck.flashcards.map(fc => ({ id: fc.id, front: fc.front })),
            }
        }).filter(d => d !== null) as GenerateVideoInput['contextualDecks'];
        
        try {
            const result = await generateVideo({
                ...values,
                contextualDecks: selectedDeckData,
            });
            setGeneratedVideoUrl(result.videoUrl);
            toast({
                title: "Video Generated!",
                description: "Your video has been successfully created.",
            });
        } catch (error) {
            console.error("Failed to generate video:", error);
            let description = "The AI failed to create a video. Please try again.";
            if (error instanceof Error && (error.message.includes('503') || error.message.includes('overloaded'))) {
                description = "The video generation model is currently overloaded. Please wait a moment and try again.";
            }
             if (error instanceof Error && (error.message.includes('API key') || error.message.includes('permission'))) {
                description = "The API key is not valid or does not have permissions for this model. Please check your configuration in Settings.";
            }
            toast({
                title: "Video Generation Failed",
                description: description,
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    }

    const handleSaveVideo = () => {
        if (!generatedVideoUrl) return;
        addMediaAsset({
            type: 'video',
            url: generatedVideoUrl,
            prompt: lastPrompt,
            createdAt: new Date().toISOString(),
        });
        toast({
            title: 'Video Saved!',
            description: 'The video has been added to your Asset Library.',
        });
    };

    const deckOptions = decks.map(deck => ({
        value: deck.id,
        label: deck.title
    }));

    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 text-sm sm:text-base">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                                <Home className="h-4 w-4 mr-2" />
                                Decks
                            </Link>
                            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                            <span className="font-semibold text-foreground">Generate Video</span>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                <div className="w-full max-w-4xl space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Clapperboard className="h-6 w-6 text-primary" />
                                Generate a Video with AI
                            </CardTitle>
                            <CardDescription>
                                Create a short video from a topic, with optional context from your decks. Video generation may take up to a minute.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="topic"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Video Topic</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., A cinematic shot of a futuristic city at night" {...field} />
                                                </FormControl>
                                                <FormDescription>This is the main subject of your video.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Detailed Instructions (Optional)</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="e.g., Make it feel hopeful and bright, with lots of lens flare." {...field} />
                                                </FormControl>
                                                <FormDescription>Provide more specific details for the AI director.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="contextualDecks"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                            <FormLabel>Background Context (Optional)</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value?.length && "text-muted-foreground"
                                                    )}
                                                    >
                                                    {field.value?.length ? `${field.value.length} deck(s) selected` : "Select decks for context..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search decks..." />
                                                    <CommandList>
                                                        <CommandEmpty>No decks found.</CommandEmpty>
                                                        <CommandGroup>
                                                        {deckOptions.map((option) => {
                                                            const isSelected = field.value?.some((d: any) => d.value === option.value) ?? false;
                                                            return(
                                                            <CommandItem
                                                                value={option.label}
                                                                key={option.value}
                                                                onSelect={() => {
                                                                    const currentValues = field.value || [];
                                                                    const newValues = isSelected
                                                                        ? currentValues.filter((v: any) => v.value !== option.value)
                                                                        : [...currentValues, option];
                                                                    field.onChange(newValues);
                                                                }}
                                                            >
                                                                <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    isSelected ? "opacity-100" : "opacity-0"
                                                                )}
                                                                />
                                                                {option.label}
                                                            </CommandItem>
                                                        )})}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormDescription>
                                                Select decks to provide the AI with background information.
                                            </FormDescription>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />

                                    <Button type="submit" disabled={isGenerating} className="w-full">
                                        {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                        {isGenerating ? 'Generating Video...' : 'Generate Video'}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    {(isGenerating || generatedVideoUrl) && (
                         <Card>
                             <CardHeader>
                                 <CardTitle className="flex justify-between items-center">
                                    <span>Generated Video</span>
                                     {generatedVideoUrl && !isGenerating && (
                                        <Button onClick={handleSaveVideo} size="sm">
                                            <Save className="mr-2 h-4 w-4" />
                                            Save to Library
                                        </Button>
                                    )}
                                 </CardTitle>
                             </CardHeader>
                             <CardContent className="flex items-center justify-center">
                                 {isGenerating ? (
                                     <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                         <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                         <p>Generating your video... this may take up to a minute.</p>
                                     </div>
                                 ) : generatedVideoUrl ? (
                                     <video src={generatedVideoUrl} controls className="w-full rounded-md" />
                                 ) : null}
                             </CardContent>
                         </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
