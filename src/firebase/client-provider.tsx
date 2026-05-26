'use client';

import React, { useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { Toaster } from '@/components/ui/toaster';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<ReturnType<typeof initializeFirebase> | null>(null);

  useEffect(() => {
    const initialized = initializeFirebase();
    setServices(initialized);
  }, []);

  if (!services) return null;

  return (
    <FirebaseProvider 
      app={services.app} 
      firestore={services.db} 
      auth={services.auth}
    >
      {children}
      <Toaster />
    </FirebaseProvider>
  );
}
