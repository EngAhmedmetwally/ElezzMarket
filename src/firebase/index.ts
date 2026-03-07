
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  let firebaseApp: FirebaseApp;
  
  if (!getApps().length) {
    try {
      // Always try to initialize with the explicit config to prevent no-options error
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      console.warn('Firebase initialization warning:', e);
      firebaseApp = getApp();
    }
  } else {
    firebaseApp = getApp();
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    database: getDatabase(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
