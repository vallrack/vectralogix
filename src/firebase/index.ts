
'use client';

/**
 * @fileOverview Inicialización de Firebase con reglas de seguridad dinámicas.
 * TRIGGER DE DESPLIEGUE: Sincronización de permisos globales de libertad total.
 * Estado: ACTIVO - Fuerza la actualización de reglas en la consola.
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

// COMENTARIO DE DESPLIEGUE FORZADO: REGLAS DE LIBERTAD TOTAL ACTUALIZADAS EL 2024-05-21.
// Este cambio asegura que el watcher detecte la actualización y despliegue las reglas de seguridad.

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
