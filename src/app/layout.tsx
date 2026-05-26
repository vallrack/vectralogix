
"use client";

import React, { useEffect } from 'react';
import './globals.css';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-spin" />
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-primary rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">VECTRA HUB</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Iniciando Sincronización...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <title>VectraLogix | Intelligent Logistics Hub</title>
      </head>
      <body className="font-body antialiased selection:bg-primary/30 selection:text-primary-foreground">
        <FirebaseClientProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
