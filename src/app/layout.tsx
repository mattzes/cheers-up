'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useEffect } from 'react';
const inter = Inter({ subsets: ['latin'] });

signInAnonymously(auth)
  .then(() => {
    console.log('Signed in anonymously');
  })
  .catch(error => {
    console.error('Anonymous sign-in error:', error);
  });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    signInAnonymously(auth)
      .then(() => {
        console.log('Signed in anonymously');
      })
      .catch(error => {
        console.error('Anonymous sign-in error:', error);
      });
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <meta name="theme-color" content="#006bd1" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
