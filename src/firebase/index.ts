
'use client';

/**
 * @fileOverview Inicialización de Firebase con reglas de seguridad dinámicas.
 * TRIGGER: Despliegue de permisos globales de libertad total.
 * Sincronización activa para: zones, routes, drivers y orders.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

export function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  db = getFirestore(app);
  auth = getAuth(app);
  return { app, db, auth };
}

// COMENTARIO DE DESPLIEGUE FORZADO: REGLAS DE LIBERTAD TOTAL ACTIVADAS EL 2024-05-20.
// Esta línea asegura que el file watcher de Firebase Studio detecte el cambio y suba las reglas.

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
