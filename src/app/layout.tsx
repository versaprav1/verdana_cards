import type { Metadata } from 'next';
import './globals.css';
import { DecksProvider } from '@/context/DecksContext';
import { Toaster } from '@/components/ui/toaster';


export const metadata: Metadata = {
  title: 'VerdantCards',
  description: 'A flashcard maker for students.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <DecksProvider>
          {children}
          <Toaster />
        </DecksProvider>
      </body>
    </html>
  );
}
