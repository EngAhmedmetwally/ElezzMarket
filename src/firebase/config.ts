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
  apiKey: "AIzaSyCXZudXhxAzIJ-Q-A884Z3Yu-qp-lIascg",
  authDomain: "studio-6623168497-8369f.firebaseapp.com",
  databaseURL: "https://studio-6623168497-8369f-default-rtdb.firebaseio.com",
  projectId: "studio-6623168497-8369f",
  storageBucket: "studio-6623168497-8369f.firebasestorage.app",
  messagingSenderId: "529757501340",
  appId: "1:529757501340:web:2f01a44b55b0c62a6f3a59"
};
