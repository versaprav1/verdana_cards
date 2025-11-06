
"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDecks } from '@/context/DecksContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Home, ChevronRight, ImageIcon, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { GenerateImageInputSchema } from '@/lib/types';
import type { GenerateImageInput } from '@/lib/types';
import { generateImage } from '@/ai/flows/generate-image-flow';

export default function GenerateImagePage() {
    const { addMediaAsset } = useDecks();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [lastPrompt, setLastPrompt] = useState('');

    const form = useForm<GenerateImageInput>({
        resolver: zodResolver(GenerateImageInputSchema),
        defaultValues: {
            prompt: '',
        }
    });

    async function onSubmit(values: GenerateImageInput) {
        setIsGenerating(true);
        setGeneratedImageUrl(null);
        setLastPrompt(values.prompt);
        
        try {
            const result = await generateImage(values);
            setGeneratedImageUrl(result.imageUrl);
            toast({
                title: "Image Generated!",
                description: "Your image has been successfully created.",
            });
        } catch (error) {
            console.error("Failed to generate image:", error);
            let description = "The AI failed to create an image. Please try again.";
            if (error instanceof Error && (error.message.includes('503') || error.message.includes('overloaded'))) {
                description = "The image generation model is currently overloaded. Please wait a moment and try again.";
            }
             if (error instanceof Error && (error.message.includes('API key') || error.message.includes('permission'))) {
                description = "The API key is not valid or does not have permissions for this model. Please check your configuration in Settings.";
            }
            toast({
                title: "Image Generation Failed",
                description: description,
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    }
    
    const handleSaveImage = () => {
        if (!generatedImageUrl) return;
        addMediaAsset({
            type: 'image',
            url: generatedImageUrl,
            prompt: lastPrompt,
        });
        toast({
            title: 'Image Saved!',
            description: 'The image has been added to your Asset Library.',
        });
    };

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
                            <span className="font-semibold text-foreground">Generate Image</span>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                <div className="w-full max-w-4xl space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <ImageIcon className="h-6 w-6 text-primary" />
                                Generate an Image with AI
                            </CardTitle>
                            <CardDescription>
                                Create an image from a text prompt.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="prompt"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Prompt</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="e.g., A cute cat astronaut floating in space, cartoon style." {...field} />
                                                </FormControl>
                                                <FormDescription>Describe the image you want to create.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isGenerating} className="w-full">
                                        {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                        {isGenerating ? 'Generating Image...' : 'Generate Image'}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    {(isGenerating || generatedImageUrl) && (
                         <Card>
                             <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>Generated Image</span>
                                    {generatedImageUrl && !isGenerating && (
                                        <Button onClick={handleSaveImage} size="sm">
                                            <Save className="mr-2 h-4 w-4" />
                                            Save to Library
                                        </Button>
                                    )}
                                 </CardTitle>
                             </CardHeader>
                             <CardContent className="flex items-center justify-center aspect-square bg-muted/50 rounded-md">
                                 {isGenerating ? (
                                     <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                         <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                         <p>Generating your image...</p>
                                     </div>
                                 ) : generatedImageUrl ? (
                                     <Image src={generatedImageUrl} alt={lastPrompt} width={512} height={512} className="rounded-md object-contain max-h-full max-w-full" />
                                 ) : null}
                             </CardContent>
                         </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
