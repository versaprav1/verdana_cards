
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useDecks } from '@/context/DecksContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ChevronRight, ImageIcon, VideoIcon, Library, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function AssetLibraryPage() {
    const { mediaAssets, deleteMediaAsset } = useDecks();

    const sortedAssets = [...mediaAssets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
                            <span className="font-semibold text-foreground">Asset Library</span>
                        </div>
                         <Button asChild variant="default">
                          <Link href="/generate-image">
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Generate Image
                          </Link>
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
                {sortedAssets.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="mx-auto bg-secondary/50 rounded-full h-24 w-24 flex items-center justify-center">
                            <Library className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h2 className="mt-6 text-2xl font-semibold">Your Asset Library is Empty</h2>
                        <p className="mt-2 text-muted-foreground">Generate videos or images to see them here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {sortedAssets.map(asset => (
                            <Card key={asset.id} className="flex flex-col">
                                <CardContent className="p-0">
                                    {asset.type === 'image' ? (
                                        <Image
                                            src={asset.url}
                                            alt={asset.prompt}
                                            width={400}
                                            height={400}
                                            className="w-full h-48 object-cover rounded-t-lg"
                                        />
                                    ) : (
                                        <video src={asset.url} controls={false} className="w-full h-48 object-cover rounded-t-lg bg-black" />
                                    )}
                                </CardContent>
                                <div className='flex-grow flex flex-col p-4'>
                                    <div className="flex-grow">
                                        <div className='flex items-center gap-2 text-sm font-semibold mb-2'>
                                            {asset.type === 'image' ? <ImageIcon className="h-4 w-4"/> : <VideoIcon className="h-4 w-4"/>}
                                            <span>{asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}</span>
                                        </div>
                                        <CardDescription className="line-clamp-2" title={asset.prompt}>
                                            {asset.prompt}
                                        </CardDescription>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-4">
                                        Created {formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true })}
                                    </div>
                                </div>
                                <CardFooter className="p-2 border-t">
                                     <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive ml-auto">
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Delete asset</span>
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete this media asset. This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => deleteMediaAsset(asset.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
