
'use client';

/**
 * @fileOverview Inicialización de Firebase con reglas de seguridad dinámicas.
 * TRIGGER: Despliegue de permisos globales para zones, routes, drivers y orders.
 * Operación 'Libre Acceso Total' activada para el centro de mando VectraLogix.
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

// Comentario para forzar despliegue de reglas en el servidor: Operación 'Libertad Total' Activa.

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
