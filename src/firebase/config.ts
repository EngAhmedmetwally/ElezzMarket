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
// All security is enforced by Firebase Security Rules and Firebase App Check.
export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBgAOGUth0NtrQMzizID8-fxJJPyMkeK_o",
  authDomain: "elezz-market.firebaseapp.com",
  databaseURL: "https://elezz-market-default-rtdb.firebaseio.com",
  projectId: "elezz-market",
  storageBucket: "elezz-market.firebasestorage.app",
  messagingSenderId: "944382398885",
  appId: "1:944382398885:web:0823faff813ee816c9184c",
  measurementId: "G-SXFHQTQZ1Q"
};
