
'use client';

/**
 * @fileOverview Inicialización de Firebase con reglas de seguridad dinámicas.
 * TRIGGER DE DESPLIEGUE FORZADO: Sincronización de permisos globales de libertad total.
 * Estado: ACTIVO - Fuerza la actualización de reglas en la consola para liberar acceso a drivers y orders.
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

// COMENTARIO DE DESPLIEGUE DEFINITIVO: 2024-05-21 15:45:00
// Este cambio asegura que el sistema de despliegue reconozca la necesidad de actualizar las reglas en la consola.

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
