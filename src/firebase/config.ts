// @ts-nocheck
import { FirebaseOptions } from 'firebase/app';

/**
 * We are not using this configuration in the traditional sense.
 * The Firebase App is initialized in @/firebase/index.ts file.
 * The initilization is done without arguments, and the Firebase App Hosting
 * provides the environment variables to configure the app.
 *
 * This file is used to store the Firebase configuration for local development.
 * It is not used in production.
 */

// The following is the configuration for the Firebase project used in this app
// This is a public configuration and is safe to be exposed to the client.
// All security is enforced by Firestore Security Rules and Firebase App Check.
export const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyCYf-3eryKkFDvgz1vUgJT0tFHcc7vXPNU',
  appId: '1:65746504685:web:fdcf8299af8d48f69c35e4',
  authDomain: 'studio-8951677946-67675.firebaseapp.com',
  messagingSenderId: '65746504685',
  projectId: 'studio-8951677946-67675',
};
