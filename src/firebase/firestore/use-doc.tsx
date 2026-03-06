'use client';
    
import { useState, useEffect } from 'react';
import {
  DatabaseReference,
  onValue,
  off,
  DataSnapshot
} from 'firebase/database';
import { errorEmitter } from '@/firebase/error-emitter';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Realtime Database path.
 * Handles nullable references.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedDocRef or BAD THINGS WILL HAPPEN
 * use useMemoFirebase to memoize it per React guidance.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DatabaseReference | null | undefined} memoizedDocRef -
 * The Realtime Database reference. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  memoizedDocRef: (DatabaseReference) & {__memo?: boolean} | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const listener = onValue(
      memoizedDocRef,
      (snapshot: DataSnapshot) => {
        const rawData = snapshot.val();
        if (snapshot.exists() && rawData) {
          setData({ ...(rawData as T), id: snapshot.key as string });
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (error: Error) => {
        console.error("RTDB useDoc Error:", error);
        setError(error);
        setData(null);
        setIsLoading(false);
        // Emitting a generic error. The specific permission error system was Firestore-specific.
        errorEmitter.emit('permission-error', error as any);
      }
    );

    return () => off(memoizedDocRef, 'value', listener);
  }, [memoizedDocRef]);

   if(memoizedDocRef && !(memoizedDocRef as any).__memo) {
    throw new Error('useDoc ref must be memoized with useMemoFirebase');
  }

  return { data, isLoading, error };
}
