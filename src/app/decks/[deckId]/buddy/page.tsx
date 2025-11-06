
"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDecks } from '@/context/DecksContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Home, ChevronRight, Sparkles } from 'lucide-react';
import { chatWithBuddy } from '@/ai/flows/study-buddy-flow';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function BuddyPage() {
    const params = useParams();
    const { decks } = useDecks();
    const { toast } = useToast();
    const deckId = params.deckId as string;
    const deck = useMemo(() => decks.find(d => d.id === deckId), [decks, deckId]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    // Set initial greeting from the AI
    useEffect(() => {
        if (deck) {
            const greeting = deck.language === 'German' 
                ? `Hallo! Ich bin dein KI-Lernbuddy. Ich bin bereit, dir bei deinem Deck "${deck.title}" zu helfen. Frag mich alles!`
                : `Hi! I'm your AI study buddy. I'm ready to help you with your deck, "${deck.title}". Ask me anything!`;
            setMessages([{ role: 'assistant', content: greeting }]);
        }
    }, [deck]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !deck) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await chatWithBuddy({
                deckTitle: deck.title,
                language: deck.language,
                flashcards: deck.flashcards.map(({ front, back }) => ({ front, back })),
                message: input,
            });
            const assistantMessage: Message = { role: 'assistant', content: result.response };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Failed to get response from study buddy:", error);
            const errorMessage: Message = { role: 'assistant', content: "Sorry, I had trouble connecting. Please try again in a moment."};
            setMessages(prev => [...prev, errorMessage]);
            toast({
                title: "Error",
                description: "Could not get a response from the AI. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
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
        <div className="flex flex-col h-screen">
             <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center text-sm sm:text-base">
                            <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                                <Home className="h-4 w-4 mr-2" />
                                Decks
                            </Link>
                            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                             <Link href={`/decks/${deck.id}`} className="flex items-center text-muted-foreground hover:text-foreground transition-colors max-w-32 sm:max-w-none truncate">
                                {deck.title}
                            </Link>
                             <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                            <span className="font-semibold text-foreground">AI Study Buddy</span>
                        </div>
                    </div>
                </div>
            </header>
            
            <main className="flex-grow container mx-auto p-4 flex flex-col">
                <div className="flex-grow space-y-4 overflow-y-auto pr-4">
                    {messages.map((message, index) => (
                        <div key={index} className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {message.role === 'assistant' && <Sparkles className="h-6 w-6 text-primary flex-shrink-0" />}
                            <div className={`rounded-lg px-4 py-2 max-w-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                         </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-end gap-2 justify-start">
                            <Sparkles className="h-6 w-6 text-primary flex-shrink-0" />
                            <div className="rounded-lg px-4 py-2 max-w-lg bg-muted flex items-center">
                                <Loader2 className="h-5 w-5 animate-spin"/>
                            </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            <footer className="bg-background border-t">
                <div className="container mx-auto p-4">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question about your deck..."
                            disabled={isLoading}
                            autoComplete="off"
                        />
                        <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            </footer>
        </div>
    );
}
