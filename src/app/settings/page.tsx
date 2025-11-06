"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Home, ChevronRight, SettingsIcon, KeyRound, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const formSchema = z.object({
  aiProvider: z.enum(['googleai']),
  googleApiKey: z.string().optional(),
});

export default function SettingsPage() {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      aiProvider: 'googleai',
      googleApiKey: '',
    },
  });

  useEffect(() => {
    setIsMounted(true);
    const storedProvider = localStorage.getItem('aiProvider') as 'googleai' | null;
    const storedGoogleKey = localStorage.getItem('googleApiKey');
    
    if (storedProvider && ['googleai'].includes(storedProvider)) {
        form.setValue('aiProvider', storedProvider);
    }
    if (storedGoogleKey) form.setValue('googleApiKey', storedGoogleKey);

  }, [form]);
  
  const provider = form.watch('aiProvider');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
        // Save provider
        localStorage.setItem('aiProvider', values.aiProvider);
        
        // Handle API keys
        if (values.googleApiKey) localStorage.setItem('googleApiKey', values.googleApiKey);
        else localStorage.removeItem('googleApiKey');
        
        toast({
            title: "Settings Saved!",
            description: "Your AI provider settings have been updated.",
        });
        
        // Short delay to give user feedback, then reload to apply changes
        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.reload();

    } catch (error) {
        toast({
            title: "Error Saving",
            description: "Could not save your settings. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  }

  if (!isMounted) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-bold">Loading Settings...</h1>
        </div>
    );
  }

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
                    <span className="font-semibold text-foreground">Settings</span>
                </div>
            </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <SettingsIcon className="h-6 w-6 text-primary" />
              AI Settings
            </CardTitle>
            <CardDescription>
              Manage your AI provider and API keys here. Changes require a page reload.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <FormField
                    control={form.control}
                    name="aiProvider"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>AI Provider</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an AI provider" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="googleai">Google AI (Gemini)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormDescription>
                            Google AI is the configured AI provider.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                {provider === 'googleai' && (
                    <FormField
                    control={form.control}
                    name="googleApiKey"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Google AI API Key</FormLabel>
                        <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Input type="password" placeholder="Enter your Google AI API Key" {...field} className="pl-10" />
                                </FormControl>
                            </div>
                        <FormDescription>
                            Optional. Uses the server key if left blank. Your key is stored in your browser.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
                
                <Button type="submit" disabled={isSaving} className="w-full">
                  {isSaving ? <Loader2 className="animate-spin" /> : null}
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
